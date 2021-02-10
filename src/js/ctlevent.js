/* eslint-env es6 */
/* eslint-env node */
import { CTLEventUtils } from './utils.js';
import { CTLEventsManager } from './events-manager.js';

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

let compareDates = (start, end) => {
    let startStr = new Date(start.toLocaleDateString());
    let endStr = new Date (end.toLocaleDateString());

    return endStr > startStr;
};

var CTLEvent = function(event) {
    this.id = event.guid;
    this.title = event.summary;

    this.startDate = 'start' in event ? CTLEventUtils.strToDate(event.start.datetime) : '';
    this.endDate = 'end' in event ? CTLEventUtils.strToDate(event.end.datetime) : '';

    if(this.startDate && this.endDate ) {
        this.multiDay = compareDates(this.startDate, this.endDate);
    }

    this.locationAndRoom = 'location' in event ? CTLEventUtils.getRoomNumber(event.location.address) : '';
    this.location = 'location' in event ? this.locationAndRoom[0] : '';
    this.roomNumber = 'location' in event ? this.locationAndRoom[1] : '';

    this.url = event.eventlink;
    this.status = event.status;
    this.description = event.description;
    this.registration = false;

    this.propertyArray = [];

    var xprop = event.xproperties || [];
    for (var i = 0; i < xprop.length; i++) {
        var aliasString;
        var propList;

        // Loop through properties and assign
        if (xprop[i]['X-BEDEWORK-ALIAS']) {
            aliasString = xprop[i]['X-BEDEWORK-ALIAS'].values.text;
            propList = aliasString.split('/').slice(-2);

            this.addProperty(propList[0], propList[1]);
        }

        if (xprop[i]['X-BEDEWORK-REGISTRATION-START']) {
            this.registration = true;
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
    var parsedString = CTLEventUtils.parseHtml(this.description);
    var desc = new Range().createContextualFragment(parsedString);
    var lede = desc.firstElementChild ? desc.firstElementChild.innerHTML : '';
    var more = '';
    if (desc.childElementCount > 1) {
        desc.removeChild(desc.firstElementChild);
        more = [...desc.children].reduce(function(acc, val){
            if (val && val.innerHTML) {
                acc += val.innerHTML;
            }
            return acc;
        }, '');
    }
    var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    var timeOptions = {hour: 'numeric', minute: '2-digit'};


    var returnString = '<div class="event">' +
        '<div class="event_specifics"><h3 class="ctl-event-title">';
    // check the event status
    if (this.status == 'CANCELLED') {
        returnString += '<span class="cancelled">' + this.status + ': ';
    }
    returnString += '<a target="_blank" href="' + this.url +'">' + this.title + '</a>';
    if (this.status == 'CANCELLED') {returnString += '</span>';}

    returnString += '</h3><h4>';

    var endDateTimeString = this.endDate.toLocaleTimeString('en-US', timeOptions);
    var startDateTimeString = this.startDate.toLocaleTimeString('en-US', timeOptions);
    var endDateString = this.endDate.toLocaleString('en-US', options);
    var startDateString = this.startDate.toLocaleString('en-US', options);

    if (this.multiDay) {
        returnString += startDateString + ' ' + startDateTimeString + '<br/>' +
            'to ' + endDateString + ' ' + endDateTimeString;
    } else if (startDateTimeString === endDateTimeString) {
        returnString += startDateString + '<br/>' + startDateTimeString;
    } else {
        returnString += startDateString + '<br/>' + startDateTimeString
            + '&ndash;' + endDateTimeString;
    }
    returnString += '</h4>' + '</div>' + '<div class="event_description"><p>' + lede;

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

    returnString += '<div class="event_registration">' +
                    '<a target="_blank"  href="' + this.url + '">' +
                    '<button>Details</button></a></div>';

    returnString += '<div class="event_properties">' +
        propertiesString(this.propertyArray) + '</div>';

    returnString += '</div>';
    return returnString;
};

CTLEvent.prototype.renderHomepageEvent = function() {
    var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    var timeOptions = {hour: 'numeric', minute: '2-digit'};

    var returnString = '<div class="event">' +
        '<div class="event_specifics"><h4>';
    // check the event status
    if (this.status == 'CANCELLED') {
        returnString += '<span class="cancelled">' + this.status + ': ';
    }
    returnString += '<a target="_blank" href="' + this.url +'">' + this.title + '</a>';
    if (this.status == 'CANCELLED') {returnString += '</span>';}

    returnString += '</h4><h5>';

    if (this.multiDay) {
        returnString += this.startDate.toLocaleString('en-US', options) + ' ' +
            this.startDate.toLocaleTimeString('en-US', timeOptions) + '<br/>' +
            'to ' + this.endDate.toLocaleString('en-US', options) + ' ' +
            this.endDate.toLocaleTimeString('en-US', timeOptions);
    } else {
        returnString += this.startDate.toLocaleString('en-US', options) + '<br/>' +
            this.startDate.toLocaleTimeString('en-US', timeOptions) + '&ndash;' +
            this.endDate.toLocaleTimeString('en-US', timeOptions);
    }
    returnString += '</h5></div>';

    return returnString;
};

export { CTLEvent };
