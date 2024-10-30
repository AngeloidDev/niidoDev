"use strict";
appControllers
  .controller('GalleryCtrl',
    function ($scope, $timeout, $ionicBackdrop, $ionicPopup, $ionicModal, $cordovaCamera, $cordovaImagePicker, $cordovaFile, $cordovaCapture, $ionicSlideBoxDelegate, $ionicScrollDelegate, $ionicPlatform, UserService, ionicService, SequenceService, ApiEndPoint, AWSServices, permissionValidationService, Utils) {

      $scope.showReactPicture = function (sequencePicture, reactPicture, index, description) {
        $scope.loadingInit = 1;
        $scope.activeSlide = index;
        var myVarPicture = $ionicPopup.show({
          scope: $scope,
          animation: 'zoom-from-center',
          templateUrl: 'templates/reactZoomView.html'
        });
        $timeout(function () {
          $scope.reactPictures = {
            "sequencePicture": sequencePicture,
            "reactPicture": reactPicture,
            "description": description
          };
        }, 200);

        $scope.myReactPicture = function () {
          $scope.reactPictures = {};
          myVarPicture.close();
        };
      };

      $scope.showImages = function (sequenceId, pictures, index, userSubscriptionInstanceId) {

        $scope.picturesItem = [];
        $scope.loadingInit = 1;
        $scope.activeSlide = index;

        console.log("pictures", pictures);
        pictures.forEach(function (picture) {
          if(!picture.itemId) return;//continues in this context

          var item = {
            src: '',
            sequenceItemId: picture.sequenceItem.href.split('/')[6],
            likeCount: picture.likeCount,
            likeActive: likeItemIsActive(picture.sequenceItem.href.split('/')[6]),
            userSubscriptionInstanceId: userSubscriptionInstanceId,
            itemId: picture.itemId,
            key: index
          };

          if (picture.url != null) {
            item.src = picture.url;
            $scope.picturesItem.push(item);
          }
          else{
            Utils.toast.error("Sorry, we couldn't find the image URL")
          }
        });

        $scope.showModal('templates/gallery-zoomview2.html');
        $scope.loadingInit = 0;
      };

      $scope.showProfileImage = function () {
        $scope.showModal('templates/Profiles/friendProfilePicture.html');
      };

      function likeItemIsActive(sequenceItem) {
        return SequenceService.findSmileysItemCount().get(
          {
            "x-isis-querystring":
              {
                "sequenceItem": {
                  "value": {
                    "href": ApiEndPoint.url + "/restful/objects/simple.SequenceItem/" + sequenceItem
                  }
                },
                "userSubs": {
                  "value": {
                    "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + window.localStorage.getItem('userSubscriptionInstanceId')
                  }
                }

              }
          }, function () {
          }, function (response) {
            console.log("findSmileysItemCount error");
          });
      }


      $scope.setLikeToItem = function (item, index) {
        if (!permissionValidationService.amISuperAdmin() && $scope.peviewTimeline) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.PERFORM_ACTION_ON_PREVIEW'));
          return;
        }

        item.likeActive.result.value = !item.likeActive.result.value;

        if (item.likeActive.result.value) {
          item.likeCount++;
          happyonItem(item.sequenceItemId);
        }
        else {
          item.likeCount--;
          happyoffItem(item.sequenceItemId);
        }

        SequenceService.setLikeToItem({"objectId": item.sequenceItemId}).save(
          {
            "userSubscription": {
              "value": {
                "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + window.localStorage.getItem('userSubscriptionInstanceId')
              }
            }
          }, function (response) {
            //Send Push Notification Like SequenceItem
            if (response.result.value && item.userSubscriptionInstanceId != window.localStorage.getItem('userSubscriptionInstanceId')) {
              UserService.getDevices(item.userSubscriptionInstanceId).$promise.then(function (response) {
                console.log("devices: ");
                var tokens = [];
                var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
                //var message = name + " liked your image";
                var message = name + " " + Utils.translate('ALERTS.LIKE_PHOTO');
                message = message.replace(/\s\s+/g, ' ');
                for (var i = 0; i < response.value.length; i++) {
                  var endpointArn = response.value[i].title;
                  AWSServices.sendNotification(message, endpointArn);
                }
              }, function (response) {
                console.log("UserService.addDevice error: ");
              });
            }
          }, function (error) {
            console.log("setLikeToItem error");
            item.likeActive.result.value = !item.likeActive.result.value;

            if (item.likeActive.result.value) {
              item.likeCount++;
              happyonItem(item.sequenceItemId);
            }
            else {
              item.likeCount--;
              happyoffItem(item.sequenceItemId);
            }
          });
      };

      $scope.ready = false;
      $scope.images = [];

      $scope.selectImages = function () {
        var options = {
          limit: 10
        };

        $cordovaCapture.captureImage(options).then(function (results) {
          for (var i = 0; i < results.length; i++) {
            $scope.images.push(results[i].fullPath);
          }
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        }, function (error) {
          console.log("captureImage error");
        });
      };

      $scope.likeMinusOrAddOneItem = function (add, likeCount) {

        if (add == -1) {
          $scope.likeCountItem = likeCount - 1;
          $scope.sequenceLikeCountItem = $scope.likeCountItem;
        }
        else {
          $scope.likeCountItem = likeCount + 1;
          $scope.likeCountAddOneItem = $scope.likeCountItem;
        }
      };

      $scope.likeCountAddOneItem = function (likeAddOne) {
        return likeAddOne;
      };

      $scope.sequenceLikeCountItem = function (likeCount) {
        return likeCount;
      };

      function happyonItem(itemId) {
        document.getElementById('happyonItem' + itemId).style.display = 'block';
        document.getElementById('happyoffItem' + itemId).style.display = 'none';
        document.getElementById('happyNumberonItem' + itemId).style.display = 'block';
        document.getElementById('happyNumberoffItem' + itemId).style.display = 'none';
        document.getElementById('happyNumberoffItem' + itemId).className = "off1";
      };

      function happyoffItem(itemId) {
        document.getElementById('happyonItem' + itemId).style.display = 'none';
        document.getElementById('happyoffItem' + itemId).style.display = 'block';
        document.getElementById('happyNumberonItem' + itemId).style.display = 'none';
        document.getElementById('happyNumberoffItem' + itemId).style.display = 'block';
        document.getElementById('happyNumberoffItem' + itemId).className = "on1";
      };

      $scope.setImagesGalery = function () {
      };

      $scope.zoomMin = 1;

      $scope.showImages2 = function () {
        $scope.showModal('templates/gallery-zoomview2.html');
      };

      $scope.showImages3 = function (index3) {
        $scope.activeSlide = index3;
        $scope.showModal('templates/gallery-zoomview3.html');
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
    })

  .controller('UserCtrl', ['$scope', '$state', '$timeout', '$ionicActionSheet', '$cordovaDevice', '$cordovaFile', '$ionicPlatform', '$ionicPopup', 'UserService', 'ApiEndPoint', 'AuthService', 'ImageService2', 'FileService2', 'usersData', 'followersData', 'friendsData', 'pendingNotificationData', '$interval', 'changeProfilePictureService', '$ionicPush', 'ionicService', 'reDirectService', '$filter', 's3', 'md5', 'Utils', 'AWSServices', 'chatService', '$rootScope',
    function ($scope, $state, $timeout, $ionicActionSheet, $cordovaDevice, $cordovaFile, $ionicPlatform, $ionicPopup, UserService, ApiEndPoint, AuthService, ImageService2, FileService2, usersData, followersData, friendsData, pendingNotificationData, $interval, changeProfilePictureService, $ionicPush, ionicService, reDirectService, $filter, s3, md5, Utils, AWSServices, chatService, $rootScope) {

      console.log("UserCtrl created!!!")

      $scope.newProfileImage = [];

      $scope.followers = {
        countFollowers: 0,
        followersName: []
      };

      $scope.friends = {
        countFriends: 0,
        friendsName: []
      };

      $scope.pictureProfile = window.localStorage.getItem("photoProfileBlob") !== null ? window.localStorage.getItem("photoProfileBlob") + '?decache=' + Math.random() : "img/ProfilePhoto.svg";
      $scope.nameProfile = window.localStorage.getItem("userName");

      $scope.$on('cloud:push:notification', function () {
        //TODO add push notification handler function
        //var msg = data.message;
        //alert(msg.title + ': ' + msg.text);
      });


      $scope.verifiedUser = function () {
        UserService.findUserSubscriptionById().get({
          "userSubscriptionId": '"' + window.localStorage.getItem("userSubscriptionId") + '"'
        }, function (response) {
          $scope.verifyUser = response[0].verifyUser;
        }, function (error) {
          console.log("findUserSubscriptionById error");
        });
      };

      $scope.addFriends = function (userSubscriptionId, isFriend) {
        console.log("isFriend");
        UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).save({
          "friendId": {
            "value": {
              "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + userSubscriptionId
            }
          }
        }, function () {
        }, function (response) {
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
          }, function (data) {
            //console.log(data);
          }, function (error) {
            console.log("getFollowingIsActive error");
          });
        return $scope.getFolliwingActive;
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
        }, function () {
          $scope.findBlockUserById(friendId);
        }, function (response) {
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
        }, function () {
          $scope.findBlockUserById(friendId);
        }, function (response) {
          console.log("unblockUser error");
        });

        return $scope.unblockUserById;
      };

      $scope.updatePassword = function (oldPassword, newPassword, retypePassword) {
        Utils.loading.show();
        var oldData = window.localStorage.getItem("EndpointArn");
        if (oldData !== null) {
          UserService.deleteDevice()
            .get({"string": oldData}).$promise.then(function (data) {
            //after delete userDevice change password
            UserService.updatePassword({objectId: window.localStorage.getItem("applicationUser").split('/')[6]}).put({
              existingPassword: {
                value: oldPassword
              },
              newPassword: {
                value: newPassword
              },
              "re-enterPassword": {
                value: retypePassword
              }
            }).$promise.then(function () {
              AWSServices.deletePlatformEndpoint(1);
              Utils.toast.success(Utils.translate('MENU.SETTINGS.UPDATE_PASSWORD.SUCCESS'));
              //window.localStorage.setItem("changePassword", false);
              AuthService.logout();
              $state.go('login', {}, {reload: true});
              //window.localStorage.clear();
            }, function (response) {
              console.log("updatePassword error");
            }).finally(function () {
              Utils.loading.hide();
            });
          }, function error(err) {
            console.log("delete Device error:", err);
            Utils.loading.hide();
          });
        }
      };

      $scope.sendEmail = function () {
        UserService.sendEmail({"objectId": window.localStorage.getItem("simpleUserId")}).save({
          "string1": {"value": "support@mycqnz.zohosupport.com"},
          "string2": {"value": "Password Update"},
          "string3": {"value": "Your password has been succesfully updated!!!"}
        }, function () {
          $ionicPopup.alert({
            //template: 'A confirmation message will be sent to your email',
            template: $filter('translate')('MENU.UPDATE_PASSWORD.CONFIRM_PASS_UPDATE'),
            cssClass: 'alertPopUp',
            okType: 'button-assertive'
          });
        }, function (response) {
          console.log("sendEmail error");
        });
      };

      $scope.sendEmailReset = function (email) {
        $scope.AuthLog($scope, AuthService, "sven", 'm<}WU6ZEFvKqks-"');
        UserService.sendEmail({"objectId": 1}).save({
          "string1": {"value": email},
          "string2": {"value": "Password Update"},
          "string3": {"value": "Your password has been succesfully updated!!!"}
        }, function () {
          $ionicPopup.alert({
            //template: 'A confirmation message will be sent to your email',
            template: $filter('translate')('MENU.UPDATE_PASSWORD.CONFIRM_PASS_UPDATE'),
            cssClass: 'alertPopUp',
            okType: 'button-assertive'
          });
          AuthService.logout();
        }, function (response) {
          console.log("sendEmail error");
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
        }, function () {
        }, function (response) {
          console.log("findBlockUserById error");
        });
      };

      $scope.sendNewPassword = function (userName, securityAnswer) {
        AuthService.login("sven", 'm<}WU6ZEFvKqks-"').then(
          function () {
            UserService.sendNewPassword().post(
              {
                "userName": {"value": userName},
                "passwordRecoveryAnswer": {"value": securityAnswer}
              }, function () {
                $ionicPopup.alert({
                  //template: 'A confirmation message will be sent to your email',
                  template: $filter('translate')('MENU.UPDATE_PASSWORD.SEND_PASSWORD_EMAIL'),
                  cssClass: 'alertPopUp',
                  okType: 'button-assertive'
                });
                AuthService.logout();
                var oldData = JSON.parse(window.localStorage.getItem("AWSToken"));
                if (oldData !== null) {
                  UserService.deleteDevice()
                    .get({"string": oldData}).$promise.then(function (data) {
                    //console.log(data);
                  }, function errro(error) {
                    console.log("deleteSequence error:");
                  });
                }
                //window.localStorage.clear();
                AWSServices.deletePlatformEndpoint(1);
                $state.go('login', {}, {reload: true});
              }, function () {
                $ionicPopup.alert({
                  //template: 'The secret answer is incorrect',
                  template: $filter('translate')('MENU.UPDATE_PASSWORD.SECRET_ANSWER_INCORRECT'),
                  cssClass: 'alertPopUp',
                  okType: 'button-assertive'
                });
                AuthService.logout();
              });
          }, function (response) {
            console.log("sendNewPassword error");
            $scope.error = "Wrong user or pass";
          }
        );
      };

      $scope.checkUserName = function (userName) {
        AuthService.login("sven", 'm<}WU6ZEFvKqks-"').then(
          function () {
            $scope.userByUsername = UserService.findUserByUserName().get(
              {"userName": userName}, function () {
                AuthService.logout();
              }, function (response) {
                console.log("findUserByUserName error");
                AuthService.logout();
              });
          }, function (response) {
            console.log("login error");
            $scope.error = "Wrong user or pass";
          }
        );
      };

      $scope.Auth = function ($scope, AuthService) {
        var username = 'sven';
        var password = 'm<}WU6ZEFvKqks-"';
        AuthService.login(username, password).then(
          function () {
            console.log("Access with sven");
            //$scope.findByWebUserId($scope);
          }, function () {
            console.log("Error login with sven");
            $scope.error = "Wrong user or pass";
          }
        );
      };

      /*$scope.showPopUpNotificationsByUserSubscription = function (){
        $state.go('menu.notifications', {}, {reload: true});
      };*/

      $scope.acceptFriend = function (friend) {
        UserService.acceptFriend({"objectId": friend.split('/')[6]}).save(
          function () {
            document.getElementById("accept").style.display = "none";
            document.getElementById("accepted").style.display = "block";
          }, function (response) {
            console.log("acceptFriend error");
          });
      };

      $scope.newProfileImage = FileService2.images();

      $scope.addMedia = function () {
        $scope.hideSheet = $ionicActionSheet.show({
          buttons: [
            {text: 'Take photo'},
            {text: 'Photo from library'}
          ],
          titleText: 'Add images',
          cancelText: 'Cancel',
          buttonClicked: function (index) {
            $scope.addImage(index);
          }
        });
      };

      $scope.addImage = function (type) {
        $scope.hideSheet();
        ImageService2.saveProfilePhoto(type).then(function () {
          $scope.newProfileImage = FileService2.images().sort(function (a, b) {
            return b.length - a.length;
          });
        });
      };

      $scope.addImageReact = function (type) {
        ImageService2.saveMedia(type, 500, 500, false).then(function () {
          $scope.$apply();
        });
      };

      $scope.uploadingPhoto = false;

      $scope.changeProfilePicture = function () {
        $scope.uploadingPhoto = true;
        var pictureName = window.localStorage.getItem("userSubscriptionInstanceId") + window.localStorage.getItem("userName");
        window.localStorage.setItem("photoProfileBlob", "nothing");
        $scope.pictureProfile = "nothing";
        //Steps to upload
        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });
        //encrypt subscriptioninstanceID and folder name
        var userSubscriptionInstanceId = md5.createHash(UserService.get_USER_ID().toString());
        var folder = md5.createHash("profilePicture");

        //create key for each picture
        var photoSmallKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'small.jpg';
        var photoNormalKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'normal.jpg';
        var photoLargeKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'large.jpg';

        //photo to blob
        var fileSmall = Utils.dataURLtoBlob($scope.newProfileImage[2]);
        var fileNormal = Utils.dataURLtoBlob($scope.newProfileImage[1]);
        var fileLarge = Utils.dataURLtoBlob($scope.newProfileImage[0]);

        //upload to s3
        //small
        s3Service.upload({
          Key: photoSmallKey,
          Body: fileSmall,
          ACL: 'public-read',
          ContentType: fileSmall.type
        }, function (err, data) {
          if (err) {
            return console.log('There was an error uploading the small jpg:');
          }
          if (data) {
            console.log('Successfully uploaded small image.');
            //normal
            s3Service.upload({
              Key: photoNormalKey,
              Body: fileNormal,
              ACL: 'public-read',
              ContentType: fileNormal.type
            }, function (err, data) {
              if (err) {
                return console.log('There was an error uploading the normal jpg:');
              }
              if (data) {
                console.log('Successfully uploaded normal image.');
                //large
                s3Service.upload({
                  Key: photoLargeKey,
                  Body: fileLarge,
                  ACL: 'public-read',
                  ContentType: fileLarge.type
                }, function (err, data) {
                  if (err) {
                    return console.log('There was an error uploading the large jpg:');
                  }
                  if (data) {
                    console.log('Successfully uploaded large image.');
                    changeProfilePictureService.changeProfPictv181(
                      {"userSubscriptionId": window.localStorage.getItem("userSubscriptionInstanceId")}
                    ).save({
                      "profilePictureSmallUrl":
                        {
                          "value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoSmallKey
                        },
                      "profilePictureMedUrl":
                        {
                          "value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoNormalKey
                        },
                      "profilePictureLargeUrl":
                        {
                          "value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoLargeKey
                        }
                    }, function succes() {
                      $scope.uploadingPhoto = false;
                      //window.localStorage.setItem("photoProfileBlob", $scope.newProfileImage[0]);
                      window.localStorage.setItem("photoProfileBlob", "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoLargeKey + '?decache=' + Math.random());
                      $scope.pictureProfile = "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoLargeKey;
                      $state.go('menu.myProfile', {}, {reload: true});
                    }, function (response) {
                      console.log("changeProfilePicture error");
                    });
                  }
                });
              }
            });
          }

        });
        //normal
        /*s3Service.upload({
            Key: photoNormalKey,
            Body: fileNormal,
            ACL: 'public-read',
            ContentType: fileNormal.type
        }, function(err, data) {
            if (err) {
                return console.log('There was an error uploading the normal jpg:');
            }
            console.log('Successfully uploaded thumb image.');
        });*/
        //large
        /*s3Service.upload({
            Key: photoLargeKey,
            Body: fileLarge,
            ACL: 'public-read',
            ContentType: fileLarge.type
        }, function(err, data) {
            if (err) {
                return console.log('There was an error uploading the large jpg:');
            }
            console.log('Successfully uploaded thumb image.');
        });*/
        //

        //upload to server
        /*changeProfilePictureService.changeProfPictv181(
                  {"userSubscriptionId": window.localStorage.getItem("userSubscriptionInstanceId")}
              ).save({
                  "profilePictureSmallUrl":
                  {
                      "value": "http://" + s3.bucket +"/"+ photoSmallKey
                  },
                  "profilePictureMedUrl":
                  {
                      "value": "http://" + s3.bucket +"/"+ photoNormalKey
                  },
                  "profilePictureLargeUrl":
                  {
                      "value": "http://" + s3.bucket +"/"+ photoLargeKey
                  }
              }, function succes(){
                  $scope.uploadingPhoto = false;
                  //window.localStorage.setItem("photoProfileBlob", $scope.newProfileImage[0]);
                  window.localStorage.setItem("photoProfileBlob", "http://" + s3.bucket +"/"+ photoLargeKey +'?decache=' + Math.random());
                  $scope.pictureProfile="http://" + s3.bucket +"/"+ photoLargeKey;
                  $state.go('menu.myProfile', {}, {reload: true});
              }, function (response){
                  console.log("changeProfilePicture error");
              });*/
      };

      /*start Function to send reaction*/
      $scope.sendingReact = false;

      $scope.sendReaction = function (reactionImage) {
        $scope.sendingReact = true;
        $state.params.sequence.reactMe(reactionImage).then(function (/*alwaysTrue*/) {
          $scope.newProfileImage = [];
          FileService2.cleanImages();
          $state.go('menu.timeline', {prepareStatement: 0}, {reload: true});
        }, function (error) {

        }).finally(function () {
          $scope.sendingReact = false;
        });
      };
      /*End Function to send reaction*/

      // code to send user to selected profile
      $scope.sendUserProfile = function (userChosen) {
        reDirectService.reDirectProfile(userChosen.userSubscriptionId);
      };

      //redirect simple to timeline
      $scope.redirectTimeLine = function () {
        $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
      };

      //codigo para redirigir ha followers
      $scope.reDirectFollowersPage = function () {
        followersData.anadir(window.localStorage.getItem("userSubscriptionInstanceId"));
        $state.go('followers', {}, {reload: true});
      };

      //CODE TO REDIRECT TO LIST OF FRIENDS
      $scope.reDirectFriendsPage = function () {
        friendsData.anadir(window.localStorage.getItem("userSubscriptionInstanceId"));
        $state.go('listFriends', {}, {reload: true});
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

      $scope.findIfHadPendingMessages = function () {
        var userInstanceId = window.localStorage.getItem("userSubscriptionInstanceId");
        $scope.noMsgs = chatService.chkHowManyPendingMsgWS().get({
          "x-isis-querystring":
            {
              "userSubscriptionRec":
                {
                  "value":
                    {
                      "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + userInstanceId
                    }
                }
            }
        }, function (data) {
          console.log("got cantity");
          if (data.result.value > 99) {
            data.result.value = "+99";
          }
        }, function (error) {

        });
      };

      $scope.showInbox = function () {
        $state.go('menu.messagesInbox', {}, {reload: true});
      };
    }])

  .controller('networkCtrl', ['$scope', '$rootScope', '$cordovaNetwork', 'network', '$translate',
    function ($scope, $rootScope, $cordovaNetwork, network, $translate) {

      $scope.internet = network;

      $scope.checkConnection = function () {
        document.addEventListener("deviceready", function () {
          var isOnline = $cordovaNetwork.isOnline();
          //console.log(isOnline);
          if (isOnline === false) {
            network.status = 'none';
          }
          else {
            network.status = $cordovaNetwork.getNetwork();
          }

          // listen when the internet comeback
          $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
            network.status = networkState;
          });

          // listen when the internet go out
          $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
            network.status = networkState;
          });

        }, false);
      };

      $scope.checkConnection();
    }])
;
