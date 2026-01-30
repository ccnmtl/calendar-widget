/* global jQuery */
/* global CTLEventUtils */

let jQuery = require('jquery');
import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-ui-dist/jquery-ui.min.css';
import '../../lib/loaders.min.css';

import { CTLEventUtils, filterAI, isAISite } from './utils.js';

import '../css/list.css';

(function($) {
    const ITEMS = 3;

    /**
     * Generate an element containing all the events that belong on
     * the given page number.
     */
    var renderEvents = function(eArray) {
        eArray.forEach((event, i) => {
            const description = CTLEventUtils.parseHtml(event.description);
            const context = new Range().createContextualFragment(description);
            const short = context.textContent.slice(0, 175);
            var eventHTML = `<a href="${event.link}" target="_blank" rel="noopener noreferrer">`;
            // check the event status
            if (event.status == 'CANCELLED') {
                eventHTML += `<div class="event_specifics"><h4>
                    <span class="cancelled">${event.status}: `;
            }
            if (event.status == 'CANCELLED') {eventHTML += '</span></h4></div>';}
            
            eventHTML += `<p><strong>${event.title}</strong></p>
                <p>${short}...</p></div>`;
            $(`#upcoming-${i+1}`).append($(eventHTML));
        });
    };

    /**
     * @param events: JSON event object fetched from Bedeworks
     */
    var initializeEventsPage = function(eventsJson) {
        var now = (new Date()).toISOString();
        const eArray = CTLEventUtils.sortEventsByDate(eventsJson)
            .filter(event => now <= event.startDate)
            .slice(0, ITEMS).map((event) => {                
                return {
                    'description': event.description,
                    'link': event.eventlink,
                    'status': event.status,
                    'title': event.summary
                };
            });
        renderEvents(eArray);

    };

    $(document).ready(function() {
        $.ajax({
            url: 'https://calendar.ctl.columbia.edu/calendar.json',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                $('#loader-animation-container').fadeOut('slow');
                let events = data.bwEventList.events;
                if (isAISite() || location.pathname.includes('calendar-widget')) {
                    events = events.filter(filterAI);
                }
                initializeEventsPage(events);
            }
        });
    });
})(jQuery);