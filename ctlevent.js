/* eslint-env es6 */
/* eslint-env node */

if (typeof require === 'function') {
    var CTLEventUtils = require('./utils.js').CTLEventUtils;
}

var propertiesString = function(properties) {
    var propString = '';
    for (var i in properties) {
        propString += '<span class="ctl-property-name">' + properties[i].name + ': </span>';
        for (var j in properties[i].values) {
            propString += '<span class="ctl-property-value">' + properties[i].values[j] + '</span> ';
        }
        propString += '</br>';
    }
    return propString;
};

var CTLEvent = function(event) {
    this.id = event.guid;
    this.title = event.summary;
    this.start = event.start_longdate;
    this.startTime = event.start_time;
    this.endTime = event.end_time;
    this.url = event.eventlink;
    this.description = event.description;
    this.location = event.location_address;

    this.category = [];
    this.type = [];
    this.eventsOpenTo = [];
    this.groupSpecific = [];
    this.campusLocation = [];

    this.propertyArray = [];

    var xprop = event.xproperties;
    if (!xprop) {
        xprop = [];
    }
    for (var i = 0; i < xprop.length; i++) {
        var aliasString;
        var propList;

        if (xprop[i]['X-BEDEWORK-ALIAS']) {
            aliasString = xprop[i]['X-BEDEWORK-ALIAS'].values.text;
            propList = aliasString.split('/').slice(-2);

            this.addProperty(propList[0], propList[1]);
        }
    }
};

/**
 * Adds the given property to this event's propertyArray.
 */
CTLEvent.prototype.addProperty = function(name, value) {
    var index = CTLEventUtils.findIndex(this.propertyArray, function(element) {
        return element.name === name;
    });

    if (index > -1) {
        this.propertyArray[index].values.push(value);
    } else {
        this.propertyArray.push({
            name: name,
            values: [value]
        });
    }
};

// TODO: this could be done on event initialization
CTLEvent.prototype.getCampusLocation = function() {
    for (var i = 0; i < this.propertyArray.length; i++) {
        if (this.propertyArray[i].name === 'Location') {
            return this.propertyArray[i].values[0];
        }
    }
    return 'Columbia University';
};

CTLEvent.prototype.render = function() {
    return '<div class="event">' +
        '<div class="event_specifics">' +
        '<h3><a href="' + this.url +'">' + this.title + '</a></h3>' +
        '<h4>' + this.start + ' ' + this.startTime + ' &ndash; '
        + this.endTime + '</h4>' +
        '</div>' +
        '<div class="event_description"><p>' + this.description + '</p></div>' +
        '<div class="location"><span class="event_location">' +
        'Location: </span>' + this.location + '</div>' +
        '<div class="event_properties">' +
        propertiesString(this.propertyArray) + '</div>' +
        '</div>';
};

if (typeof module !== 'undefined') {
    module.exports = { CTLEvent: CTLEvent };
}
