'use strict';

/*
 * GPS adapter intentionally remains unimplemented.
 * No public/verified GPS location API for this MGU firmware has been
 * established yet. Do not guess an OAP service or read undocumented data.
 */
function getLocation() {
    return Promise.resolve(null);
}

module.exports = { getLocation: getLocation };
