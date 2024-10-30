"use strict";
appControllers
  .controller('MyProfileCtrl', ['$rootScope', '$scope', '$state', 'TimeLineService', 'UserService', 'SequenceService', 'ApiEndPoint', 'cqnzData', 'usersData', 'followersData', 'friendsData', '$q', '$sce', 'network', 'reDirectService', 'ionicService', '$timeout', 's3', 'md5', '$ionicActionSheet', 'permissionValidationService', 'cqnzService', 'Utils', 'AWSServices',
    function ($rootScope, $scope, $state, TimeLineService, UserService, SequenceService, ApiEndPoint, cqnzData, usersData, followersData, friendsData, $q, $sce, network, reDirectService, ionicService, $timeout, s3, md5, $ionicActionSheet, permissionValidationService, cqnzService, Utils, AWSServices) {
      var myUserId = UserService.get_USER_ID();

      //Check what device
      $scope.isIOS = Utils.isIOS();
      $scope.isAndroid = Utils.isAndroid();
      $scope.editBio = false;
      $scope.activeMenus = false;


      $scope.userBio = UserService.get_USER_BIO();
      $scope.pictureProfile = UserService.get_USER_PHOTO();
      $scope.nameProfile = UserService.get_USER_NAME();


      //Code to check if the user is verfied or not
      $scope.verifiedUser = function () {
        UserService.findUserSubscriptionById().get({
            "userSubscriptionId": '"' + myUserId + '"'
          }, function (response) {
            $scope.verifyUser = response[0].verifyUser;
          }, function (error) {
            console.log("findUserSubscriptionById Error");
          }
        );
      };

      //count CQNZs for  my Profile
      $scope.getCountSequences = function () {
        UserService.countSequencesToAUser({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).get(
          {},
          function (data) {
            $scope.numberSequences = data.result.value;
          },
          function (error) {
            console.log("countSequencesToAUser Error");
          }
        );
      };
      $scope.getCountSequences();

      //count followers for  my Profile
      $scope.getCountFollowers = function () {
        UserService.countFollowersToAUser().get(
          {
            "x-isis-querystring": {
              "userId": {
                "value": {
                  "href": ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + window.localStorage.getItem('userSubscriptionInstanceId')
                }
              }
            }
          },
          function (data) {
            $scope.numberFollowers = data.result.value;
          },
          function (error) {
            console.log("countFollowersToAUser Error");
          }
        );
      };
      $scope.getCountFollowers();

      //count following for  my Profile
      $scope.getCountFollowing = function () {
        UserService.countFollowingToAUser().get(
          {
            "x-isis-querystring": {
              "userSubscriptionId": {
                "value": {
                  "href": ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + window.localStorage.getItem('userSubscriptionInstanceId')
                }
              }
            }
          },
          function (data) {
            $scope.numberFollowing = data.result.value;
          },
          function (error) {
            console.log("countFollowingToAUser Error");
          }
        );
      };
      $scope.getCountFollowing();

      $scope.editBiography = function (newText) {
        UserService.editTextfromUserBiography({"objectId": myUserId}).save(
          {
            "string": {
              "value": newText
            }
          }, function success(data) {
            //console.log(data);
            $scope.userBio = newText;
            window.localStorage.setItem("userBiography", newText);
          }, function (response) {
            console.log("editTextfromUserBiography error:");
          });
      };

      //Followers PAGE
      $scope.reDirectFollowersPage = function () {
        $state.go('followers', {"subscriptionInstanceId": myUserId}, {reload: true});
      };

      //Following page
      $scope.reDirectFriendsPage = function () {
        $state.go('listFriends', {"subscriptionInstanceId": myUserId}, {reload: true});
      };

      /**
       * @param description {string}
       * @return Promise {boolean}
       */
      $scope.openComposerScreen = function (description) {
        return Utils.$q(function (resolve, reject) {
          var dialog = Utils.alert.getCtrl();
          dialog.show({
            templateUrl: 'templates/partials/tags-modal.html',
            controller: 'tagsModalCtrl',
            fullscreen: true,
            locals: {description: description, dialog: dialog},
            clickOutsideToClose: false,
            multiple: true
          }).then(function (form) {
            resolve(form)
          }, function () {
            //when the modal is cancelled
            reject()
          });
        })
      }
    }])

  .controller('friendProfileCtrl', ['$scope', '$state', 'UserService', 'ApiEndPoint', 'TimeLineService', 'SequenceService', 'usersData', 'friendsData', 'followersData', 'likeUsersData', 'cqnzData', '$sce', 'ionicService', 'network', '$timeout', '$ionicHistory', 'reDirectService', 'permissionValidationService', 'AppAdminMembersService', 'Utils', 'AWSServices',
    function ($scope, $state, UserService, ApiEndPoint, TimeLineService, SequenceService, usersData, friendsData, followersData, likeUsersData, cqnzData, $sce, ionicService, network, $timeout, $ionicHistory, reDirectService, permissionValidationService, AppAdminMembersService, Utils, AWSServices) {
      var myUserId = UserService.get_USER_ID();

      $scope.iAmAdmin = UserService.USER_IS_SUPERADMIN();

      $scope.userName = null;
      $scope.newProfileImage = [];
      $scope.friend = {};

      $scope.countSequences = 0;

      $scope.togglingFollow = false;
      $scope.network = network;
      $scope.followText = Utils.translate('GLOBAL.FOLLOW');
      $scope.sendMessageText = Utils.translate('PROFILE.MESSAGE');
      //Obtener datos del usuario que se selecciono previamente Timeline/Search/notifications

      $scope.data = {};
      $scope.data.bloqued = false;
      $scope.data.unbloqued = true;

      //CODE TO REDIRECT TO LIST OF FRIENDS
      $scope.reDirectListFriends = function () {
        if ($state.params.instanceId !== undefined) {
          $state.go('listFriends', {"subscriptionInstanceId": $state.params.instanceId}, {reload: true});
        }
      };

      //CODE TO REDIRECT TO LIST OF FOLLOWERS
      $scope.reDirectFriendFollowersPage = function () {
        if ($state.params.instanceId !== undefined) {
          $state.go('followers', {"subscriptionInstanceId": $state.params.instanceId}, {reload: true});
        }
      };

      // Function to obtain the data of the friend
      $scope.initFriendProfile = function () {
        getFriendSubscription();
        countMySequences();
        countMyFollowers();
        getCountFollowing();
        findFriendInstanceId();
      };
      $scope.initFriendProfile();

      function getFriendSubscription() {
        UserService.getUserSubscriptionByinstanceId($state.params.instanceId).$promise.then(function (data) {
          $scope.profileStatus = data.members.privateAccount.value;
          if (data.members.userBio.value !== null && data.members.userBio.value !== undefined) {

            $scope.friendBio = data.members.userBio.value;
          }
          else {
            $scope.friendBio = "I love to travel";
          }
          //Request for largest profile photo
          UserService.findUserProfilePictureLargeById({
            "objectId": $state.params.instanceId
          }).get().$promise.then(function success(result) {
            //If the user doesn't have a large profile photo we use the photo in the subscription
            //This must be temporal and needs to be deprecated when all users have large photo
            if (result[0].profilePicture) {
              $scope.pictureFriendProfile = "data:image/jpeg;base64," + result[0].profilePicture.split(':')[2];
            } else {
              $scope.pictureFriendProfile = data.members.profilePicture.value !== null ? "data:image/jpeg;base64," + data.members.profilePicture.value.split(':')[2] : "img/ProfilePhoto.svg";
            }
            if (result[0].profilePictureUrl) {
              $scope.pictureFriendProfile = result[0].profilePictureUrl;
            } else {
              $scope.pictureFriendProfile = data.members.profilePictureUrl.value !== null ? +data.members.profilePictureUrl.value : "img/ProfilePhoto.svg";
            }
          }, function (response) {
            console.error("findUserProfilePictureLargeById", response);
          });


          $scope.nameFriendProfile = data.members.name.value;
          $scope.subscriptionId = data.members.userSubscriptionId.value;

          UserService.findUserSubscriptionById().get({
              "userSubscriptionId": '"' + $scope.subscriptionId + '"'
            }, function (response) {
              $scope.verifyFriendUser = response[0].verifyUser;
            }, function (error) {
              console.error("findUserSubscriptionById", error);
            }
          );
        }, function (error) {
          console.error("getUserSubscriptionByinstanceId", error);
        });
      }

      //count CQNZs for  my Profile
      function countMySequences() {
        UserService.countSequencesToAUser({"objectId": $state.params.instanceId}).get(
          {},
          function (data) {
            $scope.listCQNZ = data.result.value;
            $scope.topCQNZ = data.result.value;
          },
          function (error) {
            console.error("countSequencesToAUser: ", error);
          }
        );
      }

      //count followers for  my Profile
      function countMyFollowers() {
        UserService.countFollowersToAUser().get(
          {
            "x-isis-querystring": {
              "userId": {
                "value": {
                  "href": ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + $state.params.instanceId
                }
              }
            }
          },
          function (data) {
            $scope.numberFollowers = data.result.value;
          },
          function (error) {
            console.error("countFollowersToAUser", error);
          }
        );
      }

      //count following for  my Profile
      function getCountFollowing() {
        UserService.countFollowingToAUser().get(
          {
            "x-isis-querystring": {
              "userSubscriptionId": {
                "value": {
                  "href": ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + $state.params.instanceId
                }
              }
            }
          },
          function (data) {
            $scope.numberFollowing = data.result.value;
          },
          function (error) {
            console.error("countFollowingToAUser", error);
          }
        );
      }

      function findFriendInstanceId() {
        UserService.findFriendInstanceId({
          userId: myUserId,
          friendId: $state.params.instanceId
        }).then(function success(response) {
          if (response.result.value.length > 0) {
            $scope.friend.instanceId = response.result.value[0].href.split('/')[6]
            UserService.getFriend({
              "itemId": $scope.friend.instanceId
            }).get().$promise.then(function success(response) {
              $scope.friend.favorite = response.favorite;
            }, function (response) {
              console.log("findFriend", response);
            });
          }
        }, function (response) {
          console.log("findFriend", response);
        });
      }

      //Zone to add hashtags
      $scope.addHash = function (sequenceInfo) {
        var listHashTags = [];
        var fixHash = "";
        var pivotInsert = 0;
        var positionHashTag = 0;
        var HashtagId = 0;
        var calcEnd = 0;
        var fixedHashArray = [];
        SequenceService.getHashFromSequence(sequenceInfo.key).then(function (hashData) {
          if (hashData.length > 0) {
            hashData.length--;
            for (var a = 0; a < hashData.length; a++) {
              listHashTags.push(hashData[a].hash);
              fixedHashArray[a] = "#" + hashData[a].hash;
            }
            fixedHashArray.sort(function (a, b) {
              return b.length - a.length;
            });
            for (var b = 0; b < fixedHashArray.length; b++) {
              fixHash = fixedHashArray[b];
              if (sequenceInfo.descriptionSequence.indexOf(fixHash) != -1) {
                positionHashTag = sequenceInfo.descriptionSequence.indexOf(fixHash, pivotInsert);
                if (positionHashTag == 0) {
                  sequenceInfo.descriptionSequence = sequenceInfo.descriptionSequence.substr(0, positionHashTag) + '<span class="mentionTag" name="' + fixedHashArray[b] + '">' + fixHash + '</span>&nbsp;' + sequenceInfo.descriptionSequence.substr(positionHashTag + fixHash.length);
                  pivotInsert = pivotInsert + (positionHashTag - pivotInsert) + 31 + fixedHashArray[b].length + 2 + fixHash.length + 13;
                } else {
                  calcEnd = positionHashTag + fixHash.length;
                  if (calcEnd == sequenceInfo.descriptionSequence.length) {
                    sequenceInfo.descriptionSequence = sequenceInfo.descriptionSequence.substr(0, positionHashTag) + '<span class="mentionTag" name="' + fixedHashArray[b] + '">' + fixHash + '</span>&nbsp;' + sequenceInfo.descriptionSequence.substr(positionHashTag + fixHash.length);
                    pivotInsert = 0;
                  } else {
                    positionHashTag = sequenceInfo.descriptionSequence.indexOf(" " + fixHash + " ");
                    if (positionHashTag == -1) {
                      positionHashTag = sequenceInfo.descriptionSequence.indexOf(" " + fixHash);
                    }
                    if (positionHashTag == -1) {
                      positionHashTag = sequenceInfo.descriptionSequence.indexOf(fixHash + " ");
                      positionHashTag = positionHashTag - 1;
                    }
                    positionHashTag = positionHashTag + 1;
                    sequenceInfo.descriptionSequence = sequenceInfo.descriptionSequence.substr(0, positionHashTag) + '<span class="mentionTag" name="' + fixedHashArray[b] + '">' + fixHash + '</span>&nbsp;' + sequenceInfo.descriptionSequence.substr(positionHashTag + fixHash.length);
                  }
                }
              }
            }
          }
          sequenceInfo.hashtagIdAssociated = listHashTags;
        });
      };

      $scope.addFavorite = function () {
        if ($scope.friend.instanceId) {
          $scope.friend.favorite = $scope.friend.favorite === 0 ? 5 : 0;
          UserService.favorite({"objectId": $scope.friend.instanceId}).post({
            "int": {
              "value": $scope.friend.favorite
            }
          }).$promise.then(function success(response) {
            console.log("favorite level: ")
          }, function (response) {
            console.log("addFavorite error");
          });
        }
      };

      //function to check friend or not
      $scope.getFollowingIsActive = function () {

        UserService.getFollowingIsActive().get(
          {
            "objectId": window.localStorage.getItem('userSubscriptionInstanceId'),
            "x-isis-querystring":
              {
                "friendId":
                  {
                    "value":
                      {"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + $state.params.instanceId}
                  }
              }
          }, function (data) {
            $scope.isFriend = data.result.value;
          }, function (error) {
            $scope.isFriend = false;
            console.log("getFollowingIsActive error");
          });
      };
      $scope.getFollowingIsActive();

      //function to follow/unfollow users
      $scope.addFriends = function () {
        $scope.togglingFollow = true;
        $scope.isFriend = $scope.isFriend ? false : true;
        UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).save({
          "friendId": {
            "value": {
              "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + $state.params.instanceId
            }
          }
        }, function (response) {
          //search friend object in case we don't have it so we can add to favorites
          if (!$scope.friend.instanceId) {
            findFriendInstanceId();
          }
          //Send push notification Follower FriendProfile
          if (response.result.value) {
            UserService.getDevices($state.params.instanceId).$promise.then(function success(response) {
              console.log("devices: ");
              var tokens = [];
              var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
              var message = name + " is now following you";
              message = message.replace(/\s\s+/g, ' ');
              for (var i = 0; i < response.value.length; i++) {
                var endpointArn = response.value[i].title;
                AWSServices.sendNotification(message, endpointArn);
              }
            }, function (response) {
              console.log("UserService.addDevice error: ");
            });
          }
          $scope.togglingFollow = false;
        }, function (error) {
          console.log("addFriends error", error);
          $scope.togglingFollow = false;
        });
      };

      //check how many times the user have already logged in before show any tutorial
      /*$scope.chkTimesLogged = function () {
        userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
          transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
            if (resultSet.rows.length > 0) {
              if (resultSet.rows.item(0).count >= 3) {
                $scope.needsTutorialFavorites();
              }
            }
          })
        })
      };

      //code to show hint at new user for favorites
      $scope.needsTutorialFavorites = function () {
        userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM tutorials WHERE name = ?";
          transaction.executeSql(querySelect, ["favorites"], function (tx, resultSet) {
            var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
            if (visitedJson.second) {
              document.getElementById("sideMenuCqnz").style.visibility = "hidden";
              window.localStorage.setItem("openTutorial", true);
              var secondFav = introJs();
              secondFav.setOptions({
                steps: [
                  {
                    intro: '<p style="color:black !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.FAVORITES.SECOND.STEP1.TEXT') + '</p>',
                    position: "auto"
                  }
                ],
                nextLabel: "Next",
                prevLabel: "Back",
                doneLabel: Utils.translate('GLOBAL.GOT_IT'),
                skipLabel: "Skip",
                hidePrev: false,
                hideNext: false,
                exitOnOverlayClick: false,
                showStepNumbers: false,
                showBullets: false,
                showProgress: false,
                overlayOpacity: .6,
                scrollToElement: false,
                disableInteraction: true,
                tooltipClass: "tutorialFavoritesToolTip"
              });
              secondFav.onexit(function () {
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.second = false;
                $scope.updateBD("favorites", JSON.stringify(visitedJson));
              }).oncomplete(function () {
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.second = false;
                $scope.updateBD("favorites", JSON.stringify(visitedJson));
              }).onchange(function (step) {
                console.log("changed to", step.id);
              }).start();
            }
          })
        });
      };



      /*$timeout(function() {
          $scope.chkTimesLogged();
          //$scope.needsTutorialFavorites();
      }, 1000);*

      $scope.updateBD = function (tutorial, change) {
        userProfileData.dataBaseUser.transaction(function (transaction) {
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
        });
      }
      */


      $scope.findBlockUserById = function () {
        UserService.findBlockUserById().get({
          "x-isis-querystring":
            {
              "userSubscriptionId":
                {
                  "value":
                    {
                      "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + myUserId
                    }
                },
              "userBlockedId":
                {
                  "value":
                    {
                      "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + $state.params.instanceId
                    }
                }
            }
        }, function success(response) {
          if (response.length > 1) {
            $scope.data.bloqued = true;
            $scope.data.unbloqued = false;
          } else {
            $scope.data.bloqued = false;
            $scope.data.unbloqued = true;
          }
          Utils.loading.hide();
        }, function (response) {
          console.log("findBlockUserById error");
          Utils.loading.hide();
        });
      };

      $scope.showOptionsMenu = function () {
        var buttons = [];
        var buttonsIds = [];

        if ($scope.data.bloqued == false && $scope.data.unbloqued == true) {
          buttons.push({text: Utils.translate('GLOBAL.BLOCK_USER')});
          buttonsIds.push('GLOBAL.BLOCK_USER');
        } else if ($scope.data.bloqued == true && $scope.data.unbloqued == false) {
          buttons.push({text: Utils.translate('GLOBAL.UNBLOCK_USER')});
          buttonsIds.push('GLOBAL.UNBLOCK_USER');
        }

        if ($scope.iAmAdmin) {
          buttons.push({text: Utils.translate('MENU.ADMIN_TOOLS.TITLE') + ' <i class="icon adminToolsTitle"></i>'});
          buttonsIds.push('MENU.ADMIN_TOOLS.TITLE');
          buttons.push({text: Utils.translate('MENU.ADMIN_TOOLS.BAN_USER')});
          buttonsIds.push('MENU.ADMIN_TOOLS.BAN_USER');
          buttons.push({text: Utils.translate('MENU.ADMIN_TOOLS.BLOCK_USER')});
          buttonsIds.push('MENU.ADMIN_TOOLS.BLOCK_USER');
        }

        Utils.$ionicActionSheet.getCtrl().show({
          cssClass: 'friendProfile-actionSheet',
          buttons: buttons,
          titleText: Utils.translate('GLOBAL.GENERAL_OPTIONS'),
          buttonClicked: function (buttonIndex) {
            switch (buttonsIds[buttonIndex]) {
              case 'GLOBAL.BLOCK_USER':
                askBlockUser(true);
                break;
              case 'GLOBAL.UNBLOCK_USER':
                askBlockUser(false);
                break;
              case 'MENU.ADMIN_TOOLS.TITLE':
                return false;
              case 'MENU.ADMIN_TOOLS.BAN_USER':
                confirmBanUser();
                break;
              case 'MENU.ADMIN_TOOLS.BLOCK_USER':
                confirmLockUser();
                break;
              default:
                Utils.toast.warning("Invalid option '" + buttonsIds[buttonIndex] + "'");
            }
            return true;
          },
          destructiveText: $scope.iAmAdmin ? Utils.translate('MENU.ADMIN_TOOLS.DELETE_USER') : null,
          destructiveButtonClicked: $scope.iAmAdmin ? function () {
            confirmDeleteUser();
            return true;
          } : null
        });

        //fake group divider...
        setTimeout(function () {
          var el = document.getElementsByClassName('adminToolsTitle');
          if (el && el.length) {
            var parentEl = el[0].parentElement;

            if (Utils.isIOS()) {
              parentEl.style.fontSize = '13px';
              parentEl.style.color = '#8f8f8f';
            }
            else if (Utils.isAndroid()) {
              parentEl.style.fontSize = '14px';
              parentEl.style.color = '#666';
              parentEl.style.paddingLeft = '16px';
            }
          }
        }, 100)
      };

      function confirmBanUser() {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.BAN_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.banUser(
            $scope.subscriptionId
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.BAN_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.BAN_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      }

      function confirmLockUser() {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LOCK_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.lockUser(
            $scope.subscriptionId
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LOCK_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LOCK_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      }

      function confirmDeleteUser() {
        Utils.confirm.show(
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_CONF') +
          "<br><b>" + Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_DISCOURAGE') + "</b>"
        ).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.deleteSubscription(
            $scope.subscriptionId
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      }

      function askBlockUser(type) {
        var msg = "";
        if (type == true) {
          msg = Utils.translate('GLOBAL.ASK_USERBLOCK');
        } else {
          msg = Utils.translate('GLOBAL.ASK_USERUNBLOCK');
        }
        Utils.confirm.show(msg).then(function (boolResp) {
          if (!boolResp) return;
          if (type == true) {
            blockToUser();
          } else {
            unblockToUser();
          }

        })
      }

      function blockToUser() {
        Utils.loading.show();
        UserService.blockToUser({"objectId": myUserId}).save({
          "userSubscription":
            {
              "value":
                {
                  "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + $state.params.instanceId
                }
            }
        }).then(function (response) {
          console.log("blockToUser response");
          $scope.findBlockUserById();
        }, function (error) {
          console.log("blockToUser error");
        }).finally(function () {
          Utils.loading.hide();
        });
      }

      function unblockToUser() {
        Utils.loading.show();
        UserService.unblockUser({"objectId": myUserId}).save({
          "userSubscription":
            {
              "value":
                {
                  "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + $state.params.instanceId
                }
            }
        }).then(function () {
          $scope.findBlockUserById();
        }, function (response) {
          console.log("unblockUser error");
        }).finally(function () {
          Utils.loading.hide();
        });
      }

    }])
;
