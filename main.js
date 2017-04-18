/* global jQuery */
/* global lunr */
/* global CTLEventUtils, CTLEventsManager */

(function($) {

    var ITEMS_ON_PAGE = 6;

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

        CTLEventsManager.filteredEvents = CTLEventUtils.searchEvents(
            events, index, q);
        CTLEventUtils.updateURL('q', q);

        if (CTLEventsManager.filteredEvents.length === 0) {
            $el.append('<div class="q-no-item">Unfortunately, there are ' +
                    'no results matching what you\'re looking for.</div>');
        } else {
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
        $('.pagination-holder').pagination('updateItems', eArray.length);
        jQuery('.ctl-events').remove();
        jQuery('#calendarList').append(renderEvents(eArray, pageNum));
    };


    /**
     * @param events: JSON event object fetched from Bedeworks
     */
    var initializeEventsPage = function(eventsJson) {
        CTLEventsManager.allEvents = CTLEventsManager.loadEvents(eventsJson);
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
                CTLEventUtils.filterEventsByLocation(
                    CTLEventsManager.allEvents, loc);

            if (loc && loc !== 'null') {
                CTLEventUtils.updateURL('loc', loc);
            } else {
                CTLEventUtils.unsetURLParams('loc');
            }

            refreshEvents(CTLEventsManager.filteredEvents, 1);
        });

        // Initialize the audience dropdown
        $el = $('#audience-dropdown-container');
        $el.append(CTLEventsManager.renderAudienceDropdown());
        $el.find('select#audience-dropdown').on('change', function(e) {
            var audience = e.target.value;

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEventsByAudience(
                    CTLEventsManager.allEvents, audience);

            if (audience && audience !== 'null') {
                CTLEventUtils.updateURL('audience', audience);
            } else {
                CTLEventUtils.unsetURLParams('audience');
            }

            refreshEvents(CTLEventsManager.filteredEvents, 1);
        });

        // Initialize the start date field
        var $startInput = $('input[name="start_date"]');
        $startInput.on('change', function(e) {
            var date = e.target.value;
            // splits the format: MM/DD/YYYY
            date = date.split('/');
            var startDate = date ? new Date(date[2], date[0] - 1, date[1]) : null;
            var endDate = $('input[name="end_date"]')[0].value;
            if (endDate) {
                endDate = new Date(endDate);
            }

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEventsByDateRange(
                    CTLEventsManager.allEvents,
                    startDate, endDate);

            if (startDate) {
                CTLEventUtils.updateURL(
                    'start', CTLEventUtils.formatShortDate(startDate));
            } else {
                CTLEventUtils.unsetURLParams('start');
            }
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
            var startDate = $('input[name="start_date"]')[0].value;
            if (startDate) {
                startDate = new Date(startDate);
            }

            CTLEventsManager.filteredEvents =
                CTLEventUtils.filterEventsByDateRange(
                    CTLEventsManager.allEvents,
                    startDate, endDate);

            if (endDate) {
                CTLEventUtils.updateURL(
                    'end', CTLEventUtils.formatShortDate(endDate));
            } else {
                CTLEventUtils.unsetURLParams('end');
            }
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
        var boilerplate = '<div id=loader-animation-container>' +
            '<div class="loader-inner ball-pulse"><div></div><div></div><div></div></div>' +
            '</div>' +
            '<div class="search-wrapper">' +
            
            '<form class="search-container" role="search">' +
            '<input id="q" type="search" required="" class="search-box" ' +
            'placeholder="I\'m searching for...">' +
            '<button class="close-icon" id="clear-search" type="reset">' +
            'Reset</button>' +
            '</form>' +

            '<div id="location-dropdown-container"></div>' +

            '<div id="audience-dropdown-container"></div>' +

            '<label id="from">' +
            '<input name="start_date" placeholder="To"/>' +
            '</label>' +

            '<label id="to"> ' +
            '<input name="end_date" placeholder="From" />' +
            '</label>' +

            '<div id="search-results"></div>' +
            
            '</div>' +
            '<div id="calendarList"></div>' +
            '<div class="pagination-holder"></div>';

        jQuery('#calendar-wrapper').append(boilerplate);

        jQuery.ajax({
            url: 'https://cdn.cul.columbia.edu/ldpd-toolkit/api/events-bw-prox-v2.json.php',
            type: 'GET',
            data: {
                // This is part of a call to a php proxy used by CUL
                burl: 'https://events.columbia.edu/feeder/main/eventsFeed.do',
                f: 'y',
                sort: 'dtstart.utc:asc',
                fexpr: '(categories.href=\"/public/.bedework/categories/org/centertla\")',
                skinName: 'list-json',
                count: 200
            },
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
    });
})(jQuery);
