'use strict';

function fromSettings(settings) {
    const latitude = Number(settings.get('latitude'));
    const longitude = Number(settings.get('longitude'));
    if (!isFinite(latitude) || !isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
        (latitude === 0 && longitude === 0)) {
        return null;
    }
    return { latitude: latitude, longitude: longitude, source: 'manual' };
}

module.exports = { fromSettings: fromSettings };
