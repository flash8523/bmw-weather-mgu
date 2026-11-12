'use strict';

const https = require('https');

function requestJson(url, timeoutMs) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'BMW-Weather-MGU/0.1' } }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error('Weather API HTTP ' + res.statusCode));
                }
                try { resolve(JSON.parse(body)); }
                catch (e) { reject(new Error('Invalid weather API response: ' + e.message)); }
            });
        });
        req.setTimeout(timeoutMs || 12000, () => req.destroy(new Error('Weather API timeout')));
        req.on('error', reject);
    });
}

function fetchForecast(latitude, longitude) {
    const params = [
        'latitude=' + encodeURIComponent(latitude),
        'longitude=' + encodeURIComponent(longitude),
        'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
        'hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
        'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
        'temperature_unit=celsius',
        'wind_speed_unit=kmh',
        'precipitation_unit=mm',
        'timezone=auto',
        'forecast_days=7'
    ].join('&');
    return requestJson('https://api.open-meteo.com/v1/forecast?' + params, 15000);
}

module.exports = { fetchForecast: fetchForecast };
