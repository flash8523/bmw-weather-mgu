'use strict';

const WMO = {
    0: 'Senin',
    1: 'În general senin',
    2: 'Parțial noros',
    3: 'Noros',
    45: 'Ceață',
    48: 'Ceață cu depunere de chiciură',
    51: 'Burniță slabă',
    53: 'Burniță moderată',
    55: 'Burniță densă',
    56: 'Burniță înghețată slabă',
    57: 'Burniță înghețată densă',
    61: 'Ploaie slabă',
    63: 'Ploaie moderată',
    65: 'Ploaie puternică',
    66: 'Ploaie înghețată slabă',
    67: 'Ploaie înghețată puternică',
    71: 'Ninsoare slabă',
    73: 'Ninsoare moderată',
    75: 'Ninsoare puternică',
    77: 'Măzăriche',
    80: 'Averse slabe',
    81: 'Averse moderate',
    82: 'Averse puternice',
    85: 'Averse de ninsoare slabe',
    86: 'Averse de ninsoare puternice',
    95: 'Furtună',
    96: 'Furtună cu grindină slabă',
    99: 'Furtună cu grindină puternică'
};

function finite(value) {
    return typeof value === 'number' && isFinite(value);
}

function normalize(raw) {
    if (!raw || !raw.current) throw new Error('Răspuns meteo incomplet');
    const c = raw.current;
    const h = raw.hourly || {};
    const d = raw.daily || {};
    const hourly = [];
    const times = h.time || [];
    const now = c.time || '';
    for (let i = 0; i < times.length && hourly.length < 24; i++) {
        if (now && times[i] < now) continue;
        hourly.push({
            time: times[i],
            temperature: h.temperature_2m && h.temperature_2m[i],
            precipitationProbability: h.precipitation_probability && h.precipitation_probability[i],
            code: h.weather_code && h.weather_code[i],
            wind: h.wind_speed_10m && h.wind_speed_10m[i]
        });
    }
    const daily = [];
    const days = d.time || [];
    for (let j = 0; j < days.length; j++) {
        daily.push({
            date: days[j],
            code: d.weather_code && d.weather_code[j],
            max: d.temperature_2m_max && d.temperature_2m_max[j],
            min: d.temperature_2m_min && d.temperature_2m_min[j],
            sunrise: d.sunrise && d.sunrise[j],
            sunset: d.sunset && d.sunset[j]
        });
    }
    return {
        fetchedAt: new Date().toISOString(),
        timezone: raw.timezone || '',
        current: {
            time: c.time,
            temperature: c.temperature_2m,
            feelsLike: c.apparent_temperature,
            humidity: c.relative_humidity_2m,
            precipitation: c.precipitation,
            code: c.weather_code,
            description: WMO[c.weather_code] || 'Condiții meteo',
            wind: c.wind_speed_10m,
            windDirection: c.wind_direction_10m,
            pressure: c.surface_pressure,
            isDay: c.is_day
        },
        hourly: hourly,
        daily: daily
    };
}

module.exports = { normalize: normalize, description: function (code) { return WMO[code] || 'Condiții meteo'; } };
