"use strict";
appControllers
  .controller('notificationsTabsCtrl', ['$rootScope', '$scope', 'network', 'notificationsService', function ($rootScope, $scope, network, notificationsService) {
    //console.log("notificationsTabsCtrl created!!!");
    /**@type {network|*} - null | {network}*/
    $scope.network = network;

    $scope.badges = notificationsService.badges;

  }])
  .controller('notificationsRegularCtrl', ['$rootScope', '$scope', '$state', '$ionicPopup', 'notificationsService', 'UserService', 'SequenceService', 'reDirectService', 'selectedSequenceData', 'Utils', function ($rootScope, $scope, $state, $ionicPopup, notificationsService, UserService, SequenceService, reDirectService, selectedSequenceData, Utils) {
    //console.log("notificationsRegularCtrl created!!!");
    var mySubscriptionId = UserService.get_USER_ID();

    $scope.refreshText = Utils.translate('GLOBAL.RELOAD');

    $scope.notifications = notificationsService.notifications.regular;

    $scope.unreadNotifications = 0;

    $scope.isFirstTime = true;
    $scope.isRefreshing = false;
    $scope.isLoadingContent = false;
    $scope.canGetMoreItems = true;

    var toastCtrl = Utils.toast.getCtrl();
    var newNotifToast;

    function closeNewNotificationsToast() {
      //console.log("Closing notifications...");
      if (newNotifToast) {
        toastCtrl.clear(newNotifToast);
        toastCtrl.remove(newNotifToast);//myabe it's unnecessary
      }

      newNotifToast = undefined;
    }

    $scope.reloadToViewNewNotifications = function (mustReload) {
      if (mustReload) {
        $scope.refreshItems(true);//true == keep old data
      }

      closeNewNotificationsToast();
    };

    $scope.showNewNotificationsToast = function () {
      if(true){
        console.log("there are new notifications but by now, I can't show you any message ;(");
        return;
      }

      newNotifToast = toastCtrl.info(
        Utils.translate('NOTIFICATIONS.DIALOG.NEW_REG_NOTIF_FOUND') +
        '<br><button id="reg-notif-close" class="md-button md-raised" ng-click="reloadToViewNewNotifications(false)">' +
        Utils.translate('GLOBAL.NO') +
        '</button>' +
        '<button id="reg-notif-reload" class="md-button md-raised md-primary" ng-click="reloadToViewNewNotifications(true)">' +
        Utils.translate('GLOBAL.YES') +
        '</button>', {
          allowHtml: true, timeOut: 0, extendedTimeOut: 0, tapToDismiss: false, onShown: function () {
            var el1 = document.getElementById('reg-notif-reload');
            if (el1) Utils.$compile(el1)($scope);
            var el2 = document.getElementById('reg-notif-close');
            if (el2) Utils.$compile(el2)($scope);
          }
        });

      $scope.isRefreshing = false;
      $scope.isLoadingContent = false;
      $scope.$broadcast('scroll.refreshComplete');
      $scope.$broadcast('scroll.infiniteScrollComplete');
    };

    $scope.$on("$ionicView.enter", function () {
      if ($scope.isFirstTime) {
        $scope.getMoreItems();
        return;
      }

      $scope.isLoadingContent = true;
      countUnreadRegularNotifications().then(function (numUnreadNotif) {
        //console.log("$scope.unreadNotifications: " + $scope.unreadNotifications + "; unread notif: " + numUnreadNotif);

        if (numUnreadNotif > 0) {//$scope.unreadNotifications) {
          $scope.unreadNotifications = numUnreadNotif;
          $scope.showNewNotificationsToast();
        }
      }, function (error) {
        console.error(error);
      }).finally(function () {
        $scope.isLoadingContent = false;
      })
    });

    //we use this because $ionicView.???Leave events doesn't trigger with the (current side-menus) + tabs structure
    //only on changes between tabs or inside tab
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (fromState.name === 'menu.notificationTabs.regular') {
        $scope.canGetMoreItems = true;

        closeNewNotificationsToast();
      }
    });

    $scope.getMoreItems = function () {
      $scope.isLoadingContent = true;
      countUnreadRegularNotifications().then(function (numUnreadNotif) {
        //console.log("LOCAL unread notif: " + $scope.unreadNotifications + "; REMOTE unread notif: " + numUnreadNotif);

        //if new notifications were found (after scrolling down or view re-enter)
        if (numUnreadNotif > $scope.unreadNotifications && !$scope.isFirstTime) {
          $scope.unreadNotifications = numUnreadNotif;
          $scope.showNewNotificationsToast();
          $scope.isLoadingContent = false;
          return;
        }

        $scope.unreadNotifications = numUnreadNotif;

        getAllRegularNotifications().then(function (newNotifications) {
          //console.log(newNotifications);
          if (!notificationsService.notifications.regular.length) {// || $scope.newNotificationsFound) {
            $scope.notifications = notificationsService.notifications.regular = newNotifications;
            Utils.$ionicScrollDelegate.scrollTop();
            Utils.$ionicScrollDelegate.resize();
            return;
          }

          notificationsService.notifications.regular = notificationsService.notifications.regular.concat(newNotifications);
          $scope.notifications = notificationsService.notifications.regular;
          Utils.$ionicScrollDelegate.resize();
        }, function (error) {
          console.error(error)
        });
      }, function (error) {
        console.error(error);
      })
    };

    /**
     * @param notificationId {Object}
     * @returns {Promise}
     */
    function updateNotificationStatus(notificationId) {
      return Utils.$q(function (resolve, reject) {
        UserService.updateNotificationStatus({
          objectId: notificationId
        }).save({int: {value: 3}}).$promise.then(function () {
          resolve(notificationId)
        }, function (error) {
          reject(error);
          console.log("updateNotificationStatus error", error);
        });
      })
    }

    /**
     * @returns {Promise} - Number
     */
    function countUnreadRegularNotifications() {
      return Utils.$q(function (resolve, reject) {
        notificationsService.countPendingRegularNotifications(UserService.get_USER_INSTANCE_HREF()).then(function (total) {
          resolve(total);
        }, function (error) {
          console.error("countPendingNotifications error", error);
          $scope.errorLoading = true;
          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;
          $scope.canGetMoreItems = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
          reject(error);
        });

        notificationsService.countPendingFollowersNotifications(UserService.get_USER_INSTANCE_HREF());
      })
    }

    /**
     * @returns {Promise}
     */
    function getAllRegularNotifications() {
      return Utils.$q(function (resolve, reject) {
        //console.log("pagination", notificationsService.paginator.regular.pagination);
        UserService.findAllUserNotificationsByUserSubscriptionNotifications(
          mySubscriptionId,
          notificationsService.paginator.regular.pagination
        ).then(function (allUserNotifications) {

          var notifications = [];
          allUserNotifications.forEach(function (notification) {
            //-------------  START OF: Filter out the existing notifications ------
            var exists = $scope.notifications.some(function (currNotif) {
              return notification.userNotification.href === currNotif.userNotification.href
            });

            if (exists) {
              //console.log("id: "+Utils.getLastUrlComponent(notification.userNotification.href)+" already exists");
              return; //<-- this will make the foreach to continue with the next item...
            }
            //----------- END OF: Filter out the existing notifications ---------

            var friendHref = notification.userSubscriptionSent.href;
            var friendSubscriptionIntanceId = Utils.getLastUrlComponent(friendHref);

            //prepare the data of the user that make the action for the notification
            var userSend = UserService.getUserSubscriptionByinstanceId(friendSubscriptionIntanceId);

            //prepare the data to check if user is following the new follower
            var isFollowed = UserService.getFollowingIsActive().get({
              objectId: mySubscriptionId,
              "x-isis-querystring": {friendId: {value: {href: friendHref}}}
            });

            var ownerSequence = null;
            if (notification.sequence) {
              //ownerSequence = SequenceService.obtainSequence(Utils.getLastUrlComponent(notification.sequence.href));
              ownerSequence = SequenceService.findSequenceBySequenceIdV181(notification.sequenceId)
            }

            //console.log(userSend.members)
            var realImg;
            if (notification.sequenceUrl != null) {
              var nameArchive = notification.sequenceUrl.split('/')[8];
              var nameExtension = nameArchive.split('.')[1];
              if (nameExtension != 'jpg') {
                realImg = 'img/icons/photo_camera_24px.svg';
              } else {
                realImg = notification.sequenceUrl;
              }
            }
            else {
              realImg = 'img/icons/edit_24px.svg';
            }

            //Add every package of info for each notification
            notifications.push({
              notificationStatus: notification.notificationStatus,
              notificationStatusInt: notification.notificationStatusInt,
              notificationType: notification.notificationType,
              sequenceId: notification.sequenceId,
              sequenceInstanceId: notification.sequence ? Utils.getLastUrlComponent(notification.sequence.href) : null,
              userNotification: notification.userNotification,
              itemId: notification.itemId,
              sequencePicture: notification.sequencePicture,
              //sequencePictureUrl: notification.sequenceUrl,
              sequencePictureUrl: realImg,
              notificationPicture: notification.notificationPicture,
              reactUrl: notification.reactUrl,
              creationTime: notification.creationTime,
              description: notification.description,
              userSubscriptionSent: notification.userSubscriptionSent,
              userSend: userSend,
              friend: notification.friend,
              followed: isFollowed,
              ownerSequence: ownerSequence
            });

            //console.log("Notification id: " + Utils.getLastUrlComponent(notification.userNotification.href));

            //Update the notification status if required
            if (notification.notificationType != 4 && notification.notificationStatusInt != 3 || notification.notificationStatus === 'Pending') {
              //console.log("updating status of id: " + Utils.getLastUrlComponent(notification.userNotification.href));
              updateNotificationStatus(Utils.getLastUrlComponent(notification.userNotification.href)).then(function (updatedId) {
                //console.log("updated status of id: " + id);
                $scope.unreadNotifications--;
              }, function (error) {
                //error already printed out
              });
            }
          });

          setTimeout(function () {
            notificationsService.updateBadgesCount.regularNotifications($scope.unreadNotifications);
          }, 2000);

          notificationsService.paginator.regular.pagination.start += allUserNotifications.length;

          $scope.canGetMoreItems = allUserNotifications.length > 0;
          $scope.isFirstTime = false;
          resolve(notifications);
        }, function (error) {
          console.error("findAllUserNotificationsByUserSubscription error", error);

          $scope.canGetMoreItems = false;
          $scope.errorLoading = true;
          reject(error);
        }).finally(function () {
          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      })
    }


    $scope.refreshItems = function (keepOldNotifications) {
      //console.log("Refreshing items...");

      closeNewNotificationsToast();

      $scope.$broadcast('scroll.refreshComplete');
      if (!keepOldNotifications)
        $scope.notifications = notificationsService.notifications.regular = [];

      $scope.errorLoading = false;
      $scope.isFirstTime = true;
      $scope.isRefreshing = true;

      notificationsService.paginator.regular.reset();
      Utils.$ionicScrollDelegate.resize();
      Utils.$ionicScrollDelegate.scrollTop();
      $scope.getMoreItems()
    };

    $scope.sendUserProfile = function (userChosen) {
      var friendSubscriptionIntanceId = Utils.getLastUrlComponent(userChosen.href);
      reDirectService.reDirectProfile(friendSubscriptionIntanceId);
    };

    $scope.showReactPicture = function (sequencePicture, reactPicture, index, description, id, seen, update) {
      $scope.loadingInit = 1;
      $scope.activeSlide = index;
      if (seen == 1) {
        var myVarPicture = $ionicPopup.show({
          scope: $scope,
          animation: 'zoom-from-center',
          templateUrl: 'templates/reactZoomView.html'
        });

        setTimeout(function () {
          $scope.reactPictures = {
            sequencePicture: sequencePicture,
            reactPicture: reactPicture,
            description: description
          };
        }, 200);

        $scope.myReactPicture = function () {
          $scope.reactPictures = {};
          myVarPicture.close();
        };

        updateNotificationStatus(Utils.getLastUrlComponent(update.href)).then(function (updatedId) {
          //console.log("updateNotificationStatus react", response);
          description = "Readed";
        }, function (error) {
          //error already printed out
        });
      }
    };

    $scope.sendSequenceSelected = function (id, instanceId, ownerSequence) {
      $scope.selectedSequenceData = selectedSequenceData;
      Utils.removeLastItemIfHasNoAttribute(ownerSequence, "sequenceId");

      if (ownerSequence.length) {
        $scope.selectedSequenceData.anadir(id, instanceId, Utils.getLastUrlComponent(ownerSequence[0].userSubscriptionId.href));

        $state.go('showNotification', {sequenceBasicData: ownerSequence[0]}, {reload: true});
      }
    };

    $scope.checkBeforeSend = function (notification, indexNot) {
      if (notification.notificationType == 4 && notification.sequencePicture != null) {
        $scope.showReactPicture(
          'data:image/png;base64,' + notification.sequencePicture.split(':')[2],
          'data:image/png;base64,' + notification.notificationPicture.split(':')[2],
          indexNot,
          notification.description,
          notification.userNotification.href.split('/')[6],
          notification.notificationStatusInt,
          notification.userNotification,
          notification.description
        );
      }
      else if (notification.notificationType == 4 && notification.sequencePictureUrl != null) {
        $scope.showReactPicture(
          notification.notificationPictureUrl,
          notification.reactUrl,
          indexNot,
          notification.description,
          notification.userNotification.href.split('/')[6],
          notification.notificationStatusInt,
          notification.userNotification,
          notification.description
        );
      }
      else if (notification.notificationType == 5 ||
        notification.notificationType == 6 ||
        notification.notificationType == 7 ||
        notification.notificationType == 8 ||
        notification.notificationType == 9) {
        $scope.sendSequenceSelected(
          notification.sequenceId,
          notification.sequenceInstanceId,
          notification.ownerSequence
        );
      }
      else if (notification.notificationType == 11) {
        $state.go('groupReceivedRequests');
      }
    };

  }])
  .controller('notificationsFollowersCtrl', ['$rootScope', '$scope', 'notificationsService', 'UserService', 'reDirectService', 'Utils', 'AWSServices', function ($rootScope, $scope, notificationsService, UserService, reDirectService, Utils, AWSServices) {
    //console.log("notificationsFollowersCtrl loaded!!!");

    var mySubscriptionId = UserService.get_USER_ID();

    $scope.refreshText = Utils.translate('GLOBAL.RELOAD');
    $scope.followText = Utils.translate('GLOBAL.FOLLOW');
    $scope.unfollowText = Utils.translate('GLOBAL.UNFOLLOW');

    $scope.followerNotifications = notificationsService.notifications.followers;

    $scope.unreadFollowersNotifications = 0;

    $scope.isFirstTime = true;
    $scope.isRefreshing = false;
    $scope.isLoadingContent = false;
    $scope.canGetMoreItems = true;

    var toastCtrl = Utils.toast.getCtrl();
    var newNotifToast;

    function closeNewFollowersToast() {
      if (newNotifToast) {
        toastCtrl.clear(newNotifToast);
        toastCtrl.remove(newNotifToast);//myabe it's unnecessary
      }

      newNotifToast = undefined;
    }

    $scope.reloadToViewNewFollowers = function (mustReload) {
      if (mustReload) {
        $scope.refreshItems(true);//true == keep old data
      }

      closeNewFollowersToast();
    };

    $scope.showNewFollowersToast = function () {
      newNotifToast = toastCtrl.info(
        Utils.translate('NOTIFICATIONS.DIALOG.NEW_FOLLOWERS_FOUND') +
        '<br><button id="reg-notif-close" class="md-button md-raised" ng-click="reloadToViewNewFollowers(false)">' +
        Utils.translate('GLOBAL.NO') +
        '</button>' +
        '<button id="reg-notif-reload" class="md-button md-raised md-primary" ng-click="reloadToViewNewFollowers(true)">' +
        Utils.translate('GLOBAL.YES') +
        '</button>', {
          allowHtml: true, timeOut: 0, extendedTimeOut: 0, tapToDismiss: false, onShown: function () {
            var el1 = document.getElementById('reg-notif-reload');
            if (el1) Utils.$compile(el1)($scope);
            var el2 = document.getElementById('reg-notif-close');
            if (el2) Utils.$compile(el2)($scope);
          }
        });
    };

    $scope.$on("$ionicView.enter", function () {
      if ($scope.isFirstTime) {
        $scope.getMoreItems();
        return;
      }

      $scope.isLoadingContent = true;
      countUnreadFollowersNotifications().then(function (numUnreadNotif) {
        //console.log("$scope.unreadFollowersNotifications: " + $scope.unreadFollowersNotifications + "; unread notif: " + numUnreadNotif);

        if (numUnreadNotif > 0) {//$scope.unreadFollowersNotifications) {
          $scope.unreadFollowersNotifications = numUnreadNotif;
          $scope.showNewFollowersToast();
        }
      }, function (error) {
        console.error(error);
      }).finally(function () {
        $scope.isLoadingContent = false;
      })
    });

    //we use this because $ionicView.???Leave events doesn't trigger with the current side-menus + tabs structure
    //only on changes between tabs o inside tabs
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      if (fromState.name === 'menu.notificationTabs.follwers') {
        $scope.canGetMoreItems = true;

        closeNewFollowersToast();
      }
    });

    $scope.getMoreItems = function () {
      $scope.isLoadingContent = true;
      countUnreadFollowersNotifications().then(function (numUnreadNotif) {
        //console.log("LOCAL unread notif: " + $scope.unreadFollowersNotifications + "; REMOTE unread notif: " + numUnreadNotif);

        if (numUnreadNotif > $scope.unreadFollowersNotifications && !$scope.isFirstTime) {
          $scope.unreadFollowersNotifications = numUnreadNotif;
          $scope.showNewFollowersToast();
          $scope.isLoadingContent = false;
          return;
        }

        $scope.unreadFollowersNotifications = numUnreadNotif;

        getAllFollowersNotifications().then(function (newNotifications) {
          if (!notificationsService.notifications.followers.length) {
            $scope.followerNotifications = notificationsService.notifications.followers = newNotifications;
            Utils.$ionicScrollDelegate.scrollTop();
            Utils.$ionicScrollDelegate.resize();
            return;
          }

          notificationsService.notifications.followers = notificationsService.notifications.followers.concat(newNotifications);
          $scope.followerNotifications = notificationsService.notifications.followers;
          Utils.$ionicScrollDelegate.resize();
        }, function (error) {
          console.error(error)
        });
      }, function (error) {
        console.error(error);
      })
    };


    /**
     * @param notification {Object}
     * @returns {Promise}
     */
    function updateNotificationStatus(notificationId) {
      return Utils.$q(function (resolve, reject) {
        UserService.updateNotificationStatus({
          objectId: notificationId
        }).save({int: {value: 3}}).$promise.then(function () {
          resolve(notificationId)
        }, function (error) {
          reject(error);
          console.error("updateNotificationStatus error", error);
        });
      })
    }

    /**
     * @returns {Promise}
     */
    function countUnreadFollowersNotifications() {
      return Utils.$q(function (resolve, reject) {
        notificationsService.countPendingFollowersNotifications(UserService.get_USER_INSTANCE_HREF()).then(function (total) {
          resolve(total);
        }, function (error) {
          console.error("countPendingFollowersNotifications error", error);
          $scope.errorLoading = true;
          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;
          $scope.canGetMoreItems = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
          reject(error);
        });

        console.log("countUnreadFollowersNotifications", UserService.get_USER_INSTANCE_HREF());
        notificationsService.countPendingRegularNotifications(UserService.get_USER_INSTANCE_HREF());
      })
    }

    /**
     * @returns {Promise}
     */
    function getAllFollowersNotifications() {
      return Utils.$q(function (resolve, reject) {
        //console.log("Followers pagination", notificationsService.paginator.followers.pagination);
        UserService.findAllUserNotificationsByUserSubscriptionFollow(
          mySubscriptionId,
          notificationsService.paginator.followers.pagination
        ).then(function (allUserNotifications) {
          //console.log("Regular notifications: ", allUserNotifications.length);

          var notifications = [];
          allUserNotifications.forEach(function (notification) {
            //-------------  START OF: Filter out the existing notifications ------
            var exists = $scope.followerNotifications.some(function (currNotif) {
              return notification.userNotification.href === currNotif.userNotification.href
            });

            if (exists) {
              //console.log("id: "+Utils.getLastUrlComponent(notification.userNotification.href)+" already exists");
              return; //<-- this will make the foreach to continue with the next item...
            }
            //----------- END OF: Filter out the existing notifications ---------

            var friendHref = notification.userSubscriptionSent.href;
            var friendSubscriptionIntanceId = Utils.getLastUrlComponent(friendHref);

            //prepare the data of the user that make the action for the notification
            var userSend = UserService.getUserSubscriptionByinstanceId(friendSubscriptionIntanceId);

            //prepare the data to check if user is following the new follower
            var isFollowed = UserService.getFollowingIsActive().get({
              objectId: mySubscriptionId,
              "x-isis-querystring": {friendId: {value: {href: friendHref}}}
            });


            //Add every package of info for each notification
            notifications.push({
              notificationStatus: notification.notificationStatus,
              notificationStatusInt: notification.notificationStatusInt,
              notificationType: notification.notificationType,
              sequenceId: notification.sequenceId,
              sequenceInstanceId: notification.sequence ? Utils.getLastUrlComponent(notification.sequence.href) : null,
              userNotification: notification.userNotification,
              itemId: notification.itemId,
              sequencePicture: notification.sequencePicture,
              notificationPicture: notification.notificationPicture,
              creationTime: notification.creationTime,
              description: notification.description,
              userSubscriptionSent: notification.userSubscriptionSent,
              userSend: userSend,
              friend: notification.friend,
              followed: isFollowed
            });

            //console.log("Follower Notification id: " + Utils.getLastUrlComponent(notification.userNotification.href));

            //Update the notification status if required
            if (notification.notificationType != 4 && notification.notificationStatusInt != 3 || notification.notificationStatus === 'Pending') {
              updateNotificationStatus(Utils.getLastUrlComponent(notification.userNotification.href)).then(function (updatedId) {
                $scope.unreadFollowersNotifications--;
              }, function (error) {
                //error already printed out
              });
            }
          });

          setTimeout(function () {
            notificationsService.updateBadgesCount.followersNotifications($scope.unreadFollowersNotifications);
          }, 2000);

          notificationsService.paginator.followers.pagination.start += allUserNotifications.length;

          $scope.canGetMoreItems = allUserNotifications.length > 0;
          $scope.isFirstTime = false;
          resolve(notifications);
        }, function (error) {
          console.error("findAllUserNotificationsByUserSubscriptionFollow error", error);

          $scope.errorLoading = true;
          $scope.canGetMoreItems = false;
          reject(error);
        }).finally(function () {
          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      })
    }


    $scope.refreshItems = function (keepOldFollowers) {
      //console.log("Refresing items...");
      //$scope.canGetMoreItems = true;
      closeNewFollowersToast();

      $scope.$broadcast('scroll.refreshComplete');

      if (!keepOldFollowers)
        $scope.followerNotifications = notificationsService.notifications.followers = [];

      $scope.errorLoading = false;
      $scope.isFirstTime = true;
      $scope.isRefreshing = true;

      notificationsService.paginator.followers.reset();
      Utils.$ionicScrollDelegate.resize();
      Utils.$ionicScrollDelegate.scrollTop();
      $scope.getMoreItems()
    };

    $scope.sendUserProfile = function (userChosen) {
      var friendSubscriptionIntanceId = Utils.getLastUrlComponent(userChosen.href);
      reDirectService.reDirectProfile(friendSubscriptionIntanceId);
    };

    $scope.addFriends = function (notification) {
      notification.togglingFollow = true;
      notification.followed.result.value = !notification.followed.result.value;
      UserService.addFriends({objectId: mySubscriptionId}).save({
        friendId: {value: {href: notification.userSubscriptionSent.href}}
      }).$promise.then(function (response) {
        //Send push notification Follower Follower
        if (response.result.value) {
          UserService.getDevices(
            Utils.getLastUrlComponent(notification.userSubscriptionSent.href)
          ).$promise.then(function success(response) {
            //console.log("devices: ", response);
            var tokens = [];
            var name = UserService.get_USER_NAME() || Utils.translate('NOTIFICATIONS.DIALOG.SOMEONE');
            var message = name + Utils.translate('NOTIFICATIONS.DIALOG.IS_FOLLOWING_YOU');
            message = message.replace(/\s\s+/g, ' ');
            for (var i = 0; i < response.value.length; i++) {
              var endpointArn = response.value[i].title;
              AWSServices.sendNotification(message, endpointArn);
            }
          }, function (error) {
            console.error("UserService.addDevice error: ", error);
          });
        }
        //success
        notification.togglingFollow = false;
      }, function (error) {
        console.log("addFriends error", error);
      });
    };

    $scope.acceptFriend = function (friend) {
      UserService.acceptFriend({objectId: Utils.getLastUrlComponent(friend.href)}).save(
        function () {
          document.getElementById("accept").style.display = "none";
          document.getElementById("accepted").style.display = "block";
        }, function (error) {
          console.error("acceptFriend error", error);
        });
    };
  }])
  .controller('showNotificationCtrl', ['$rootScope', '$scope', 'UserService', 'SequenceService', 'adsService', '$state', 'network', 'permissionValidationService', 'cqnzService', 'SequenceFactory', 'CommentFactory', 'Utils',
    function ($rootScope, $scope, UserService, SequenceService, adsService, $state, network, permissionValidationService, cqnzService, SequenceFactory, CommentFactory, Utils) {
      var sequenceBasicData = $state.params.sequenceBasicData;
      //console.log("showNotificationCtrl created", sequenceBasicData);

      var myUserId = UserService.get_USER_ID();

      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      $scope._controllerName = 'showNotificationCtrl';

      $scope.refreshText = Utils.translate('GLOBAL.RELOAD');

      $scope.showAllComments = true;//for showing more than 2 comments in list
      $scope.showCommentAvatar = true;
      $scope.showCommentLikeCounter = true;
      $scope.canShowCommentEditActionsMenu = true;

      var pagination = {
        start: 0,
        count: 10
      };

      $scope.isRefreshing = false;
      $scope.canGetMoreItems = true;

      /*
      $scope.isFirstTime = true;
      $scope.isLoadingContent = false*/


      $scope.sequence = {};//the object for everything except comments list

      //only for building the comments section
      $scope.sequenceAux = {
        comments: {
          enabled: !!(sequenceBasicData.commentEnable && permissionValidationService.canCreateComment()),
          counter: +sequenceBasicData.sequenceCommentCount,
          items: []
        }
      };

      $scope.canComment = /*permissionValidationService.amISuperAdmin() ||*/ $scope.sequenceAux.comments.enabled;

      var newTagList = [];
      $scope.errorLoading = false;
      $scope.network = network;
      $scope.commentsActive = false;
      $scope.commentsActiveKey = 0;
      $scope.uploadingComment = true;
      $scope.isIOS = ionic.Platform.isIOS();
      $scope.isAndroid = ionic.Platform.isAndroid();



      /**@type {SequenceMetadataType}*/
      var sequenceMetadata = {
        id: sequenceBasicData.sequenceId,
        instanceId: +Utils.getLastUrlComponent(sequenceBasicData.sequence.href),
        href: sequenceBasicData.sequence.href + "",
        dateTime: sequenceBasicData.creationTime,
        finalDate: sequenceBasicData.finalDate,
        lifetime: sequenceBasicData.lifetime,
        isPinned: sequenceBasicData.pinned,
        isAdvertisement: sequenceBasicData.isAdvertisement,
        mustBeDeleted: !(!sequenceBasicData.mustBeDeleted),
        belongsMe: UserService.get_USER_ID() == Utils.getLastUrlComponent(sequenceBasicData.userSubscriptionId.href)
      };

      /**@type {SequenceOwnerMetadataType}*/
      var sequenceOwnerMetadata = {
        id: +Utils.getLastUrlComponent(sequenceBasicData.userSubscriptionId.href),
        //instanceId:pendiente...
        name: sequenceBasicData.name + "",
        avatar: Utils.getUserImgUrl(sequenceBasicData)
      };

      (function () {
        SequenceService.findSequenceBySequenceIdV181(sequenceMetadata.id).$promise.then(function (basicData) {
          Utils.removeLastItemIfHasNoAttribute(basicData, 'sequenceId');

          var listTags = SequenceService.obtainTagwithIdandType({
            sequenceId: basicData[0].sequenceId,
            notificationType: 7
          });

          var listHashs = SequenceService.getHashFromSequence(basicData[0].sequenceId);

          //we dont want to load comments for this sequence
          //because they will be loaded apart
          /*var comments = SequenceService.findTheCommentsOfASequencev157({
            sequenceId: basicData[0].sequenceId,
            start: 0,
            count: 2
          });*/

          Utils.$q.all({
            basicData: basicData[0],
            //comments: comments,
            tagsList: listTags,
            hashesList: listHashs
          }).then(function (notifCqnz) {

            //we dont want to load nor set the comments for this sequence
            //because they will be loaded apart
            notifCqnz.comments = [];

            notifCqnz.sequenceOwnerId = Utils.getLastUrlComponent(notifCqnz.basicData.userSubscriptionId.href);
            notifCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(notifCqnz.basicData.sequenceId);
            notifCqnz.likeActive = SequenceService.findSmileysCount({
              sequenceId: Utils.getLastUrlComponent(notifCqnz.basicData.sequence.href),
              userId: myUserId
            });
            notifCqnz.followEachOther = myUserId == notifCqnz.sequenceOwnerId ? {result: {value: true}} : SequenceService.followEachOther({
              userId: myUserId,
              friendId: notifCqnz.sequenceOwnerId
            });
            notifCqnz.viewsCounter = $scope.iAmAdvertiser && notifCqnz.basicData.isAdvertisement ? adsService.getViewsCount(notifCqnz.basicData.sequenceId) : null;
            notifCqnz.clicksCounter = $scope.iAmAdvertiser && notifCqnz.basicData.isAdvertisement ? adsService.getClicksCount(notifCqnz.basicData.sequenceId) : null;

            $scope.sequence = SequenceFactory.buildSequenceObject(notifCqnz);
            $scope.sequence.comments.items = [];
            $scope.canComment = /*permissionValidationService.amISuperAdmin() ||*/ $scope.sequence.comments.enabled;

            setTimeout(function () {
              $scope.$apply()
            }, 600)

          }, function (error) {
            console.error("cant get basicData, listTags or listHashs", error)
          })
        }, function (error) {
          console.error("findSequenceBySequenceIdV181", error)
        })
      })();


      $scope.loadComments = function () {
        $scope.isLoadingComments = true;

        SequenceService.findTheCommentsOfASequencev157({
          sequenceId: sequenceBasicData.sequenceId,
          start: pagination.start,
          count: pagination.count
        }).then(function (comments) {
          Utils.removeLastItemIfHasNoAttribute(comments, 'sequenceComments');

          if (!comments.length) {
            $scope.isRefreshing = false;
            $scope.canGetMoreItems = false;
            $scope.isLoadingComments = false;
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
          }


          comments.forEach(function (comment, i) {
            var comment = CommentFactory.buildCommentObject({
              comment: comment,
              sequenceMetadata: sequenceMetadata,
              sequenceOwnerMetadata: sequenceOwnerMetadata
            });

            comment.algo = "XD "+i;
            $scope.sequenceAux.comments.items.push(
              comment
            );
          });

          pagination.start = $scope.sequenceAux.comments.items.length;
          pagination.count = 15;

          $scope.isRefreshing = false;
          $scope.isLoadingComments = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (error) {
          $scope.errorLoading = true;
          $scope.isRefreshing = false;
          $scope.canGetMoreItems = false;
          $scope.isLoadingComments = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
          console.error("findTheCommentsOfASequencev157", error);
        });
      };

      $scope.reloadNotifComments = function () {
        $scope.errorLoading = false;
        $scope.canGetMoreItems = true;
        pagination.start = 0;
        pagination.count = 10;
        $scope.sequence.comments.items = [];
        $scope.sequenceAux.comments.items = [];
        $scope.loadComments();
      };

      $rootScope.$on('sequence.comment.enabled.updated', function (event, data) {
        $scope.canComment = permissionValidationService.amISuperAdmin() ||
          data.enabled && permissionValidationService.canCreateComment();
      });

      $rootScope.$on('sequence.comment.created', function (event, data) {
        if($scope.sequence.metadata.id == data.comment.sequenceMetadata.id)
          $scope.sequenceAux.comments.items.push(data.comment);
      });

      $rootScope.$on('sequence.comment.edited', function (event, data) {
        if($scope.sequence.metadata.id == data.comment.sequenceMetadata.id){
          $scope.sequenceAux.comments.items.some(function (comment, j) {
            if (comment.metadata.id == data.comment.metadata.id) {
              setTimeout(function () {
                $scope.sequenceAux.comments.items[j] = data.comment;
                setTimeout(function () {
                  $scope.$apply()
                }, 10)
              }, 800);
              return true;
            }
          });
        }
      });

      $rootScope.$on('sequence.comment.deleted', function (event, data) {
        if ($scope.sequence.metadata.id == data.comment.sequenceMetadata.id) {
          $scope.sequenceAux.comments.items.some(function (comment, index) {
            if (comment.metadata.id == data.comment.metadata.id) {
              $scope.sequenceAux.comments.items.splice(index, 1);
              return true;
            }
          });
        }
      });

      /**
       * @param comment {CommentStructureType}
       * @param index
       */
      function deleteComment(comment, index) {
        comment.deleteMe(comment).then(function () {
          $scope.sequence.comments.items.splice(index, 1);
          $scope.sequence.comments.counter--;
          sequenceBasicData.sequenceCommentCount--;
        }, function (error) {
        })
      }

      $scope.openCommentComposer = function () {
        composeOrEditMessageWithTags().then(function (form) {
          addComments(form);
        })
      };

      /**
       * @param comment {CommentStructureType}
       * @param listIndex {number}
       */
      $scope.showEditActionsMenu = function (comment, listIndex) {
        var buttons = [];
        var buttonsIds = [];

        if (comment.canModify) {
          buttons.push({text: Utils.translate('GLOBAL.UPDATE') /*+ ' <i class="icon ion-quote"></i>'*/});
          buttonsIds.push('EDIT_COMMENT');
        }


        Utils.$ionicActionSheet.show({
          buttons: buttons,
          titleText: Utils.translate('SEQUENCE.OPTIONS'),
          buttonClicked: function (buttonIndex) {
            switch (buttonsIds[buttonIndex]) {
              case "EDIT_COMMENT":
                composeOrEditMessageWithTags(comment.editableDescription).then(function (form) {
                  newTagList = form.savedTags;

                  if (form.description && form.description != comment.backupDescription)
                    updateComment(comment, form, listIndex);
                });
                break;
              default:
                Utils.toast.warning("Invalid option '" + buttonsIds[buttonIndex] + "'");
            }
            return true;
          },
          destructiveText: comment.canDelete ? Utils.translate('GLOBAL.DELETE') + ' <i class="icon ion-close-round"></i>' : null,
          destructiveButtonClicked: comment.canDelete ? function () {
            deleteComment(comment, listIndex);
            return true;
          } : null
        });
      };

      /**
       * Helper function
       * @param previousDescription
       * @return Promise {*}
       */
      function composeOrEditMessageWithTags(previousDescription) {
        return Utils.$q(function (resolve, reject) {
          var dialog = Utils.alert.getCtrl();
          dialog.show({
            templateUrl: 'templates/partials/tags-modal.html',
            controller: 'tagsModalCtrl',
            fullscreen: true,
            locals: {description: previousDescription || '', dialog: dialog},
            clickOutsideToClose: false,
            multiple: true
          }).then(function (form) {
            resolve(form)
          }, function () {
            reject();
          });
        })
      }

      function addComments(form) {
        $scope.isCreatingComment = true;

        CommentFactory.createComment({
          sequenceMetadata: sequenceMetadata,
          sequenceOwnerMetadata: sequenceOwnerMetadata,
          description: form.description,
          tagsList: form.savedTags
        }).then(/**@param newComment {CommentStructureType}*/function (newComment) {
          $scope.sequence.comments.items.push(newComment);
          $scope.sequence.comments.counter++;
          sequenceBasicData.sequenceCommentCount++;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');

          setTimeout(function () {
            Utils.$ionicScrollDelegate.resize();
            Utils.$ionicScrollDelegate.scrollBottom();
          }, 800);
        }, function (error) {
          //the errors are printed inside the function
          Utils.toast.error(Utils.translate("SEQUENCE.DIALOG.CREATE_POST_COMMENT_ERROR"))
        }).finally(function () {
          $scope.isCreatingComment = false;
        });
      }

      /**
       * @param comment
       * @param listIndex
       */
      function updateComment(comment, form, listIndex) {
        comment.editableDescription = form.description;
        comment.updateMe(form.savedTags).then(function (/*theNewCommentObject*/) {
          //nothing to do
        }, function (error) {
          //the messages/toasts are shown and printed inside updateMe
        });
      }
    }])
