'use strict';

const fs = require('fs');
const path = require('path');
const api = require('./weather-api');
const normalize = require('./weather-normalize');

function create(dataDir, log) {
    const cacheFile = path.join(dataDir, 'weather-cache.json');
    let cached = null;
    let cachedLocation = null;
    try {
        const saved = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (saved && saved.data && saved.location) {
            cached = saved.data;
            cachedLocation = saved.location;
        }
    } catch (e) {}

    function sameLocation(a, b) {
        return a && b &&
            Math.abs(Number(a.latitude) - Number(b.latitude)) < 0.0001 &&
            Math.abs(Number(a.longitude) - Number(b.longitude)) < 0.0001;
    }

    function save(data, location) {
        const temp = cacheFile + '.tmp';
        try {
            fs.writeFileSync(temp, JSON.stringify({ data: data, location: location }));
            fs.renameSync(temp, cacheFile);
        } catch (e) {
            try { fs.unlinkSync(temp); } catch (ignore) {}
            if (log) log.warn('Nu am putut salva cache-ul meteo: ' + e.message);
        }
    }

    return {
        cached: function () { return cached; },
        refresh: function (location) {
            if (!location) return Promise.reject(new Error('Configurează coordonatele locației în Setări'));
            return api.fetchForecast(location.latitude, location.longitude).then(function (raw) {
                cached = normalize.normalize(raw);
                cachedLocation = { latitude: location.latitude, longitude: location.longitude };
                save(cached, cachedLocation);
                return { data: cached, stale: false };
            }).catch(function (error) {
                if (cached && sameLocation(cachedLocation, location)) {
                    return { data: cached, stale: true, error: error };
                }
                throw error;
            });
        }
    };
}

module.exports = { create: create };
