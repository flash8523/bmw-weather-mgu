'use strict';

const mgu = require('./kit/mgu');
const { t: translate, getLanguage } = require('./kit/i18n');
const { ScaledCanvas } = require('./kit/canvas');
const Weather = require('./weather-service');
const ManualLocation = require('./location-manual');
const GPS = require('./location-gps');

const W = 1600, H = 520;
const BG = '#080b10', PANEL = '#111720', RED = '#e31b36';
const MUTED = '#8c98a8', WHITE = '#f3f5f8';
const MISSING_LOCATION = 'Setează coordonatele în Setări pentru a primi prognoza meteo.';

function number(value, digits) {
    return typeof value === 'number' && isFinite(value) ? value.toFixed(digits || 0) : '--';
}
function hour(value) {
    return value && value.length >= 16 ? value.slice(11, 16) : '--:--';
}
function day(value) {
    return value && value.length >= 10 ? value.slice(5, 10) : '--';
}

mgu.run({
    async start(ctx) {
        const { ui, settings, log } = ctx;
        const service = Weather.create(ctx.dataDir, log);
        let data = service.cached();
        let stale = !!data;
        let error = '';
        let page = 0;
        let busy = false;
        let refreshTimer = null;

        function location() {
            if (settings.get('locationMode') === 'gps') {
                // GPS is deliberately guarded until the MGU firmware's provider is confirmed.
                return GPS.getLocation().then(function (loc) {
                    return loc || ManualLocation.fromSettings(settings);
                });
            }
            return Promise.resolve(ManualLocation.fromSettings(settings));
        }

        async function refresh() {
            if (busy) return;
            busy = true;
            error = '';
            try {
                const loc = await location();
                if (!loc) throw new Error(MISSING_LOCATION);
                const result = await service.refresh(loc);
                data = result.data;
                stale = result.stale;
                if (result.error) error = 'Date salvate · conexiune indisponibilă';
            } catch (e) {
                const details = e && e.message ? e.message : String(e);
                error = getLanguage() === 'zh-CN' && details !== MISSING_LOCATION
                    ? 'Unable to refresh weather' : details;
                log.warn('weather refresh: ' + details);
            } finally {
                busy = false;
            }
        }

        function scheduleRefresh() {
            if (refreshTimer) clearTimeout(refreshTimer);
            const minutes = Number(settings.get('refreshMinutes')) || 30;
            refreshTimer = setTimeout(function () {
                refresh().then(scheduleRefresh);
            }, minutes * 60 * 1000);
        }

        function drawMain() {
            const cv = ctx.canvas(W, H).clear(BG);
            cv.fillRect(0, 0, W, 5, RED);
            cv.text('BMW WEATHER', 64, 58, 24, RED, { font: 'bold', spacing: 3 });
            cv.text('FORECAST  /  ROMANIA', 1536, 58, 18, MUTED, { align: 'right', spacing: 2 });
            cv.line(64, 78, 1536, 78, 1, '#29313d');

            if (!data || !data.current) {
                cv.text('METEO', 800, 220, 26, MUTED, { align: 'center', font: 'bold', spacing: 4 });
                cv.text(busy ? 'Se descarcă prognoza...' : 'Configurează locația în Setări', 800, 285, 38, WHITE, { align: 'center' });
                cv.text(error || 'Apasă Actualizează după configurare', 800, 340, 22, MUTED, { align: 'center' });
                return ui.image('MAIN_GFX', cv);
            }

            const c = data.current;
            if (page === 0) {
                cv.text(number(c.temperature, 0) + '°', 92, 285, 150, WHITE, { font: 'num' });
                cv.text(c.description || 'Condiții meteo', 100, 340, 32, WHITE, { font: 'bold' });
                cv.text(translate('SE SIMTE CA') + ' ' + number(c.feelsLike, 0) + '°', 102, 382, 19, MUTED, { spacing: 1.5 });

                const cards = [
                    ['VÂNT', number(c.wind, 0) + ' km/h'],
                    ['UMIDITATE', number(c.humidity, 0) + '%'],
                    ['PRESIUNE', number(c.pressure, 0) + ' hPa'],
                    ['PRECIPITAȚII', number(c.precipitation, 1) + ' mm']
                ];
                cards.forEach(function (item, i) {
                    const x = 660 + i * 220;
                    cv.fillRect(x, 155, 196, 150, PANEL);
                    cv.fillRect(x, 155, 196, 3, i === 0 ? RED : '#35404e');
                    cv.text(item[0], x + 18, 195, 15, MUTED, { font: 'bold', spacing: 1.5 });
                    cv.text(item[1], x + 18, 260, 27, WHITE, { font: 'bold' });
                });
                cv.text(translate('ACTUALIZAT') + ' ' + (data.fetchedAt || '').replace('T', ' ').slice(0, 16), 660, 365, 17, MUTED);
            } else {
                cv.text('PROGNOZĂ ORARĂ', 80, 135, 23, WHITE, { font: 'bold', spacing: 2 });
                const rows = (data.hourly || []).slice(0, 8);
                rows.forEach(function (item, i) {
                    const x = 80 + i * 180;
                    cv.fillRect(x, 175, 160, 190, PANEL);
                    cv.text(hour(item.time), x + 18, 215, 19, RED, { font: 'bold' });
                    cv.text(number(item.temperature, 0) + '°', x + 18, 280, 38, WHITE, { font: 'num' });
                    cv.text(number(item.precipitationProbability, 0) + translate('% ploaie'), x + 18, 325, 15, MUTED);
                });
                cv.text('PROGNOZĂ ZILNICĂ', 80, 420, 18, MUTED, { font: 'bold', spacing: 2 });
                (data.daily || []).slice(0, 5).forEach(function (item, i) {
                    const x = 390 + i * 220;
                    cv.text(day(item.date), x, 420, 18, WHITE, { font: 'bold' });
                    cv.text(number(item.max, 0) + '° / ' + number(item.min, 0) + '°', x, 460, 19, MUTED);
                });
            }
            if (stale) cv.text('CACHE', 1536, 490, 14, RED, { align: 'right', font: 'bold' });
            if (error) cv.text(error, 800, 495, 16, RED, { align: 'center' });
            return ui.image('MAIN_GFX', cv);
        }

        function renderWidget() {
            const spec = ctx.spec.startWidget || {};
            const w = (spec.size || [384, 256])[0];
            const h = (spec.size || [384, 256])[1];
            const scale = spec.scale || 2;
            const key = w + 'x' + h + '@' + scale;
            if (!renderWidget.canvases) renderWidget.canvases = {};
            const cache = renderWidget.canvases;
            const scaled = cache[key] || (cache[key] = new ScaledCanvas(w, h, scale));
            const cv = scaled.clear(BG);
            cv.fillRect(0, 0, w, 4, RED);
            cv.text('BMW WEATHER', 16, 30, 15, RED, { font: 'bold', spacing: 1.5 });
            if (data && data.current) {
                cv.text(number(data.current.temperature, 0) + '°', 18, 122, 68, WHITE, { font: 'num' });
                cv.text(data.current.description || 'Condiții meteo', 20, 154, 15, MUTED);
                cv.line(18, 174, w - 18, 174, 1, '#35404e');
                cv.text('VÂNT', 18, 198, 12, MUTED, { font: 'bold' });
                cv.text(number(data.current.wind, 0) + ' km/h', 18, 226, 18, WHITE, { font: 'bold' });
                cv.text('UMIDITATE', w - 18, 198, 12, MUTED, { font: 'bold', align: 'right' });
                cv.text(number(data.current.humidity, 0) + '%', w - 18, 226, 18, WHITE, { font: 'bold', align: 'right' });
            } else {
                cv.text('Setează locația', 18, 122, 24, WHITE, { font: 'bold' });
                cv.text('în aplicația meteo', 18, 155, 15, MUTED);
            }
            return cv.canvas;
        }

        ui.onClick('BTN_ACTION', function () {
            refresh().then(function () { scheduleRefresh(); });
        });
        ui.onClick('BTN_PAGE', function () { page = page ? 0 : 1; });
        if (ctx.widget) {
            ctx.widget.loop(function () { return 4; }, renderWidget);
            ctx.widget.onChange(function () { /* redraw on next widget frame */ });
        }

        await refresh();
        scheduleRefresh();
        ctx.loop('MAIN', 2, drawMain);
        log.info('BMW Weather initialized');
    }
});
