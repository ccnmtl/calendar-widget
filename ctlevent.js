/* eslint-env es6 */
/* eslint-env node */

if (typeof require === 'function') {
    var CTLEventUtils = require('./utils.js').CTLEventUtils;
}

var propertiesString = function(properties) {
    var propString = '';
    for (var i in properties) {
        // For now, this will only print 'Events open to' as 'Audience'.
        // All other tags are being skipped for the moment
        if (properties[i].name == 'Events open to') {
            propString += '<span class="ctl-property-name">Audience: </span>';
            var propLen = properties[i].values.length;
            for (var j in properties[i].values) {
                propString += '<span class="ctl-property-value">' + properties[i].values[j];
                j != propLen -1 ? propString += ',': '';
                propString += '</span> ';
            }
            propString += '<br>';
        }
    }
    return propString;
};

var CTLEvent = function(event) {
    this.id = event.guid;
    this.title = event.summary;

    // check for specific properties in event object before assigning values
    this.longDate = '';
    this.startTime = '';
    this.startDate = '';
    if ('start' in event) {
        this.longDate = event.start.longdate;
        this.startTime = event.start.time;
        this.startDate = CTLEventUtils.strToDate(event.start.datetime);
    }
    this.endTime = '';
    this.endDate = '';
    if ('end' in event) {
        this.endTime = event.end.time;
        this.endDate = CTLEventUtils.strToDate(event.end.datetime);
    }
    this.locationAndRoom = '';
    this.location = '';
    this.roomNumber = '';
    if ('location' in event) {
        this.locationAndRoom = CTLEventUtils.getRoomNumber(event.location.address);
        this.location = this.locationAndRoom[0];
        this.roomNumber = this.locationAndRoom[1];
    }

    this.url = event.eventlink;
    this.status = event.status;
    this.description = event.description;
    this.registration = false;
    this.registrationLink = '';

    this.propertyArray = [];

    var xprop = event.xproperties;
    if (!xprop) {
        xprop = [];
    }
    for (var i = 0; i < xprop.length; i++) {
        var aliasString;
        var propList;

        // Loop through properties and assign
        if (xprop[i]['X-BEDEWORK-ALIAS']) {
            aliasString = xprop[i]['X-BEDEWORK-ALIAS'].values.text;
            propList = aliasString.split('/').slice(-2);

            this.addProperty(propList[0], propList[1]);
        }
        // construct url for CAS login to register
        if (xprop[i]['X-BEDEWORK-UNI-ONLY-REG']) {
            this.registration = true;
            this.registrationLink = 'https://cas.columbia.edu/cas/login?service=';
            this.registrationLink += this.url.replace('http', 'https');
            this.registrationLink += '%26setappvar=cas(true)';
            this.registrationLink = this.registrationLink.replace(/&/g, '%26');
        }
    }
};

/**
 * Adds the given property to this event's propertyArray.
 */
CTLEvent.prototype.addProperty = function(name, value) {

    if (name.match('Category')) {
        return;
    }
    // Replace 'Group-Specific' which is a backend term from Bedeworks to
    // 'Category'
    name = name.replace('Group-Specific', 'Category');

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

CTLEvent.prototype.getCampusLocation = function() {
    for (var i = 0; i < this.propertyArray.length; i++) {
        if (this.propertyArray[i].name === 'Location') {
            return this.propertyArray[i].values[0];
        }
    }
    return 'Columbia University';
};

CTLEvent.prototype.getAudience = function() {
    for (var i = 0; i < this.propertyArray.length; i++) {
        if (this.propertyArray[i].name === 'Events open to') {
            return this.propertyArray[i].values;
        }
    }
    return null;
};

CTLEvent.prototype.render = function() {
    var desc = this.description.trim();
    var lnBreak = desc.indexOf('.') + 1;
    var lede = '';
    var more = '';

    if (lnBreak > 0) {
        lede = desc.slice(0, lnBreak);
        more = desc.slice(lnBreak).trim();
    }

    var returnString = '<div class="event">' +
        '<div class="event_specifics"><h3>';
    // check the event status
    if (this.status == 'CANCELLED') {
        returnString += '<span class="cancelled">' + this.status + ': ';
    }
    returnString += '<a href="' + this.url +'">' + this.title + '</a>';
    if (this.status == 'CANCELLED') {returnString += '</span>';}

    returnString += '</h3><h4>' + this.longDate + ' ' + this.startTime + ' &ndash; '
        + this.endTime + '</h4>' +
        '</div>' +
        '<div class="event_description"><p>' + lede;
    if (more.length > 0) {
        returnString += '<span class="more_info_trigger"> More&hellip;</span>';
    }
    returnString += '</p>';
    if (more.length > 0) {
        returnString += '<p class="more_info_container">' + more + '</p>';
    }
    returnString += '</div><div class="location">';
    if (this.roomNumber != '' ) {
        returnString += 'Room ' + this.roomNumber + ', ';
    }
    returnString += this.location + '</div>';

    if (this.registration) {
        returnString += '<div class="event_registration">' +
                        '<a target="_blank"  href="' + this.registrationLink + '">' +
                        '<button>Register With UNI</button></a></div>';
    }

    returnString += '<div class="event_properties">' +
        propertiesString(this.propertyArray) + '</div>';

    returnString += '</div>';
    return returnString;
};

CTLEvent.prototype.renderHomepageEvent = function() {
    var returnString = '<div class="event">' +
        '<div class="event_specifics"><h3>';
    // check the event status
    if (this.status == 'CANCELLED') {
        returnString += '<span class="cancelled">' + this.status + ': ';
    }
    returnString += '<a href="' + this.url +'">' + this.title + '</a>';
    if (this.status == 'CANCELLED') {returnString += '</span>';}

    returnString += '</h3><h4>' + this.longDate + ' ' + this.startTime + ' &ndash; '
        + this.endTime + '</h4>' +
        '</div>';

    return returnString;
};

if (typeof module !== 'undefined') {
    module.exports = { CTLEvent: CTLEvent };
}
