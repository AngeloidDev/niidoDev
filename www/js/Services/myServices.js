"use strict";

appServices
  .service('AsyncSearch', ['$q', 'UserService', function ($q, UserService) {
    var
      pendingSearch,
      lastSearch,
      cancelSearch = angular.noop;


    /**
     * Async search for contacts
     * Also debounce the queries; since the md-contact-chips does not support this
     */
    function findFriendUserSubscriptionsByUserName(criteria) {
      if (!pendingSearch || !debounceSearch()) {
        cancelSearch();

        return pendingSearch = $q(function (resolve, reject) {
          cancelSearch = reject;

          UserService.findFriendUserSubscriptionsByUserName().get(criteria).$promise.then(function (userList) {
            resolve(userList);
            refreshDebounce();
          }, function (error) {
            console.error("[AsyncSearch.findFriendUserSubscriptionsByUserName] error:", error);
            resolve([]);
            refreshDebounce();
          });
        });
      }
      return pendingSearch;
    }

    function findFriendUserSubscriptionsByUserNamev157(criteria) {
      if (!pendingSearch || !debounceSearch()) {
        cancelSearch();

        return pendingSearch = $q(function (resolve, reject) {
          cancelSearch = reject;

          UserService.findFriendUserSubscriptionsByUserNamev157().get(criteria).$promise.then(function (userList) {
            resolve(userList);
            refreshDebounce();
          }, function (error) {
            console.error("[AsyncSearch.findFriendUserSubscriptionsByUserNamev157] error:", error);
            resolve([]);
            refreshDebounce();
          });
        });
      }
      return pendingSearch;
    }

    /**
     * @param criteria {{userId:number|string, start:number, count:number}}
     * @return {*}
     */
    function findSuggestedFriends(criteria){
      if(!pendingSearch || !debounceSearch()){
        cancelSearch();

        return pendingSearch = $q(function (resolve, reject) {
          cancelSearch = reject;

          UserService.findSuggestedFriends({
            userId:criteria.userId,
            start:criteria.start,
            count:criteria.count
          }).$promise.then(function (userList){
            resolve(userList);
            refreshDebounce();
          }, function(error){
            console.error("[AsyncSearch.findSuggestedFriends] error:", error);
            resolve([]);
            refreshDebounce();
          });
        });
      }
    }

    function refreshDebounce() {
      lastSearch = 0;
      pendingSearch = null;
      cancelSearch = angular.noop;
    }

    /**
     * Debounce if querying faster than 300ms
     */
    function debounceSearch() {
      var now = new Date().getMilliseconds();
      lastSearch = lastSearch || now;
      return ((now - lastSearch) < 300);
    }

    return {
      findFriendUserSubscriptionsByUserName: findFriendUserSubscriptionsByUserName,
      findFriendUserSubscriptionsByUserNamev157: findFriendUserSubscriptionsByUserNamev157,
      findSuggestedFriends: findSuggestedFriends
    };

  }])

;
