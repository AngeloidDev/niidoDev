"use strict";

appServices
  .service('notificationsService', ['$rootScope', '$resource', 'ApiEndPoint', 'UserService', 'TagsService', 'AWSServices', 'Utils',
    function ($rootScope, $resource, ApiEndPoint, UserService, TagsService, AWSServices, Utils) {
      /**
       * @type BadgesType
       */
      var badges = {unreadRegularNotifications: 0, unreadFollowersNotifications: 0};

      var defaultPaginationValues = {start: 0, count: 7};

      var paginator = {
        regular: {
          pagination: {start: defaultPaginationValues.start, count: defaultPaginationValues.count},
          reset: function () {
            paginator.regular.pagination.start = defaultPaginationValues.start;
            paginator.regular.pagination.count = defaultPaginationValues.count;
          }
        },
        followers: {
          pagination: {start: defaultPaginationValues.start, count: defaultPaginationValues.count},
          reset: function () {
            paginator.followers.pagination.start = defaultPaginationValues.start;
            paginator.followers.pagination.count = defaultPaginationValues.count;
          }
        }
      };

      var notifications = {regular: [], followers: []};


      /**
       * function that returns only the pending notifications (everything except followers) count
       * @param userHref {string}
       * @return {Promise}
       */
      function countPendingRegularNotifications(userHref) {
        //console.log("counting Pending Regular Notifications");
        return Utils.$q(function (resolve, reject) {
          $resource(ApiEndPoint.url + '/restful/services/UserNotificationRepository/actions/countPendingNotifications/invoke', {}, {
            get: {
              method: 'GET',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }).get({
            "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
          }).$promise.then(function (data) {
            if (data.result.value) {
              console.log(data.result.value+" unread regular notifications found");
              badges.unreadRegularNotifications = data.result.value;
              $rootScope.$broadcast("notifications.new", {
                unreadRegularNotifications: badges.unreadRegularNotifications,
                unreadFollowersNotifications: badges.unreadFollowersNotifications
              });
              setTimeout(function () {
                $rootScope.$apply();
              }, 10)
            }
            resolve(data.result.value);
          }, function (error) {
            reject(error);
          })
        });
      }

      /**
       * function that returns only the pending followers notifications count
       * @param userHref {string}
       * @returns {Promise}
       */
      function countPendingFollowersNotifications(userHref) {
        //console.log("counting Pending Followers Notifications");
        return Utils.$q(function (resolve, reject) {
          $resource(ApiEndPoint.url + '/restful/services/UserNotificationRepository/actions/countPendingNotificationsFollow/invoke', {}, {
            get: {
              method: 'GET',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }).get({
            "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
          }).$promise.then(function (data) {
            if (data.result.value) {
              badges.unreadFollowersNotifications = data.result.value;
              $rootScope.$broadcast("notifications.new", {
                unreadRegularNotifications: badges.unreadRegularNotifications,
                unreadFollowersNotifications: badges.unreadFollowersNotifications
              });
              setTimeout(function () {
                $rootScope.$apply();
              }, 10)
            }
            resolve(data.result.value);
          }, function (error) {
            reject(error);
          });
        })
      }

      /**
       * @type {{regularNotifications: regularNotifications, followersNotifications: followersNotifications}}
       */
      var updateBadgesCount = {
        /**@param numOfRegularNotif {number}*/
        regularNotifications: function (numOfRegularNotif) {
          if (typeof numOfRegularNotif === 'number') {
            badges.unreadRegularNotifications = numOfRegularNotif;
            $rootScope.$broadcast("notifications.new", {
              unreadRegularNotifications: badges.unreadRegularNotifications,
              unreadFollowersNotifications: badges.unreadFollowersNotifications
            });
            setTimeout(function () {
              $rootScope.$apply()
            }, 10);
          }
          else
            Utils.toast.error("Cant update followers badget count, the argument is not a number");
        },
        /**@param numOfFollowersNotif {number}*/
        followersNotifications: function (numOfFollowersNotif) {
          if (typeof numOfFollowersNotif === 'number') {
            badges.unreadFollowersNotifications = numOfFollowersNotif;
            $rootScope.$broadcast("notifications.new", {
              unreadRegularNotifications: badges.unreadRegularNotifications,
              unreadFollowersNotifications: badges.unreadFollowersNotifications
            });
            setTimeout(function () {
              $rootScope.$apply()
            }, 10);
          }
          else {
            Utils.toast.error("Cant update followers badget count, the argument is not a number");
          }
        }
      };


      /*------------ AWS NOTIFICATIONS --------------*/
      /**
       * @param toUserId {number|string}
       * @return Promise {bolean|*}
       */
      function notifyNewCommentOnSequence(toUserId) {
        return _sendNotificationToUserDevices(
          toUserId,
          UserService.get_USER_NAME() + " " + Utils.translate('ALERTS.COMMENT_SEQUENCE')
        )
      }

      /**
       * @param toUserId {number|string}
       * @return Promise {bolean|*}
       */
      function notifyCommentLiked(toUserId) {
        return _sendNotificationToUserDevices(
          toUserId,
          UserService.get_USER_NAME() + " " + Utils.translate('ALERTS.LIKE_COMMENT')
        )
      }

      /**
       * @param toUserId {number|string}
       * @return Promise {bolean|*}
       */
      function notifySequenceLiked(toUserId) {
        return _sendNotificationToUserDevices(
          toUserId,
          UserService.get_USER_NAME() + " " + Utils.translate("ALERTS.LIKE_SEQUENCE")
        )
      }

      /**
       * @param toUserId {number|string}
       * @return Promise {bolean|*}
       */
      function notifyReactToSequence(toUserId) {
        return _sendNotificationToUserDevices(
          toUserId,
          UserService.get_USER_NAME() + " " + Utils.translate('ALERTS.REACTED_TO_SEQUENCE')
        )
      }

      /**
       * @param promiseTagData {*}
       * @return Promise {boolean|*}
       */
      function notifyTaggedUsersInComment(promiseTagData) {
        return _notifyUsersTaggedInObject(
          promiseTagData,
          UserService.get_USER_NAME() + " " + Utils.translate("ALERTS.TAG_COMMENT")
        )
      }

      /**
       * @param promiseTagData {*}
       * @return Promise {boolean|*}
       */
      function notifyTaggedUsersInUpdatedComment(promiseTagData) {
        return _notifyUsersTaggedInObject(
          promiseTagData,
          UserService.get_USER_NAME() + " " + Utils.translate("ALERTS.UPDATE_COMMENT_TAGGED")
        )
      }

      /**
       * @param promiseTagData {*}
       * @return Promise {boolean|*}
       */
      function notifyUsersTaggedInSequence(promiseTagData) {
        return _notifyUsersTaggedInObject(
          promiseTagData,
          UserService.get_USER_NAME() + " " + Utils.translate("ALERTS.TAG_SEQUENCE")
        )
      }

      /**
       * Helper function
       * @param promiseTagData {*}
       * @param message {string}
       * @return Promise {number|*}
       */
      function _notifyUsersTaggedInObject(promiseTagData, message) {
        return Utils.$q(function (resolve, reject) {
          var userIdsList = Object.keys(promiseTagData);

          var numUsersToNotify = 0;

          //get devices for tags
          var sentNotificationsPromises = [];
          userIdsList.forEach(function (userId) {
            //if the user wants to be notified...
            if (promiseTagData[userId].result.value == true) {
              numUsersToNotify++;
              sentNotificationsPromises.push(_sendNotificationToUserDevices(userId, message))
            }
          });

          Utils.$q.all(sentNotificationsPromises).then(function () {
            resolve(numUsersToNotify)
          }, function (error) {
            console.error("_notifyUsersTaggedInObject", error);
            reject(error)
          });
        })
      }

      /**
       * Helper function
       * @param toUserId {number|string}
       * @param message {string}
       * @return Promise {boolean|*}
       */
      function _sendNotificationToUserDevices(toUserId, message) {
        return Utils.$q(function (resolve, reject) {
          UserService.getDevices(toUserId).$promise.then(function (userTagged) {
            message = (message || "").replace(/\s\s+/g, ' ');
            //for any user device...
            userTagged.value.forEach(function (endpointArn) {
              AWSServices.sendNotification(message, endpointArn.title);
            });
            resolve(true);
          }, function (error) {
            console.error("UserService.getDevices", error);
            reject(error)
          });
        })
      }

      /*-------- END OF AWS NOTIFICATIONS -----------*/

      return {
        badges: badges,
        paginator: paginator,
        notifications: notifications,
        countPendingRegularNotifications: countPendingRegularNotifications,
        countPendingFollowersNotifications: countPendingFollowersNotifications,
        updateBadgesCount: updateBadgesCount,
        notifyNewCommentOnSequence: notifyNewCommentOnSequence,
        notifyCommentLiked: notifyCommentLiked,
        notifySequenceLiked: notifySequenceLiked,
        notifyReactToSequence: notifyReactToSequence,
        notifyTaggedUsersInComment: notifyTaggedUsersInComment,
        notifyTaggedUsersInUpdatedComment: notifyTaggedUsersInUpdatedComment,
        notifyUsersTaggedInSequence: notifyUsersTaggedInSequence
      }
    }]);

/**
 * @typedef {Object} BadgesType
 * @property {number} unreadRegularNotifications
 * @property {number} unreadFollowersNotifications
 */

/**
 * @typedef {Function} regularNotifications
 * @param {number} numOfRegularNotif
 */

/**
 * @typedef {Function} followersNotifications
 * @param {number} numOfFollowersNotif
 */
