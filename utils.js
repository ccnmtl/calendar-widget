/* eslint-env node */

var CTLEventUtils = {};

/**
 * Takes a Date object and returns a string in yyyy-mm-dd format.
 */
CTLEventUtils.formatShortDate = function(d) {
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};

/**
 * Given an array of all events and a search query,
 * return an array of search results.
 *
 * @param allEvents = an array of events
 * @param index = the index object from Lunr
 * @param q = the string to filter
 *
 * @return = an array of events that match the query
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

CTLEventUtils.filterEventsByAudience = function(allEvents, audience) {
    if (audience === null || audience === 'null') {
        return allEvents;
    }

    var searchResults = [];

    allEvents.forEach(function(e) {
        if (e.getAudience().indexOf(audience) > -1) {
            searchResults.push(e);
        }
    });

    return searchResults;
};

/**
 * @param allEvents = an array of all events
 * @param startDate = a date object representing the start date
 * @param endDate = another date object
 *
 * @return an array of event indicies for the filtered date range.
 */
CTLEventUtils.filterEventsByDateRange = function(allEvents, startDate, endDate) {
    if (!startDate && !endDate) {
        return allEvents;
    }

    var events = [];

    allEvents.forEach(function(e) {
        if (startDate && endDate) {
            if (
                e.getDateObject() >= startDate &&
                    e.getDateObject() <= endDate
            ) {
                events.push(e);
            }
        } else if (startDate && e.getDateObject() >= startDate) {
            events.push(e);
        } else if (endDate && e.getDateObject() <= endDate) {
            events.push(e);
        }
    });

    return events;
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

/**
 * Updates the query string of the URL
 *
 * If no parameters are passed, it updates the url to have no params.
 * If params are passed, it updates them if they exist, else it inserts them.
 *
 * returns nothing.
 */
CTLEventUtils.updateURL = function(key, value) {
    var reString = key + '[=][^&]*';
    var regex = new RegExp(reString, 'i');
    var replacement = key + '=' + encodeURI(value);
    var queryString = '';

    if (window.location.search.match(regex)) {
        queryString = window.location.search.replace(regex, replacement);
    } else if (window.location.search){
        queryString = window.location.search + '&' + replacement;
    } else {
        queryString = '?' + replacement;
    }

    window.history.replaceState(null, '', queryString);
    return;
};

/**
 * Clears all query string parameters from the URL
 */
CTLEventUtils.clearURLParams = function() {
    window.history.replaceState(null, '', window.location.pathname);
};

/**
 * Unsets an existing query string parameter.
 *
 * @param the key to remove
 */
CTLEventUtils.unsetURLParams = function(key) {
    if (window.location.search) {
        // this takes in a key, checks to see if it exists, then removes it
        var reString = key + '[=][^&]*';
        var regex = new RegExp(reString, 'i');
        var queryString = '';
        queryString = window.location.search.replace(regex, '');
        // remove extraneous ampersand if needed
        queryString = queryString.replace(/^\?&/, '?');
        window.history.replaceState(null, '', queryString);
    }
};

/**
 * This function takes in a list of events and applies filters to it
 * passed from the query string parameters.
 */
CTLEventUtils.readURLParams = function(eventsList, queryString, index) {
    var params = queryString.split('&');
    var filteredEvents = eventsList.slice();

    params.forEach(function(el) {
        var splitParam = el.split('=');

        switch(splitParam[0]) {
            case 'q':
                filteredEvents = CTLEventUtils.searchEvents(
                    filteredEvents, index, splitParam[1]);
                document.getElementById('q').value = splitParam[1];
                break;
            case 'loc':
                filteredEvents = CTLEventUtils.filterEventsByLocation(
                    filteredEvents, splitParam[1]);
                document.querySelector('#location-dropdown [value="' +
                    splitParam[1] + '"]').selected = true;
                break;
            case 'audience':
                filteredEvents = CTLEventUtils.filterEventsByAudience(
                    filteredEvents, splitParam[1]);
                document.querySelector('#audience-dropdown [value="' +
                    splitParam[1] + '"]').selected = true;
                break;
            case 'start':
                filteredEvents = CTLEventUtils.filterEventsByDateRange(
                    filteredEvents, new Date(splitParam[1]), null);
                // re-arrange the date format to match the date picker input
                // YYYY-MM-DD => DD/MM/YYYY
                var sDate = splitParam[1].split('-');
                sDate = sDate[1] + '/' + sDate[2] + '/' + sDate[0];
                document.getElementsByName('start_date')[0].value = sDate;
                break;
            case 'end':
                filteredEvents = CTLEventUtils.filterEventsByDateRange(
                    filteredEvents, null, new Date(splitParam[1]));
                var eDate = splitParam[1].split('-');
                eDate = eDate[1] + '/' + eDate[2] + '/' + eDate[0];
                document.getElementsByName('end_date')[0].value = eDate;
                break;
        }
    });

    return filteredEvents;
};
