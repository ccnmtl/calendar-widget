/* global jQuery */
/* global lunr */
/* global CTLEventUtils, CTLEventsManager */

(function($) {

    var ITEMS_ON_PAGE = 10;

    var index;

    var initializeLunrIndex = function(events) {
        index = lunr(function() {
            this.ref('id');
            this.field('title');
            this.field('description');
            var i = 0;
            var self = this;
            events.forEach(function(e){
                // build lunr index
                self.add({
                    id: i++,
                    title: e.title,
                    description: e.description
                });
            });
        });

        return index;
    };

    var doSearch = function(events) {
        var $el = $('#calendarList');
        var q = $('#q').val();

        $el.empty();
        $el.show();
        $el.append('<div class="arrow"></div>');
        $el.append($('<h2>Results for: "' + q + '"</h2>'));

        CTLEventsManager.filteredEvents = CTLEventUtils.filterEvents(events, index, q, null, null, null, null);
        //CTLEventUtils.updateURL('q', q);

        if (CTLEventsManager.filteredEvents.length > 0) {
            refreshEvents(CTLEventsManager.filteredEvents, 1);
        }
        return false;
    };

    var clearSearch = function() {
        $('#calendarList').empty();
        $('#calendarList').hide();
        // remove query string from url
        CTLEventUtils.clearURLParams();
    };

    /**
     * Generate an element containing all the events that belong on
     * the given page number.
     */
    var renderEvents = function(eArray, pageNum) {
        var $container = jQuery('<div class="ctl-events" />');
        var start = (pageNum - 1) * ITEMS_ON_PAGE;
        var end = start + ITEMS_ON_PAGE;
        for (var i = start; i < end && i < eArray.length; i++) {
            $container.append(jQuery(
                eArray[i].render()
            ));
        }
        return $container;
    };

    /**
     * Clear the events from the DOM and re-render them.
     */
    var refreshEvents = function(eArray, pageNum) {
        // Sort by date first to ensure the correct order
        eArray = CTLEventUtils.sortEventsByDate(eArray);
        $('.pagination-holder').pagination('updateItems', eArray.length);
        jQuery('.ctl-events').remove();
        jQuery('#calendarList').append(renderEvents(eArray, pageNum));
    };


    /**
     * @param events: JSON event object fetched from Bedeworks
     */
    var initializeEventsPage = function(eventsJson) {
        var now = new Date();
        CTLEventsManager.allEvents = CTLEventsManager.loadEvents(eventsJson, now);
        index = initializeLunrIndex(CTLEventsManager.allEvents);

        $('.pagination-holder').pagination({
            items: CTLEventsManager.allEvents.length,
            itemsOnPage: ITEMS_ON_PAGE,
            useAnchors: false,
            cssStyle: 'ctl-theme',
            onPageClick: function(pageNumber) {
                if (CTLEventsManager.filteredEvents.length > 0 || $('#q').val().length > 1) {
                    refreshEvents(CTLEventsManager.filteredEvents, pageNumber);
                } else {
                    refreshEvents(CTLEventsManager.allEvents, pageNumber);
                }
            }
        });

        // Initialize the location dropdown
        var $el = $('#location-dropdown-container');
        $el.append(CTLEventsManager.renderLocationDropdown());
        $el.find('select#location-dropdown').on('change', function(e) {
            var loc = e.target.value;

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEvents(
                    CTLEventsManager.allEvents, index, null, loc, null, null, null);

            refreshEvents(CTLEventsManager.filteredEvents, 1);
        });

        // Initialize the audience dropdown
        $el = $('#audience-dropdown-container');
        $el.append(CTLEventsManager.renderAudienceDropdown());
        $el.find('select#audience-dropdown').on('change', function(e) {
            var audience = e.target.value;

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEvents(
                    CTLEventsManager.allEvents, index, null, null, audience, null, null);

            refreshEvents(CTLEventsManager.filteredEvents, 1);
        });

        // Initialize the start date field
        var $startInput = $('input[name="start_date"]');
        $startInput.on('change', function(e) {
            var date = e.target.value;
            // splits the format: MM/DD/YYYY
            date = date.split('/');
            var startDate = date ? new Date(date[2], date[0] - 1, date[1]) : null;
            // get the end date so it can be filtered together
            var endDate = $('input[name="end_date"]')[0].value;
            if (endDate) {
                endDate = new Date(endDate);
            }

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEvents(
                    CTLEventsManager.allEvents, index, null, null, null,
                    startDate, endDate);

            refreshEvents(CTLEventsManager.filteredEvents, 1);
        });
        $startInput.datepicker();

        // Initialize the end date field
        var $endInput = $('input[name="end_date"]');
        $endInput.on('change', function(e) {
            var date = e.target.value;
            // splits the format: MM/DD/YYYY
            date = date.split('/');
            var endDate = date ? new Date(date[2], date[0] - 1, date[1]) : null;
            // get the start date so it can be filtered together
            var startDate = $('input[name="start_date"]')[0].value;
            if (startDate) {
                startDate = new Date(startDate);
            }

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEvents(
                    CTLEventsManager.allEvents, index, null, null, null,
                    startDate, endDate);

            refreshEvents(CTLEventsManager.filteredEvents, 1);
        });
        $endInput.datepicker();

        var queryString = window.location.search.replace(/^\?/, '');
        var paramsArray = CTLEventUtils.readURLParams(queryString);
        CTLEventUtils.populateURLParams(paramsArray);
        var filteredEvents = CTLEventUtils.filterOnURLParams(paramsArray, CTLEventsManager.allEvents, index);

        refreshEvents(filteredEvents, 1);
    };

    $(document).ready(function() {
        var boilerplate =

            '<div id=loader-animation-container>' +

            '<div class="loader-inner ball-pulse"><div></div><div></div><div></div></div>' +

            '</div>' +

            '<div class="search-wrapper">' +

            '<div class="search-row" id="search-term">' +

            '<div class="search-label">Term</div>' +


            '<form class="search-container" role="search">' +

            '<input id="q" type="search" required="" class="search-box" ' +

            'placeholder="Search for...">' +

            '<button class="close-icon" id="clear-search" type="reset">' +

            'Reset</button>' +

            '</form>' +

            '</div>' +



            '<div class="search-row" id="search-location">' +

            '<div class="search-label">Location</div>' +

            '<div id="location-dropdown-container"></div>' +

            '</div>' +



            '<div class="search-row" id="search-audience">' +

            '<div class="search-label">Audience</div>' +

            '<div id="audience-dropdown-container"></div>' +

            '</div>' +



            '<div class="search-row" id="search-from">' +

            '<div class="search-label">From</div>' +

            '<label id="from">' +
            '<input name="start_date" placeholder="Start Date"/>' +
            '</label>' +

            '</div>' +



            '<div class="search-row" id="search-to">' +

             '<div class="search-label">To</div>' +

            '<label id="to"> ' +
            '<input name="end_date" placeholder="End Date" />' +
            '</label>' +

            '</div>' +

            '</div>' +

            '<div style="clear: both;"></div>' +

            '<div id="search-results-alerts"></div>' +

            '<div id="search-results"></div>' +


            '<div id="calendarList"></div>' +


            '<div class="pagination-holder"></div>';

        jQuery('#calendar-wrapper').append(boilerplate);

        jQuery.ajax({
            url: 'https://calendar.ctl.columbia.edu/calendar.json',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                $('#loader-animation-container').fadeOut('slow');
                initializeEventsPage(data.bwEventList.events);
            }
        });

        $('#clear-search').click(clearSearch);
        $('form.search-container').submit(function(e) {
            e.preventDefault();
        });
        $('#q').keyup(function() {
            $('#calendarList').empty();

            if ($(this).val().length < 2) {
                refreshEvents(CTLEventsManager.allEvents, 1);
                CTLEventUtils.unsetURLParams('q');
                return;
            }
            return doSearch(CTLEventsManager.allEvents);
        });

        $('#calendarList').on('click', '.more_info_trigger', function() {
            $(this).closest('.event_description')
                .find('.more_info_container')
                .toggle();
            if (this.innerHTML.match(/More/ig)) {
                this.innerHTML = ' Less';
            } else if (this.innerHTML.match(/Less/ig)) {
                this.innerHTML = ' More&hellip;';
            }
        });
    });
})(jQuery);
