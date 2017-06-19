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

    var allEvents = CTLEventsManager.loadEvents(events);
    
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
        assert.equal(CTLEventUtils.searchEvents(allEvents, index, 'Media').length, 3);
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

describe('filterOnURLParams', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;

    var index = lunr(function() {
        this.ref('id');
        this.field('title', {boost: 10});
        this.field('description', {boost: 5});
    });

    var allEvents = CTLEventsManager.loadEvents(events, index);

    it('returns an array of event objects given params', function() {
        var paramsArray = CTLEventUtils.readURLParams('q=video');
        var filteredArray = CTLEventUtils.filterOnURLParams(paramsArray,
            allEvents, index);
        var searchedArray = CTLEventUtils.searchEvents(allEvents,
            index, 'video');
        assert.deepEqual(filteredArray, searchedArray);
    });

    it('returns a list of all events when given garbage params', function() {
        var paramsArray = CTLEventUtils.readURLParams('foo=bar');
        var filteredArray = CTLEventUtils.filterOnURLParams(paramsArray,
            allEvents, index);
        assert.deepEqual(filteredArray, allEvents);
    });

    it('returns list of all events given an empty params array', function() {
        var paramsArray = CTLEventUtils.readURLParams('');
        var filteredArray = CTLEventUtils.filterOnURLParams(paramsArray,
            allEvents, index);
        assert.deepEqual(filteredArray, allEvents);
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
    var allEvents = CTLEventsManager.loadEvents(events);

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
