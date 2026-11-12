'use strict';

const assert = require('assert');
const weather = require('../apps/flash8523_bmw_weather/weather-normalize');

const result = weather.normalize({
    timezone: 'Europe/Bucharest',
    current: {
        time: '2026-11-09T12:00',
        temperature_2m: 12.4,
        relative_humidity_2m: 72,
        apparent_temperature: 10.8,
        precipitation: 0,
        weather_code: 2,
        wind_speed_10m: 14,
        wind_direction_10m: 250,
        surface_pressure: 1018,
        is_day: 1
    },
    hourly: {
        time: ['2026-11-09T10:00', '2026-11-09T11:00', '2026-11-09T12:00', '2026-11-09T13:00'],
        temperature_2m: [10, 11, 12, 13],
        precipitation_probability: [0, 5, 10, 15],
        weather_code: [3, 3, 2, 2],
        wind_speed_10m: [10, 11, 12, 13]
    },
    daily: {
        time: ['2026-11-09', '2026-11-10'],
        weather_code: [2, 61],
        temperature_2m_max: [14, 12],
        temperature_2m_min: [6, 5],
        sunrise: ['2026-11-09T07:00', '2026-11-10T07:01'],
        sunset: ['2026-11-09T16:55', '2026-11-10T16:54']
    }
});

assert.strictEqual(result.current.temperature, 12.4);
assert.strictEqual(result.current.description, 'Parțial noros');
assert.strictEqual(result.hourly.length, 2);
assert.strictEqual(result.hourly[0].time, '2026-11-09T12:00');
assert.strictEqual(result.daily.length, 2);
assert.strictEqual(weather.description(95), 'Furtună');
console.log('BMW Weather normalization: OK');
