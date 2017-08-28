/* eslint-env node */
/* eslint-env mocha */
var config = {url: 'http://www.ctl.columbia.edu/events'};
require('jsdom-global')(undefined, config);

var assert = require('assert');
var CTLEventUtils = require('../utils.js').CTLEventUtils;
var CTLEventsManager = require('../events-manager.js').CTLEventsManager;
var fs = require('fs');
var lunr = require('lunr');

describe('searchEvents', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;

    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);

    var index;
    index = lunr(function() {
        this.ref('id');
        this.field('title');
        this.field('description');
        var self = this;
        var i = 0;
        allEvents.forEach(function(e) {
            // build lunr index
            self.add({
                id: i++,
                title: e.title,
                description: e.description
            });
        });
    });

    it('filters events accurately', function() {
        assert.deepEqual(CTLEventUtils.searchEvents(allEvents, index, 'test'), []);
        assert.equal(CTLEventUtils.searchEvents(allEvents, index, 'Canvas').length, 11);
    });
});

describe('findIndex', function() {
    it('accepts an empty array', function() {
        var i = CTLEventUtils.findIndex([], function(e) {
            return e === 6;
        });
        assert.equal(i, -1);
    });

    it('returns an accurate index', function() {
        var i = CTLEventUtils.findIndex([1, 2, 6, 3], function(e) {
            return e === 6;
        });
        assert.equal(i, 2);

        i = CTLEventUtils.findIndex([1, 2, 6, 3], function(e) {
            return e === 66;
        });
        assert.equal(i, -1);
    });
});

describe('updateURL', function() {
    it('inserts a new query string parameter', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('foo', 'bar');
        assert.equal(window.location.search, '?foo=bar');
    });

    it('updates an existing query string parameter', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('foo', 'notbar');
        assert.equal(window.location.search, '?foo=notbar');
        CTLEventUtils.updateURL('foo', 'bar');
        assert.equal(window.location.search, '?foo=bar');
    });

});

describe('clearURLParams', function() {
    it('removes all query string parameters', function() {
        // first set up some dummy data and assert that it exists
        window.history.replaceState(null, '', '?foo=bar');
        assert.equal(window.location.search, '?foo=bar');
        // then test that the function clears what we know to be there
        CTLEventUtils.clearURLParams();
        assert.equal(window.location.search, '');
    });
});

describe('unsetURLParams', function() {
    it('unsets an existing query string parameter', function() {
        // first clear the query string
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('foo', 'bar');
        assert.equal(window.location.search, '?foo=bar');
        // then unset the foo param
        CTLEventUtils.unsetURLParams('foo');
        assert.equal(window.location.search, '');
    });

    it('unsets only the requested param', function() {
        // now set multiple params and unset only one
        CTLEventUtils.updateURL('foo', 'bar');
        CTLEventUtils.updateURL('baz', 'bar');
        CTLEventUtils.unsetURLParams('foo');
        assert.equal(window.location.search, '?baz=bar');
    });

    it('does nothing if param is not present', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.unsetURLParams('foo');
        assert.equal(window.location.search, '');
    });
});

describe('readURLParams', function() {
    it('returns an array of key-value pairs', function() {
        assert.deepEqual(CTLEventUtils.readURLParams('foo=bar'),
            [ {key: 'foo', value: 'bar' } ]);
    });
    it('returns an empty array when given nothing', function() {
        assert.deepEqual(CTLEventUtils.readURLParams(''),
            [ ]);
    });
});

