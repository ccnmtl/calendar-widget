/* eslint-env node */

var CTLEventUtils = {};

/**
 * Given an array of all events and a search query,
 * return an array of search results.
 */
CTLEventUtils.searchEvents = function(allEvents, index, q) {
    var results = index.search(q);

    var searchResults = [];
    for (var r in results) {
        var e = allEvents[results[r].ref];
        searchResults.push(e);
    }

    return searchResults;
};

/**
 * Given an array of events and a location string, return an array of
 * events that are in the location.
 */
CTLEventUtils.filterEventsByLocation = function(allEvents, loc) {
    if (loc === null || loc === 'null') {
        return allEvents;
    }

    var searchResults = [];

    allEvents.forEach(function(e) {
        if (e.getCampusLocation() === loc) {
            searchResults.push(e);
        }
    });

    return searchResults;
};

/**
 * Returns the index of the first element of the array that passes the
 * test.
 *
 * If nothing is found, return -1.
 */
CTLEventUtils.findIndex = function(array, testFunc) {
    for (var i = 0; i < array.length; i++) {
        if (testFunc(array[i])) {
            return i;
        }
    }
    return -1;
};

if (typeof module !== 'undefined') {
    module.exports = { CTLEventUtils: CTLEventUtils };
}