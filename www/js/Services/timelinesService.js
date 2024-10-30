"use strict";
appControllers
  .factory('timelinesService', function () {

    var eventsAttached = false;

    /**
     *
     * @type {{
     *   events: {
     *     timeline: {refresh: Function},
     *     sequence: {onCreate: Function, onDelete: Function},
     *     comment: {onCreate: Function, onUpdate: Function, onDelete: Function}
     *     advertisement: {onSettingsUpdated: Function}
     *   },
     *   ctrlCreated: boolean,
     *   isFirstTime: boolean
     * }}
     */
    var defaultTimeline = {
      events: {
        timeline: {
          refresh: null
        },
        sequence: {
          onCreate: null,
          onDelete: null,
          onTitleEdited: null,
          onContentEdited: null,
          onCountersUpdated: null
        },
        comment: {
          onCreate: null,
          onUpdate: null,
          onDelete: null,
          onEnabledUpdated: null,
          onLikeUpdated: null
        },
        advertisement:{
          onSettingsUpdated:null
        }
      },
      ctrlCreated: false,
      isFirstTime: true
    };

    /**
     * @type {{
     *   events: {
     *     timeline: {refresh: Function},
     *     sequence: {onCreate: Function, onDelete: Function},
     *     comment: {onCreate: Function, onUpdate: Function, onDelete: Function}
     *   },
     *   ctrlCreated: boolean,
     *   groupId: null,
     *   isFirstTime: boolean,
     *   pinnedSequenceFetched: boolean
     * }}
     */
    var groupTimeline = {
      events: {
        timeline: {
          refresh: null
        },
        sequence: {
          onCreate: null,
          onDelete: null,
          onTitleEdited: null,
          onContentEdited: null,
          onCountersUpdated: null
        },
        comment: {
          onCreate: null,
          onUpdate: null,
          onDelete: null,
          onEnabledUpdated: null,
          onLikeUpdated: null
        }
      },
      ctrlCreated: false,
      groupId: null,
      isFirstTime: true,
      pinnedSequenceFetched: false
    };

    var hashTimeline = {
      events: {
        timeline: {
          onRefresh: null
        },
        sequence: {
          onCreate: null,
          onDelete: null
        },
        comment: {
          onCreate: null,
          onUpdate: null,
          onDelete: null,
          onLikeCounterUpdated: null
        }
      }
    };


    return {
      defaultTimeline: defaultTimeline,
      groupTimeline: groupTimeline,
      hashTimeline: hashTimeline,
      eventsAttached: eventsAttached
    }
  });