describe('populateURLParams', function() {
    var searchForm = '<div class="search-wrapper">' +
        '<form role="search">' +
            '<input id="q">' +
            '<button class="close-icon" id="clear-search" type="reset">' +
                'Reset' +
            '</button>' +
        '</form>' +
        '<div id="location-dropdown-container">' +
            '<select id="location-dropdown">' +
                '<option value="null">All</option>' +
                '<option value="Morningside">Morningside</option>' +
                '<option value="Medical Center">Medical Center</option>' +
            '</select>' +
        '</div>' +
        '<div id="audience-dropdown-container">' +
            '<select id="audience-dropdown">' +
                '<option value="null">All</option>' +
                '<option value="Faculty">Faculty</option>' +
                '<option value="Staff">Staff</option>' +
                '<option value="Postdocs">Postdocs</option>' +
                '<option value="Student">Student</option>' +
                '<option value="Alumni">Alumni</option>' +
                '<option value="Public">Public</option>' +
            '</select>' +
        '</div>' +
        '<label>From: ' +
            '<input name="start_date" class="hasDatepicker">' +
        '</label>' +
        '<label>To: ' +
            '<input name="end_date" class="hasDatepicker">' +
        '</label>' +
        '<div id="search-results"></div>' +
    '</div>';

    document.body.innerHTML = searchForm;
    it('populates the query field', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('q=test');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(document.getElementById('q').value, 'test');
    });
    it('populates the location dropdown', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('loc=Morningside');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(
            document.querySelector('#location-dropdown [value="Morningside"]')
                .selected, true);

    });
    it('populates the audience dropdown', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('audience=Faculty');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(
            document.querySelector('#audience-dropdown [value="Faculty"]')
                .selected, true);
    });
    it('populates the start date field', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('start=2017-4-18');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(document.getElementsByName('start_date')[0].value,
            '4/18/2017');
    });
    it('populates the end date field', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('end=2017-4-18');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(document.getElementsByName('end_date')[0].value,
            '4/18/2017');
    });
    it('populates all the fields', function() {
        document.body.innerHTML = searchForm;
        var paramString = 'q=test&loc=Morningside&audience=Faculty&' +
                          'start=2017-4-18&end=2017-4-18';
        var paramsArray = CTLEventUtils.readURLParams(paramString);
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(document.getElementById('q').value, 'test');
        assert.equal(
            document.querySelector('#location-dropdown [value="Morningside"]')
                .selected, true);
        assert.equal(
            document.querySelector('#audience-dropdown [value="Faculty"]')
                .selected, true);
        assert.equal(
            document.getElementsByName('start_date')[0].value, '4/18/2017');
        assert.equal(
            document.getElementsByName('end_date')[0].value, '4/18/2017');
    });
    it('populates none of the fields when given an empty array', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(document.getElementById('q').value, '');
        assert.equal(
            document.querySelector('#location-dropdown [value="null"]')
                .selected, true);
        assert.equal(
            document.querySelector('#audience-dropdown [value="null"]')
                .selected, true);
        assert.equal(document.getElementsByName('start_date')[0].value, '');
        assert.equal(document.getElementsByName('end_date')[0].value, '');
    });
    it('populates none of the fields when given garbage params', function() {
        document.body.innerHTML = searchForm;
        var paramsArray = CTLEventUtils.readURLParams('foo=bar&bar=foo');
        CTLEventUtils.populateURLParams(paramsArray);
        assert.equal(document.getElementById('q').value, '');
        assert.equal(
            document.querySelector('#location-dropdown [value="null"]')
                .selected, true);
        assert.equal(
            document.querySelector('#audience-dropdown [value="null"]')
                .selected, true);
        assert.equal(document.getElementsByName('start_date')[0].value, '');
        assert.equal(document.getElementsByName('end_date')[0].value, '');

    });
});

describe('getURLParam', function() {
    it('passes', function() {
        assert(true);
    });
});

describe('room number string', function() {
    it('checks for null location string', function() {
        var loc = null;
        var strings = CTLEventUtils.getRoomNumber(loc);
        assert.equal(strings[0], '');
        assert.equal(strings[1], '');
    });
    it('leaves the string alone if there is no room number given', function() {
        var loc = 'Butler Library, 535 W. 114 St., New York, NY 10027';
        var strings = CTLEventUtils.getRoomNumber(loc);
        assert.equal(strings[0], 'Butler Library, 535 W. 114 St., New York, NY 10027');
        assert.equal(strings[1], '');
    });
    it('acurately trims the string if the penultimate word is Room', function() {
        var loc = 'Butler Library, 535 W. 114 St., New York, NY 10027 Room 212';
        var strings = CTLEventUtils.getRoomNumber(loc);
        assert.equal(strings[0], 'Butler Library, 535 W. 114 St., New York, NY 10027');
        assert.equal(strings[1], '212');
    });
    it('If the string ends in a number not a zipcode, its handled as a room number', function() {
        var loc = 'Butler Library, 535 W. 114 St., New York, NY 10027 212';
        var strings = CTLEventUtils.getRoomNumber(loc);
        assert.equal(strings[0], 'Butler Library, 535 W. 114 St., New York, NY 10027');
        assert.equal(strings[1], '212');
    });
});

