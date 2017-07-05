/* global jQuery */
/* global CTLEventsManager */

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
        var allEvents = CTLEventsManager.loadEvents(eventsJson);
        jQuery('#homepage-calendar-listing').append(renderEvents(allEvents, ITEMS_TO_DISPLAY));
    };

    $(document).ready(function() {
        jQuery.ajax({
            url: 'https://calendar.ctl.columbia.edu/calendar.json',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                initializeEventsHomepage(data.bwEventList.events);
            }
        });
    });
})(jQuery);
