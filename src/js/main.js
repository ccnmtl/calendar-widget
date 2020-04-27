/* global jQuery */
/* global lunr */
/* global CTLEventUtils, CTLEventsManager */

let jQuery = require('jquery');
import 'jquery-ui-dist/jquery-ui.min.js';
import 'jquery-ui-dist/jquery-ui.min.css';
require('imports-loader?jQuery=jquery!../../lib/jquery.simplePagination.js');
import '../../lib/simplePagination.css';
import '../../lib/loaders.min.css';

import * as lunr from 'lunr';

import { CTLEvent } from './ctlevent.js';
import { CTLEventUtils } from './utils.js';
import { CTLEventsManager } from './events-manager.js';

import '../css/list.css';


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

    var clearSearch = function() {
        $('#calendarList').empty();
        $('#calendarList').hide();
        // remove query string from url
        CTLEventUtils.clearURLParams();
        clearFields();
        filterEventHandler();
    };

    /**
     * Generate an element containing all the events that belong on
     * the given page number.
     */
    var renderEvents = function(eArray, pageNum) {
        var $container = $('<div class="ctl-events" />');
        var start = (pageNum - 1) * ITEMS_ON_PAGE;
        var end = start + ITEMS_ON_PAGE;
        for (var i = start; i < end && i < eArray.length; i++) {
            $container.append($(
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
        $('.ctl-events').remove();
        $('#calendarList').append(renderEvents(eArray, pageNum));
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
                if (CTLEventsManager.filteredEvents.length > 0 || $('#q').val().length > 0) {
                    refreshEvents(CTLEventsManager.filteredEvents, pageNumber);
                } else {
                    refreshEvents(CTLEventsManager.allEvents, pageNumber);
                }
            }
        });

        // Initialize the dropdowns and input fields
        var $el = $('#location-dropdown-container');
        $el.append(CTLEventsManager.renderLocationDropdown());

        $el = $('#audience-dropdown-container');
        $el.append(CTLEventsManager.renderAudienceDropdown());

        var $startInput = $('input[name="start_date"]');
        $startInput.datepicker();

        var $endInput = $('input[name="end_date"]');
        $endInput.datepicker();

        // Setup event handlers
        var $locationDropdown = $('#location-dropdown');
        var $audienceDropdown = $('#audience-dropdown');
        var $startDateInput = $('input[name="start_date"]');
        var $endDateInput = $('input[name="end_date"]');
        var $searchWrapper = $('#search-wrapper');

        $locationDropdown.on('change', filterEventHandler);
        $audienceDropdown.on('change', filterEventHandler);
        $startDateInput.on('change', filterEventHandler);
        $endDateInput .on('change', filterEventHandler);
        $searchWrapper.on('submit', filterEventHandler)

        // Get all the url params and save them somewhere
        var queryString = window.location.search.replace(/^\?/, '');
        var urlParams = CTLEventUtils.readURLParams(queryString);

        // Call the filter with the URL params
        var filteredEvents = CTLEventUtils.filterEvents(
            CTLEventsManager.allEvents,
            index,
            CTLEventUtils.getURLParam(urlParams, 'q'),
            CTLEventUtils.getURLParam(urlParams, 'loc'),
            CTLEventUtils.getURLParam(urlParams, 'audience'),
            CTLEventUtils.getURLParam(urlParams, 'start'),
            CTLEventUtils.getURLParam(urlParams, 'end'),
            CTLEventUtils.getURLParam(urlParams, 'eventID')
        );

        // Repopulate the url params, the filter function unsets these
        CTLEventUtils.populateURLParams(urlParams);

        refreshEvents(filteredEvents, 1);
    };

    var clearFields = function() {
      $('#q').val('');
      $('#location-dropdown')[0].value = '';
      $('#audience-dropdown')[0].value = '';
      $('input[name="start_date"]').datepicker('setDate', null);
      $('input[name="end_date"]').datepicker('setDate', null);
    };

    var filterEventHandler = function() {
        // Clear the events
        $('#calendarList').empty();
        // Then get the vars ready
        var $searchWrapper = $('#search-wrapper');

        var $el = $('#calendarList');
        var q = $('#q').val();

        // Clear the events box and add results box when there's text to search
        $el.empty();
        $el.show();
        $el.append('<div class="arrow"></div>');

        var loc = $searchWrapper.find('select#location-dropdown')[0].value;
        var audience = $searchWrapper.find('select#audience-dropdown')[0].value;
        var startDate = $('input[name="start_date"]').datepicker('getDate');
        var endDate = $('input[name="end_date"]').datepicker('getDate');

        // filter events and refresh events
        CTLEventsManager.filteredEvents =
            CTLEventUtils.filterEvents(
                CTLEventsManager.allEvents, index, q, loc, audience,
                startDate, endDate);

        // if there are results and there exists a text query, display the
        // searched text
        if (CTLEventsManager.filteredEvents.length > 0 && q.length > 0) {
            $el.append($('<h2>Results for: "' + q + '"</h2>'));
        }

        refreshEvents(CTLEventsManager.filteredEvents, 1);
    };

    $(document).ready(function() {
        var boilerplate =
            '<div id=loader-animation-container>' +
            '<div class="loader-inner ball-pulse"><div></div><div></div><div></div></div>' +
            '</div>' +
            '<div id="search-wrapper">' +
            '<div class="search-row" id="search-term">' +
            '<div class="search-label">Term</div>' +

            '<form class="search-container" role="search">' +
            '<input id="q" type="search" required="" class="search-box" ' +
            'placeholder="Search for...">' +
            '<button class="close-icon" id="submit-search" type="submit">' +
            'Search</button>' +
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
            '<input name="start_date" autocomplete="off" placeholder="Start Date"/>' +
            '</label>' +
            '</div>' +

            '<div class="search-row" id="search-to">' +
            '<div class="search-label">To</div>' +

            '<label id="to"> ' +
            '<input name="end_date" autocomplete="off" placeholder="End Date" />' +
            '</label>' +
            '<button class="close-icon" id="clear-search" type="reset">' +
            'Clear</button>' +
            '</div>' +
            '</div>' +

            '<div style="clear: both;"></div>' +
            '<div id="search-results-alerts"></div>' +
            '<div id="search-results"></div>' +
            '<div id="calendarList"></div>' +
            '<div class="pagination-holder"></div>';

        $('#calendar-wrapper').append(boilerplate);

        $.ajax({
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
