/* eslint-env node */
/* eslint-env mocha */

var assert = require('assert');
var CTLEvent = require('../ctlevent.js').CTLEvent;
var CTLEventUtils = require('../utils.js').CTLEventUtils;
var fs = require('fs');

describe('CTLEvent', function() {
    var json = JSON.parse(fs.readFileSync('./tests/data.json', 'utf8'));
    var events = json.bwEventList.events;

    describe('constructor', function() {
        it('should not fail when given empty data', function() {
            new CTLEvent({});
        });
        it('loads data correctly', function() {
            var e = new CTLEvent(events[0]);
            assert.equal(e.id, events[0].guid);
            assert.equal(e.title, events[0].summary);
            assert.deepEqual(e.startDate, CTLEventUtils.strToDate(events[0].start.datetime));
            assert.deepEqual(e.endDate, CTLEventUtils.strToDate(events[0].end.datetime));
            assert.equal(e.url, events[0].eventlink);
            assert.equal(e.description, events[0].description);
            assert.equal(e.location, CTLEventUtils.getRoomNumber(events[0].location.address)[0]);
            assert.equal(e.roomNumber, CTLEventUtils.getRoomNumber(events[0].location.address)[1]);
            assert.deepEqual(e.propertyArray[0].values, ['Workshop']);
            assert.deepEqual(e.propertyArray[1].values, ['Staff', 'Faculty']);
            assert.deepEqual(e.propertyArray[2].values, ['CourseWorks']);
            assert.deepEqual(e.propertyArray[3].values, ['Morningside']);
            assert(e.registration);
        });
    });
    describe('render', function() {
        it('should render the event correctly', function() {
            var e = new CTLEvent(events[0]);
            var rendered = e.render();
            assert.ok(rendered.indexOf(e.title) > -1);
        });
    });
});
