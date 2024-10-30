"use strict";
appControllers
  .controller('discoveryCtrl', ['$rootScope', '$scope', '$state', 'ApiEndPoint', 'DBServices', 'UserService', 'usersData', '$ionicModal', '$ionicScrollDelegate', 'ionicService', 'TimeLineService', 'SequenceService', '$ionicSlideBoxDelegate', 'network', '$timeout', 'reDirectService', '$filter', 'AWSServices', 'cqnzService', 'SequenceFactory', 'TagsService', 'Utils',
    function ($rootScope, $scope, $state, ApiEndPoint, DBServices, UserService, usersData, $ionicModal, $ionicScrollDelegate, ionicService, TimeLineService, SequenceService, $ionicSlideBoxDelegate, network, $timeout, reDirectService, $filter, AWSServices, cqnzService, SequenceFactory, TagsService, Utils) {
      $scope._controllerName = 'discoveryCtrl';
      var myUserId = UserService.get_USER_ID();
      var myUserHref = UserService.get_USER_INSTANCE_HREF();

      var lastSearch, pendingSearch;

      $scope.data = {};

      //setings for seach modal objects
      $scope.data.searchActiveTab = 'none';
      $scope.activateSearchTab = function (tabName) {
        $scope.data.searchActiveTab = tabName
      };


      $scope.searching = false;

      $scope.newUsers = [];
      $scope.featuredUsers = [];

      $scope.newUsersCount = {};
      $scope.newUsersCount.start = 0;
      $scope.newUsersCount.pagination = {};
      $scope.newUsersCount.pagination.withStart = '"' + $scope.newUsersCount.start + '"';
      $scope.newUsersCount.pagination.withCount = '"' + 6 + '"';

      $scope.featuredUsersCount = {};
      $scope.featuredUsersCount.start = 0;
      $scope.featuredUsersCount.pagination = {};
      $scope.featuredUsersCount.pagination.withStart = '"' + $scope.featuredUsersCount.start + '"';
      $scope.featuredUsersCount.pagination.withCount = '"' + 5 + '"';
      $scope.featuredUsersCount.pagination.random = false;

      $scope.data.noMoreUsersAvailable = false;

      $scope.data.unfollowText = $filter('translate')('GLOBAL.UNFOLLOW');
      $scope.data.followText = $filter('translate')('GLOBAL.FOLLOW');

      $scope.data.activeTab = "featured";

      $scope.errorLoading = false;
      $scope.network = network;
      $scope.textOnboarding = [];

      $scope.data.trendingList = [];

      $scope.initDiscover = function () {
        $scope.newUsers = [];
        $scope.featuredUsers = [];
        $scope.newUsersCount.start = 0;
        $scope.newUsersCount.pagination.withStart = '"' + $scope.newUsersCount.start + '"';
        $scope.featuredUsersCount.start = 0;
        $scope.featuredUsersCount.pagination.withStart = '"' + $scope.featuredUsersCount.start + '"';
        $scope.changeTab($scope.data.activeTab);
        $scope.data.random = true;
      };

      $scope.changeTab = function (tab) {
        $scope.data.activeTab = tab;
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $ionicScrollDelegate.resize();
        $scope.data.noMoreUsersAvailable = false;
      }

      $scope.changeTab("featured");

      $scope.loadMore = function () {
        switch ($scope.data.activeTab) {
          case "featured":
            $scope.findFeatured();
            break;
          case "newUsers":
            $scope.findNewUsers();
            break;
        }
      };

      $scope.initSearch = function () {
        $scope.data.noMoreItemsAvailable = false;
        $scope.users = [];
        $scope.start = 0;
        $scope.count = 6;
      };


      var usersLoaded = false;
      var cqnzDescriptionsLoaded = false;

      $scope.limitSearch = function () {
        $scope.usersResults = $scope._sequenceList = null;

        if (!$scope.data.userName || !debounceSearch()) return;

        $scope.data.noMoreItemsAvailable = true;
        $scope.searching = true;
        $scope.errorLoading = false;

        var term = $scope.data.userName;

        usersLoaded = cqnzDescriptionsLoaded = false;


        searchForSequenceDescription(term).then(function (value) {
          //console.log("searchForSequenceDescription", value);
          $scope._sequenceList = value;
        }, function (error) {
          $scope.errorLoading = false;
        }).finally(function () {
          cqnzDescriptionsLoaded = true;
          searchEnded();
        });

        //user dont want to search other users
        if (term.charAt(0) === '#') {
          $scope.usersResults = null;
          usersLoaded = true;
          searchEnded();
        }
        else {
          searchForUsers(term).then(function (value) {
            //console.log("searchForUsers", value);
            $scope.usersResults = value;
          }, function (error) {
            $scope.errorLoading = true;
          }).finally(function () {
            usersLoaded = true;
            searchEnded();
          });
        }
      };

      /**
       * @param term
       * @return Promise {*}
       */
      function searchForUsers(term) {
        return Utils.$q(function (resolve, reject) {
          UserService.searchUsersByPartialNameOrIncludingSpaces({
            term: term,
            start: 0,
            count: 25
          }).then(
            /**
             * @param UserResults {[{
             *  id:string,
             *  href:string
             *  name:string,
             *  photo:string,
             * }] | []}
             */
            function (UserResults) {
              resolve(UserResults.length ? UserResults : null);
            }, function (error) {
              reject(error);
              console.error("couldn't get user list", error);
            });
        })
      }

      /**
       * @param term
       * @return Promise {*}
       */
      function searchForSequenceDescription(term) {
        return Utils.$q(function (resolve, reject) {
          SequenceService.findSequenceByDescription(term).$promise.then(function (sequenceResults) {

            if (sequenceResults && !sequenceResults[sequenceResults.length - 1].sequence)
              sequenceResults.splice(sequenceResults.length - 1, 1);

            if (!sequenceResults || !sequenceResults.length)
              resolve(null);

            var sequenceList = [];
            sequenceResults.forEach(function (sequence) {

              var listTags = SequenceService.obtainTagwithIdandType({
                sequenceId: sequence.sequenceId,
                notificationType: 7
              });

              var hashesList = SequenceService.getHashFromSequence(sequence.sequenceId);

              Utils.$q.all({
                tagsList: listTags,
                hashesList: hashesList
              }).then(function (userCqnz) {
                userCqnz.basicData = sequence;
                userCqnz.comments = [];
                userCqnz.sequenceOwnerId = Utils.getLastUrlComponent(userCqnz.basicData.userSubscriptionId.href);
                userCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(userCqnz.basicData.sequenceId);

                //sequenceList.push(cqnzService.configureSequence(userCqnz));
                sequenceList.push(SequenceFactory.buildSequenceObject(userCqnz));

                if (sequenceList.length === sequenceResults.length)
                  resolve(sequenceList.length ? sequenceList : null);
              }, function (error) {
                console.error(error);
                reject(error);
              })
            });
            //refreshDebounce();
          }, function (error) {
            reject(error);
            console.error("couldn't get sequence list", error);
          });
        })
      }

      function searchEnded() {
        if (!cqnzDescriptionsLoaded || !usersLoaded) return;

        refreshDebounce();

        $scope.searching = false;

        $scope.data.searchActiveTab =
          $scope.usersResults ? 'users' :
            ($scope._sequenceList ? 'content' : 'none');

        //console.log("searchActiveTab", $scope.data.searchActiveTab)
      }

      function refreshDebounce() {
        lastSearch = 0;
        pendingSearch = null;
        //cancelSearch  = angular.noop;
      }

      /**
       * Debounce if querying faster than 300ms
       */
      function debounceSearch() {
        var now = new Date().getMilliseconds();
        lastSearch = lastSearch || now;
        return ((now - lastSearch) < 300);
      }

      function searchForUsers1(term) {
        UserService.findFriendUserSubscriptionsByUserName().get({
          userName: term,
          withStart: 0,
          withCount: 3
        }).$promise.then(function success(response) {
          if (response.length > 1) {
            response.length--;
            $scope.start += response.length;
            $scope.users = response;
            $scope.searching = false;
          } else {
            $scope.data.noMoreItemsAvailable = true;
            $scope.searching = false;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');

        }, function error(response) {
          $scope.errorLoading = true;
          $scope.searching = false;
          $scope.data.noMoreItemsAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
          console.log("findFriendUserSubscriptionsByUserName error");
        });
      }


      $scope.search = function () {
        if ($scope.data.userName) {
          $scope.errorLoading = false;
          $scope.searching = true;
          UserService.findFriendUserSubscriptionsByUserName().get({

            'userName': $scope.data.userName,
            'withStart': $scope.start,
            'withCount': $scope.count

          }).$promise.then(function success(response) {
            if (response.length > 1) {
              response.length--;
              $scope.start += response.length;
              $scope.users.push.apply($scope.users, response);
              $scope.searching = false;
            } else {
              $scope.data.noMoreItemsAvailable = true;
              $scope.searching = false;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');

          }, function error(response) {
            $scope.errorLoading = true;
            $scope.searching = false;
            $scope.data.noMoreItemsAvailable = true;
            $scope.$broadcast('scroll.infiniteScrollComplete');
            console.log("findFriendUserSubscriptionsByUserName error");
          });
        }
      };

      $scope.findNewUsers = function () {
        UserService.findNewUsers({
          "itemId": window.localStorage.getItem("userSubscriptionInstanceId")
        }).get(
          $scope.newUsersCount.pagination
        ).$promise.then(function success(response) {
          if (response.length > 0) {
            $scope.newUsersCount.start += response.length;
            $scope.newUsersCount.pagination.withStart = '"' + $scope.newUsersCount.start + '"';
            $scope.newUsers.push.apply($scope.newUsers, response);
            $scope.searching = false;
          } else {
            $scope.data.noMoreUsersAvailable = true;
            $scope.searching = false;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function error(response) {
          console.log("findNewUsers error");
          $scope.errorLoading = true;
          $scope.data.noMoreUsersAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      $scope.findFeatured = function () {
        UserService.findFeatured({
          "itemId": window.localStorage.getItem("userSubscriptionInstanceId")
        }).get(
          $scope.featuredUsersCount.pagination
        ).$promise.then(function success(response) {
          if (response.length > 0) {
            $scope.featuredUsersCount.start += response.length;
            $scope.featuredUsersCount.pagination.withStart = '"' + $scope.featuredUsersCount.start + '"';
            var dataLength = response.length;
            //$scope.featuredUsers.push.apply($scope.featuredUsers, response);
            for (var i = 0; i < dataLength; i++) {
              var pictureResult = UserService.findLatestItemThumbBelongingToAUserSubscriptionByType({
                "itemId": response[i].userSubscription.href.split('/')[6]
              }).get({
                "withStart": '"0"',
                "withCount": '"3"'
              });

              $scope.featuredUsers.push({
                profilePicture: response[i].profilePicture,
                profilePictureUrl: response[i].profilePictureUrl,
                userSubscription: response[i].userSubscription,
                name: response[i].name,
                pictures: pictureResult
              });
            }
            $scope.searching = false;
          } else {
            $scope.data.noMoreUsersAvailable = true;
            $scope.searching = false;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function error(response) {
          console.log("findNewUsers error");
          $scope.errorLoading = true;
          $scope.data.noMoreUsersAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      $scope.retry = function () {
        $scope.errorLoading = false;
        $scope.initDiscover();
        $scope.initSearch();
      };

      /*$ionicModal.fromTemplateUrl('templates/search.html', {
          scope: $scope,
              focusFirstInput: true
      }).then(function(modal) {
          $scope.modalSearch = modal;
      });*/

      $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        $scope.modalSearch.remove();
      });

      $scope.$on("$ionicView.enter", function (event, toState, toParams, fromState, fromParams) {
        $ionicModal.fromTemplateUrl('templates/search.html', {
          scope: $scope,
          focusFirstInput: true
        }).then(function (modal) {
          $scope.modalSearch = modal;
        });
      });

      $scope.sendUserProfile = function (userHref) {
        if (userHref == myUserHref) {
          $state.go('menu.myProfile', {}, {reload: true});
        }
        else {
          $state.go('friendProfile', {instanceId: Utils.getLastUrlComponent(userHref)}, {reload: true});
        }
      };

      $scope.addFriends = function (userChoose) {
        userChoose.Follow ? userChoose.Follow = false : userChoose.Follow = true;
        var userInstanceId = userChoose.userSubscription.href.split('/')[6];
        UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).save({
          "friendId": {
            "value": {
              "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + userInstanceId
            }
          }
        }, function (response) {
          //Send push notification Follower Search
          if (response.result.value) {
            UserService.getDevices(userInstanceId).$promise.then(function success(response) {
              var tokens = [];
              var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
              var message = name + " is now following you";
              message = message.replace(/\s\s+/g, ' ');
              for (var i = 0; i < response.value.length; i++) {
                var endpointArn = response.value[i].title;
                AWSServices.sendNotification(message, endpointArn);
              }
            }, function error(response) {
              console.log("UserService.addDevice error: ");
            });
          }
        }, function (error) {
          console.log("addFriends error");
        });
      };

      $scope.addFriendsSearch = function (user) {
        user.togglingFollow = true;
        user.followingIsActive.result.value = user.followingIsActive.result.value ? false : true;
        UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).save({
          "friendId": {
            "value": {
              "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + user.userSubscription.href.split('/')[6]
            }
          }
        }, function (response) {
          if (response.result.value) {
            UserService.getDevices(
              user.userSubscription.href.split('/')[6]
            ).$promise.then(function success(response) {
              var tokens = [];
              var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
              var message = name + " is now following you";
              message = message.replace(/\s\s+/g, ' ');
              for (var i = 0; i < response.value.length; i++) {
                var endpointArn = response.value[i].title;
                AWSServices.sendNotification(message, endpointArn);
              }
            }, function error(response) {
              console.log("UserService.addDevice error: ");
            });
          }
          user.togglingFollow = false;
        }, function (error) {
          user.togglingFollow = false;
          console.log("addFriends error");
        });
      };

      $scope.getFollowingIsActive = function (friendId) {
        $scope.getFolliwingActive = UserService.getFollowingIsActive().get(
          {
            "objectId": window.localStorage.getItem('userSubscriptionInstanceId'),
            "x-isis-querystring":
              {
                "friendId":
                  {
                    "value":
                      {"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + friendId}
                  }
              }
          }, function success() {
          }, function error(response) {
            console.log("getFollowingIsActive error");
          });
        return $scope.getFolliwingActive;
      };

      $scope.showImages1 = function (pictures, index, userChoosen) {
        //console.log(pictures, index, userChoosen)
        var userInstanceId = Utils.getLastUrlComponent(userChoosen.userSubscription.href);

        $scope.picturesItem = [];
        $scope.loadingInit = 1;
        $scope.activeSlide = index;

        for (var i = 0; i < pictures.length; i++) {

          $scope.picturesItem.push({
            src: pictures[i].url,//'data:image/jpeg;base64,' + pictures[i].thumbPicture.split(':')[2],
            sequenceItemId: pictures[i].sequenceItem.href.split('/')[6],
            likeCount: pictures[i].likeCount,
            userSubscriptionInstanceId: userInstanceId,
            itemId: pictures[i].itemId,
            key: index
          });
        }
        $scope.showModal('templates/gallery-zoomview2.html');
        $scope.loadingInit = 0;
      };

      $scope.showModal = function (templateUrl) {
        $ionicModal.fromTemplateUrl(templateUrl, {
          scope: $scope,
          animation: 'zoom-from-center'
        }).then(function (modal) {
          $scope.modal = modal;
          $scope.modal.show();
        });
      };

      $scope.zoomStatus = 0;

      $scope.closeModal = function () {
        $scope.modal.hide();
        $scope.modal.remove();
      };

      $scope.zoomMin = 1;

      $scope.doubleTapped = function (slide) {
        if ($scope.zoomStatus === 0) {
          $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).zoomBy(2, true);
          $scope.zoomStatus++;
        } else {
          $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).zoomBy(0, true);
          $scope.zoomStatus--;
        }
      };

      $scope.updateSlideStatus = function (slide) {
        var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + slide).getScrollPosition().zoom;
        if (zoomFactor == $scope.zoomMin) {
          $ionicSlideBoxDelegate.enableSlide(true);
        } else {
          $ionicSlideBoxDelegate.enableSlide(false);
        }
      };

      //check how many times the user have already logged in before show any tutorial
      $scope.chkTimesLogged = function () {
        var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
        DBServices.execute(querySelect, [window.localStorage.getItem("name")]).then(function (resultSet) {
          if (resultSet.rows.length > 0) {
            if (resultSet.rows.item(0).count >= 1) {
              $scope.needsTutorial();
            }
          }
        }, function (error) {
        });

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
          transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
            if (resultSet.rows.length > 0) {
              if (resultSet.rows.item(0).count >= 1) {
                $scope.needsTutorial();
              }
            }
          })
        })*/
      };

      //CODE needed to show tutorial
      $scope.needsTutorial = function () {
        var querySelect = "SELECT * FROM tutorials WHERE name = ?";
        DBServices.execute(querySelect, ["discovery"]).then(function (resultSet) {
          var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
          if (visitedJson.first) {
            document.getElementById("sideMenuCqnz").style.visibility = "hidden";
            window.localStorage.setItem("openTutorial", true);
            var intro = introJs();
            intro.setOptions({
              steps: [
                {
                  intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP1.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;  padding: 0 65px 0 65px;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP1.TEXT') + '</p>',
                  position: 'auto'
                },
                {
                  intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP2.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP2.TEXT') + '</p>',
                  position: 'auto',
                  tooltipClass: 'discoverPeople'
                },
                {
                  intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP3.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP3.TEXT') + '</p>',
                  position: 'auto',
                  tooltipClass: 'newUsers'
                }
              ],
              nextLabel: $filter('translate')('GLOBAL.NEXT'),
              prevLabel: $filter('translate')('GLOBAL.BACK'),
              doneLabel: $filter('translate')('GLOBAL.DONE'),
              skipLabel: $filter('translate')('GLOBAL.SKIP'),
              hidePrev: false,
              hideNext: false,
              exitOnOverlayClick: false,
              showStepNumbers: false,
              showBullets: false,
              showProgress: false,
              overlayOpacity: 1,
              scrollToElement: false,
              disableInteraction: true
            });
            intro.onexit(function () {
              console.log("Exit tutorial");
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              visitedJson.first = false;
              $scope.updateBD("discovery", JSON.stringify(visitedJson));
            }).oncomplete(function () {
              console.log("Complete tutorial");
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              visitedJson.first = false;
              $scope.updateBD("discovery", JSON.stringify(visitedJson));
            }).start();
          }
          else {
            document.getElementById("sideMenuCqnz").style.visibility = "initial";
            window.localStorage.setItem("openTutorial", false);
            console.log("Not new User");
          }
        }, function (error) {

        })

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM tutorials WHERE name = ?";
          transaction.executeSql(querySelect, ["discovery"], function (tx, resultSet) {
            var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
            if (visitedJson.first) {
              document.getElementById("sideMenuCqnz").style.visibility = "hidden";
              window.localStorage.setItem("openTutorial", true);
              var intro = introJs();
              intro.setOptions({
                steps: [
                  {
                    intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP1.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;  padding: 0 65px 0 65px;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP1.TEXT') + '</p>',
                    position: 'auto'
                  },
                  {
                    intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP2.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP2.TEXT') + '</p>',
                    position: 'auto',
                    tooltipClass: 'discoverPeople'
                  },
                  {
                    intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP3.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + $filter('translate')('TUTORIAL.DISCOVER.FIRST.STEP3.TEXT') + '</p>',
                    position: 'auto',
                    tooltipClass: 'newUsers'
                  }
                ],
                nextLabel: $filter('translate')('GLOBAL.NEXT'),
                prevLabel: $filter('translate')('GLOBAL.BACK'),
                doneLabel: $filter('translate')('GLOBAL.DONE'),
                skipLabel: $filter('translate')('GLOBAL.SKIP'),
                hidePrev: false,
                hideNext: false,
                exitOnOverlayClick: false,
                showStepNumbers: false,
                showBullets: false,
                showProgress: false,
                overlayOpacity: 1,
                scrollToElement: false,
                disableInteraction: true
              });
              intro.onexit(function () {
                console.log("Exit tutorial");
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.first = false;
                $scope.updateBD("discovery", JSON.stringify(visitedJson));
              }).oncomplete(function () {
                console.log("Complete tutorial");
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.first = false;
                $scope.updateBD("discovery", JSON.stringify(visitedJson));
              }).start();
            } else {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              console.log("Not new User");
            }
          })
        })*/
      };

      /*$timeout(function() {
          $scope.chkTimesLogged();
          //$scope.needsTutorial();
      }, 1500);*/

      $scope.updateBD = function (tutorial, change) {
        var querySelect = "UPDATE tutorials SET visited = ? WHERE name = ?";
        DBServices.execute(querySelect, [change, tutorial]).then(function (resultSet) {
          console.log(name + " insertId: " + resultSet.insertId);
          console.log(name + " rowsAffected: " + resultSet.rowsAffected);
        }, function (error) {
          console.log('UPDATE error out: ' + error.message);
        })

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "UPDATE tutorials SET visited = ? WHERE name = ?";
          transaction.executeSql(querySelect, [change, tutorial], function (tx, resultSet) {
            console.log(name + " insertId: " + resultSet.insertId);
            console.log(name + " rowsAffected: " + resultSet.rowsAffected);
          }, function (tx, error) {
            console.log('UPDATE error in: ' + error.message);
          })
        }, function (error) {
          console.log('UPDATE error out: ' + error.message);
        }, function () {
          console.log('transaction ok');
        });*/
      }
      //END CODE needed to show tutorial

      //zone for hashtags list
      $scope.getTrending = function () {
        SequenceService.getTrending().get({
          "withStart": '"' + 0 + '"',
          "withCount": '"' + 10 + '"'
        }).$promise.then(function (hashtagsList) {
          if (hashtagsList.length > 1) {
            hashtagsList.length--;
            if (hashtagsList.length >= 1) {
              for (var a = 0; a < hashtagsList.length; a++) {
                $scope.data.trendingList[a] = {
                  name: hashtagsList[a].hashTag
                }
              }
            } else {
              $scope.data.noTrending = 1;
            }
          } else {
            $scope.data.noTrending = 1;
          }
          //console.log("trending",hashtagsList);
        }, function (error) {
          $scope.data.noTrending = 1;
        })
      }
      $scope.getTrending();

      $scope.sendHashtagTimeline = function (text) {
        $state.go('hashTimeLine', {"hashName": "#" + text}, {reload: true});
      };
      //end zone for hashtags list

      $scope.data.showButtonsArea = false;
      //zone to show and quit button upload zone
      $scope.showButtonArea = function () {
        console.log("in");
        if ($scope.data.showButtonsArea) {
          var area = document.getElementById("ButtonsAreaRedirect");
          area.className = "";
          $scope.data.showButtonsArea = false;
        } else {
          var area = document.getElementById("ButtonsAreaRedirect");
          area.className = "bounceInUp";
          $scope.data.showButtonsArea = true;
        }

      };
      //END zone to show and quit button upload zone
    }])
;
