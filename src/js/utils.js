/* eslint-env node */

var CTLEventUtils = {};

function InvalidDateRangeError(message) {
    this.name = 'InvalidDateRangeError';
    this.message = message || 'An invalid date range was provided';
    this.stack = (new Error()).stack;
}

InvalidDateRangeError.prototype = Object.create(Error.prototype);
InvalidDateRangeError.prototype.constructor = InvalidDateRangeError;

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
    if (!q) {
        return allEvents;
    }

    var results = index.search(q);
    var searchResults = [];
    for (var r in results) {
        var e = allEvents[results[r].ref];
        if (e) {
            searchResults.push(e);
        }
    }

    return searchResults;
};

/**
 * Given an array of events and a location string, return an array of
 * events that are in the location.
 */
CTLEventUtils.filterEventsByLocation = function(allEvents, loc) {
    if (!loc) {
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
    if (!audience) {
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
 * @return an array of event indices for the filtered date range.
 */
CTLEventUtils.filterEventsByDateRange = function(allEvents, startDate, endDate) {
    if (!startDate && !endDate) {
        return allEvents;
    }

    // Set the time of the end date to 23:59 to accommodate events that take
    // place on that day.
    if (endDate) {
        endDate = new Date(endDate);
        endDate.setHours(23, 59);
    }

    var events = [];

    allEvents.forEach(function(e) {
        if (startDate && endDate) {
            if (
                e.startDate >= startDate &&
                    e.startDate <= endDate
            ) {
                events.push(e);
            }
        } else if (startDate && e.startDate >= startDate) {
            events.push(e);
        } else if (endDate && e.startDate <= endDate) {
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
    if (!queryString) {
        return [];
    }
    var paramsArray = [];
    var params = queryString.split('&');

    params.forEach(function(el) {
        var splitParam = el.split('=');
        paramsArray.push({
            key: decodeURI(splitParam[0]),
            value: decodeURI(splitParam[1]),
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
    if (!eventsList || !eventID) {return [];}
    for(var i = 0; i < eventsList.length; i++) {
        if (eventsList[i].id === eventID) {
            return [eventsList[i]];
        }
    }
    return [];
};

/**
 * This function populates the form fields with values from the URL query string.
 * @param paramsArray = The array of objects that are composed of the URL
 * parameter pairs.
 */
CTLEventUtils.populateURLParams = function(paramsArray) {
    paramsArray.forEach(function(el) {
        el.value = decodeURIComponent(el.value);
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
 * This function returns the value from a paramsArray when given a key.
 * If no value exists it returns null. If the value is a start or end
 * date, it returns a date object.
 *
 * @param paramsArray = An object that contains key value representation
 *                      of URL params. Call readURLParams to get these values.
 *
 * @param param = The key that you wish to fetch from the params array
 *
 * @return = The value associated with the key, if it exists
 */
CTLEventUtils.getURLParam = function(paramsArray, param) {
    var value = null;
    for (var i = 0; i < paramsArray.length; i++) {
        if (paramsArray[i].key == param) {
            value = paramsArray[i].value;
            // if the param is supposed to be a date, instantiate a Date object
            if (param == 'start' || param == 'end') {
                value = new Date(value);
            }
            return value;
        }
    }
    return value;
};

/**
 * This function takes in the location string from Bedeworks and returns an
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
    if (!locationString) {
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

CTLEventUtils.sortEventsByDate = function(events) {
    function compareDates(a, b) {
        if (a.startDate < b.startDate) {
            return -1;
        } else if (a.startDate > b.startDate) {
            return 1;
        } else {
            return 0;
        }
    }
    return events.sort(compareDates);
};

CTLEventUtils.strToDate = function(dateString) {
    if (!dateString) {return null;}
    // the dateString should be in this format:
    // YYYYMMDDTHHMMSS
    // where T is the literal letter 'T'
    // and all others are ints
    if (dateString.length != 15) {return null;}

    var year = Number(dateString.substr(0, 4));
    var month = Number(dateString.substr(4, 2)) - 1;
    var date = Number(dateString.substr(6, 2));
    var hours = Number(dateString.substr(9, 2));
    var min = Number(dateString.substr(11, 2));

    var dateObject = new Date(year, month, date, hours, min);
    // rely on the Date constructor to test for validity
    if (dateObject instanceof Date) {
        return dateObject;
    } else {
        return null;
    }
};

/**
 * This function validates the values input into the search filters
 * It checks:
 * - that the start date is greater than or equal to today's date
 * - that the end date is greater than or equal to today's date
 * - that the end date is greater than or equal to the start date
 *
 * @param startDate A Date object for the start of the date range
 *
 * @param endDate A Date object for the end of the date range
 */
CTLEventUtils.validateFilterValues = function(startDate, endDate) {
    // First instantiate copies of startDate and endDate which have their
    // time standardized. These objects *should* have these times already
    // set, but this ensures that they do.
    //
    // startDate has its hours set to the start of the day
    // endDate has its hours set to the end of the day
    if (startDate) {
        startDate = new Date(startDate);
        startDate.setHours(0, 0, 0, 0);
    }
    if (endDate) {
        endDate = new Date(endDate);
        endDate.setHours(23, 59, 0, 0);
    }

    // Comparing Date objects by day depends on the context of what it's
    // being compared to.
    //
    // In this case there are two date objects:
    //   - todayStartOfDay: represents midnight of today. This is to be used
    //     when checking if an event occurs on that day or later.
    //   - todayEndOfDay: represents 23:59 of today. This is to be used when
    //     checking if an event occurs on that date or earlier.
    var todayStartOfDay = new Date();
    todayStartOfDay.setHours(0, 0, 0, 0);

    var todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 0, 0);

    // Now check for various conditions, first by making sure that
    // the date objects exist before comparing
    if (startDate && (startDate < todayStartOfDay)) {
        throw new InvalidDateRangeError('The start date entered is prior to today');
    }
    if (endDate && (endDate <= todayEndOfDay)) {
        throw new InvalidDateRangeError('The end date entered is prior to today');
    }
    if (startDate && endDate) {
        if (endDate < startDate) {
            throw new InvalidDateRangeError('The end date entered is prior to the start date');
        }
    }

    return true;
};

/**
 * Clear alerts set on page
 */
CTLEventUtils.clearAlerts = function() {
    // If the div exists, clear it
    var alertDiv = document.getElementById('search-results-alerts');
    if (alertDiv) {
        alertDiv.innerHTML = '';
        alertDiv.style.display = 'none';
    }
};

/**
 * Sets an alert message
 */
CTLEventUtils.setAlert = function(alertText) {
    // If the div exists, append the alert text to it
    var alertDiv = document.getElementById('search-results-alerts');
    if (alertDiv) {
        alertDiv.style.display = '';
        // create an alert div and append it to the alert div
        var alertMessage = document.createElement('div');
        alertMessage.innerHTML = alertText;
        alertMessage.className = 'search-alert';

        alertDiv.appendChild(alertMessage);
    }
};

/**
 * This is general function for filtering events. It validates the parameters, handles error
 * messages, and
 *
 * This function takes in all the search params and filters.
 *
 * First it considers the params in the URL and assigns those to variables.
 * Then it considers the variables passed in, which supersede the url params.
 *
 * It then validates the values, and sets error messages as needed.
 *
 * If it passes validate, it returns an array of event objects to be rendered on the page.
 *
 * Note: this function is intended to accommodate filtering by eventID. This was left out of the
 * signature for now, but will need to be put back to accommodate this in the future.
 */
CTLEventUtils.filterEvents = function(allEvents, lunrIndex, q, loc, audience, startDate, endDate, eventID) {
    // Perhaps this function can use keyword arguments in a single object rather than 7 params
    //
    // This function orders the filters from general to specific
    // - Date
    // - Location
    // - Audience
    // - Text search

    // Clear the URL params
    CTLEventUtils.clearURLParams();

    // Clear alerts and URL params
    CTLEventUtils.clearAlerts();

    // Assign allEvents first so that if all the params are null, all events are returned.
    // This is filtering, not querying.
    var eventsList = allEvents;
    // then validate inputs and set alerts as needed
    try {
        CTLEventUtils.validateFilterValues(startDate, endDate);
    } catch (e) {
        // set an alert if the resulting array doesn't pass validation
        if (e instanceof InvalidDateRangeError) {
            CTLEventUtils.setAlert(e.message);
        }
    }

    // first check that the parameters exist, then call the filters
    if (q) {
        eventsList = CTLEventUtils.searchEvents(eventsList, lunrIndex, q);
        CTLEventUtils.updateURL('q', q);
    }
    if (startDate || endDate) {
        eventsList = CTLEventUtils.filterEventsByDateRange(eventsList, startDate, endDate);
        if (startDate) {
            CTLEventUtils.updateURL('start', CTLEventUtils.formatShortDate(startDate));
        }
        if (endDate) {
            CTLEventUtils.updateURL('end', CTLEventUtils.formatShortDate(endDate));
        }
    }
    if (loc) {
        eventsList = CTLEventUtils.filterEventsByLocation(eventsList, loc);
        CTLEventUtils.updateURL('loc', loc);
    }
    if (audience) {
        eventsList = CTLEventUtils.filterEventsByAudience(eventsList, audience);
        CTLEventUtils.updateURL('audience', audience);
    }
    if (eventID) {
        eventsList = CTLEventUtils.getEventByID(eventsList, eventID);
        CTLEventUtils.updateURL('eventID', eventID);
    }

    if (eventsList.length == 0) {
        // then set an alert for no results
        CTLEventUtils.setAlert('No events match these filters');
    }

    return eventsList;
};

export { CTLEventUtils };
