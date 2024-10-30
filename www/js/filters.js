"use strict";
angular.module('app.filters', ['ngResource'])

  .filter('creationTime', ['$filter', function ($filter) {
    return function (sequenceTime) {
      if (sequenceTime && isNaN(sequenceTime)) {
        var creationTime = new Date(sequenceTime);
        var now = new Date();
        var date;
        var timeDiff = Math.abs(now.getTime() - creationTime.getTime());
        var diffDays = Math.round(timeDiff / (1000 * 3600 * 24));
        if (diffDays === 0) {
          date = $filter('date')(creationTime, "h:mm a");
          return $filter('translate')('GLOBAL.TODAY') + date.toLowerCase();
        } else if (diffDays === 1) {
          date = $filter('date')(creationTime, "h:mm a");
          return $filter('translate')('GLOBAL.YESTERDAY') + date.toLowerCase();
        } else {
          date = $filter('date')(creationTime, "MMM d, y");
          return date.toLowerCase();
        }
      } else {
        return sequenceTime;
      }
    };
  }])

  .filter('briefCounter', function () {
    return function (counter) {
      if (!counter || counter < 0 || counter == null || typeof counter === 'undefined')
        return 0;

      var ent, res;
      /*if (counter < 100) {//1 to 999
        return counter;
      }
      else */if (counter < 1000) {//1 to 999
        //return '+99';
        return counter;
      } else if (counter < 1000000) {//1k to 999k
        ent = Math.floor(counter / 1000);
        res = Math.floor(((counter / 1000) - ent) * 10);
        if (ent < 10)
          return ent + (res > 0 ? "." + res + "k" : "k");
        else
          return ent + "k"
      }
      else {//1M and more
        ent = Math.floor(counter / 1000000);
        res = Math.floor(((counter / 1000000) - ent) * 10);
        if (ent < 10)
          return ent + (res > 0 ? "." + res + "M" : "M");
        else
          return ent + "M"
      }
    };
  })
;
