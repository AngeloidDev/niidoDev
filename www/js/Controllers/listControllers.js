"use strict";
appControllers
//list of friends linked to a user
  .controller('listFriendsCtrl', ['$scope', '$state', 'friendsData', '$ionicPopup', 'UserService', 'ApiEndPoint', 'usersData', 'ionicService', 'network', 'reDirectService', '$filter', 'AWSServices', '$ionicPlatform',
    function ($scope, $state, friendsData, $ionicPopup, UserService, ApiEndPoint, usersData, ionicService, network, reDirectService, $filter, AWSServices, $ionicPlatform) {

      $scope.network = network;
      $scope.unfollowText = $filter('translate')('GLOBAL.UNFOLLOW');
      $scope.followText = $filter('translate')('GLOBAL.FOLLOW');
      //$state.params.subscriptionInstanceId
      $scope.init = function () {
        $scope.start = 0;
        $scope.count = 6;
        $scope.noMoreItemsAvailable = false;
        $scope.friends = [];
        $scope.errorLoading = false;
      };
      $scope.init();

      $scope.loadMore = function () {
        UserService.findFriendsByUserSubscriptionId({
          userId: $state.params.subscriptionInstanceId,
          start:$scope.start,
          count:$scope.count
        }).$promise.then(function (data) {
          if (data.length > 0) {
            $scope.friends.push.apply($scope.friends, data);
            $scope.start = $scope.friends.length;
          } else {
            $scope.noMoreItemsAvailable = true;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (error) {
          console.log("findFriendsByUserSubscriptionId error");
          $scope.errorLoading = true;
          $scope.noMoreItemsAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      //Check if any of the list of Friend's friends are friend with the current user
      //function to check friend or not
      $scope.checkFriendship = function (friend) {
        $scope.getFolliwingActive = UserService.getFollowingIsActive().get(
          {
            "objectId": window.localStorage.getItem('userSubscriptionInstanceId'),
            "x-isis-querystring":
              {
                "friendId":
                  {
                    "value":
                      {"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + friend.userSubscription.href.split('/')[6]}
                  }
              }
          }, function success(response) {
            friend.followingIsActive = response.result.value;
          }, function error(response) {
            $scope.content = false;
            console.log("getFollowingIsActive error");
          });
        return $scope.getFolliwingActive;
      };

      //function to follow/unfollow users
      $scope.addFriends = function (friend) {
        friend.togglingFollow = true;
        friend.followingIsActive = friend.followingIsActive ? false : true;
        UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).save({
          "friendId": {
            "value": {
              "href": friend.userSubscription.href
            }
          }
        }, function (response) {
          //Send push notification Follower Following
          if (response.result.value) {
            UserService.getDevices(
              friend.userSubscription.href.split('/')[6]
            ).$promise.then(function success(response) {
              console.log("devices: ", response);
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
          friend.togglingFollow = false;
        }, function () {
          friend.togglingFollow = false;
        });
      };

      $scope.sendUserProfile = function (userChosen) {
        userChosen = userChosen.href.split('/')[6];
        reDirectService.reDirectProfile(userChosen);
      };

      $scope.data = {};
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

  //list of followers linked to a user
  .controller('followersCtrl', ['$scope', 'ApiEndPoint', 'UserService', 'followersData', '$ionicPopup', 'usersData', '$state', 'ionicService', 'network', 'reDirectService', '$filter', 'AWSServices', '$ionicPlatform', 'Utils',
    function ($scope, ApiEndPoint, UserService, followersData, $ionicPopup, usersData, $state, ionicService, network, reDirectService, $filter, AWSServices, $ionicPlatform, Utils) {

      $scope.network = network;
      $scope.unfollowText = $filter('translate')('GLOBAL.UNFOLLOW');
      $scope.followText = $filter('translate')('GLOBAL.FOLLOW');
      //$state.params.subscriptionInstanceId
      $scope.init = function () {
        $scope.errorLoading = false;
        $scope.start = 0;
        $scope.count = 6;
        $scope.noMoreItemsAvailable = false;
        $scope.followers = [];
      };

      $scope.init();

      $scope.loadMore = function () {
        UserService.followersByUserId({"objectId": $state.params.subscriptionInstanceId}).get({
          "withStart": '"' + $scope.start + '"',
          "withCount": '"' + $scope.count + '"'
        }, function (data) {
          if (data.length > 0) {
            $scope.followers.push.apply($scope.followers, data);
            $scope.start = $scope.followers.length;
          } else {
            $scope.noMoreItemsAvailable = true;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (error) {
          console.log("followersByUserId error");
          $scope.errorLoading = true;
          $scope.noMoreItemsAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      $scope.findBlockUserById = function (friendId) {
        return UserService.findBlockUserById().get({
          "x-isis-querystring":
            {
              "userSubscriptionId":
                {
                  "value":
                    {
                      "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + window.localStorage.getItem("userSubscriptionInstanceId")
                    }
                },
              "userBlockedId":
                {
                  "value":
                    {
                      "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + friendId
                    }
                }
            }
        }, function success() {
        }, function error(response) {
          console.log("findBlockUserById error");
        });
      };

      $scope.blockToUser = function (friendId) {
        $scope.blockUserById = UserService.blockToUser({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save({
          "userSubscription":
            {
              "value":
                {
                  "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + friendId
                }
            }
        }, function (response) {
          console.log("blockToUser response");
          $scope.findBlockUserById(friendId);
        }, function (error) {
          console.log("blockToUser error");
        });
        return $scope.blockUserById;
      };

      $scope.unblockToUser = function (friendId) {
        $scope.unblockUserById = UserService.unblockUser({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save({
          "userSubscription":
            {
              "value":
                {
                  "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + friendId
                }
            }
        }, function success() {
          $scope.findBlockUserById(friendId);
        }, function error(response) {
          console.log("unblockUser error");
        });

        return $scope.unblockUserById;
      };

      $scope.getFollowingIsActive = function (follower) {
        UserService.getFollowingIsActive().get(
          {
            "objectId": window.localStorage.getItem('userSubscriptionInstanceId'),
            "x-isis-querystring":
              {
                "friendId":
                  {
                    "value":
                      {"href": follower.userSubscription.href}
                  }
              }
          }, function (data) {
            follower.isActive = data.result.value;
          }, function (error) {
            follower.isActive = false;
            console.log("getFollowingIsActive error");
          });
      };

      //function to follow/unfollow users
      $scope.addFriends = function (follower) {
        follower.togglingFollow = true;
        follower.isActive = follower.isActive === true ? false : true;
        UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).save({
          "friendId": {
            "value": {
              "href": follower.userSubscription.href
            }
          }
        }, function (response) {
          //Send push notification Follower Follower
          if (response.result.value) {
            UserService.getDevices(
              follower.userSubscription.href.split('/')[6]
            ).$promise.then(function success(response) {
              console.log("getDevices success");
              var tokens = [];
              var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
              //var message = name + " is now following you";
              var message = name + Utils.translate('NOTIFICATIONS.DIALOG.IS_FOLLOWING_YOU');
              message = message.replace(/\s\s+/g, ' ');
              for (var i = 0; i < response.value.length; i++) {
                var endpointArn = response.value[i].title;
                AWSServices.sendNotification(message, endpointArn);
              }
            }, function error(response) {
              console.log("getDevices error");
            });
          }
          //success
          follower.togglingFollow = false;
        }, function (error) {
          console.log("addFriends error");
        });
      };

      //Function to redirect to other userprofile
      $scope.sendUserProfile = function (userChosen) {
        userChosen = userChosen.href.split('/')[6];
        reDirectService.reDirectProfile(userChosen);
      };

      $scope.data = {};
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

  //list of likes linked to a post
  .controller('listLikesCtrl', ['$scope', 'ApiEndPoint', 'likeUsersData', 'SequenceService', 'UserService', 'usersData', '$state', 'network', 'reDirectService',
    function ($scope, ApiEndPoint, likeUsersData, SequenceService, UserService, usersData, $state, network, reDirectService) {

      $scope.likeUsersData = likeUsersData;
      $scope.userLikeList = [];
      $scope.noMoreItemsAvailable = false;
      $scope.start = 0;
      $scope.count = 10;
      $scope.errorLoading = false;
      $scope.network = network;
      //function to load al the data needed
      $scope.loadMore = function () {
        SequenceService.sequenceCounts({"objectId": $scope.likeUsersData.data}).get({
          'withStart': $scope.start,
          'withCount': $scope.count
        }).$promise.then(function success(response) {
          if (response.length > 1) {
            response.length--;
            $scope.start += response.length;
            $scope.userLikeList.push.apply($scope.userLikeList, response);
          } else {
            $scope.noMoreItemsAvailable = true;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function error(response) {
          $scope.errorLoading = true;
          $scope.noMoreItemsAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
          console.log("sequenceCounts error");
        });
      };

      $scope.retry = function () {
        $scope.errorLoading = false;
        $scope.userLikeList = [];
        $scope.noMoreItemsAvailable = false;
        $scope.start = 0;
        $scope.count = 10;
      };

      $scope.sendUserProfile = function (userChosen) {
        reDirectService.reDirectProfile(userChosen);
      };

      $scope.data = {};
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
    }])

  //Controller for the list favorites page
  .controller('listFavoritesCtrl', ['$scope', '$state', 'TimeLineService', 'network', 'ApiEndPoint', 'reDirectService', 'UserService',
    function ($scope, $state, TimeLineService, network, ApiEndPoint, reDirectService, UserService) {
      //declaration
      $scope.data = {};
      $scope.userSubscriptionInstanceId = window.localStorage.getItem('userSubscriptionInstanceId');
      $scope.start = 0;
      $scope.count = 10;
      $scope.network = network;
      $scope.errorLoading = false;
      $scope.noMoreItemsAvailable = false;
      $scope.userFavoritesList = [];

      //function to initialize all data
      $scope.getListOfFavorites = function () {
        TimeLineService.findMyFavoriteFriendsByUserSubscriptionId({"objectId": $scope.userSubscriptionInstanceId}).get(
          {
            "withStart": '"' + $scope.start + '"',
            "withCount": '"' + $scope.count + '"',
          }
        ).$promise.then(function (response) {
          if (response.length > 0) {
            $scope.start += response.length;
            $scope.userFavoritesList.push.apply($scope.userFavoritesList, response);
          } else {
            $scope.noMoreItemsAvailable = true;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (error) {
          $scope.errorLoading = true;
          $scope.noMoreItemsAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
          console.log("sequenceCounts error");
        })
      };

      $scope.retry = function () {
        $scope.errorLoading = false;
        $scope.userFavoritesList = [];
        $scope.noMoreItemsAvailable = false;
        $scope.start = 0;
        $scope.count = 10;
      };

      //Code needed to redirect user to friend's profile
      $scope.sendFriendProfile = function (user) {
        var friendSubscriptionIntanceId = user.href.split('/')[6];
        reDirectService.reDirectProfile(friendSubscriptionIntanceId);
      };

      $scope.addFavorite = function (user) {
        var friendSubscriptionIntanceId = user.userSubscription.href.split('/')[6];
        user.favorite = user.favorite === 0 ? 5 : 0;
        //Find id from "friendship"
        UserService.findFriendInstanceId({
          userId: window.localStorage.getItem("userSubscriptionInstanceId"),
          friendId: friendSubscriptionIntanceId
        }).then(function success(response) {
          if (response.result.value.length > 0) {
            console.log("friend id");
            UserService.favorite({"objectId": response.result.value[0].href.split('/')[6]}).post({
              "int": {
                "value": user.favorite
              }
            }).$promise.then(function success(response) {
              console.log("favorite level");
            }, function error(response) {
              console.log("addFavorite error");
            });
          }
        }, function error(response) {
          console.log("findFriend");
        });
      };

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

  //Controller to comments web page
  .controller('commentsCqnzCtrl', ['$rootScope', '$scope', '$state', 'UserService', 'SequenceService', 'cqnzService', 'TagsService', 'CommentFactory', 'network', 'permissionValidationService', 'notificationsService', 'Utils',
    function ($rootScope, $scope, $state, UserService, SequenceService, cqnzService, TagsService, CommentFactory, network, permissionValidationService, notificationsService, Utils) {

      var params = $state.params.data;
      //console.log("params", params)

      var pagination = {
        start: 0,
        count: 10
      };

      $scope.refreshText = Utils.translate('GLOBAL.REFRESH');
      $scope.noMoreItemsAvailable = false;
      /**@type {CommentStructureType[]}*/
      $scope.commentsUserToSequence = [];
      $scope.errorLoading = false;
      $scope.network = network;
      $scope.isCreatingComment = false;
      $scope.isRefreshing = false;
      $scope.isLoadingComments = false;

      $scope.findTheCommentsOfASequence = function () {
        $scope.isLoadingComments = true;
        SequenceService.findTheCommentsOfASequencev157({
          sequenceId: params.sequenceMetadata.id,
          start: pagination.start,
          count: pagination.count
        }).then(function (comments) {
          Utils.removeLastItemIfHasNoAttribute(comments, 'sequenceComments');

          if (!comments.length) {
            $scope.isRefreshing = false;
            $scope.noMoreItemsAvailable = true;
            $scope.isLoadingComments = false;
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
            return;
          }

          comments.forEach(function (comment) {
            //console.log("comments list",comment);
            $scope.commentsUserToSequence.push(
              CommentFactory.buildCommentObject({
                comment: comment,
                sequenceMetadata: params.sequenceMetadata,
                sequenceOwnerMetadata: params.sequenceOwnerMetadata
              })
            );
          });

          pagination.start = $scope.commentsUserToSequence.length;
          pagination.count = 15;

          $scope.isRefreshing = false;
          $scope.isLoadingComments = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (error) {
          $scope.errorLoading = true;
          $scope.isRefreshing = false;
          $scope.noMoreItemsAvailable = true;
          $scope.isLoadingComments = false;
          $scope.$broadcast('scroll.refreshComplete');
          $scope.$broadcast('scroll.infiniteScrollComplete');
          console.log("findTheCommentsOfASequencev157",error);
        });
      };

      $scope.reloadComments = function () {
        $scope.errorLoading = false;
        pagination.start = 0;
        pagination.count = 10;
        $scope.noMoreItemsAvailable = false;
        $scope.commentsUserToSequence = [];
        $scope.isRefreshing = true;

        $scope.findTheCommentsOfASequence();
      };

      $scope.showCommentComposer = function () {
        composeOrEditMessageWithTags().then(function (form) {
          addComments(form)
        })
      };

      //code to update/delete comment
      /**
       * @param comment {CommentStructureType}
       * @param listIndex
       */
      $scope.showEditActionsMenu = function (comment, listIndex) {
        //console.log("comment", comment);
        var buttons = [];
        var buttonsIds = [];

        if (comment.canEdit) {
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
                  //No description or is the same, nothing to update
                  if (!form.description || form.description == comment.backupDescription) return;

                  comment.editableDescription = form.description;
                  comment.updateMe(form.savedTags).then(function (/*theNewCommentObject*/) {
                    //nothing to do
                  }, function (error) {
                    //the messages/toasts are shown and printed inside updateMe
                  });
                });
                break;
              default:
                Utils.toast.warning("Invalid option '" + buttonsIds[buttonIndex] + "'");
            }
            return true;
          },
          destructiveText: comment.canDelete ? Utils.translate('GLOBAL.DELETE') + ' <i class="icon ion-close-round"></i>' : null,
          destructiveButtonClicked: comment.canDelete ? function () {
            comment.deleteMe().then(function () {
              $scope.commentsUserToSequence.splice(listIndex, 1);
            }, function (error) {
            });
            return true;
          } : null
        });
      };

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
          sequenceMetadata: params.sequenceMetadata,
          sequenceOwnerMetadata: params.sequenceOwnerMetadata,
          description: form.description,
          tagsList: form.savedTags
        }).then(/**@param newComment {CommentStructureType}*/function (newComment) {
          if ($scope.commentsUserToSequence.length)
            $scope.commentsUserToSequence.push(newComment);
          else {
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$broadcast('scroll.infiniteScrollComplete');
            setTimeout(function () {
              Utils.$ionicScrollDelegate.resize();
            }, 800);
          }
        }, function (error) {
          //the errors are printed inside the function
          Utils.toast.error(Utils.translate("SEQUENCE.DIALOG.CREATE_POST_COMMENT_ERROR"))
        }).finally(function () {
          $scope.isCreatingComment = false;
        });
      }

      if (!params.totalComments)
        $scope.showCommentComposer();
      else
        $scope.findTheCommentsOfASequence();
    }])
;
