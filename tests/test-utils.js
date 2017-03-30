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
