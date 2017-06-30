/* eslint-env node */
/* global jQuery */

if (typeof require === 'function') {
    var CTLEvent = require('./ctlevent.js').CTLEvent;
}

var CTLEventsManager = {};

CTLEventsManager.allEvents = [];
CTLEventsManager.filteredEvents = [];

/**
 * Takes an array of events from JSON, and initializes a CTLEvent
 * instance for each one. This also indexes these items with the
 * given search index.
 *
 * @param eventsJson = the JSON object in the format provided by
 *                     Bedeworks
 *
 * @param filterAfterDate = a Date object to filter events by. This will
 *                          filter out events prior to the Date given.
 *
 * @return Returns the array of CTLEvents.
 */
CTLEventsManager.loadEvents = function(eventsJson, filterAfterDate) {
    var events = [];

    eventsJson.forEach(function(eventData) {
        var e = new CTLEvent(eventData);
        if (filterAfterDate <= e.startDate) {
            events.push(e);
        }
    });

    return events;
};

CTLEventsManager.renderLocationDropdown = function() {
    var $container = jQuery(
        '<select id="location-dropdown">' +
            '<option value="null">All</option>' +
            '</select>');

    var locations = [];
    CTLEventsManager.allEvents.forEach(function(e) {
        var loc = e.getCampusLocation();
        if (locations.indexOf(loc) === -1) {
            locations.push(loc);
        }
    });

    locations.forEach(function(e) {
        $container.append(
            '<option value="' + e + '">' + e + '</option>');
    });

    return $container;
};

CTLEventsManager.renderAudienceDropdown = function() {
    var $container = jQuery(
        '<select id="audience-dropdown">' +
            '<option value="null">All</option>' +
            '</select>');

    var allAudiences = [];
    CTLEventsManager.allEvents.forEach(function(e) {
        var audiences = e.getAudience();
        audiences.forEach(function (audience) {
            if (allAudiences.indexOf(audience) === -1) {
                allAudiences.push(audience);
            }
        });
    });

    allAudiences.forEach(function(e) {
        $container.append(
            '<option value="' + e + '">' + e + '</option>');
    });

    return $container;
};

if (typeof module !== 'undefined') {
    module.exports = { CTLEventsManager: CTLEventsManager };
}
