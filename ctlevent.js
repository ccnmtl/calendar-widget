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
            propString += '</br>';
        }
    }
    return propString;
};

var CTLEvent = function(event) {
    this.id = event.guid;
    this.title = event.summary;
    this.longDate = event.start_longdate;
    this.startTime = event.start_time;
    this.endTime = event.end_time;
    this.url = event.eventlink;
    this.description = event.description;
    var locationAndRoom = CTLEventUtils.getRoomNumber(event.location_address);
    this.location = locationAndRoom[0];
    this.roomNumber = locationAndRoom[1];
    
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

CTLEvent.prototype.getDateObject = function() {
    return new Date(this.longDate);
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
        '<div class="event_specifics">' +
        '<h3><a href="' + this.url +'">' + this.title + '</a></h3>' +
        '<h4>' + this.longDate + ' ' + this.startTime + ' &ndash; '
        + this.endTime + '</h4>' +
        '</div>' +
        '<div class="event_description"><p>' + lede; 
    if (more.length > 0) {
        returnString += '<span class="more_info_trigger"> More&hellip; </span></br>' +
            '<span class="more_info_container">' + more + '</span>'; 
    }

    returnString += '</p></div><div class="location">'; 
    if (this.roomNumber != '' ) {
        returnString += 'Room ' + this.roomNumber + ', ';
    } 

    returnString += this.location + '</br>' +  
        '</div><div class="event_properties">' +
        propertiesString(this.propertyArray) + '</div>'; 

    returnString += '</div>';
    return returnString;
};

if (typeof module !== 'undefined') {
    module.exports = { CTLEvent: CTLEvent };
}