describe('get event by ID', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;
    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);

    it('checks that an event is found by ID, and that only a single event is returned', function() {
        for (var i = 0; i < events.length; i++) {
            var eventID = events[i].guid;
            var currentEventObject = CTLEventUtils.getEventByID(allEvents, eventID);
            assert.equal(currentEventObject.length, 1);
            assert.equal(currentEventObject[0].id, eventID);
        }
    });

    it('handles a null list', function() {
        var eventList = CTLEventUtils.getEventByID(null, events[0].guid);
        assert.equal(eventList.length, 0);
    });
    it('handles a null eventID', function() {
        var eventList = CTLEventUtils.getEventByID(allEvents, null);
        assert.equal(eventList.length, 0);
    });
    it('handles an eventID that isn\'t found', function() {
        var eventList = CTLEventUtils.getEventByID(allEvents, 'GUID-1234');
        assert.equal(eventList.length, 0);
    });
});

describe('sort events by date and time', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;
    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);

    it('checks that an array of event objects is sorted by date', function() {
        var sortedEvents = CTLEventUtils.sortEventsByDate(allEvents);
        for (var i = 0; i < (sortedEvents.length - 1); i++) {
            assert(sortedEvents[i].startDate <= sortedEvents[i + 1].startDate);
        }
    });
});

describe('take a string and convert it to a date object', function() {
    it('handles a null', function() {
        var sampleDate = CTLEventUtils.strToDate(null);
        assert.equal(sampleDate, null);
    });
    it('handles a malformed string', function() {
        var sampleDate = CTLEventUtils.strToDate('FOOBAR');
        assert.equal(sampleDate, null);
    });
    it('returns a date object when given a string in the correct format', function() {
        var sampleDate = CTLEventUtils.strToDate('20170622T131500');
        assert(sampleDate instanceof Date);
        assert.equal(sampleDate.getFullYear(), 2017);
        assert.equal(sampleDate.getMonth(), 5);
        assert.equal(sampleDate.getDate(), 22);
        assert.equal(sampleDate.getHours(), 13);
        assert.equal(sampleDate.getMinutes(), 15);
    });
});

// This test checks CTLEventUtils.filterEventsByLocation
describe('', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;
    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);
    it('Returns all events when passed in a null location', function() {
        var testEvents = CTLEventUtils.filterEventsByLocation(allEvents, null);
        assert.equal(testEvents.length, 15);
    });
    it('Returns no events when given a non-existant location', function() {
        var testEvents = CTLEventUtils.filterEventsByLocation(allEvents, 'foo');
        assert.equal(testEvents.length, 0);
    });
    it('Returns the correct number of events for Morningside', function() {
        // There are 14 events at Morningside
        var testEvents = CTLEventUtils.filterEventsByLocation(allEvents, 'Morningside');
        assert.equal(testEvents.length, 14);
    });
    it('Returns the correct number of events for Medical Center', function() {
        // There is 1 event at the Medical Center
        var testEvents = CTLEventUtils.filterEventsByLocation(allEvents, 'Medical Center');
        assert.equal(testEvents.length, 1);
    });
});

