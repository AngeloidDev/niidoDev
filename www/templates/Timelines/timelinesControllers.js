"use strict";
appControllers

  .controller("TimelinesContainerCtrl", ["$rootScope", "$state", "$scope", '$ionicHistory', "GroupsService", "UserService", 'AppAdminRolesService', 'permissionValidationService', 'notificationsService', "Utils",
    function ($rootScope, $state, $scope, $ionicHistory, GroupsService, UserService, AppAdminRolesService, permissionValidationService, notificationsService, Utils) {
      var mySubscription = UserService.get_USER_INSTANCE_HREF();

      //$scope.openStatementForm = openStatementForm;
      $scope.openStatementForm = openComposerScreen;

      if ($state.params.groupIndex === -1)
        $state.params.groupIndex = window.localStorage.getItem('groupIndex');

      //append here the child functions
      //that need tobe executed from this control
      $scope.sharedCtrl = {};


      $rootScope.$on('group-modified', function (event, group) {
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
        loadMyGroups();
      });


      //if the view is cached, we need to do this...
      $scope.$on('$ionicView.afterEnter', function () {
        //console.log('$ionicView.afterEnter')
        if ($state.params.prepareStatement == 1)
          $scope.openStatementForm();

        /**@type {string|number}*/
        $scope.statementBtnAction = $state.params.prepareStatement == 1 ? "close" : "open";
      });

      //this is triggered only when user leaves the timelines
      // NOT when changing between default/groups timeline
      $scope.$on('$ionicView.beforeLeave', function () {
        //console.log('$ionicView.beforeLeave')
      });

      /*$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if (fromState.name === 'menu.timeline') {
          //console.log("------- $stateChangeStart: from menu.timeline");
          //window.localStorage.setItem("scrollPosition", JSON.stringify(Utils.$ionicScrollDelegate.getScrollPosition()))
        }
      });*/

      $rootScope.$on('refresh-timeline-order', function (/*event, data*/) {
        $scope.order = parseInt(window.localStorage.getItem("timelineOrder")) || 1;
      });

      $rootScope.$on("rolePermissions-changed", function () {
        if ($scope.isGroupTimeline)
          $scope.showStatementButton = permissionValidationService.canCreateCqnzInGroupTimeline();
        else
          $scope.showStatementButton = permissionValidationService.canCreateCqnzInGralTimeline();
      });

      //$scope.slidesCtrl = {};//parent container for child functions
      $scope.menuIcons = [
        'ion-funnel',
        'ion-shuffle',
        'ion-android-bookmark',
        'ion-android-sunny',
        'ion-clock'
      ];
      $scope.order = parseInt(window.localStorage.getItem("timelineOrder")) || 1;


      $scope.actionSheetItemText = [
        "Default",
        Utils.translate('TIMELINE.DEFAULT'),
        Utils.translate('TIMELINE.FAVORITE'),
        Utils.translate('TIMELINE.LIKES'),
        Utils.translate('TIMELINE.DATE')
      ];

      // Shows the action sheet
      $scope.showSortingMenu = function () {
        Utils.$ionicActionSheet.show({
          buttons: [
            {text: $scope.actionSheetItemText[1] + ' <i class="icon ' + $scope.menuIcons[1] + '"></i>'},
            {text: $scope.actionSheetItemText[2] + ' <i class="icon ' + $scope.menuIcons[2] + '"></i>'},
            {text: $scope.actionSheetItemText[3] + ' <i class="icon ' + $scope.menuIcons[3] + '"></i>'},
            {text: $scope.actionSheetItemText[4] + ' <i class="icon ' + $scope.menuIcons[4] + '"></i>'}
          ],
          titleText: Utils.translate('TIMELINE.ORGANIZE'),
          cancelText: Utils.translate('GLOBAL.CANCEL'),
          buttonClicked: function (index) {
            $scope.order = index + 1;
            window.localStorage.setItem("timelineOrder", $scope.order);
            $scope.sharedCtrl.organize($scope.order);
            //in order to close the actionSheet
            return true;
          }
        });
      };

      $scope.groups = [];
      $scope.groupData = {};//current group data
      $scope.totalGroups = null; //to avoid include twice the default timeline

      if ($state.params.groupIndex)
        window.localStorage.setItem('groupIndex', $state.params.groupIndex);

      var newGroupId = $state.params.newGroupId;
      var groupIndex = $scope.activeIndex = parseInt(window.localStorage.getItem('groupIndex')) || 0;


      //ZONE: Default template params
      $scope.slideTemplate = "templates/Timelines/" + (groupIndex === 0 ? "timeline" : "group-timeline") + ".html";
      $scope.nameProfile = window.localStorage.getItem("name");
      $scope.pictureProfile = window.localStorage.getItem("photoProfileBlob") !== null ? window.localStorage.getItem("photoProfileBlob") : "img/ProfilePhoto.svg";

      $scope.isGroupTimeline = false;//popup menu var
      $scope.groupIndex = null;//popup menu var
      //ZONE: END Default template params


      var bannedGroupsList = [],
        lockedGroupsList = [];

      function loadMyGroups() {
        bannedGroupsList = [];
        lockedGroupsList = [];
        $scope.groups = [];
        $scope.groupData = {};//current group data
        $scope.totalGroups = null; //to avoid include twice the default timeline

        $scope.isLoadingGroups = true;
        getBannedAndLockedGroupsForUser().then(function () {
          getUserGroups().then(function () {
            setupSlider();
          }, function (reason2) {
            console.error("getUserGroups", reason2);
            Utils.toast.error(Utils.translate('GROUPS.TIMELINE_WRAPPER.DIALOG.GET_GROUPS_ERR'));
          }).finally(function () {
            $scope.isLoadingGroups = false;
          });
        }, function (reason) {
          console.error(reason);
          $scope.isLoadingGroups = false;
        })
      }

      loadMyGroups();

      /**
       * Gets and sets (the corresponding list) the groups where the user has been banned/locked from
       * @returns {Promise} boolean
       */
      function getBannedAndLockedGroupsForUser() {
        var deferred = Utils.$q.defer();
        GroupsService.getBannedGroupsForUser(mySubscription).then(function (bannedList) {
          //console.log("bannedList", bannedList);
          bannedGroupsList = bannedList;
          GroupsService.getLockedGroupsForUser(mySubscription).then(function (lockedList) {
            //console.log("lockedList", lockedList);
            lockedGroupsList = lockedList;
            deferred.resolve(true);
          }, function (getLockedError) {
            deferred.reject(getLockedError);
            Utils.toast.error(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_LOCKED_GROUPS_ERR'));
            //console.error(getLockedError);
          })
        }, function (getBannedError) {
          deferred.reject(getBannedError);
          //Utils.toast.error(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_BANNED_GROUPS_ERR'));
          console.error(getBannedError);
        });
        return deferred.promise;
      }


      function getUserGroups() {
        var deferred = Utils.$q.defer();

        GroupsService.getUserGroups(mySubscription).then(function (groups) {
          //console.log("My Groups: ", groups);

          //remove the last item because it's normally a useless object
          if (!groups[groups.length - 1].group)
            groups.splice(groups.length - 1, 1);

          groups.forEach(function (resource, idx) {
            var isBanned = GroupsService.checkIfIsBannedOrLockedGroup(bannedGroupsList, resource.group.href);
            var isLocked = GroupsService.checkIfIsBannedOrLockedGroup(lockedGroupsList, resource.group.href);

            var gData = {
              id: resource.groupId,
              creationDate: resource.creationDate,
              href: resource.group.href,
              hrefId: Utils.getLastUrlComponent(resource.group.href),
              name: resource.groupName,
              description: resource.description,
              image: resource.url || 'img/photoFrame.svg',
              privacy: resource.privacy,
              imAdministrator: resource.administrator,
              imModerator: resource.moderator,
              imBanned: isBanned,
              imLocked: isLocked,
              imMember: true
            };

            //si el user desea ver el timeline de este grupo (hizo click en él en groupsMainPage
            if (groupIndex > 0 && (groupIndex - 1 === idx))//redir para ver timeline de grupo existente
              $scope.groupData = gData;
            else if (newGroupId && newGroupId == gData.hrefId) {//redir para ver timeline despues de crear un grupo
              $scope.activeIndex = groupIndex = idx + 1;
            }

            if (!isBanned)
              $scope.groups.push(gData);
          });

          $scope.totalGroups = $scope.groups.length;
          window.localStorage.setItem("totalGroups", $scope.totalGroups);

          deferred.resolve(true);

        }, function (error) {
          console.error("getUserGroups", error);
          deferred.reject(error);
          $scope.totalGroups = 0;
        });

        return deferred.promise;
      }


      $scope.gotoSlide = function (number) {
        $scope.closePopover();
        $scope.slider.slideTo(number);
      };

      function setupSlider() {
        //You want to go directly to a group?
        if (groupIndex > 0) {
          $scope.isGroupTimeline = true;
          $scope.groupIndex = groupIndex - 1;
          $scope.slideTemplate = "templates/Timelines/group-timeline.html";
          $scope.groupData = $scope.groups[$scope.groupIndex];
          //console.log($scope.groupData)

          $scope.showStatementButton = permissionValidationService.canCreateCqnzInGroupTimeline();
        }
        else {
          $scope.isGroupTimeline = false;
          $scope.slideTemplate = "templates/Timelines/timeline.html";
          $scope.showStatementButton = permissionValidationService.canCreateCqnzInGralTimeline();
        }

        //some options to pass to our slider
        $scope.sliderOptions = {
          pagination: false,
          threshold: 125,
          initialSlide: groupIndex,
          direction: 'horizontal', //or vertical
          speed: 300 //0.3s transition
        };


        $scope.$on("$ionicSlides.sliderInitialized", function (event, data) {
          // data.slider is the instance of Swiper
          $scope.slider = data.slider;
          $scope.$apply();
          //console.log("Slider initialized");
        });

        $scope.$on("$ionicSlides.slideChangeStart", function (event, data) {
          //console.log('Slide change is beginning');
          //console.log(data)
        });


        $scope.$on("$ionicSlides.slideChangeEnd", function (event, data) {
          // note: the indexes are 0-based
          $scope.activeIndex = data.slider.activeIndex;
          $scope.previousIndex = data.slider.previousIndex;

          $scope.statementBtnAction = 'open';
          $scope.showButtonsArea = false;

          //You are in general timeline
          if ($scope.activeIndex == 0) {
            $scope.isGroupTimeline = false;
            $scope.groupIndex = null;
            $scope.groupData = {};
            $scope.slideTemplate = "templates/Timelines/timeline.html";
            $scope.showStatementButton = permissionValidationService.canCreateCqnzInGralTimeline();
            window.localStorage.setItem('groupIndex', '0');

            //clearGroupsTimelineSubscribers();
          }
          else {
            $scope.isGroupTimeline = true;
            $scope.groupIndex = $scope.activeIndex - 1;
            $scope.slideTemplate = "templates/Timelines/group-timeline.html";
            $scope.groupData = $scope.groups[$scope.groupIndex];

            //usado en uploadCtrl
            $scope.groupData.groupIndex = $scope.activeIndex;

            $scope.showStatementButton = permissionValidationService.canCreateCqnzInGroupTimeline();
            window.localStorage.setItem('groupIndex', $scope.activeIndex);

            //clearUserTimelineSubscribers();
          }

          AppAdminRolesService.updateLocalUserPermissions();

          //console.log("$ionicSlides.slideChangeEnd", UserService.get_USER_INSTANCE_HREF())
          //avoid count new notifications before entering to notifications view
          notificationsService.countPendingRegularNotifications(UserService.get_USER_INSTANCE_HREF());
          notificationsService.countPendingFollowersNotifications(UserService.get_USER_INSTANCE_HREF());

          $scope.$apply();

        });
      }

      function openComposerScreen() {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/partials/tags-modal.html',
          controller: 'tagsModalCtrl',
          fullscreen: true,
          locals: {description: "", dialog: dialog},
          clickOutsideToClose: false,
          multiple: true
        }).then(function (form) {
          openStatementForm(form);
        });
      }

      function openStatementForm(form) {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          controller: "statementCtrl",
          templateUrl: 'templates/Uploads/statementTpl.html',
          //targetEvent: ev,
          clickOutsideToClose: false,
          fullscreen: true, // Only for -xs, -sm breakpoints.
          locals: {groupData: $scope.groupData, form: form, dialog: dialog},
          openFrom: '#right',
          multiple: true
        }).then(function () {
          $scope.statementBtnAction = 'open';
        }, function () {
          $scope.statementBtnAction = 'open';
        });

        $scope.statementBtnAction = 'close';
      }

      Utils.$ionicPopover.fromTemplateUrl(
        'templates/Timelines/timelines-container-popover.tpl.html', {
          scope: $scope
        }).then(
        function (popover) {
          $scope.popover = popover;

          //Cleanup the popover when we're done with it!
          $scope.$on('$destroy', function () {
            $scope.popover.remove();
          });
        },
        function (error) {
          console.error("Popover couldn't be created", error);
          Utils.toast.warning("Popover couldn't be created");
        }
      );

      $scope.closePopover = function () {
        $scope.popover.hide();
        Utils.$ionicScrollDelegate.scrollTop();
      };

    }])

  .controller('TimeLineCtrl', ['$rootScope', '$scope', '$state', 'TimeLineService', 'timelinesService', 'UserService', 'SequenceService', 'GroupsService', 'cqnzService', 'cqnzData', 'network', 'permissionValidationService', 'adsService', 'SequenceFactory', 'Utils',
    function ($rootScope, $scope, $state, TimeLineService, timelinesService, UserService, SequenceService, GroupsService, cqnzService, cqnzData, network, permissionValidationService, adsService, SequenceFactory, Utils) {
      //console.log("TimeLineCtrl created!!!");
      //console.log($state.params);
      var myUserId = UserService.get_USER_ID();

      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();


      //-- All scope variables are shared with SequenceCtrl but these are the more relevant ones--------
      $scope._controllerName = 'TimeLineCtrl';
      $scope._totalPinnedSequences = 0;
      $scope._maxSequencesToPin = 1;
      $scope._sequenceList = [];

      //for showing the avatar in comments list
      //$scope.showCommentAvatar = false;
      //-------- END OF variables will be shared with SequenceCtrl -----


      var pagination = {
        start: 0,
        count: 5,
        order: parseInt(window.localStorage.getItem("timelineOrder")) || 1
      };

      var pinnedSequenceFetched = false;

      $scope.refreshText = Utils.translate('GLOBAL.REFRESH');
      $scope.isFirstTime = true;
      $scope.isRefreshing = false;
      $scope.isLoadingContent = false;
      $scope.canGetMoreItems = true;
      $scope.errorLoading = false;
      $scope.network = network;

      //function appended to parent's sharedCtrl object
      //so that it can be executed remotelly (from timelinesContainerCtrl)
      $scope.sharedCtrl.organize = function (order) {
        pagination.order = order;
        $scope.refreshDefaultTimeline();
      };

      $scope.getMoreDefaultSequences = function () {
        !pinnedSequenceFetched ? getPinnedSequence() : getMoreDefaultSequences();
      };

      function getPinnedSequence() {
        if ($scope.isLoadingContent) return;

        $scope.isLoadingContent = true;
        $scope._totalPinnedSequences = 0;

        cqnzService.getPinnedSequencesWS().then(function (cqnzPinnedResp) {
          Utils.removeLastItemIfHasNoAttribute(cqnzPinnedResp, 'sequenceId');
          //console.log("findPinnedSequenceWS", cqnzPinnedResp);

          $scope._totalPinnedSequences = cqnzPinnedResp.length;
          //console.log("total pinned: " + $scope._totalPinnedSequences);

          if ($scope._totalPinnedSequences) {
            var pinnedPromises = [];
            cqnzPinnedResp.forEach(function (sequence) {
              pinnedPromises.push(complementUserCqnzData(-1, sequence));
            });

            Utils.$q.all(pinnedPromises).then(function () {
              //nothing to do
            }, function (errors) {
              console.error("complementUserCqnzData (pinned) promises", errors)
            }).finally(function () {
              $scope.isLoadingContent = false;
              //console.log("now we're getting the rest of cqnz's");
              getMoreDefaultSequences();
            })
          }
          else {
            $scope.isLoadingContent = false;

            //console.log("now we're getting the rest of cqnz's");
            getMoreDefaultSequences();
          }
        }, function (findPinnedError) {
          $scope.isLoadingContent = false;

          console.error("we couldn't get the pinned cqnz", findPinnedError);
          //console.log("now we're getting the rest of cqnz's");
          getMoreDefaultSequences();
        });
        pinnedSequenceFetched = true;
      }

      function getMoreDefaultSequences() {
        if ($scope.isLoadingContent)
          return;

        $scope.isLoadingContent = true;

        TimeLineService.findPendingLogByUserSubscription(
          myUserId,
          pagination
        ).then(function (sequences) {
          //console.log("findPendingLogByUserSubscription",sequences);//response: [] |[*]
          $scope.canGetMoreItems = sequences.length > 0;
          $scope.isFirstTime = false;

          if (!sequences.length) {
            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;

            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
          }

          pagination.start += sequences.length;

          var cqnzPromises = [];
          sequences.forEach(function (cqnz) {
            cqnzPromises.push(complementUserCqnzData(cqnz.logItemId));
          });//end forEach()

          Utils.$q.all(cqnzPromises).then(function (responses) {
            //nothing to do
          }, function (errors) {
            Utils.toast.error("An error occurred, pull to refresh to try again", errors);
            $scope.errorLoading = true;
            $scope.canGetMoreItems = false;
          }).finally(function () {
            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;

            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
          });
        }, function (error) {
          console.log("findPendingLogByUserSubscription error", error);
          $scope.canGetMoreItems = false;
          $scope.errorLoading = true;

          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;

          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      }

      //----------------- START CODE TO INCREASE AN AD VIEWS COUNTER ------------
      var adsNotViewed = [], scrollableContainer;

      var interval1 = setInterval(function () {
        scrollableContainer = document.getElementById('ion-content-userTimeline');

        if (scrollableContainer) {
          clearInterval(interval1);
          //console.info("TimeLineCtrl->scrollableContainer.removeEventListener('scroll') has been created!")
          scrollableContainer.addEventListener('scroll', increaseAdViewsCounter);
        }
      }, 200);

      function increaseAdViewsCounter() {
        adsNotViewed.forEach(function (item, idx) {
          var rect = item.el.getBoundingClientRect();
          if (rect.top <= (scrollableContainer.clientHeight / 3) * 2) {
            if (!item.sequence.adSeen) {
              //console.log("increasing ad views");
              item.sequence.adSeen = true;
              adsService.increaseViewsCount(item.sequence.metadata.instanceId).then(function (/*uselessData*/) {
                adsNotViewed.splice(idx, 1);
                /*if (item.sequence.metadata.belongsMe) {//if I can see the counters
                  $scope._sequenceList[item.listIndex].advertisement.counters.views ?
                    $scope._sequenceList[item.listIndex].advertisement.counters.views.result.value++ :
                    $scope._sequenceList[item.listIndex].advertisement.counters.views = {result: {value: 1}};
                }*/
              }, function (error) {
                console.error("increaseViewsCount", error)
              });
            }
          }
        })
      }

      $scope.$on('$destroy', function () {
        //console.info("TimeLineCtrl has been destroyed");
        if (scrollableContainer.removeEventListener)
          scrollableContainer.removeEventListener('scroll', increaseAdViewsCounter)
      });
      //----------------- END OF CODE TO INCREASE AN AD VIEWS COUNTER ------------


      //var totalSize = 0;
      var timelineLen = 0;

      /**
       * @param cqnzId {number}
       * @param {*?} pinnedSeqObj
       * @return {Promise}
       */
      function complementUserCqnzData(cqnzId, pinnedSeqObj) {
        var deferred = Utils.$q.defer();

        if (pinnedSeqObj)
          cqnzId = pinnedSeqObj.sequenceId;

        var data = !pinnedSeqObj ? SequenceService.findSequenceBySequenceIdV181(cqnzId).$promise : pinnedSeqObj;

        var comments = SequenceService.findTheCommentsOfASequencev157({
          sequenceId: cqnzId,
          start: 0,
          count: 2
        });

        var listTags = SequenceService.obtainTagwithIdandType({
          sequenceId: cqnzId,
          notificationType: 7
        });

        var hashesList = SequenceService.getHashFromSequence(cqnzId);

        Utils.$q.all({
          basicData: data,
          comments: comments,
          tagsList: listTags,
          hashesList: hashesList
        }).then(function (userCqnz) {
          //if(userCqnz.basicData.mustBeDeleted == true){
          //  console.log("mustBeDeleted");
          //} else {
          if (!pinnedSeqObj) {
            Utils.removeLastItemIfHasNoAttribute(userCqnz.basicData, 'sequence');
            userCqnz.basicData = userCqnz.basicData[0];
          }

          //console.log("data.sequenceItems",data.sequenceItems)
          userCqnz.sequenceOwnerId = Utils.getLastUrlComponent(userCqnz.basicData.userSubscriptionId.href);
          userCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(cqnzId);
          userCqnz.likeActive = SequenceService.findSmileysCount({
            sequenceId: Utils.getLastUrlComponent(userCqnz.basicData.sequence.href),
            userId: myUserId
          });
          userCqnz.followEachOther = myUserId == userCqnz.sequenceOwnerId ? {result: {value: true}} : SequenceService.followEachOther({
            userId: myUserId,
            friendId: userCqnz.sequenceOwnerId
          });
          userCqnz.viewsCounter = userCqnz.basicData.isAdvertisement && userCqnz.sequenceOwnerId == myUserId ? adsService.getViewsCount(cqnzId) : null;
          userCqnz.clicksCounter = userCqnz.basicData.isAdvertisement && userCqnz.sequenceOwnerId == myUserId ? adsService.getClicksCount(cqnzId) : null;

          //the pinned seqs will be pushed in the begining
          var realLen = pinnedSeqObj ? $scope._sequenceList.unshift(SequenceFactory.buildSequenceObject(userCqnz)) :
            $scope._sequenceList.push(SequenceFactory.buildSequenceObject(userCqnz));

          if (!userCqnz.basicData.pinned) timelineLen++;

          if (!userCqnz.basicData.pinned && !UserService.USER_IS_ADVERTISER() && adsService.canInsertAd(timelineLen, pagination.count)) {
            console.log("inserting ad at " + timelineLen, realLen);
            adsService.getAdvertisement(UserService.get_USER_INSTANCE_HREF()).then(function (advertisementData) {
              //console.log("getAdv", advertisementData);
              if (advertisementData) {
                $scope._sequenceList.splice(realLen - 1, 0, advertisementData);
                var interval2 = setInterval(function () {
                  var el = document.getElementById($scope._controllerName + '_Ad_' + (realLen - 1));
                  if (el) {
                    clearInterval(interval2);
                    //console.log("userCqnz",userCqnz)
                    adsNotViewed.push({sequence: advertisementData, listIndex: realLen - 1, el: el});
                  }
                  else
                    console.warn("The ad '" + ($scope._controllerName + '_Ad_' + (realLen - 1)) + "' container was not found")
                }, 500);
              }
            }, function (getAdError) {
              console.error("Couldn't get advertisement", getAdError)
            });
          }

          /*var s = Utils.sizeof($scope._sequenceList[data.index]);
          console.log("size of userCqnz: "+Utils.formatByteSize(s));
          console.log("timeline size: "+Utils.formatByteSize(totalSize+=s))*/
          deferred.resolve(true);

          return deferred.promise;
        }, function (errors) {
          console.error("complementUserCqnzData", errors);
          deferred.reject(errors);
        });//end $q.all(data, comments, listTags, hashesList)
      }

      if ($scope.isFirstTime) {
        $scope.getMoreDefaultSequences();
      }

      timelinesService.defaultTimeline.events.timeline.refresh =
        $scope.refreshDefaultTimeline = function () {
          $scope._sequenceList = [];
          pinnedSequenceFetched = false;

          $scope.canGetMoreItems = true;
          $scope.errorLoading = false;
          $scope.isRefreshing = true;
          $scope.isFirstTime = true;

          pagination.start = 0;
          pagination.count = 5;

          $scope.getMoreDefaultSequences();

          setTimeout(function () {
            Utils.$ionicScrollDelegate.resize();
          }, 800);
        };

      timelinesService.defaultTimeline.events.sequence.onDelete = function (data) {
        $scope._sequenceList.some(function (sequence, index) {
          if (sequence.metadata.id == data.sequenceMetadata.id) {
            $scope._sequenceList.splice(index, 1);
            pagination.count = 1;
            pagination.start--;
            $scope.getMoreDefaultSequences();
            pagination.count = 5;

            return true;
          }
        });
      };

      timelinesService.defaultTimeline.events.sequence.onTitleEdited = function (data) {
        console.log("Ctrl name: "+$scope._controllerName);
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.sequenceId) {
            data.updaterFn(sequence, data);
            return true;
          }
        })
      };

      timelinesService.defaultTimeline.events.sequence.onContentEdited = function (data) {
        console.log("We're implementing this feature: update General Timeline after events.sequence.onContentEdited")
      };

      timelinesService.defaultTimeline.events.sequence.onCountersUpdated = function (newData) {
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == newData.sequenceMetadata.id) {
            newData.updaterFn(sequence, newData);
            return true;
          }
        })
      };

      timelinesService.defaultTimeline.events.comment.onEnabledUpdated = function (data) {
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.sequenceMetadata.id) {
            sequence.comments.enabled = data.enabled;
            return true;
          }
        });
      };

      timelinesService.defaultTimeline.events.comment.onCreate = function (data) {
        console.log("defaultTimeline.events.comment.onCreate", data)
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.comment.sequenceMetadata.id) {
            sequence.comments.counter++;
            if (sequence.comments.counter > 2) return true;

            sequence.comments.items.push({});

            setTimeout(function () {
              sequence.comments.items[sequence.comments.items.length - 1] = data.comment;

              setTimeout(function () {
                $scope.$apply()
              }, 10)
            }, 3000);
            return true
          }
        })
      };

      timelinesService.defaultTimeline.events.comment.onUpdate = function (data) {
        console.log("defaultTimeline.events.comment.onUpdate", data);
        $scope._sequenceList.some(function (sequence, i) {
          if (sequence.metadata.id == data.comment.sequenceMetadata.id) {
            sequence.comments.items.some(function (comment, j) {
              if (comment.metadata.id == data.comment.metadata.id) {
                console.log("updating comment from user timeline");
                $scope._sequenceList[i].comments.items[j] = {};
                setTimeout(function () {
                  $scope._sequenceList[i].comments.items[j] = data.comment;

                  setTimeout(function () {
                    $scope.$apply()
                  }, 10)
                }, 800);
                return true;
              }
            });
            return true;
          }
        })
      };

      /**
       * @param data {{cqnzListIndex:number,commentListIndex:number, cqnzInstanceId:number}}
       */
      timelinesService.defaultTimeline.events.comment.onDelete = function (data) {
        console.log("defaultTimeline.events.comment.onDelete", data);
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.comment.sequenceMetadata.id) {
            sequence.comments.counter--;
            sequence.comments.items.some(function (comment, index) {
              if (comment.metadata.id == data.comment.metadata.id) {
                sequence.comments.items.splice(index, 1);
                return true;
              }
            });
            return true;
          }
        });
      };

      timelinesService.defaultTimeline.events.comment.onLikeUpdated = function (data) {
        $scope._sequenceList.some(function (sequence, i) {
          if (sequence.metadata.id == data.sequenceId) {
            sequence.comments.items.some(function (comment, j) {
              if (comment.metadata.id == data.commentId) {
                console.log("updating comment like from general timeline");

                setTimeout(function () {
                  $scope._sequenceList[i].comments.items[j].likeCounter = data.likeCounter;
                  $scope._sequenceList[i].comments.items[j].likeActive = data.likeActive;

                  setTimeout(function () {
                    $scope.$apply()
                  }, 10)
                }, 1500);
                return true;
              }
            });
            return true;
          }
        })
      };

      timelinesService.defaultTimeline.events.advertisement.onSettingsUpdated = function (data) {
        $scope._sequenceList.some(function (sequence, index) {
          if (sequence.metadata.id == data.sequence.metadata.id) {
            console.log("Updating advertisement settings");
            $scope._sequenceList[index] = data.sequence;
            setTimeout(function () {
              $scope.$apply()
            }, 10);
            return true;
          }
        })
      };

      $rootScope.$on('login.success', function (event) {
        $scope.refreshDefaultTimeline();
      });
    }])

  .controller("groupTimelineCtrl", ['$rootScope', '$scope', '$state', 'timelinesService', 'UserService', 'SequenceService', 'adsService', 'cqnzData', 'network', 'GroupsService', 'cqnzService', 'SequenceFactory', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, timelinesService, UserService, SequenceService, adsService, cqnzData, network, GroupsService, cqnzService, SequenceFactory, permissionValidationService, Utils) {
      //console.log("groupTimelineCtrl Created!");//, $state.params);
      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      /**
       * $scope.groupData is inherited from slidesCtrl
       * $state.params can be inherited from slidesCtrl or
       * passsed as parameter from groupMainPageCtrl->showPublicTimelinePreview()
       */
      if ($state.params.groupData) $scope.groupData = $state.params.groupData;

      //console.log($scope.groupData);

      if (!$scope.groupData || !$scope.groupData.hrefId) {
        $state.go("menu.timeline", {groupIndex: -1}, {reload: true});
        return;
      }

      var myUserId = UserService.get_USER_ID();

      //------------ variables will be shared with SequenceCtrl --------
      $scope._groupHrefId = $scope.groupData.hrefId;
      $scope._controllerName = "groupTimelineCtrl";
      $scope._totalPinnedSequences = 0;
      $scope._maxSequencesToPin = 1;
      /** @type {SequenceType[]}*/
      $scope._sequenceList = [];
      //-------- END OF variables will be shared with SequenceCtrl -----

      $scope.groupName = $scope.groupData.name;
      $scope.groupDescription = $scope.groupData.description;
      $scope.groupImage = $scope.groupData.image;
      $scope.peviewTimeline = $scope.groupData.isPreview;

      var pagination = {
        start: 0,
        count: 5
      };

      var pinnedSequenceFetched = false;

      $scope.refreshText = Utils.translate('GLOBAL.REFRESH');
      $scope.isFirstTime = true;
      $scope.isRefreshing = false;
      $scope.isLoadingContent = false;
      $scope.canGetMoreItems = true;
      $scope.errorLoading = false;
      $scope.network = network;

      //----------------- START CODE TO INCREASE AN AD VIEWS COUNTER ------------
      var adsNotViewed = [],
        scrollableContainer,
        findAdContainerInterval;

      var findTimelineContainerInterval = setInterval(function () {
        scrollableContainer = document.getElementById('ion-content-groupTimeline');

        if (scrollableContainer) {
          clearInterval(findTimelineContainerInterval);
          findTimelineContainerInterval = undefined;
          scrollableContainer.addEventListener('scroll', increaseAdViewsCounter);
        }
      }, 200);

      function increaseAdViewsCounter() {
        adsNotViewed.forEach(function (item, idx) {
          var rect = item.el.getBoundingClientRect();
          if (rect.top <= (scrollableContainer.clientHeight / 3) * 2) {
            if (!item.sequence.adSeen) {
              item.sequence.adSeen = true;
              //console.log("increasing ad views")
              adsService.increaseViewsCount(item.sequence.metadata.instanceId).then(function (/*uselessData*/) {
                adsNotViewed.splice(idx, 1);
                /*if (item.sequence.metadata.belongsMe) {//if I can see the counters
                  $scope._sequenceList[item.listIndex].advertisement.counters.views ?
                    $scope._sequenceList[item.listIndex].advertisement.counters.views.result.value++ :
                    $scope._sequenceList[item.listIndex].advertisement.counters.views = {result: {value: 1}};
                }*/
              }, function (error) {
                console.error("increaseViewsCount", error)
              });
            }
          }
        })
      }

      $scope.$on('$destroy', function () {
        if (scrollableContainer.removeEventListener)
          scrollableContainer.removeEventListener('scroll', increaseAdViewsCounter);

        /*if (findTimelineContainerInterval) {
          clearInterval(findTimelineContainerInterval);
          findTimelineContainerInterval = undefined;
        }

        if (findAdContainerInterval) {
          clearInterval(findAdContainerInterval);
          findAdContainerInterval = undefined;
        }*/
      });
      //----------------- END OF CODE TO INCREASE AN AD VIEWS COUNTER ------------

      //triggered from template: on-infinite
      $scope.getMoreGroupSequences = function () {
        if (!pinnedSequenceFetched)
          getGroupPinnedSequences();
        else
          getMoreGroupSequences();
      };

      function getGroupPinnedSequences() {
        if ($scope.isLoadingContent) return;

        $scope.isLoadingContent = true;
        $scope._totalPinnedSequences = 0;

        cqnzService.getGroupPinnedSequencesWS($scope._groupHrefId).then(function (cqnzPinnedResp) {
          Utils.removeLastItemIfHasNoAttribute(cqnzPinnedResp, 'sequenceId');
          //console.log("getPinnedGroupSequence", cqnzPinnedResp);
          //console.log("total pinned: " + cqnzPinnedResp.length);

          $scope._totalPinnedSequences = cqnzPinnedResp.length;

          if ($scope._totalPinnedSequences) {
            var pinnedPromises = [];
            cqnzPinnedResp.forEach(function (sequence) {
              pinnedPromises.push(complementGroupCqnzData(sequence, true));
            });

            Utils.$q.all(pinnedPromises).then(function () {
              //nothing to do
            }, function (errors) {
              console.error("complementGroupCqnzData (pinned) promises", errors)
            }).finally(function () {
              $scope.isLoadingContent = false;
              //console.log("now we're getting the rest of cqnz's");
              getMoreGroupSequences();
            });
          }
          else {
            $scope.isLoadingContent = false;
            //console.log("now we're getting the rest of cqnz's");
            getMoreGroupSequences();
          }
        }, function (findPinnedError) {
          $scope.isLoadingContent = false;

          console.error("we couldn't get the pinned cqnz", findPinnedError);
          //console.log("now we're getting the rest of cqnz's");
          getMoreGroupSequences();
        });
        pinnedSequenceFetched = true;
      }

      //var totalSize = 0;
      function getMoreGroupSequences() {
        if ($scope.isLoadingContent) return;

        $scope.isLoadingContent = true;

        GroupsService.getGroupSequences(
          $scope._groupHrefId,
          pagination
        ).then(function (groupSequences) {
          //console.log("getting More Group Sequences: ", groupSequences);
          Utils.removeLastItemIfHasNoAttribute(groupSequences, 'sequence');

          //console.log("groupSequences",groupSequences);

          var fetchedCqnzsLength = groupSequences.length;

          $scope.canGetMoreItems = fetchedCqnzsLength > 0;

          $scope.isFirstTime = false;

          if (!fetchedCqnzsLength) {
            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;

            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');

            return
          }

          pagination.start += fetchedCqnzsLength;

          groupSequences.forEach(function (fetchedCqnz) {
            complementGroupCqnzData(fetchedCqnz);
            /*var s = Utils.sizeof($scope._sequenceList[idx]);
            console.log("size of sequence: " + Utils.formatByteSize(s));
            console.log("groupTimeline size: " + Utils.formatByteSize(totalSize += s))*/
          });

          setTimeout(function () {
            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;

            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
          }, 1500);
        }, function (error) {
          console.error("can't getMoreGroupSequences: ", error);
          $scope.errorLoading = true;
          $scope.canGetMoreItems = false;

          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;

          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      }

      var timelineLen = 0;

      /**
       * @param groupCqnzBasicData {*}
       * @param isPinnedCqnz? {boolean}
       */
      function complementGroupCqnzData(groupCqnzBasicData, isPinnedCqnz) {

        var comments = SequenceService.findTheCommentsOfASequencev157({
          sequenceId: groupCqnzBasicData.sequenceId,
          //sequenceId: Utils.getLastUrlComponent(groupCqnzBasicData.sequence.href),
          start: 0,
          count: 2
        });

        var tagsList = SequenceService.obtainTagwithIdandType({
          sequenceId: groupCqnzBasicData.sequenceId,
          notificationType: 7
        });

        var hashesList = SequenceService.getHashFromSequence(groupCqnzBasicData.sequenceId);

        Utils.$q.all({
          comments: comments,
          tagsList: tagsList,
          hashesList: hashesList
        }).then(function (groupCqnz) {
          groupCqnz.basicData = groupCqnzBasicData;

          groupCqnz.sequenceOwnerId = Utils.getLastUrlComponent(groupCqnz.basicData.userSubscriptionId.href);
          groupCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(groupCqnz.basicData.sequenceId);
          groupCqnz.likeActive = SequenceService.findSmileysCount({
            sequenceId: Utils.getLastUrlComponent(groupCqnz.basicData.sequence.href),
            userId: myUserId
          });
          groupCqnz.followEachOther = myUserId == groupCqnz.sequenceOwnerId ? {result: {value: true}} : SequenceService.followEachOther({
            userId: myUserId,
            friendId: groupCqnz.sequenceOwnerId
          });

          //because an advertiser has no access to a group timeline
          groupCqnz.viewsCounter = null;//groupCqnz.basicData.isAdvertisement ? adsService.getViewsCount(groupCqnz.basicData.sequenceId) : null;
          groupCqnz.clicksCounter = null;//groupCqnz.basicData.isAdvertisement ? adsService.getClicksCount(groupCqnz.basicData.sequenceId) : null;


          var realLen = isPinnedCqnz ? $scope._sequenceList.unshift(SequenceFactory.buildSequenceObject(groupCqnz)) :
            $scope._sequenceList.push(SequenceFactory.buildSequenceObject(groupCqnz));

          if (!groupCqnz.basicData.pinned) timelineLen++;

          if (!groupCqnz.basicData.pinned && !UserService.USER_IS_ADVERTISER() && adsService.canInsertAd(timelineLen, pagination.count)) {
            //console.log("inserting ad at " + timelineLen, realLen);
            adsService.getAdvertisement(
              UserService.get_USER_INSTANCE_HREF(),
              $scope.groupData.groupId/*only for groups*/
            ).then(function (advertisementData) {
              //console.log("getAdv", advertisementData);
              if (advertisementData) {
                $scope._sequenceList.splice(realLen - 1, 0, advertisementData);
                findAdContainerInterval = setInterval(function () {
                  var el = document.getElementById($scope._controllerName + '_Ad_' + (realLen - 1));
                  if (el) {
                    clearInterval(findAdContainerInterval);
                    findAdContainerInterval = undefined;
                    adsNotViewed.push({sequence: advertisementData, listIndex: realLen - 1, el: el});
                  }
                  else
                    console.warn("The ad '" + ($scope._controllerName + '_Ad_' + (realLen - 1)) + "' container was not found")
                }, 500);
              }
            }, function (adError) {
              console.error("Couldn't get advertisement", adError);
            });
          }
        }, function (errors) {
          console.error("Comments|Tags|Hashes error", errors)
        });
      }

      if ($scope.isFirstTime) {
        $scope.getMoreGroupSequences();
      }

      timelinesService.groupTimeline.events.timeline.refresh =
        $scope.refreshGroupTimeline = function () {
          $scope._sequenceList = [];

          pinnedSequenceFetched = false;

          $scope.canGetMoreItems = true;
          $scope.errorLoading = false;
          $scope.isRefreshing = true;
          $scope.isFirstTime = true;

          pagination.start = 0;
          pagination.count = 5;

          $scope.getMoreGroupSequences();

          setTimeout(function () {
            Utils.$ionicScrollDelegate.resize();
          }, 800);
        };

      timelinesService.groupTimeline.events.sequence.onDelete = function (data) {

        if ($scope._totalPinnedSequences && data.sequenceMetadata.isPinned) {
          $scope._sequenceList.shift();
          $scope._totalPinnedSequences = 0;
        }

        $scope._sequenceList.some(function (sequence, index) {
          if (sequence.metadata.id == data.sequenceMetadata.id) {

            $scope._sequenceList.splice(index, 1);

            pagination.count = 1;
            pagination.start--;
            $scope.getMoreGroupSequences();
            pagination.count = 5;

            return true;
          }
        });
      };

      timelinesService.groupTimeline.events.sequence.onTitleEdited = function (data) {
        console.log("Ctrl name: "+$scope._controllerName);
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.sequenceId) {
            data.updaterFn(sequence, data);
            return true;
          }
        })
      };

      timelinesService.groupTimeline.events.sequence.onContentEdited = function (data) {

      };

      timelinesService.groupTimeline.events.sequence.onCountersUpdated = function (newData) {
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == newData.sequenceMetadata.id) {
            newData.updaterFn(sequence, newData);
            return true;
          }
        })
      };

      timelinesService.groupTimeline.events.comment.onEnabledUpdated = function (data) {
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.sequenceMetadata.id) {
            sequence.comments.enabled = data.enabled;
            return true;
          }
        });
      };

      timelinesService.groupTimeline.events.comment.onCreate = function (data) {
        console.log("groupTimeline.events.comment.onCreate", data)
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.comment.sequenceMetadata.id) {
            sequence.comments.counter++;
            if (sequence.comments.counter > 2) return true;

            sequence.comments.items.push({});

            setTimeout(function () {
              sequence.comments.items[sequence.comments.items.length - 1] = data.comment;

              setTimeout(function () {
                $scope.$apply()
              }, 10)
            }, 3000);

            return true
          }
        })
      };

      timelinesService.groupTimeline.events.comment.onUpdate = function (data) {
        console.log("updating comment from group timeline data", data);
        $scope._sequenceList.some(function (sequence, i) {
          if (sequence.metadata.id == data.comment.sequenceMetadata.id) {
            sequence.comments.items.some(function (comment, j) {
              if (comment.metadata.id == data.comment.metadata.id) {
                console.log("updating comment from group timeline", $scope._sequenceList[i].comments[j]);
                sequence.comments.items[j] = {};
                setTimeout(function () {
                  sequence.comments.items[j] = data.comment;

                  setTimeout(function () {
                    $scope.$apply()
                  }, 10);
                }, 800);
                return true;
              }
            });
            return true;
          }
        })
      };

      /**
       * @param data {{cqnzListIndex:number,commentListIndex:number, cqnzInstanceId:number}}
       */
      timelinesService.groupTimeline.events.comment.onDelete = function (data) {
        $scope._sequenceList.some(function (sequence) {
          if (sequence.metadata.id == data.comment.sequenceMetadata.id) {
            sequence.comments.items.some(function (comment, index) {
              if (comment.metadata.id == data.comment.metadata.id) {
                sequence.comments.items.splice(index, 1);
                sequence.comments.counter--;
                return true;
              }
            });
            return true;
          }
        });
      };

      timelinesService.groupTimeline.events.comment.onLikeUpdated = function (data) {
        $scope._sequenceList.some(function (sequence, i) {
          if (sequence.metadata.id == data.sequenceId) {
            sequence.comments.items.some(function (comment, j) {
              if (comment.metadata.id == data.commentId) {
                console.log("updating comment like from group timeline");

                setTimeout(function () {
                  $scope._sequenceList[i].comments.items[j].likeCounter = data.likeCounter;
                  $scope._sequenceList[i].comments.items[j].likeActive = data.likeActive;

                  setTimeout(function () {
                    $scope.$apply()
                  }, 10)
                }, 1500);
                return true;
              }
            });
            return true;
          }
        })
      };
    }])

  .controller('hashtagTimeLineCtrl', ['$rootScope', '$scope', '$state', 'timelinesService', 'UserService', 'SequenceService', 'adsService', 'cqnzData', 'cqnzService', 'SequenceFactory', 'network', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, timelinesService, UserService, SequenceService, adsService, cqnzData, cqnzService, SequenceFactory, network, permissionValidationService, Utils) {
      var myUserId = UserService.get_USER_ID();
      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      //Declare zone
      $scope._controllerName = "hashtagTimeLineCtrl";
      $scope._sequenceList = [];
      var pagination = {
        start: 0,
        count: 2
      };
      $scope.canGetMoreItems = true;
      $scope.isRefreshing = false;
      $scope.isLoadingContent = false;
      $scope.errorLoading = false;
      $scope.network = network;
      $scope.refreshText = Utils.translate('GLOBAL.REFRESH');
      $scope.titlePage = $state.params.hashName;

      $scope.$on("$ionicView.enter", function () {
        $scope.canGetMoreItems = true;
      });

      $scope.$on("$ionicView.beforeLeave", function () {
        $scope.canGetMoreItems = false;
      });

      $scope.getMoreHashtagsSequences = function () {
        if ($scope.isLoadingContent)
          return;

        $scope.isLoadingContent = true;


        SequenceService.findHashDataFromHash(
          $state.params.hashName.replace('#', '')
        ).$promise.then(function (hashtagData) {

          //with the ID we'll get all the sequences that use it
          SequenceService.getSequenceFromHashtags({
            hashtagId: Utils.getLastUrlComponent(hashtagData[0].hashTagObj.href),
            start: pagination.start,
            count: pagination.count
          }).$promise.then(function (listSequences) {
            if (listSequences && !listSequences[listSequences.length - 1].sequence)
              listSequences.splice(listSequences.length - 1, 1);

            configHashtagTimelineData(listSequences);

            setTimeout(function () {
              $scope.isRefreshing = false;
              $scope.isLoadingContent = false;

              $scope.$broadcast('scroll.refreshComplete');
              $scope.$broadcast('scroll.infiniteScrollComplete');
            }, 1500);
          }, function (error) {
            console.log("getSequenceFromHashtags", error);
            $scope.canGetMoreItems = false;
            $scope.errorLoading = true;

            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;

            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
          })
        }, function (error) {
          console.log("findHashDataFromHash", error);
          $scope.canGetMoreItems = false;
          $scope.errorLoading = true;

          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;

          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        })
      };

      function configHashtagTimelineData(sequences) {
        $scope.canGetMoreItems = sequences.length > 0;
        $scope.isFirstTime = false;

        if (!sequences.length) {
          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;

          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
          return;
        }

        pagination.start += sequences.length;
        pagination.count += 3;

        sequences.forEach(function (cqnz) {
          //console.log("cqnz",cqnz);
          //complementHashtagCqnzData(Utils.getLastUrlComponent(cqnz.sequence.href));
          complementHashtagCqnzData(cqnz.sequence.title);
        });//end forEach()
      }

      function complementHashtagCqnzData(cqnzId) {
        //The data required
        var data = SequenceService.findSequenceBySequenceIdV181(cqnzId).$promise;

        //Ws call to check if the sequence have 2 or more comments to display at timeline
        var comments = SequenceService.findTheCommentsOfASequencev157({
          sequenceId: cqnzId,
          start: 0,
          count: 2
        });

        //Ws called to check if the sequence have any tags in title
        var listTags = SequenceService.obtainTagwithIdandType({
          sequenceId: cqnzId,
          notificationType: 7
        });

        //Ws called to check if the sequence have any hashtags in title
        var hashesList = SequenceService.getHashFromSequence(cqnzId);

        Utils.$q.all({
          basicData: data,
          comments: comments,
          tagsList: listTags,
          hashesList: hashesList
        }).then(function (hashCqnz) {
          if (hashCqnz.basicData && !hashCqnz.basicData[hashCqnz.basicData.length - 1].sequence)
            hashCqnz.basicData.splice(hashCqnz.basicData.length - 1, 1);

          hashCqnz.basicData = hashCqnz.basicData[0];

          hashCqnz.sequenceOwnerId = Utils.getLastUrlComponent(hashCqnz.basicData.userSubscriptionId.href);
          hashCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(hashCqnz.basicData.sequenceId);
          hashCqnz.likeActive = SequenceService.findSmileysCount({
            sequenceId: Utils.getLastUrlComponent(hashCqnz.basicData.sequence.href),
            userId: myUserId
          });
          hashCqnz.followEachOther = myUserId == hashCqnz.sequenceOwnerId ? {result: {value: true}} : SequenceService.followEachOther({
            userId: myUserId,
            friendId: hashCqnz.sequenceOwnerId
          });
          hashCqnz.viewsCounter = hashCqnz.basicData.isAdvertisement && hashCqnz.sequenceOwnerId == myUserId ? adsService.getViewsCount(hashCqnz.basicData.sequenceId) : null;
          hashCqnz.clicksCounter = hashCqnz.basicData.isAdvertisement && hashCqnz.sequenceOwnerId == myUserId ? adsService.getClicksCount(hashCqnz.basicData.sequenceId) : null;

          //$scope._sequenceList.push(cqnzService.configureSequence(hashCqnz))
          $scope._sequenceList.push(SequenceFactory.buildSequenceObject(hashCqnz))
        })
      }

      $scope.refreshHashtagTimeline = function () {
        $scope.errorLoading = false;
        $scope.isRefreshing = true;
        pagination.start = 0;
        pagination.count = 2;
        $scope._sequenceList = [];
        $scope.$broadcast('scroll.refreshComplete');
        $scope.$broadcast('scroll.infiniteScrollComplete');
        Utils.$ionicScrollDelegate.resize();
        $scope.canGetMoreItems = true;
      };
    }])

  .controller('myProfileTimelineCtrl', ['$rootScope', '$scope', 'network', 'UserService', 'TimeLineService', 'SequenceService', 'cqnzService', 'SequenceFactory', 'adsService', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, network, UserService, TimeLineService, SequenceService, cqnzService, SequenceFactory, adsService, permissionValidationService, Utils) {
      var myUserId = UserService.get_USER_ID();
      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      $scope._controllerName = "myProfileTimelineCtrl";

      //------- CONFIG FOR SEQUENCE ITEMS -------
      $scope.isUserProfile = true;
      $scope.hideAvatar = true;
      $scope.hideUsername = true;
      //---- END CONFIG FOR SEQUENCE ITEMS -----


      var pagination = {
        start: 0,
        count: 5
      };
      $scope._sequenceList = [];

      $scope.refreshText = Utils.translate('GLOBAL.REFRESH');
      $scope.isFirstTime = true;
      $scope.isRefreshing = false;
      $scope.isLoadingContent = false;
      $scope.canGetMoreItems = true;
      $scope.errorLoading = false;
      $scope.network = network;

      $scope.findSequencesFromTheUser = function () {
        if ($scope.isLoadingContent) return;

        $scope.isLoadingContent = true;

        TimeLineService.findLatestSequencesBelongingToAUser({
          userId: myUserId,
          start: pagination.start,
          count: pagination.count
        }).then(function (sequencesMyProfile) {
          if (sequencesMyProfile && !sequencesMyProfile[sequencesMyProfile.length - 1].sequence)
            sequencesMyProfile.splice(sequencesMyProfile.length - 1, 1);

          //console.log(sequencesMyProfile);

          var fetchedCqnzsLength = sequencesMyProfile.length;

          $scope.canGetMoreItems = fetchedCqnzsLength > 0;

          if (!fetchedCqnzsLength) {
            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
          }

          pagination.start += sequencesMyProfile.length;

          sequencesMyProfile.forEach(function (cqnzBasicData) {
            var comments = SequenceService.findTheCommentsOfASequencev157({
              sequenceId: cqnzBasicData.sequenceId,
              start: 0,
              count: 2
            });

            var tagsList = SequenceService.obtainTagwithIdandTypev166({
              sequenceId: cqnzBasicData.sequenceId,
              notificationType: 7
            });

            var hashesList = SequenceService.getHashFromSequence(cqnzBasicData.sequenceId);

            Utils.$q.all({
              comments: comments,
              tagsList: tagsList,
              hashesList: hashesList
            }).then(function (myProfileCqnz) {
              myProfileCqnz.basicData = cqnzBasicData;

              myProfileCqnz.sequenceOwnerId = myUserId;
              myProfileCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(myProfileCqnz.basicData.sequenceId);
              myProfileCqnz.likeActive = SequenceService.findSmileysCount({
                sequenceId: Utils.getLastUrlComponent(myProfileCqnz.basicData.sequence.href),
                userId: myUserId
              });
              myProfileCqnz.followEachOther = {result: {value: true}};
              myProfileCqnz.viewsCounter = myProfileCqnz.basicData.isAdvertisement && myProfileCqnz.sequenceOwnerId == myUserId ? adsService.getViewsCount(myProfileCqnz.basicData.sequenceId) : null;
              myProfileCqnz.clicksCounter = myProfileCqnz.basicData.isAdvertisement && myProfileCqnz.sequenceOwnerId == myUserId ? adsService.getClicksCount(myProfileCqnz.basicData.sequenceId) : null;

              //$scope._sequenceList.push(cqnzService.configureSequence(myProfileCqnz));
              $scope._sequenceList.push(SequenceFactory.buildSequenceObject(myProfileCqnz));

              $scope.isRefreshing = false;
              $scope.isLoadingContent = false;

              $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (errors) {
              console.error("Comments-Tags-Hashes error", errors);
              $scope.errorLoading = true;
              $scope.canGetMoreItems = false;

              $scope.isRefreshing = false;
              $scope.isLoadingContent = false;

              $scope.$broadcast('scroll.infiniteScrollComplete');
            })
          });
        }, function (error) {
          console.log("findLatestSequencesBelongingToAUser", error);
          $scope.errorLoading = true;
          $scope.canGetMoreItems = false;

          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;

          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      $scope.refreshMyProfileTimeline = function () {
        $scope._sequenceList = [];

        $scope.errorLoading = false;
        $scope.isRefreshing = true;
        pagination.start = 0;
        pagination.count = 5;

        $scope.findSequencesFromTheUser();

        setTimeout(function () {
          Utils.$ionicScrollDelegate.resize();
        }, 800);
      };

      $rootScope.$on('sequence.deleted', function (event, data) {
        if (data.from === 'myProfileTimelineCtrl') {
          $scope._sequenceList.splice(data.listIndex, 1);
          pagination.count = 1;
          pagination.start--;
          $scope.findSequencesFromTheUser();
          pagination.count = 5;

          Utils.toast.success(Utils.translate('SEQUENCE.DIALOG.DELETE_CQNZ_OK'));
        }
      });
    }])

  .controller('friendProfileTimelineCtrl', ['$rootScope', '$scope', '$state', 'TimeLineService', 'SequenceService', 'cqnzService', 'SequenceFactory', 'adsService', 'UserService', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, TimeLineService, SequenceService, cqnzService, SequenceFactory, adsService, UserService, permissionValidationService, Utils) {
      var myUserId = UserService.get_USER_ID();
      var friendUserId = $state.params.instanceId;
      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      $scope._controllerName = "friendProfileTimelineCtrl";

      //------- CONFIG FOR SEQUENCE ITEMS ------
      $scope.isUserProfile = true;
      $scope.hideAvatar = true;
      $scope.hideUsername = true;
      //---- END CONFIG FOR SEQUENCE ITEMS -----

      var pagination = {
        start: 0,
        count: 5
      };
      $scope._sequenceList = [];

      $scope.refreshText = Utils.translate('GLOBAL.REFRESH');
      $scope.isRefreshing = false;
      $scope.isLoadingContent = false;
      $scope.canGetMoreItems = true;
      $scope.errorLoading = false;

      $scope.findFriendSequences = function () {
        if ($scope.isLoadingContent) return;

        $scope.isLoadingContent = true;

        TimeLineService.findLatestSequencesBelongingToAUser({
          userId: friendUserId,
          start: pagination.start,
          count: pagination.count
        }).then(function (sequencesMyProfile) {
          if (sequencesMyProfile && !sequencesMyProfile[sequencesMyProfile.length - 1].sequence)
            sequencesMyProfile.splice(sequencesMyProfile.length - 1, 1);

          //console.log(sequencesMyProfile);

          var fetchedCqnzsLength = sequencesMyProfile.length;

          $scope.canGetMoreItems = fetchedCqnzsLength > 0;

          if (!fetchedCqnzsLength) {
            $scope.isRefreshing = false;
            $scope.isLoadingContent = false;
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
          }

          pagination.start += sequencesMyProfile.length;

          sequencesMyProfile.forEach(function (cqnzBasicData) {
            var comments = SequenceService.findTheCommentsOfASequencev157({
              sequenceId: cqnzBasicData.sequenceId,
              start: 0,
              count: 2
            });

            var tagsList = SequenceService.obtainTagwithIdandType({
              sequenceId: cqnzBasicData.sequenceId,
              notificationType: 7
            });

            var hashesList = SequenceService.getHashFromSequence(cqnzBasicData.sequenceId);

            Utils.$q.all({
              comments: comments,
              tagsList: tagsList,
              hashesList: hashesList
            }).then(function (friendProfileCqnz) {
              friendProfileCqnz.basicData = cqnzBasicData;

              friendProfileCqnz.sequenceOwnerId = Utils.getLastUrlComponent(friendProfileCqnz.basicData.userSubscriptionId.href);
              friendProfileCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(friendProfileCqnz.basicData.sequenceId);
              friendProfileCqnz.likeActive = SequenceService.findSmileysCount({
                sequenceId: Utils.getLastUrlComponent(friendProfileCqnz.basicData.sequence.href),
                userId: myUserId
              });
              friendProfileCqnz.followEachOther = myUserId == friendProfileCqnz.sequenceOwnerId ? {result: {value: true}} : SequenceService.followEachOther({
                userId: myUserId,
                friendId: friendProfileCqnz.sequenceOwnerId
              });
              friendProfileCqnz.viewsCounter = friendProfileCqnz.basicData.isAdvertisement && friendProfileCqnz.sequenceOwnerId == myUserId ? adsService.getViewsCount(friendProfileCqnz.basicData.sequenceId) : null;
              friendProfileCqnz.clicksCounter = friendProfileCqnz.basicData.isAdvertisement && friendProfileCqnz.sequenceOwnerId == myUserId ? adsService.getClicksCount(friendProfileCqnz.basicData.sequenceId) : null;

              //$scope._sequenceList.push(cqnzService.configureSequence(friendProfileCqnz));
              $scope._sequenceList.push(SequenceFactory.buildSequenceObject(friendProfileCqnz));


              $scope.isRefreshing = false;
              $scope.isLoadingContent = false;

              $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function (errors) {
              console.error("Comments-Tags-Hashes error", errors);
              $scope.errorLoading = true;
              $scope.canGetMoreItems = false;

              $scope.isRefreshing = false;
              $scope.isLoadingContent = false;

              $scope.$broadcast('scroll.infiniteScrollComplete');
            })
          });
        }, function (error) {
          console.log("findLatestSequencesBelongingToAUser", error);
          $scope.errorLoading = true;
          $scope.canGetMoreItems = false;

          $scope.isRefreshing = false;
          $scope.isLoadingContent = false;

          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      $scope.refreshFriendProfileTimeline = function () {
        $scope._sequenceList = [];

        $scope.errorLoading = false;
        $scope.isRefreshing = true;
        pagination.start = 0;
        pagination.count = 5;

        $scope.findFriendSequences();

        setTimeout(function () {
          Utils.$ionicScrollDelegate.resize();
        }, 800);

        $scope.initFriendProfile();
      };
    }])

;

/**
 * @typedef {Object} GroupWithErrors
 * @property {string} groupName
 * @property {{status:number, statusText:string, message:string}} error
 */

//4805 lines
