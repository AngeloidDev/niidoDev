"use strict";
appControllers
  .controller('settingsPageCtrl', ['$scope', 'AuthService', '$ionicPopup', '$state', '$ionicHistory', '$timeout', 'UserService', '$ionicPush', '$filter', 's3', 'md5', 'AWSServices', '$ionicPlatform',
    function ($scope, AuthService, $ionicPopup, $state, $ionicHistory, $timeout, UserService, $ionicPush, $filter, s3, md5, AWSServices, $ionicPlatform) {
      //This method is going to be deprecated. when a user log in we have to save this data.
      UserService.getUserSubscriptionByinstanceId(UserService.get_USER_ID()).$promise.then(function success(response) {
        $scope.privateAccount = response.members.privateAccount.value;
      }, function (response) {
      });

      $scope.changePrivateAccount = function () {
        UserService.changePrivateAccount(
          {"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}
        ).save().$promise.then(function success(response) {
          $scope.privateAccount = response.result.members.privateAccount.value;
        }, function (response) {
        });
      };

      $scope.logOut = function () {
        var myPopup = $ionicPopup.alert({
          cssClass: 'alertPopUp',
          template: 'Logout successfully',
          okType: 'button-assertive'
        });
        myPopup.then(function () {
          facebookConnectPlugin.getLoginStatus(function (response) {
            if (response.status == 'connected') {
              facebookConnectPlugin.logout(function () {
                $scope.webUser = "";
              }, function (error) {
                console.error("facebookConnectPlugin.logout",error)
              });
            } else {
            }
          }, function (error) {
            console.error("facebookConnectPlugin.getLoginStatus",error)
          });

          var oldData = window.localStorage.getItem("EndpointArn");
          if (oldData !== null) {
            UserService.deleteDevice()
              .get({"string": oldData}).$promise.then(function success(data) {
            }, function (response) {
            });
          }
          AWSServices.deletePlatformEndpoint(1);
          //window.localStorage.clear();
          AuthService.logout();
          //$ionicPush.unregister();

          $ionicHistory.clearHistory();
          $ionicHistory.clearCache();
          window.localStorage.clear();
          window.localStorage.setItem("onboardingComplete", "yes");

          //$rootScope.$broadcast("logout.success");
          $state.go('login', {}, {reload: true});
        });
        $timeout(function () {
          myPopup.close();
        }, 500);
      };

      //check if user use FB for login to stop change password
      $scope.redirectToPassChange = function () {
        facebookConnectPlugin.getLoginStatus(function (response) {
          if (response.status == 'connected') {
            $ionicPopup.alert({
              cssClass: 'popupClass',
              title: $filter('translate')('MENU.FACEBOOK_USER_NO_PASSWORD.TITLE'),
              template: $filter('translate')('MENU.FACEBOOK_USER_NO_PASSWORD.MESSAGE'),
              okType: 'button-assertive',
              okText: $filter('translate')('GLOBAL.OK')
            });
          } else {
            $state.go('menu.updatePassword', {}, {reload: true});
          }
        }, function (error) {
        });
      };

      //Zone Delete account
      $scope.deleteAccount = function () {
        //Prepare data if needed for s3 management
        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });
        var userSubscriptionInstanceId = md5.createHash(window.localStorage.getItem("userSubscriptionInstanceId"));
        //END Prepare data if needed for s3 management
        $ionicPopup.confirm({
          cssClass: 'alertPopUp',
          title: $filter('translate')('MENU.SETTINGS.DELETE_ACCOUNT.INFO_DELETE'),
          cancelText: $filter('translate')('GLOBAL.NO'),
          okText: $filter('translate')('GLOBAL.YES'),
          okType: 'button-assertive'
        }).then(function (responseConfirm) {
          if (responseConfirm) {
            $ionicPopup.confirm({
              cssClass: 'alertPopUp',
              title: $filter('translate')('MENU.SETTINGS.DELETE_ACCOUNT.CONFIRM_DELETE'),
              cancelText: $filter('translate')('GLOBAL.NO'),
              okText: $filter('translate')('GLOBAL.YES'),
              okType: 'button-assertive'
            }).then(function (responseConfirmInside) {
              if (responseConfirmInside) {
                UserService.deleteUserComplete({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save({},
                  function (deleteUserData) {
                    facebookConnectPlugin.getLoginStatus(function (response) {
                      if (response.status == 'connected') {
                        facebookConnectPlugin.logout(function () {
                          var oldData = window.localStorage.getItem("EndpointArn");
                          if (oldData !== null) {
                            UserService.deleteDevice()
                              .get({"string": oldData}).$promise.then(function success(data) {
                            }, function (response) {
                            });
                          }
                          emptyBucket(s3Service, s3, userSubscriptionInstanceId,function(){});
                          AWSServices.deletePlatformEndpoint(1);
                          window.localStorage.clear();
                          AuthService.logout();
                          $state.go('login', {}, {reload: true});
                        });
                      } else {
                        var oldData = window.localStorage.getItem("EndpointArn");
                        if (oldData !== null) {
                          UserService.deleteDevice()
                            .get({"string": oldData}).$promise.then(function success(data) {
                          }, function (response) {
                          });
                        }
                        emptyBucket(s3Service, s3, userSubscriptionInstanceId,function(){});
                        AWSServices.deletePlatformEndpoint(1);
                        window.localStorage.clear();
                        AuthService.logout();
                        $state.go('login', {}, {reload: true});
                      }
                    });
                  }
                );
              } else {
              }
            })
          } else {
          }
        });
      };

      //function to delete all media from user before delete localstorage but after delete account info
      function emptyBucket(service, bucketData, userId, callback) {
        var params = {
          Bucket: bucketData.bucket,
          Prefix: bucketData.prefix + '/' + userId + '/'
        };

        service.listObjectsV2(params, function (err, dataList) {
          if (err) return callback(err);

          if (dataList.Contents.length == 0) return callback();

          params = {Bucket: bucketData.bucket};
          params.Delete = {Objects: []};

          dataList.Contents.forEach(function (content) {
            params.Delete.Objects.push({Key: content.Key});
          });

          service.deleteObjects(params, function (err, dataDelete) {
            if (err) return callback(err);
            if (dataDelete.Deleted.length == 1000) emptyBucket(service, bucketData, userId, callback);
            else return callback();
          });
        })
      }

      //END function to delete all media from user before delete localstorage but after delete account info
      //End Zone Delete account

      $scope.data = {};
      $scope.data.showButtonsArea = false;
      //zone to show and quit button upload zone
      $scope.showButtonArea = function () {
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


  .controller('configureMyProfileCtrl', ['$scope', '$state', 'UserService',
    function ($scope, $state, UserService) {

      //declaration
      $scope.data = {};
      $scope.advice = false;
      $scope.isFBUser = false;
      $scope.showPrivateOptions = false;
      //Order
      //name - can modify
      //email- can modify
      //biography - can modify
      //username - can't modify
      //private - can modify
      $scope.obtainData = function () {
        var userName;
        if (window.localStorage.getItem('starter_facebook_user')) {
          $scope.isFBUser = true;
          userName = "Logged by Facebook";
        } else {
          userName = window.localStorage.getItem('userName')
        }
        $scope.data.fields = [{
          isActive: false,
          value: window.localStorage.getItem('name'),
          backUp: window.localStorage.getItem('name')
        }, {
          isActive: false,
          value: window.localStorage.getItem('userEmail'),
          backUp: window.localStorage.getItem('userEmail')
        }, {
          isActive: false,
          value: window.localStorage.getItem('userBiography'),
          backUp: window.localStorage.getItem('userBiography')
        }, {
          isActive: false,
          value: userName,
          backUp: userName
        }, {
          isActive: false,
          value: false,
          backUp: false
        }];
      };
      $scope.obtainData();

      $scope.chkTypeUser = function (num) {
        if ($scope.isFBUser) {
          if (num != 1) {
            $scope.toogleActive(num);
          } else {
            $scope.advice = true;
          }
        } else {
          $scope.toogleActive(num);
        }
      }

      $scope.toogleActive = function (num) {
        if (!$scope.data.fields[num].isActive) {
          $scope.data.fields[num].isActive = true;
        } else {
          $scope.data.fields[num].isActive = false;
          $scope.data.fields[num].value = $scope.data.fields[num].backUp;
        }
      };

      $scope.checkChanges = function () {
        $scope.advice = false;
        if ($scope.data.fields[0].isActive) {
          $scope.data.fields[0].isActive = false;
          $scope.updateName();
        }
        if ($scope.data.fields[1].isActive) {
          $scope.data.fields[1].isActive = false;
          $scope.updateEmail();
        }
        if ($scope.data.fields[2].isActive) {
          $scope.data.fields[2].isActive = false;
          $scope.updateBio();
        }
      };

      $scope.updateName = function () {
        $scope.data.fields[0].backUp = $scope.data.fields[0].value;
        var tempText = $scope.data.fields[0].value.split(" ");
        var firstName = "";
        var middleName = "";
        var lastName = "";
        var lastName2 = "";
        if (tempText.length == 1) {
          firstName = $scope.data.fields[0].value;
        } else if (tempText.length == 2) {
          firstName = tempText[0];
          lastName = tempText[1];
        } else {
          firstName = tempText[0];
          for (var i = 1; i < tempText.length; i++) {
            if (i == 1) {
              lastName = tempText[i];
            }
            else {
              lastName = lastName + " " + tempText[i];
            }
          }
        }
        if (firstName.length > 20) {
          middleName = firstName.slice(21);
          firstName = firstName.slice(0, 20);
        }
        if (lastName.length > 20) {
          lastName2 = lastName.slice(21);
          lastName = lastName.slice(0, 20);
        }

        UserService.name({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).post({
          "firstName": {
            "value": firstName
          },
          "middleName": {
            "value": middleName
          },
          "lastName": {
            "value": lastName
          },
          "lastName2": {
            "value": lastName2
          }
        }).$promise.then(function success(response) {
            window.localStorage.setItem('name', $scope.data.fields[0].value);
          }, function (response) {
          }
        );
      };

      $scope.updateEmail = function () {
        $scope.data.fields[1].backUp = $scope.data.fields[1].value;
        UserService.email({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).post({
          "string": {
            "value": $scope.data.fields[1].value
          }
        }).$promise.then(function success(response) {
            window.localStorage.setItem("userEmail", $scope.data.fields[1].value);
          }, function (response) {
          }
        );
      };

      $scope.updateBio = function () {
        $scope.data.fields[2].backUp = $scope.data.fields[2].value;
        UserService.editTextfromUserBiography({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save(
          {
            "string": {
              "value": $scope.data.fields[2].value
            }
          }, function success(data) {
            window.localStorage.setItem("userBiography", $scope.data.fields[2].value);
          }, function (response) {
          })
      };

      $scope.data.showButtonsArea = false;
      //zone to show and quit button upload zone
      $scope.showButtonArea = function () {
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

  .controller('menuCtrl', ['$rootScope', '$scope', '$ionicSideMenuDelegate', 'SignUpService', 'AuthService', '$state', '$ionicHistory', '$ionicPopup', '$timeout', 'UserServiceFb', '$ionicActionSheet', 'UserService', '$ionicPlatform', '$ionicPush', '$filter', 'permissionValidationService', 'AWSServices', 'Utils',
    function ($rootScope, $scope, $ionicSideMenuDelegate, SignUpService, AuthService, $state, $ionicHistory, $ionicPopup, $timeout, UserServiceFb, $ionicActionSheet, UserService, $ionicPlatform, $ionicPush, $filter, permissionValidationService, AWSServices, Utils) {

      function configWhenLoginSuccess() {
        $scope.menuUsername = UserService.get_USER_NAME();
        $scope.menuUserPhoto = UserService.get_USER_PHOTO();
      }
      configWhenLoginSuccess();

      $rootScope.$on('login.success', function (event) {
        configWhenLoginSuccess();
        setTimeout(function () {
          $scope.$apply();
        },10);
      });

      //watches when the side menu is open
      $scope.$watch(function () {
          return $ionicSideMenuDelegate.getOpenRatio();
        },
        function (ratio) {
          if (ratio == 1) {
            $scope.menuUsername = UserService.get_USER_NAME();
            $scope.menuUserPhoto = UserService.get_USER_PHOTO();
            setTimeout(function () {
              $scope.$apply();
            },10);
          }
        });


      function configWhenRolePermissionsChange() {
        $scope.isSuperAdmin = UserService.USER_IS_SUPERADMIN();
        $scope.canShowGroupsItem = UserService.USER_IS_SUPERADMIN() || permissionValidationService.canReadOwnGroups() && permissionValidationService.canReadOthersGroups();
      }
      configWhenRolePermissionsChange();

      $rootScope.$on('rolePermissions-changed', function (event) {
        configWhenRolePermissionsChange();
      });


      $scope.typelogin = "";
      //Code to get the Facebook information from localstorage
      $scope.user = UserServiceFb.getUser();
      //console.log("data",window.localStorage.starter_facebook_user);
      $ionicPlatform.ready(function () {
        try {
          cordova.getAppVersion(function (version) {
            $scope.appVersion = version;
          });
        } catch (e) {
          console.error("Couldn't get app version");
        }

      });

      //Function to logout from server app
      $scope.logOut = function () {
        facebookConnectPlugin.getLoginStatus(function (response) {
          if (response.status == 'connected') {
            facebookConnectPlugin.logout(function () {
              $scope.webUser = "";
            }, function (error) {
              console.error("facebookConnectPlugin.logout", error)
            });
          } else {
          }
        }, function (error) {
          console.error("facebookConnectPlugin.getLoginStatus", error)
        });

        var oldData = window.localStorage.getItem("EndpointArn");

        if (oldData !== null) {
          //oldData=JSON.parse(oldData);
          UserService.deleteDevice().get({"string": oldData}).$promise.then(function success(data) {
          }, function (response) {
          });
        }
        AWSServices.deletePlatformEndpoint(1);
        //window.localStorage.clear();
        AuthService.logout();

        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        window.localStorage.clear();
        window.localStorage.setItem("onboardingComplete", "yes");
        location.reload();
        $state.go('login', {}, {reload: true});
      };

      $scope.facebookFriends = function () {
        facebookConnectPlugin.getLoginStatus(function (response) {
          if (response.status == 'connected') {
            $state.go('menu.friends', {}, {reload: true});
          } else {
            $ionicPopup.alert({
              cssClass: 'popupClass',
              title: $filter('translate')('MENU.FIND_FACEBOOK_FRIENDS.NO_FB_TITLE'),
              template: $filter('translate')('MENU.FIND_FACEBOOK_FRIENDS.NO_FB'),
              okType: 'button-assertive',
              okText: $filter('translate')('GLOBAL.OK')
            });
          }
        }, function (error) {
        });
      };

      $scope.userdecision = function () {
        var confirmPopUp = $ionicPopup.confirm({
          cssClass: 'popupClass',
          title: $filter('translate')('MENU.SETTINGS.DISABLE_ACCOUNT.DISABLE'),
          template: $filter('translate')('MENU.SETTINGS.DISABLE_ACCOUNT.TEXT'),
          cancelText: $filter('translate')('GLOBAL.CANCEL'),
          okType: 'button-assertive',
          okText: $filter('translate')('GLOBAL.OK')
        });
        confirmPopUp.then(function (res) {
          if (res) {
            facebookConnectPlugin.getLoginStatus(function (response) {
              if (response.status == 'connected') {
                $scope.cancelAccountFb();
              } else {
                $scope.cancelAccount();
              }
            });
          } else {
          }
        });
      };

      $scope.cancelAccountFb = function () {
        //console.log("Entramos a cancelar FB");
        UserService.cancelUserSubscription({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save({}, function (data) {
          $ionicPopup.alert({
            template: 'Your account has been cancelled',
            cssClass: 'alertPopUp',
            okType: 'button-assertive'
          });

          facebookConnectPlugin.logout(function () {
            var oldData = window.localStorage.getItem("EndpointArn");
            if (oldData !== null) {
              UserService.deleteDevice()
                .get({"string": oldData}).$promise.then(function success(data) {
              }, function (response) {
              });
            }
            AWSServices.deletePlatformEndpoint(1);
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            AuthService.logout();
            $state.go('login', {}, {reload: true});
          });
        }, function (error) {
        });
      };

      $scope.cancelAccount = function () {
        //console.log("Entramos a cancelar cuenta");
        UserService.cancelUserSubscription({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save({}, function (data) {
          $ionicPopup.alert({
            template: 'Your account has been cancelled',
            cssClass: 'alertPopUp',
            okType: 'button-assertive'
          });
          var oldData = window.localStorage.getItem("EndpointArn");
          if (oldData !== null) {
            UserService.deleteDevice()
              .get({"string": oldData}).$promise.then(function success(data) {
            }, function (response) {
            });
          }
          AWSServices.deletePlatformEndpoint(1);
          window.localStorage.clear();
          window.localStorage.setItem("onboardingComplete", "yes");
          AuthService.logout();

          $state.go('login', {}, {reload: true});
        }, function (error) {
        });
      };

      $scope.Appmessage = function () {
        //Link Data: Universal Object Properties
        var deepProperties = {
          canonicalIdentifier: 'menuShare'
        };
        //Init object for branch
        var branchShareApp = null;

        //Link Data: Deep Link Properties
        var analyticsDeepLink = {
          feature: "Share App",
          campaign: "none"
        };

        var propertiesDeepLink = {
          $fallback_url: "http://niido.cloud/",
          $desktop_url: "http://niido.cloud/",
          $android_url: "http://niido.cloud/",
          $ios_url: "http://niido.cloud/",
          $ipad_url: "http://niido.cloud/"
        };

        //var message = 'Check out this link';

        if (!Branch) {
          Utils.loading.hide();
          Utils.toast.error(Utils.translate("PLUGINS.BRANCH.PLUGIN_NOT_INSTALLED"));
          return;
        }

        Branch.createBranchUniversalObject(deepProperties).then(function (res) {
          branchShareApp = res;
          //branchShareApp.showShareSheet(analyticsDeepLink, propertiesDeepLink, message);
          var text = $filter('translate')('MENU.SETTINGS.SHARE_APP.MESSAGE');
          var text2 = $filter('translate')('MENU.SETTINGS.SHARE_APP.MESSAGE2');
          branchShareApp.generateShortUrl(analyticsDeepLink, propertiesDeepLink).then(function (res) {
            //alert(JSON.stringify(res.url));
            window.plugins.socialsharing.share(
              text + ' \n' + text2 + '\n',
              null,
              null,
              res.url
            );
          }).catch(function (err) {
            //alert(JSON.stringify(err));
          });

        }).catch(function (err) {
          //alert('Error: ' + JSON.stringify(err));
        });
      };
    }])

  .controller('configNotificationsCtrl', ['$scope', '$state', 'UserService',
    function ($scope, $state, UserService) {
      if (window.localStorage.getItem('pushNotificationsConfig') === null) {
        UserService.getPushNotificationsConfig(
          {
            objectId: window.localStorage.getItem('userSubscriptionInstanceId')
          }
        ).get({"x-ro-follow-links": "value"}).$promise.then(function success(response) {
          var config = [];
          for (var i = 0; i < response.result.value.length; i++) {
            config[config.length++] = {
              "instanceId": response.result.value[i].value.instanceId,
              "notificationType": response.result.value[i].value.members.notificationType.value,
              "sendNotification": response.result.value[i].value.members.sendNotification.value
            };
          }
          window.localStorage.setItem('pushNotificationsConfig', JSON.stringify(config));
          $scope.configuration = JSON.parse(window.localStorage.getItem('pushNotificationsConfig')).sort(function (a, b) {
            return a.notificationType - b.notificationType;
          });
        }, function (response) {
        });
      } else {
        $scope.configuration = JSON.parse(window.localStorage.getItem('pushNotificationsConfig')).sort(function (a, b) {
          return a.notificationType - b.notificationType;
        });
      }

      $scope.updatePushNotificationConfig = function (option) {
        UserService.updatePushNotificationConfig(
          {objectId: $scope.configuration[option].instanceId}
        ).post({
          "boolean": {
            "value": $scope.configuration[option].sendNotification
          }
        }).$promise.then(function success() {
          window.localStorage.setItem('pushNotificationsConfig', JSON.stringify($scope.configuration));
        }, function (response) {
        });
      };
    }])
;
