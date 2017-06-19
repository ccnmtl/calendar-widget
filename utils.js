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
 *
 * It returns an array of objects of the form:
 * { key: <key>, value: <value> }
 */
CTLEventUtils.readURLParams = function(queryString) {
    if (queryString == '') {
        return [];
    }
    var paramsArray = [];
    var params = queryString.split('&');

    params.forEach(function(el) {
        var splitParam = el.split('=');
        paramsArray.push({
            key: splitParam[0],
            value: splitParam[1],
        });
    });

    return paramsArray;
};

/**
 * @param eventsList = A list of events to select from
 *
 * @param eventID = the guid from Bedeworks that identifies the event
 *
 * @return = An array containing the single event that matches the ID
 */
CTLEventUtils.getEventByID = function(eventsList, eventID) {
    if (eventsList == null || eventID == null) {return [];}
    for(var i = 0; i < eventsList.length; i++) {
        if (eventsList[i].id == eventID) {
            return [eventsList[i]];
        }
    }
    return [];
};

/**
 * @param paramsArray = The array of objects that are composed of the URL
 * parameter pairs.
 *
 * @param eventsList = An array of event objects to be filtered.
 *
 * @param index = The Lunr JS index object.
 *
 * @return = An array of filtered event objects.
 */
CTLEventUtils.filterOnURLParams = function(paramsArray, eventsList, index) {
    if (eventsList.length === 0) {
        return [];
    }

    paramsArray.forEach(function(el) {
        switch(el.key) {
            case 'q':
                eventsList = CTLEventUtils.searchEvents(
                    eventsList, index, el.value);
                break;
            case 'loc':
                eventsList = CTLEventUtils.filterEventsByLocation(
                    eventsList, el.value);
                break;
            case 'audience':
                eventsList = CTLEventUtils.filterEventsByAudience(
                    eventsList, el.value);
                break;
            case 'start':
                eventsList = CTLEventUtils.filterEventsByDateRange(
                    eventsList, new Date(el.value), null);
                break;
            case 'end':
                eventsList = CTLEventUtils.filterEventsByDateRange(
                    eventsList, null, new Date(el.value));
                break;
            case 'eventID':
                eventsList = CTLEventUtils.getEventByID(eventsList, el.value);
                break;
        }
    });
    return eventsList;
};

/**
 * This function populates the form fields with values from the URL query string.
 * @param paramsArray = The array of objects that are composed of the URL
 * parameter pairs.
 */
CTLEventUtils.populateURLParams = function(paramsArray) {
    paramsArray.forEach(function(el) {
        switch(el.key) {
            case 'q':
                document.getElementById('q').value = el.value;
                break;
            case 'loc':
                document.querySelector('#location-dropdown [value="' + el.value + '"]').selected = true;
                break;
            case 'audience':
                document.querySelector('#audience-dropdown [value="' + el.value + '"]').selected = true;
                break;
            case 'start':
                var sDate = el.value.split('-');
                sDate = sDate[1] + '/' + sDate[2] + '/' + sDate[0];
                document.getElementsByName('start_date')[0].value = sDate;
                break;
            case 'end':
                var eDate = el.value.split('-');
                eDate = eDate[1] + '/' + eDate[2] + '/' + eDate[0];
                document.getElementsByName('end_date')[0].value = eDate;
                break;
        }
    });
};

/**
 * This function takes in the location string from Bedewords and returns an
 * array with the location and room number broken out.
 *
 * @locationString = The location string from Bedeworks
 *
 * return @returnArray = An array that contains the location and room number
 *                       returnArray[0] contains the location string
 *                       returnArray[1] contains the room number
 */
CTLEventUtils.getRoomNumber = function(locationString) {
    var returnArray = ['',''];
    if (locationString == null) {
        return ['',''];
    }
    // Matches 10027 or 10032
    var zipCodes = /(\b10027$|\b10032$)/g;
    // Matches on the string 'Room ***', where *** are any number of digits 
    var roomString = /room\s*\d*$/gi;
    if (locationString.match(zipCodes)) {
        returnArray[0] = locationString;
    } else if (locationString.match(roomString)) {
        // If the penultimate word in the string is 'Room' then trim
        returnArray[1] = locationString.match(/\d*$/g)[0];
        returnArray[0] = locationString.replace(roomString, '').trim();
    } else {
        // Else trim the last number and set it as room
        returnArray[1] = locationString.match(/\d*$/g)[0];
        returnArray[0] = locationString.replace(/\d*$/g, '').trim();
    }

    return returnArray;
};