// This test checks CTLEventUtils.filterEventsByAudience
describe('filter events by audience works as expected', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;
    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);
    it('Returns all events when passed in a null audience', function() {
        var testEvents = CTLEventUtils.filterEventsByAudience(allEvents, null);
        assert.equal(testEvents.length, 15);
    });
    it('Returns no events when given a non-existant audience name', function() {
        var testEvents = CTLEventUtils.filterEventsByAudience(allEvents, 'foo');
        assert.equal(testEvents.length, 0);
    });
    it('Returns the correct number of events for Faculty', function() {
        //there are 13
        var testEvents = CTLEventUtils.filterEventsByAudience(allEvents, 'Faculty');
        assert.equal(testEvents.length, 13);
    });
    it('Returns the correct number of events for Graduate Student', function(){
        //there are 2
        var testEvents = CTLEventUtils.filterEventsByAudience(allEvents, 'Graduate Students');
        assert.equal(testEvents.length, 2);
    });
    it('Returns the correct number of events for Staff', function() {
        //there are 11
        var testEvents = CTLEventUtils.filterEventsByAudience(allEvents, 'Staff');
        assert.equal(testEvents.length, 11);
    });
});

// This test is for CTLEventUtils.filterEventsByDateRange
describe('filter events by date range works as expected', function() {
    // Set up the all events array
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;
    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);
    it('returns an expected number of events when given a valid range', function() {
        var futureDate = new Date(2999, 11, 31, 23, 59);
        var events = CTLEventUtils.filterEventsByDateRange(allEvents, pastDate, futureDate);
        assert.equal(events.length, allEvents.length);
    });
    it('returns an expected number of events when the start ' +
        'date and end date are the same day', function() {
        // The first event in the data set takes place on June 27, 2017. There
        // is only one event.
        var testDate = new Date(2017, 5, 27, 0, 0);
        var events = CTLEventUtils.filterEventsByDateRange(allEvents, testDate, testDate);
        assert.equal(events.length, 1);
    });
    it('returns no events when given an end date before the start date', function() {
        var today = new Date();
        var events = CTLEventUtils.filterEventsByDateRange(allEvents, today, pastDate);
        assert.equal(events.length, 0);
    });
    it('returns no events when given a valid date range outside the' +
        'dataset of events given', function() {
        // Date one year prior to the first date in the test dataset
        var testDate = new Date(2016, 5, 27, 0, 0);
        var events = CTLEventUtils.filterEventsByDateRange(allEvents, pastDate, testDate);
        assert.equal(events.length, 0);
    });
});

// This tests the loadEvents function. This function doesn't load events prior to a date given.
// This is done to ensure that, if the proxy were out of date, it wouldn't list stale events.
// This functionality isn't meant to filter events for the user.
describe('it filters out events older than a given date', function() {
    it('returns all events when filtered on a date before any in the test set', function() {
        var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
        var events = json.bwEventList.events;
        var pastDate = new Date(1999, 11, 31, 23, 59);
        var allEvents = CTLEventsManager.loadEvents(events, pastDate);
        assert.equal(allEvents.length, 15);
    });
    it('returns no events when filtered on a date far far in the future', function() {
        var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
        var events = json.bwEventList.events;
        var futureDate = new Date(2999, 11, 31, 23, 59);
        var allEvents = CTLEventsManager.loadEvents(events, futureDate);
        assert.equal(allEvents.length, 0);
    });
});

describe('validate filter values', function() {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    it('returns false if the start date is before today', function() {
        assert.throws(function() {CTLEventUtils.validateFilterValues(yesterday, today);},
            'The start date entered is prior to today');
    });
    it('returns true if the start date is today', function() {
        assert(CTLEventUtils.validateFilterValues(today, null));
    });
    it('returns true if the start date is after today', function() {
        assert(CTLEventUtils.validateFilterValues(tomorrow, null));
    });
    it('returns false if the start date is after the end date', function() {
        assert.throws(function () {CTLEventUtils.validateFilterValues(tomorrow, today);},
            'The end date entered is prior to the start date');
    });
    it('returns true if the start date is before the end date', function() {
        assert(CTLEventUtils.validateFilterValues(today, tomorrow));
    });
    it('returns true if only and end date in the future is passed', function() {
        assert(CTLEventUtils.validateFilterValues(null, tomorrow));
    });
});

