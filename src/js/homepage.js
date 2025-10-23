/* global jQuery */
/* global CTLEventsManager */
let jQuery = require('jquery');
import { CTLEvent } from './ctlevent.js';
import { CTLEventUtils } from './utils.js';
import { CTLEventsManager } from './events-manager.js';

(function($) {

    var ITEMS_TO_DISPLAY = 10;

    /**
     * Generate an element containing all the events that belong on
     * the given page number.
     */
    var renderEvents = function(eArray, noOfEvents) {
        var $container = jQuery('<div class="ctl-events" />');
        for (var i = 0; i < noOfEvents && i < eArray.length; i++) {
            $container.append(jQuery(
                eArray[i].renderHomepageEvent()
            ));
        }
        return $container;
    };


    /**
     * @param events: JSON event object fetched from Bedeworks
     */
    var initializeEventsHomepage = function(eventsJson) {
        var today = new Date();
        var allHomepageEvents = CTLEventsManager.loadEvents(eventsJson, today);
        jQuery('#homepage-calendar-listing').append(renderEvents(allHomepageEvents, ITEMS_TO_DISPLAY));
    };

    $(document).ready(function() {
        $('head').append('<style type="text/css"> .event{margin-top: 2em;} .event:first-child {margin-top: 0em;}');
        jQuery.ajax({
            url: 'https://calendar.ctl.columbia.edu/calendar.json',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                let events = data.bwEventList.events;
                if (location.hostname.includes('ai.ctl.columbia.edu') ||
                    location.pathname.includes('ctlai'))
                {
                    events = events.filter(events => events.categories.includes('AI') ||
                        events.categories.includes('Artificial Intelligence'));
                }
                initializeEventsHomepage(events);
            }
        });
    });
})(jQuery);