describe('test the filterEvents function', function() {
    // because this function calls utility functions that are already tested
    // what needs to be tested for?
    //
    // It needs to return an array of events sorted in date order, or an empty array

    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;
    var pastDate = new Date(1999, 11, 31, 23, 59);
    var allEvents = CTLEventsManager.loadEvents(events, pastDate);

    document.body.innerHTML = '<div id="search-results-alerts"></div>';

    var lunrIndex = lunr(function() {
        this.ref('id');
        this.field('title');
        this.field('description');
        var self = this;
        var i = 0;
        allEvents.forEach(function(e) {
            // build lunr index
            self.add({
                id: i++,
                title: e.title,
                description: e.description
            });
        });
    });


    it('returns a sorted array of all events', function() {
        var q = '';
        var loc = '';
        var audience = '';
        var startDate = new Date(2017, 0, 1, 0, 0);
        var endDate = new Date(2018, 0, 1, 0, 0);

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);

        for (var i = 0; i == events.length -1; i++) {
            assert(events[i] < events[i + 1]);
        }
    });
    it('returns an array of length 0', function() {
        var q = 'foo';
        var loc = '';
        var audience = '';
        var startDate = new Date(2017, 0, 1, 0, 0);
        var endDate = new Date(2018, 0, 1, 0, 0);

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 0);
    });

    it('searching for just "Canvas" returns 11 items', function() {
        var q = 'Canvas';
        var loc = null;
        var audience = null;
        var startDate = null;
        var endDate= null;

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 11);
    });

    it('passing in just "Canvas" as a URL param returns 11 items', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('q', 'Canvas');
        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 11);
    });

    it('returns all events when given undefined search parameters', function() {
        CTLEventUtils.clearURLParams();
        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 15);
    });

    it('returns the correct number of events when given only a start date', function() {
        // There's only one event in June, on June 27th
        // Filtering from July one should return 14 events
        var q = null;
        var loc = null;
        var audience = null;
        var startDate = new Date(2017, 6, 1, 0, 0);
        var endDate = null;

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 14);
    });

    it('passing in start date as a URL param returns the correct number of events', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('start', '2017-7-1');
        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 14);
    });

    it('returns the correct number of events when given only an end date', function() {
        var q = null;
        var loc = null;
        var audience = null;
        var startDate = null;
        var endDate = new Date(2017, 6, 1, 0, 0);

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 1);
    });

    it('passing in an end date as a URL param returns the correct number of events', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('end', '2017-7-1');
        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 1);
    });

    it('returns the correct number of events when given only a location', function() {
        // try 'Morningside' there are 14 events at MS
        var q = null;
        var loc = 'Morningside';
        var audience = null;
        var startDate = null;
        var endDate = null;

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 14);
    });

    it('passing in a location as a URL param returns the correct number of events', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('loc', 'Morningside');
        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 14);
    });

    it('returns the correct number of events when given only a audience', function() {
        // pass in 'Faculty' and you'll get 13 events back
        var q = null;
        var loc = null;
        var audience = 'Faculty';
        var startDate = null;
        var endDate = null;

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 13);
    });

    it('passing in an audience as a URL param returns the correct number of events', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('audience', 'Faculty');
        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 13);
    });

    it('passing in multiple values returns the correct event', function() {
        var q = 'Canvas';
        var loc = 'Morningside';
        var audience = 'Faculty';
        var startDate = new Date(2017, 5, 26, 0, 0);
        var endDate = new Date(2017, 6, 1, 0, 0);

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex, q,
            loc, audience, startDate, endDate);
        assert(events.length == 1);
        assert(events[0].id == 'CAL-00bbdcc7-5cc9b360-015c-cbf3a776-00005b65events%40columbia.edu');
    });

    it('passing in multiple values as URL params returns the correct event', function() {
        CTLEventUtils.clearURLParams();
        CTLEventUtils.updateURL('q', 'Canvas');
        CTLEventUtils.updateURL('loc', 'Morningside');
        CTLEventUtils.updateURL('audience', 'Faculty');
        CTLEventUtils.updateURL('start', '2017-6-26');
        CTLEventUtils.updateURL('end', '2017-7-1');

        var events = CTLEventUtils.filterEvents(allEvents, lunrIndex);
        assert(events.length == 1);
        assert(events[0].id == 'CAL-00bbdcc7-5cc9b360-015c-cbf3a776-00005b65events%40columbia.edu');
    });
});
