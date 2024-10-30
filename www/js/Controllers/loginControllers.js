"use strict";
appControllers

  .controller('loginCtrl', ['$rootScope', '$scope', '$state', '$ionicPopup', 'AuthService', 'SignUpService', 'SignInService', 'AddSubscriptionService', '$timeout', 'changeProfilePictureService', 'FindUserSubscriptionbyWebUser', '$q', 'UserServiceFb', 'UserService', '$ionicPush', 'DBServices', 's3', 'md5', 'ApiEndPoint', 'AppAdminRolesService', 'Utils', 'AWSServices', '$ionicPlatform',
    function ($rootScope, $scope, $state, $ionicPopup, AuthService, SignUpService, SignInService, AddSubscriptionService, $timeout, changeProfilePictureService, FindUserSubscriptionbyWebUser, $q, UserServiceFb, UserService, $ionicPush, DBServices, s3, md5, ApiEndPoint, AppAdminRolesService, Utils, AWSServices, $ionicPlatform) {
      $scope.data = {};
      $scope.pictures = [];
      $scope.images = [];
      $scope.checkTerms = false;
      //scope to show button skip
      $scope.skip = true;
      //asign error message to ""
      $scope.ErrorMessage = '';
      //code to change the value of button
      $scope.chkFinish = function (index) {
        $scope.skip = index != 6;
      };

      if(window.localStorage.getItem('onboardingComplete')){
        //Check this function is repeated in app.js and seems that is not used but if it is removed the login view shows and the user needs to log in again
        if (window.localStorage.getItem('userSubscriptionHref')) {
          /*console.log(window.localStorage.getItem('userSubscriptionInstanceId'));
            return;*/

          // get user subscription data
          // Verify if has Active status
          //1.- get user role id from localStorage and compare it with the obtained in the subscription data
          //2.- if they are different set userRoleId in localstorage
          //3.- get role permissions
          //4.- get & set last role modification date
          //5.- set permissions in memory (user object)
          //6.- redirect
          Utils.loading.show();
          /*UserService.getUserSubscriptionByinstanceId().get({
            userInstanceId: window.localStorage.getItem('userSubscriptionInstanceId')
          })*/
          UserService.findUserSubscriptionv157().get({
            "x-isis-querystring": {
              'userSubscription': {
                'value':{
                  'href': ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + window.localStorage.getItem('userSubscriptionInstanceId')
                }
              }
            }
          }).$promise.then(function (response) {
            //console.log("getUserSubscriptionByinstanceId",response);
            if (response[0].role) {

              var accountStatus = response[0].accountStatus;
              //console.log(accountStatus);

              if (accountStatus === "Canceled") {
                Utils.loading.hide();
                $scope.userCanceled();
                return;
              }
              else if (accountStatus === "Banned") {
                Utils.loading.hide();
                Utils.alert.show(Utils.translate('LOGIN.USER_BANNED_MSG'));
                return;
              }
              else if (accountStatus === "Blocked") {
                Utils.loading.hide();
                Utils.alert.show(Utils.translate('LOGIN.USER_BLOCKED_MSG'));
                return;
              }

              if (accountStatus !== "Active") {
                Utils.loading.hide();
                Utils.alert.show(Utils.translate("LOGIN.UNKNOWN_ACCOUNT_STATUS"));
                return;
              }

              //Function to register ionic token when a user has logged in
              if (window.localStorage.getItem('AWSToken') && (window.localStorage.getItem('AWSToken') != '(null)')) {
                AWSServices.awsInit();
              } else {
                $ionicPlatform.ready(function () {
                  var isIOS = ionic.Platform.isIOS();
                  if (isIOS === true) {
                    if (window.ApnsToken) {
                      ApnsToken.getToken(function (token) {
                        window.localStorage.setItem('AWSToken', token);
                        if (typeof FCMPlugin != 'undefined') {
                          AWSServices.awsInit();
                        }
                      }, function (error) {
                        console.error("can't get ios token", error);
                      })
                    }
                  } else {
                    if (typeof FCMPlugin != 'undefined') {
                      FCMPlugin.getToken(function (token) {
                        window.localStorage.setItem('AWSToken', token);
                        AWSServices.awsInit();
                      }, function (response) {
                        console.error("couldn't get FCM token because: ", response);
                      })
                    }
                  }
                })
              }

              //Load push configuration if needed
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
                }, function (response) {
                  console.error("UserService.addDevice error: ", response);
                });
              }

              var newRoleId = Utils.getLastUrlComponent(response[0].role.href);
              if (!newRoleId) newRoleId = 2;//<--regular user
              var currentRoleId = window.localStorage.getItem('userRoleId');

              if (currentRoleId !== newRoleId) {
                window.localStorage.setItem('userRoleId', newRoleId);
                //console.log("--- New role detected");
              }

              getRolePermissionAndSetUserData(+newRoleId).then(function (boolResp) {
                $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
                setTimeout(function () {
                  $rootScope.$broadcast('login.success');
                }, 1000);
              }, function (error) {
                console.error("getRolePermissions", error);
                window.localStorage.clear();
                window.localStorage.setItem("onboardingComplete", "yes");
                Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
                  location.reload();
                })
              }).finally(function () {
                Utils.loading.hide();
              })
            }
            else {
              Utils.loading.hide();
              console.error("No role attribute found");
              window.localStorage.clear();
              window.localStorage.setItem("onboardingComplete", "yes");
              Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
                location.reload();
              })
            }
          }, function (error) {
            console.error("findUserSubscriptionv157", error);
            Utils.loading.hide();
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
              location.reload();
            })
          });
        }
      } else {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/partials/onBoarding.html',
          controller: 'onBoardingCtrl',
          locals: {dialog: dialog},
          clickOutsideToClose: false,
          fullscreen: true // Only for -xs, -sm breakpoints.
        }).then(function (resp) {
          $scope.data.sequenceName = resp.description;
          $scope.data.mentionsList = resp.savedTags;
          $scope.data.hashList = resp.savedHashes;
        });
      }



      // Code use for the Log in
      $scope.login = function () {
        var username = $scope.data.userName.toUpperCase();
        var password = $scope.data.password;

        $scope.ErrorMessage = '';

        Utils.loading.show(Utils.translate('LOGIN.LOGGING_IN'));
        AuthService.login(username, password).then(
          function () {
            $scope.data = {};
            $scope.error = undefined;
            $scope.userName = username;
            $scope.findSubscription($scope);
          }, function (err) {
            Utils.loading.hide();
            Utils.alert.show(err);
            console.error("Error login", err);
            $scope.data.password = "";
          });
      };

      $scope.findSubscription = function ($scope) {
        UserService.findUserSubscriptionByUserName().get({
          'userName': $scope.userName
        }, function (response) {
          console.log("findUserSubscriptionByUserName",response);

          if (response[0].accountStatus == "Canceled") {
            AuthService.logout();
            Utils.loading.hide();
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            $scope.userCanceled($scope);
          }
          else if (response[0].accountStatus == "Banned") {
            Utils.loading.hide();
            Utils.alert.show(Utils.translate('LOGIN.USER_BANNED_MSG'));
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            AuthService.logout();
          }
          else if (response[0].accountStatus == "Blocked") {
            Utils.loading.hide();
            Utils.alert.show(Utils.translate('LOGIN.USER_BLOCKED_MSG'));
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            AuthService.logout();
          }
          else if (response[0].accountStatus !== "Active") {
            Utils.loading.hide();
            Utils.alert.show(Utils.translate("LOGIN.UNKNOWN_ACCOUNT_STATUS"));
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            AuthService.logout();
          }
          else {
            if (response[0].name) {
              window.localStorage.setItem("name", response[0].name);
              window.localStorage.setItem("userName", $scope.userName);
              window.localStorage.setItem("simpleUserInstanceId", response[0].user.href.split('/')[6]);
              window.localStorage.setItem("userSubscriptionInstanceId", response[0].userSubscription.href.split('/')[6]);
              window.localStorage.setItem("userSubscriptionHref", response[0].userSubscription.href);
              window.localStorage.setItem("userSubscriptionId", response[0].userSubscriptionId);
              window.localStorage.setItem("userBiography", response[0].userBio);

              //Request for largest profile photo
              UserService.findUserProfilePictureLargeById({
                "objectId": response[0].userSubscription.href.split('/')[6]
              }).get().$promise.then(function success(result) {
                //If the user doesn't have a large profile photo we use the photo in the subscription
                //This must be temporal and needs to be deprecated when all users have large photo
                if (result[0].profilePicture) {
                  if (result[0].profilePicture !== null) {
                    window.localStorage.setItem("photoProfileBlob", 'data:image/jpeg;base64,' + result[0].profilePicture.split(':')[2]);
                  }
                } else {
                  if (response[0].profilePicture !== null) {
                    window.localStorage.setItem("photoProfileBlob", 'data:image/jpeg;base64,' + response[0].profilePicture.split(':')[2]);
                  }
                }
                if (result[0].profilePictureUrl) {
                  if (result[0].profilePictureUrl !== null) {
                    window.localStorage.setItem("photoProfileBlob", result[0].profilePictureUrl);
                  }
                } else {
                  if (response[0].profilePictureUrl !== null) {
                    window.localStorage.setItem("photoProfileBlob", response[0].profilePictureUrl);
                  }
                }
              }, function (error) {
                console.error("Error findUserProfilePictureLargeById", error);
              });

              var newRoleId = Utils.getLastUrlComponent(response[0].role.href);
              if (!newRoleId) newRoleId = 2;//<--regular user
              var currentRoleId = window.localStorage.getItem('userRoleId');

              if (currentRoleId !== newRoleId) {
                window.localStorage.setItem('userRoleId', newRoleId);
                //console.log("New role detected");
              }

              getRolePermissionAndSetUserData(+Utils.getLastUrlComponent(response[0].role.href)).then(function (boolResp) {
                $scope.finduser($scope);
              }, function (error) {
                //$scope.finduser($scope);
                console.error("getRolePermissions", error);
                Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
                  location.reload();
                })
                window.localStorage.clear();
                window.localStorage.setItem("onboardingComplete", "yes");
              })
            } else {
              $scope.showErrorAndClean($scope, Utils.translate('LOGIN.USER_DELETED'), 0, 1);
            }
          }
        }, function (error) {
          window.localStorage.clear();
          window.localStorage.setItem("onboardingComplete", "yes");
          AuthService.logout();
          Utils.loading.hide();
          console.error("Error findUserSubscriptionByUserName", error);
          Utils.alert.show("Your username or password is incorrect");
        });
      };

      $scope.finduser = function ($scope) {
        UserService.findUserByUserName().get({
          'userName': $scope.userName
        }, function (response) {
          //console.log("findUserByUserName",response);
          window.localStorage.setItem("applicationUser", response[0].applicationUser.href);
          window.localStorage.setItem("simpleUserId", response[0].userId);
          window.localStorage.setItem("userEmail", response[0].email);

          $scope.reDirect($scope);
        }, function (error) {
          console.error("Error findUserByUserName", error);
        });
      };

      $scope.reDirect = function () {
        Utils.loading.hide();

        //function needed to prepare aws notification
        if (window.localStorage.getItem('AWSToken') && (window.localStorage.getItem('AWSToken') != '(null)')) {
          AWSServices.awsInit();
        } else {
          $ionicPlatform.ready(function () {
            var isIOS = ionic.Platform.isIOS();
            if (isIOS === true) {
              if (window.ApnsToken) {
                ApnsToken.getToken(function (token) {
                  window.localStorage.setItem('AWSToken', token);
                  if (typeof FCMPlugin != 'undefined') {
                    AWSServices.awsInit();
                  }
                }, function (error) {
                  console.error("can't get ios token", error);
                })
              }
            } else {
              if (typeof FCMPlugin != 'undefined') {
                FCMPlugin.getToken(function (token) {
                  window.localStorage.setItem('AWSToken', token);
                  AWSServices.awsInit();
                }, function (response) {
                  console.error("couldn't get FCM token because: ", response);
                })
              }
            }
          })
        }

        if (window.localStorage.getItem("changePassword")) {
          $state.go('menu.updatePassword', {}, {reload: true});
          Utils.alert.show(Utils.translate('MENU.SETTINGS.UPDATE_PASSWORD.RECOMMEND'));
        } else {
          //Check if the user still have their logged count stored in the device
          DBServices.execute(
            "SELECT * FROM userLogCount WHERE name = ?",
            [window.localStorage.getItem("name")]
          ).then(function (resultSet) {
            if (resultSet.rows.length > 0) {
              //Check if user still have tutorial data stored
              DBServices.execute("SELECT * FROM tutorials").then(function (resultSetTwo) {
                if (resultSetTwo.rows.length > 0) {
                  //redirect timeline
                  $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
                  setTimeout(function () {
                    $rootScope.$broadcast('login.success');
                  }, 1000);
                } else {
                  //send populate tutorials
                  $scope.setDefaultsDataBase(1, 1);
                }
              }, function (error) {
                console.error('Execute SELECT tutorials error out', error);
              })
            } else {
              //send populate log count table
              $scope.setDefaultsDataBase(2, 1);
            }
          }, function (error) {
            console.error('Execute SELECT logCount error in', error);
            $scope.setDefaultsDataBase(4, 1);
          });

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
            transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
              //console.log(name + " insertId: " + resultSet.insertId);
              //console.log(name + " rowsAffected: " + resultSet.rowsAffected);
              if (resultSet.rows.length > 0) {
                //Check if user still have tutorial data stored
                var querySecond = "SELECT * FROM tutorials";
                transaction.executeSql(querySecond, [], function (tx, resultSetTwo) {
                  if (resultSetTwo.rows.length > 0) {
                    //redirect timeline
                    $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
                    setTimeout(function () {
                      $rootScope.$broadcast('login.success');
                    }, 1000);
                  } else {
                    //send populate tutorials
                    $scope.setDefaultsDataBase(1, 1);
                  }
                }, function (error) {
                  console.error('Execute SELECT tutorials error out', error);
                });
              } else {
                //send populate log count table
                $scope.setDefaultsDataBase(2, 1);
              }
            }, function (tx, error) {
              console.error('Execute SELECT logCount error in', error);
              $scope.setDefaultsDataBase(4, 1);
            })
          }, function (error) {
            console.error('Transaction SELECT logCount error out', error);
            $scope.setDefaultsDataBase(4, 1);
          });*/
        }
      };

      /*
      // END Code use for the Log in
      */


      /**
       * @param roleId {number}
       * @returns {Promise}
       */
      function getRolePermissionAndSetUserData(roleId) {
        return Utils.$q(function (resolve, reject) {
          AppAdminRolesService.getRolePermissions(roleId).then(function (resources) {
            //console.log("Permissions",resources);

            if (resources.length && !resources[resources.length - 1].codeName)
              resources.splice(resources.length - 1, 1);

            /**@type {string[]}*/
            var PERMISSIONS = [];
            resources.forEach(function (permission) {
              PERMISSIONS.push(permission.codeName);
            });

            //console.log("PERMISSIONS",PERMISSIONS);
            UserService.set_USER_PERMISSIONS(PERMISSIONS);

            resolve(true)
          }, function (error) {
            console.error("getRolePermissions", error);
            reject(error)
          })
        })
      }

      /*
      // Code use for the Facebook Log in
      */
      // This is the success callback from the login method
      var fbLoginSuccess = function (response) {
        //console.log("***fbLoginSuccess()")
        if (!response.authResponse) {
          fbLoginError("Cannot find the authResponse");
          return;
        }
        var authResponse = response.authResponse;
        getFacebookProfileInfo(authResponse)
          .then(function (profileInfo) {
            //console.log("***getFacebookProfileInfo()")
            // For the purpose of this example I will store user data on local storage
            UserServiceFb.setUser({
              authResponse: authResponse,
              userID: profileInfo.id,
              name: profileInfo.name,
              firstName: profileInfo.first_name,
              lastName: profileInfo.last_name,
              userWebLink: profileInfo.link,
              email: profileInfo.email,
              birthday: profileInfo.birthday,
              appFriends: profileInfo.friends,
              pictureSmall: "https://graph.facebook.com/" + authResponse.userID + "/picture?type=small",
              pictureNormal: "https://graph.facebook.com/" + authResponse.userID + "/picture?type=normal",
              pictureLarge: "https://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
            });
            $scope.verifyAge($scope);
          }, function (fail) {
            $scope.showErrorAndClean($scope, Utils.translate('LOGIN.FACEBOOK_ERR01'), 1, 0);
            console.error('profile info fail', fail);
          });
      };

      // This is the fail callback from the login method
      var fbLoginError = function (error) {
        //console.log('fbLoginError');
        $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR02'), 1, 0);
      };

      // This method is to get the user profile info from the facebook api
      var getFacebookProfileInfo = function (authResponse) {
        var info = $q.defer();
        /*facebookConnectPlugin.api('/me?fields=id,email,name,first_name,last_name,friends,location,about,birthday,hometown&access_token=' + authResponse.accessToken, null,*/
        facebookConnectPlugin.api('/me?fields=id,email,name,first_name,last_name,birthday,friends&access_token=' + authResponse.accessToken, null,
          function (response) {
            info.resolve(response);
          },
          function (response) {
            info.reject(response);
          }
        );
        return info.promise;
      };

      //This method is executed when the user press the "Login with facebook" button
      $scope.facebookSignIn = function () {
        $scope.ErrorMessage = '';
        Utils.loading.show(Utils.translate('LOGIN.LOGGING_IN'));
        facebookConnectPlugin.getLoginStatus(function (response) {
          if (response.status == 'connected') {
            // The user is logged in and has authenticated your app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed request, and the time the access token
            // and signed request each expire
            // Check if we have our user saved
            var user = UserServiceFb.getUser('facebook');
            if (!user.userID) {
              getFacebookProfileInfo(response.authResponse)
                .then(function (profileInfo) {
                  //store user data on local storage
                  UserServiceFb.setUser({
                    authResponse: response.authResponse,
                    userID: profileInfo.id,
                    name: profileInfo.name,
                    firstName: profileInfo.first_name,
                    lastName: profileInfo.last_name,
                    userWebLink: profileInfo.link,
                    email: profileInfo.email,
                    birthday: profileInfo.birthday,
                    appFriends: profileInfo.friends,
                    pictureSmall: "https://graph.facebook.com/" + response.authResponse.userID + "/picture?type=small",
                    pictureNormal: "https://graph.facebook.com/" + response.authResponse.userID + "/picture?type=normal",
                    pictureLarge: "https://graph.facebook.com/" + response.authResponse.userID + "/picture?type=large"
                  });
                  //Se obtienen datos del usuario de Fb
                  $scope.Auth($scope, AuthService);

                }, function (fail) {
                  // Fail get profile info
                  $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR01'), 0, 0);
                  console.error('profile info fail', fail);
                });
            } else {
              //Se tienen ya los datos de usuario de Fb
              $scope.verifyAge($scope);
            }
          } else {
            // If (response.status === 'not_authorized') the user is logged in to Facebook,
            // but has not authenticated your app
            // Else the person is not logged into Facebook,
            // so we're not sure if they are logged into this app or not.
            // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
            facebookConnectPlugin.login(['public_profile', 'email', 'user_friends', 'user_birthday'], fbLoginSuccess, fbLoginError);
          }
        });
      };

      $scope.verifyAge = function ($scope) {
        //console.log("***verifyAge()")
        $scope.userFb = UserServiceFb.getUser();
        var userFbBirth = $scope.userFb.birthday;

        if (userFbBirth !== null && userFbBirth !== undefined) {
          var userMonth = userFbBirth.split('/')[0];
          var userDay = userFbBirth.split('/')[1];
          var userYear = userFbBirth.split('/')[2];
          var currentTime = new Date();
          var todayMonth = currentTime.getMonth();
          var todayYear = currentTime.getFullYear();
          var todayDay = currentTime.getDate();
          var userAge = todayYear - userYear;

          if (todayMonth < userMonth - 1) {
            userAge--;
          }
          if (userMonth - 1 == todayMonth && todayDay < userDay) {
            userAge--;
          }
          if (userAge <= "13") {
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_AGE_ERR'), 1, 0);
          }
          else {
            $scope.realAge = userAge;
          }
        }
        else {
          $scope.realAge = "0";
        }
        $scope.Auth($scope, AuthService);
      };

      // function to make the Authorization to check if the user has an account in CQNZ
      $scope.Auth = function ($scope, AuthService) {
        //console.log("***Auth()")
        var username = 'sven';
        var password = 'm<}WU6ZEFvKqks-"';
        AuthService.login(username, password).then(
          function success() {
            //console.log("***AuthService.login()")
            $scope.findByWebUserId($scope);
          }, function (error) {
            console.error("Error login with sven", error);
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR03'), 1, 0);
          }
        );
      };

      //function to check if the facebook user have an account or needs to create one
      $scope.findByWebUserId = function ($scope) {
        //console.log("***findByWebUserId()")
        //var idTempo = "\"RealFakeAccount\""
        var userFace = UserServiceFb.getUser('facebook');
        //SignInService.findByWebUserId().get({"webUserid": idTempo}, function (data){
        SignInService.findByWebUserId().get({"webUserid": userFace.userID}, function (data) {
          //console.log("***SignInService.findByWebUserId()")
          if (data.length > 0) {
            window.localStorage.setItem("simpleUserInstanceId", data[0].userId.href.split('/')[6]);
            window.localStorage.setItem("userNameWeb", data[0].userName);

            AuthService.logout();
            //Usuario ya existente procede a logeo
            $scope.AuthLog($scope, AuthService, data[0].userName, userFace.userID, '1');
          }
          else {
            //Usuario nuevo, se verifican datos
            $scope.terms();
          }
        }, function (err) {
          $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR04'), 1, 1);
          console.error('Error tipo findByWebUserId', err);
        });
      };

      //Se detiene el proceso de signup via Facebook para mostrar terminos y condiciones
      $scope.terms = function () {
        Utils.loading.hide();
        $scope.checkTerms = true;
      };

      //En caso de que el usuario de click en cancel cuando se muestren terminos y condiciones
      $scope.cancelTerms = function () {
        AuthService.logout();
        $scope.checkTerms = false;
      };

      //Al dar click en continuar se reanuda el proceso de pedir datos y sign up
      $scope.askAge = function () {
        $scope.checkTerms = false;
        var userData = UserServiceFb.getUser('facebook');
        Utils.loading.show(Utils.translate('LOGIN.LOGGING_IN'));
        if ($scope.realAge === 0) {
          var myPopup = $ionicPopup.prompt({
            title: Utils.translate('LOGIN.ASKAGE_TITLE'),
            template: Utils.translate('LOGIN.ASKAGE_TEMPLATE'),
            inputType: 'number',
            inputPlaceholder: Utils.translate('LOGIN.ASKAGE_PLACEHOLDER')
          });
          myPopup.then(function (res) {
            if (res <= "13") {
              $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_AGE_ERR'), 1, 1);
            } else {
              $scope.askFirstName($scope, userData);
            }
          });
        } else {
          $scope.askFirstName($scope, userData);
        }
      };

      $scope.askFirstName = function ($scope, userData) {
        var userFbFirstName = userData.firstName;
        if (userFbFirstName == null && userFbFirstName == undefined) {
          var myPopup = $ionicPopup.prompt({
            title: Utils.translate('LOGIN.ASKFIRSTNAME_TITLE'),
            template: Utils.translate('LOGIN.ASKFIRSTNAME_TEMPLATE'),
            inputType: 'text',
            inputPlaceholder: Utils.translate('LOGIN.ASKFIRSTNAME_PLACEHOLDER')
          });
          myPopup.then(function (res) {
            userData.firstName = res;
            $scope.askLastName($scope, userData);
          });
        }
        else {
          $scope.askLastName($scope, userData);
        }
      };

      $scope.askLastName = function ($scope, userData) {
        var userFblastName = userData.lastName;
        if (userFblastName == null && userFblastName == undefined) {
          var myPopup = $ionicPopup.prompt({
            title: Utils.translate('LOGIN.ASKLASTNAME_TITLE'),
            template: Utils.translate('LOGIN.ASKLASTNAME_TEMPLATE'),
            inputType: 'text',
            inputPlaceholder: Utils.translate('LOGIN.ASKLASTNAME_PLACEHOLDER')
          });
          myPopup.then(function (res) {
            userData.lastName = res;
            $scope.askEmail($scope, userData);
          });
        }
        else {
          $scope.askEmail($scope, userData);
        }
      };

      $scope.askEmail = function ($scope, userData) {
        var userFbEmail = userData.email;
        if (userFbEmail == null && userFbEmail == undefined) {
          var myPopup = $ionicPopup.prompt({
            title: Utils.translate('LOGIN.ASKEMAIL_TITLE'),
            template: Utils.translate('LOGIN.ASKEMAIL_TEMPLATE'),
            inputType: 'email',
            inputPlaceholder: Utils.translate('LOGIN.ASKEMAIL_PLACEHOLDER')
          });
          myPopup.then(function (res) {
            userData.Email = res;
            window.localStorage.setItem("userEmail", res);
            //$scope.addusersignup($scope,userData);
            $scope.verifyEmailExists($scope, userData);
          });
        } else {
          window.localStorage.setItem("userEmail", userData.email);
          //$scope.addusersignup($scope,userData);
          $scope.verifyEmailExists($scope, userData);
        }
      };

      //zone to check if the email is already in use
      $scope.verifyEmailExists = function ($scope, userData) {
        UserService.validateUserEmail().get({
          'email': userData.email
        }, function (response) {
          if (response.length > 1) {
            Utils.alert.show(Utils.translate('LOGIN.EMAIL_USED')).then(function (res) {
              $scope.showErrorAndClean($scope, Utils.translate('LOGIN.EMAIL_USED'), 1, 1);
            });
          } else {
            $scope.addusersignup($scope, userData);
          }
        }, function (error) {
          $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR04'), 1, 1);
          console.error('Error tipo verifyEmailExists', error);
        })
      };
      //end zone to check if the email is already in use

      //function to call the webservice to sign up to server
      $scope.addusersignup = function ($scope, userData) {
        var nombre = [];
        var apellido = [];
        if (userData.firstName.split(' ').length > 1) {
          nombre = userData.firstName.split(' ');
        }
        else {
          nombre.push(userData.firstName, ' ');
        }
        if (userData.lastName.split(' ').length > 1) {
          apellido = userData.lastName.split(' ');
        }
        else {
          apellido.push(userData.lastName, ' ');
        }

        SignUpService.addUserSignUp().save(
          {
            "firstName": {
              "value": nombre[0]
              //"value": "FakeFirstName07"
            },
            "middleName": {
              "value": nombre[1]
              //"value": "FakeMiddleName07"
            },
            "lastName": {
              "value": apellido[0]
              //"value": "FakeLastName07"
            },
            "lastName2": {
              "value": apellido[1]
              //"value": "FakeLastNameTwo07"
            },
            "webUser": {
              "value": userData.userID
              //"value": "FakeWebUser07"
            },
            "webUserType": {
              "value": "Facebook"
            },
            "username": {
              //"value": userData.userID + "06"
              "value": userData.userID
            },
            "password": {
              "value": userData.userID
            },
            "passwordRepeat": {
              "value": userData.userID
            },
            "email": {
              "value": userData.email
              //"value": "fakeEmail07@hotmail.com"
            },
            "passwordRecoveryQuestion": {
              "value": "¿Access with Facebook?"
            },
            "passwordRecoveryAnswer": {
              "value": "Yes"
              //"value": "fakeAnswer"
            }
          }, function (response) {
            $scope.simpleuserinstId = response.result.instanceId;
            $scope.simpleuserId = response.result.members.userId.value;
            window.localStorage.setItem("name", userData.name);
            window.localStorage.setItem("applicationUser", response.result.members.applicationUser.value.href);
            window.localStorage.setItem("userName", userData.name);
            window.localStorage.setItem("userNameWeb", userData.userID);
            $scope.AddSubscription(response.result.links[0].href, userData.userID, userData.userID);
            $scope.webUser = "";
          }, function (err) {
            console.error('Error tipo addUserSignUp', err);
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR03'), 1, 1);
          });
      };

      //function to add subscription to the new login profile
      $scope.AddSubscription = function (userRef, username, password) {
        AddSubscriptionService.addSubscription().save(
          {
            "user":
              {
                "value":
                  {
                    "href": userRef
                  }
              }
          }, function success(response) {
            $scope.usersubsid = response.result.title.substr(response.result.title.lastIndexOf("-") + 1).replace(",", "");
            $scope.usersubinstid = response.result.instanceId;
            $scope.useGetName = response.result.members.name.value;
            if (response.result.members.userBio.value !== null) {
              $scope.userBio = response.result.members.userBio.value;
            }
            else {
              $scope.userBio = Utils.translate('GLOBAL.BIOGRAPHY');
            }
            AuthService.logout();
            $scope.AuthLog($scope, AuthService, username, password, '0');
          }, function () {
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR03'), 1, 1);
          });
      };

      //function to login with the user-isis associated with facebook profile
      $scope.AuthLog = function ($scope, AuthService, username, password, news) {
        //console.log("***AuthLog()")
        AuthService.login(username, password).then(
          function success() {
            //console.log("***AuthService.login()")
            if (news == '1') {
              //console.log("***news == 1")
              $scope.FindUserSubs($scope);
            }
            else {
              window.localStorage.setItem("simpleUserId", $scope.simpleuserId);
              window.localStorage.setItem("simpleUserInstanceId", $scope.simpleuserinstId);
              window.localStorage.setItem("userSubscriptionId", $scope.usersubsid);
              window.localStorage.setItem("userSubscriptionHref", ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + $scope.simpleuserId);
              window.localStorage.setItem("userSubscriptionInstanceId", $scope.usersubinstid);
              window.localStorage.setItem("userName", $scope.useGetName);
              window.localStorage.setItem("userBiography", $scope.userBio);
              $scope.BlobPhoto($scope);
            }
          }, function () {
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR03'), 1, 1);
            $scope.error = "Wrong user or pass";
          }
        );
      };

      //function to find the idsubscription for the user
      $scope.FindUserSubs = function ($scope) {
        //console.log("***FindUserSubs()")
        var userFace = UserServiceFb.getUser('facebook');
        window.localStorage.setItem("userEmail", userFace.email);
        FindUserSubscriptionbyWebUser.findUserSubscription().get({"webUser": userFace.userID}, function (data) {
          //console.log("***FindUserSubscriptionbyWebUser.findUserSubscription()");
          //console.log(data)
          if (data.length > 0) {
            var accountStatus = data[0].accountStatus;
            //console.log("***accountStatus:"+accountStatus);
            if (accountStatus == "Canceled") {
              AuthService.logout();
              Utils.loading.hide();
              $scope.userCanceledFB($scope);
            }
            else if (accountStatus === "Banned") {
              Utils.loading.hide();
              Utils.alert.show(Utils.translate('LOGIN.USER_BANNED_MSG'));
              AuthService.logout();
              window.localStorage.clear();
              window.localStorage.setItem("onboardingComplete", "yes");
              facebookConnectPlugin.logout(function () {
              }, function () {
              });
            }
            else if (accountStatus === "Blocked") {
              Utils.loading.hide();
              Utils.alert.show(Utils.translate('LOGIN.USER_BLOCKED_MSG'));
              AuthService.logout();
              window.localStorage.clear();
              window.localStorage.setItem("onboardingComplete", "yes");
              facebookConnectPlugin.logout(function () {
              }, function () {
              });
            }
            else if (accountStatus !== "Active") {
              Utils.loading.hide();
              Utils.alert.show(Utils.translate("LOGIN.UNKNOWN_ACCOUNT_STATUS"));
              AuthService.logout();
              window.localStorage.clear();
              window.localStorage.setItem("onboardingComplete", "yes");
              facebookConnectPlugin.logout(function () {
              }, function () {
              });
            }
            else {
              window.localStorage.setItem("name", data[0].name);
              window.localStorage.setItem("simpleUserId", data[0].userSubscription.title.substr(data[0].userSubscription.title.lastIndexOf("-") + 1).replace(",", ""));
              window.localStorage.setItem("userSubscriptionId", data[0].userSubscriptionId);
              window.localStorage.setItem("userSubscriptionHref", data[0].userSubscription.href);
              window.localStorage.setItem("userSubscriptionInstanceId", data[0].userSubscription.href.split('/')[6]);

              if (data[0].profilePicture !== null) {
                window.localStorage.setItem("photoProfileBlob", 'data:image/jpeg;base64,' + data[0].profilePicture.split(':')[2]);
              }
              if (data[0].profilePictureUrl !== null) {
                //profilePictureUrl
                window.localStorage.setItem("photoProfileBlob", data[0].profilePictureUrl);
              }
              window.localStorage.setItem("userName", data[0].name);
              window.localStorage.setItem("applicationUser", data[0].applicationUser.href);

              if (data[0].userBio !== null) {
                window.localStorage.setItem("userBiography", data[0].userBio);
              }
              else {
                window.localStorage.setItem("userBiography", Utils.translate('GLOBAL.BIO'));
              }

              UserService.findUserSubscriptionById().get({
                "x-isis-querystring": {
                  userSubscriptionId: {value: data[0].userSubscriptionId.toString()}
                }
              }).$promise.then(function (resp) {
                if (resp[0].role) {

                  var newRoleId = Utils.getLastUrlComponent(resp[0].role.href);
                  if (!newRoleId) newRoleId = 2;//<--regular user
                  var currentRoleId = window.localStorage.getItem('userRoleId');

                  if (currentRoleId !== newRoleId) {
                    window.localStorage.setItem('userRoleId', newRoleId);
                    //console.log("New role detected");
                  }

                  getRolePermissionAndSetUserData(+Utils.getLastUrlComponent(resp[0].role.href)).then(function (boolResp) {
                    //nothing to do...
                  }, function (error) {
                    //$scope.finduser($scope);
                    console.error("getRolePermissions", error);
                    //window.localStorage.clear();
                    Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
                      location.reload();
                    })
                  }).finally(function () {
                    continueFacebookLoginProcess();
                  })
                }
                else {
                  console.error("Facebook login: findUserSubscriptionById, no user subscription found");
                  Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
                    location.reload();
                  })
                  continueFacebookLoginProcess();
                }
              }, function (error) {
                console.error("findUserSubscriptionById", error);
                Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_IN_LOGIN_ERROR')).then(function () {
                  location.reload();
                })
                continueFacebookLoginProcess();
              })
            }
          }
          else {
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR05'), 1, 1);
            console.error("Error");
          }
        }, function (error) {
          console.error("findUserSubscription error", error);
        });
      };

      function continueFacebookLoginProcess() {
        Utils.loading.hide();

        //function needed to prepare aws notification
        if (window.localStorage.getItem('AWSToken') && (window.localStorage.getItem('AWSToken') != '(null)')) {
          AWSServices.awsInit();
        } else {
          $ionicPlatform.ready(function () {
            var isIOS = ionic.Platform.isIOS();
            if (isIOS === true) {
              if (window.ApnsToken) {
                ApnsToken.getToken(function (token) {
                  window.localStorage.setItem('AWSToken', token);
                  if (typeof FCMPlugin != 'undefined') {
                    AWSServices.awsInit();
                  }
                }, function (error) {
                  console.error("can't get ios token", error);
                  $scope.checkTerms = false;
                })
              }
            } else {
              if (typeof FCMPlugin != 'undefined') {
                FCMPlugin.getToken(function (token) {
                  window.localStorage.setItem('AWSToken', token);
                  AWSServices.awsInit();
                }, function (response) {
                  console.error("couldn't get FCM token because: ", response);
                  $scope.checkTerms = false;
                })
              }
            }
          })
        }


        /*var firsTimeUser = {
          "discovery":{
            first: false,
            second: false
          },
          "upload":{
            first: false,
            second: false
          },
          "timelineOrganize":{
            first: false
          },
          "favorites":{
            first: false,
            second: false
          }
        };
        window.localStorage.setItem("firstTimeUser",JSON.stringify(firsTimeUser));*/
        //Verificamos si el usuario logeado ya terminó el onboarding
        // de no ser así se le mandará de regreso al principio firsTimeUser
        $scope.checkTerms = false;
        //Check if the user still have their logged count stored in the device
        DBServices.execute(
          "SELECT * FROM userLogCount WHERE name = ?",
          [window.localStorage.getItem("name")]
        ).then(function (resultSet) {
          if (resultSet.rows.length > 0) {
            $scope.setDefaultsDataBase(3, 1);
          } else {
            $scope.setDefaultsDataBase(2, 1);
          }
        }, function (error) {
          $scope.setDefaultsDataBase(4, 1);
        });

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
          transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
            //console.log(name + " insertId: " + resultSet.insertId);
            //console.log(name + " rowsAffected: " + resultSet.rowsAffected);
            if (resultSet.rows.length > 0) {
              $scope.setDefaultsDataBase(3, 1);
            } else {
              $scope.setDefaultsDataBase(2, 1);
            }
          }, function (tx, error) {
            //console.log('UPDATE error in');
            $scope.setDefaultsDataBase(4, 1);
          })
        }, function (error) {
          console.error('UPDATE error out', error);
          $scope.setDefaultsDataBase(4, 1);
        });*/
      }

      //Function to change profile photo to blob
      $scope.BlobPhoto = function ($scope) {
        var user = UserServiceFb.getUser('facebook');
        var canvas;
        var ctx;
        var dataURL;
        var num = 0;

        var imagePaths = [
          user.pictureSmall,
          user.pictureNormal,
          user.pictureLarge];

        function loadProfilePhotos(paths) {
          paths.forEach(function (path) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
              canvas = document.createElement('CANVAS');
              ctx = canvas.getContext('2d');
              canvas.height = this.height;
              canvas.width = this.width;
              ctx.drawImage(this, 0, 0);
              dataURL = canvas.toDataURL("image/jpeg", 1.0);
              window.localStorage.setItem(path.split('/')[4], dataURL);
              //$scope.pictures.push({"blob": dataURL, "name": path.split('/')[4]});
              $scope.$apply();
              if (num == 2) {
                $scope.addPhoto($scope);
              }
              num++;
            };
            img.src = path;
          });
        }

        loadProfilePhotos(imagePaths);
      };


      //function to save profile photo to subcription profile
      $scope.addPhoto = function ($scope) {
        var photoName = UserServiceFb.getUser();
        var realPhotoName = photoName.firstName.replace(" ", "_");
        var pictureName = realPhotoName + "_" + window.localStorage.getItem("simpleUserId");

        //Steps to upload
        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });
        //encrypt subscriptioninstanceID and folder name
        var userSubscriptionInstanceId = md5.createHash(window.localStorage.getItem("userSubscriptionInstanceId"));
        var folder = md5.createHash("profilePicture");

        //create key for each picture
        var photoSmallKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'small.jpg';
        var photoNormalKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'normal.jpg';
        var photoLargeKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'large.jpg';

        //photo to blob
        var fileSmall = Utils.dataURLtoBlob(window.localStorage.getItem("picture?type=normal"));
        var fileNormal = Utils.dataURLtoBlob(window.localStorage.getItem("picture?type=large"));
        var fileLarge = Utils.dataURLtoBlob(window.localStorage.getItem("picture?type=large"));

        //upload to s3
        //small
        s3Service.upload({
          Key: photoSmallKey,
          Body: fileSmall,
          ACL: 'public-read',
          ContentType: fileSmall.type
        }, function (err, data) {
          if (err) {
            return console.error('There was an error uploading the small jpg:', err);
          }
          //console.log('Successfully uploaded thumb image.');
        });
        //normal
        s3Service.upload({
          Key: photoNormalKey,
          Body: fileNormal,
          ACL: 'public-read',
          ContentType: fileNormal.type
        }, function (err, data) {
          if (err) {
            return console.error('There was an error uploading the normal jpg:', err);
          }
          //console.log('Successfully uploaded thumb image.');
        });
        //large
        s3Service.upload({
          Key: photoLargeKey,
          Body: fileLarge,
          ACL: 'public-read',
          ContentType: fileLarge.type
        }, function (err, data) {
          if (err) {
            return console.error('There was an error uploading the large jpg:', err);
          }
          //console.log('Successfully uploaded thumb image.');
        });
        //

        //upload links to server
        changeProfilePictureService.changeProfPictv181(
          {
            "userSubscriptionId": window.localStorage.getItem("userSubscriptionInstanceId")
          }).save(
          {
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
          }, function success(response) {
            //window.localStorage.setItem("photoProfileBlob", window.localStorage.getItem("picture?type=large") );
            window.localStorage.setItem("photoProfileBlob", "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoLargeKey);
            Utils.loading.hide();

            //function needed to prepare aws notification
            if (window.localStorage.getItem('AWSToken') && (window.localStorage.getItem('AWSToken') != '(null)')) {
              AWSServices.awsInit();
            } else {
              $ionicPlatform.ready(function () {
                var isIOS = ionic.Platform.isIOS();
                if (isIOS === true) {
                  if (window.ApnsToken) {
                    ApnsToken.getToken(function (token) {
                      window.localStorage.setItem('AWSToken', token);
                      if (typeof FCMPlugin != 'undefined') {
                        AWSServices.awsInit();
                      }
                    }, function (error) {
                      console.error("can't get ios token", error);
                      $scope.checkTerms = false;
                    })
                  }
                } else {
                  if (typeof FCMPlugin != 'undefined') {
                    FCMPlugin.getToken(function (token) {
                      window.localStorage.setItem('AWSToken', token);
                      AWSServices.awsInit();
                    }, function (response) {
                      console.error("couldn't get FCM token because: ", response);
                      $scope.checkTerms = false;
                    })
                  }
                }
              })
            }

            $scope.checkTerms = false;
            //Check if the user still have their logged count stored in the device
            DBServices.execute(
              "SELECT * FROM userLogCount WHERE name = ?",
              [window.localStorage.getItem("name")]
            ).then(function (resultSet) {
              if (resultSet.rows.length > 0) {
                $scope.setDefaultsDataBase(3, 2);
              }
              else {
                $scope.setDefaultsDataBase(2, 2);
              }
            }, function (error) {
              console.error('UPDATE error out', error);
              $scope.setDefaultsDataBase(4, 2);
            });

            /*userProfileData.dataBaseUser.transaction(function (transaction) {
              var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
              transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
                if (resultSet.rows.length > 0) {
                  $scope.setDefaultsDataBase(3, 2);
                } else {
                  $scope.setDefaultsDataBase(2, 2);
                }
              }, function (tx, error) {
                console.error('UPDATE error in', error);
                $scope.setDefaultsDataBase(4, 2);
              })
            }, function (error) {
              console.error('UPDATE error out', error);
              $scope.setDefaultsDataBase(4, 2);
            });*/
          }, function () {
            $scope.showErrorAndClean($scope, Utils.translate('ERROR.FACEBOOK_ERR06'), 1, 1);
          });
      };

      /*
      // END Code use for the Facebook Log in
      */

      /*
      // Code use when the user have his/her subscription cancelled
      */

      $scope.userCanceled = function () {

        Utils.alert.show(Utils.translate('LOGIN.USERCANCELED_TEMPLATE'), {
          title: Utils.translate('LOGIN.USERCANCELED_TITLE')
        }).then(function () {
          AuthService.logout();
        });
      };

      $scope.userCanceledFB = function () {
        facebookConnectPlugin.logout(function () {
            window.localStorage.clear();
            window.localStorage.setItem("onboardingComplete", "yes");
            Utils.alert.show(Utils.translate('LOGIN.USERCANCELED_TEMPLATE'), {
              title: Utils.translate('LOGIN.USERCANCELED_TITLE')
            }).then(function () {
              AuthService.logout();
            });
          },
          function (fail) {
            console.error("facebookConnectPlugin.logout", fail);
          });
      };

      /*
      // END Code use when the user have his/her subscription cancelled
      */

      $scope.showErrorAndClean = function ($scope, error, face, loged) {
        Utils.loading.hide();
        /*$ionicPopup.alert({
          template: error,
          cssClass: 'alertPopUp',
          okType: 'button-assertive'
        });*/
        $scope.ErrorMessage = error;
        if (face == 1) {
          facebookConnectPlugin.logout(function success() {
              if (loged == 1) {
                AuthService.logout();
              }
            },
            function () {
            });
        }
        else {
          if (loged == 1) {
            AuthService.logout();
          }
        }
        $scope.checkTerms = false;
        window.localStorage.clear();
        window.localStorage.setItem("onboardingComplete", "yes");
      };

      $scope.reDirectForgot = function () {
        $state.go('menu.forgotPassword', {}, {reload: true});
      };

      //Zone for Database about user
      $scope.setDefaultsDataBase = function (option, redirect) {
        //console.log("***setDefaultsDataBase()")
        //case to set tutorial in default
        if (option == 1) {
          var statusJson = [];
          var listOfTutorials = ["discovery", "upload", "timelineOrganize", "favorites"];

          var statusJson1 = JSON.stringify({first: true, second: true});
          var statusJson2 = JSON.stringify({first: true});
          DBServices.batch([
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["discovery", statusJson1]],
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["upload", statusJson1]],
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["favorites", statusJson1]],
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["timelineOrganize", statusJson2]]
          ]).then(function () {
            $scope.setDefaultsDataBase(4, redirect);
          }, function (error) {
            console.error('Transaction ERROR:', error);
            $scope.setDefaultsDataBase(4, redirect);
          })

          /*userProfileData.dataBaseUser.transaction(function (tx) {
            statusJson = {first: true, second: true};
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["discovery", JSON.stringify(statusJson)]);
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["upload", JSON.stringify(statusJson)]);
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["favorites", JSON.stringify(statusJson)]);
            statusJson = {first: true};
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["timelineOrganize", JSON.stringify(statusJson)]);
          }, function (error) {
            console.error('Transaction ERROR:', error);
            $scope.setDefaultsDataBase(4, redirect);
          }, function (resultSet) {
            //console.log('Populated Table:');
            $scope.setDefaultsDataBase(4, redirect);
          });*/
        }
        //case to set log count in default
        //after
        if (option == 2) {
          DBServices.execute(
            "INSERT INTO userLogCount (name, count) VALUES (?,?)",
            [window.localStorage.getItem("name"), 1]
          ).then(function (value) {
            $scope.setDefaultsDataBase(3, redirect);
          }, function (error) {
            console.error("Insert log Count error", error);
            $scope.setDefaultsDataBase(4, redirect);
          });

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySelect = "INSERT INTO userLogCount (name, count) VALUES (?,?)";
            transaction.executeSql(querySelect, [window.localStorage.getItem("name"), 1], function (tx, resultSet) {
              //console.log("tx:", tx);
              //console.log("User login's count: ", resultSet);
              $scope.setDefaultsDataBase(3, redirect);
            }, function (tx, error) {
              console.error("Insert log Count error", error);
              $scope.setDefaultsDataBase(4, redirect);
            });
          }, function (error) {
            console.error("transaction log Count error", error);
            $scope.setDefaultsDataBase(4, redirect);
          });*/
        }
        //after case 2 we check if table for tutorial have any data
        if (option == 3) {
          DBServices.execute("SELECT * FROM tutorials").then(function (resultSet) {
            if (resultSet.rows.length > 0) {
              $scope.setDefaultsDataBase(4, redirect);
            }
            else {
              $scope.setDefaultsDataBase(1, redirect);
            }
          }, function (error) {
            console.error("SELECT tutorials error:", error);
            $scope.setDefaultsDataBase(4, redirect);
          })

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySecond = "SELECT * FROM tutorials";
            transaction.executeSql(querySecond, [], function (tx, resultSet) {
              if (resultSet.rows.length > 0) {
                $scope.setDefaultsDataBase(4, redirect);
              } else {
                $scope.setDefaultsDataBase(1, redirect);
              }
            }, function (tx, error) {
              console.error("SELECT tutorials error:", error);
              $scope.setDefaultsDataBase(4, redirect);
            });
          }, function (error) {
            console.error("Transaction tutorials error", error);
            $scope.setDefaultsDataBase(4, redirect);
          })*/
        }
        //after all we need to redirect acordly
        if (option == 4) {
          if (redirect == 1) {
            //console.log("***redirecting to timeline...")
            $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
            setTimeout(function () {
              $rootScope.$broadcast('login.success');
            }, 1000);
          } else {
            //console.log("***refirecting to firstFBFriends...")
            $state.go('firstFBFriends', {}, {reload: true});
            setTimeout(function () {
              $rootScope.$broadcast('login.success');
            }, 1000);
          }
        }
      };
      //End Zone for Database about user
    }])

  .controller('signupCtrl', ['$scope', '$state', '$ionicHistory', 'AuthService', 'AddUserService', 'UserService', 'Utils',
    function ($scope, $state, $ionicHistory, AuthService, AddUserService, UserService, Utils) {

      $scope.data = {};
      $scope.methods = {};

      $scope.data.newUser = AddUserService.newUser;

      $scope.methods.findUsername = function () {
        $scope.data.newUser.availableUsername = 0
        if ($scope.data.newUser.username) {
          AuthService.login("sven", 'm<}WU6ZEFvKqks-"').then(
            function success() {
              //console.log("Access with sven");
              UserService.validateUserName().get({
                "userName": $scope.data.newUser.username
              }, function success(response) {
                $scope.data.newUser.availableUsername = response.length > 1 ? 1 : 2;
                AuthService.logout();
              }, function (resposne) {
                console.error("error login", error());
                $scope.data.newUser.availableUsername = 0;
                AuthService.logout();
              });
            }, function () {
              console.error("Error login with sven", error());
              $scope.error = "Wrong user or pass";
            }
          );
        }
      };

      $scope.methods.goBack = function () {
        $ionicHistory.goBack();
      };

      $scope.methods.continue = function () {

        Utils.confirm.show($scope.data.newUser.email, {
          title: Utils.translate('SIGNUP.EMAIL_CORRECT'),
          cancelText: Utils.translate('GLOBAL.NO'),
          okText: Utils.translate('GLOBAL.YES')
        }).then(function (res) {
          if (res) {
            if ($scope.data.newUser.availableUsername === 2) {
              $state.go('signup2', {}, {reload: true});
            }
          } else {
            console.log('You are not sure');
          }
        });

      };
    }])

  .controller('signup2Ctrl', ['$rootScope', '$scope', '$state', '$ionicHistory', 'AuthService', 'AddSubscriptionService', 'AddUserService', 'changeProfilePictureService', '$ionicActionSheet', 'ImageService2', 'FileService2', '$ionicPlatform', 'UserService', '$ionicPush', 'DBServices', 's3', 'md5', 'ApiEndPoint', 'Utils', 'AWSServices',
    function ($rootScope, $scope, $state, $ionicHistory, AuthService, AddSubscriptionService, AddUserService, changeProfilePictureService, $ionicActionSheet, ImageService2, FileService2, $ionicPlatform, UserService, $ionicPush, DBServices, s3, md5, ApiEndPoint, Utils, AWSServices) {

      $scope.data = {};
      $scope.methods = {};
      $scope.data.newUser = AddUserService.newUser;
      $scope.data.pictures = FileService2.images();
      $scope.data.creating = false;
      $scope.data.addPhoto = Utils.translate('SIGNUP.ADDPHOTO')


      $scope.methods.goBack = function () {
        $ionicHistory.goBack();
      };

      $scope.methods.addPhoto = function () {
        $scope.hideSheet = $ionicActionSheet.show({
          buttons: [
            {text: 'Take photo'},
            {text: 'Photo from library'}
          ],
          titleText: 'Add photo from',
          cancelText: 'Cancel',
          buttonClicked: function (index) {
            $scope.hideSheet();
            ImageService2.saveProfilePhoto(index).then(function () {
              $scope.data.pictures = FileService2.images().sort(function (a, b) {
                return b.length - a.length;
              });
            });
          }
        });
      };


      $scope.methods.createAccount = function () {
        $scope.data.creating = true;
        AuthService.login('sven', 'm<}WU6ZEFvKqks-"').then(
          function success() {
            //console.log("Access with sven");
            var splitName = $scope.data.newUser.firstName.split(" ");
            var splitLastName = $scope.data.newUser.lastName.split(" ");
            var middleName = splitName.length > 1 ? splitName[1] : null;
            var lastName2 = splitLastName.length > 1 ? splitLastName[1] : null;
            AddUserService.addUser().save(
              {
                "firstName": {
                  "value": splitName[0]
                },
                "middleName": {
                  "value": middleName
                },
                "lastName": {
                  "value": splitLastName[0]
                },
                "lastName2": {
                  "value": lastName2
                },
                "username": {
                  "value": $scope.data.newUser.username.toUpperCase()
                },
                "password": {
                  "value": $scope.data.newUser.password
                },
                "passwordRepeat": {
                  "value": $scope.data.newUser.password
                },
                "email": {
                  "value": $scope.data.newUser.email
                },
                "passwordRecoveryQuestion": {
                  "value": "¿Access with Facebook?"
                },
                "passwordRecoveryAnswer": {
                  "value": "No"
                }
              }).$promise.then(function success(response) {
              AuthService.logout();
              //Check if is retrieve by other resquest.
              $scope.data.newUser.href = response.result.links[0].href;
              window.localStorage.setItem("applicationUser", response.result.members.applicationUser.value.href);
              window.localStorage.setItem("userName", $scope.data.newUser.username);
              window.localStorage.setItem("simpleUserId", response.result.members.userId.value);
              window.localStorage.setItem("simpleUserInstanceId", response.result.instanceId);
              window.localStorage.setItem("userEmail", $scope.data.newUser.email);

              AuthService.login($scope.data.newUser.username.toUpperCase(), $scope.data.newUser.password).then(function success() {
                AddSubscriptionService.addSubscription().save(
                  {
                    "user":
                      {
                        "value":
                          {
                            "href": $scope.data.newUser.href
                          }
                      }
                  }).$promise.then(function success(response) {
                  window.localStorage.setItem("name", response.result.members.name.value);
                  window.localStorage.setItem("userSubscriptionId", response.result.title.substr(response.result.title.lastIndexOf("-") + 1).replace(",", ""));
                  window.localStorage.setItem("userSubscriptionInstanceId", response.result.instanceId);
                  window.localStorage.setItem("userSubscriptionHref", ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + response.result.instanceId);


                  if (window.localStorage.getItem('AWSToken') && (window.localStorage.getItem('AWSToken') != '(null)')) {
                    AWSServices.awsInit();
                  } else {
                    $ionicPlatform.ready(function () {
                      var isIOS = ionic.Platform.isIOS();
                      if (isIOS === true) {
                        if (window.ApnsToken) {
                          ApnsToken.getToken(function (token) {
                            window.localStorage.setItem('AWSToken', token);
                            if (typeof FCMPlugin != 'undefined') {
                              AWSServices.awsInit();
                            }
                          }, function (error) {
                            console.error("can't get ios token", error);
                            $scope.checkTerms = false;
                          })
                        }
                      } else {
                        if (typeof FCMPlugin != 'undefined') {
                          FCMPlugin.getToken(function (token) {
                            window.localStorage.setItem('AWSToken', token);
                            AWSServices.awsInit();
                          }, function (response) {
                            console.error("couldn't get FCM token because: ", response);
                            $scope.checkTerms = false;
                          })
                        }
                      }
                    })
                  }

                  /*var oldData = JSON.parse(window.localStorage.getItem("ionic_push_token"));
                    $ionicPush.register().then(function(newData) {
                    if(oldData !== null){
                        if (newData.token != oldData.token ){
                            UserService.deleteDevice()
                            .get({"string": oldData.token}).$promise.then(function(data){
                                //console.log(data);
                            },function(error){
                                console.log("deleteSequence error:");
                            });
                            UserService.addDevice(
                                { objectId : window.localStorage.getItem('userSubscriptionInstanceId') }
                            ).save({
                                "userDeviceId": {
                                    "value" : newData.token
                                },
                                "status": {
                                    "value": "valid"
                                }
                            }).$promise.then(function success (){
                                console.log("Token saved in BD");
                            },function error (response){
                                console.log("UserService.addDevice error");
                            });
                        }
                    }else{
                        UserService.addDevice(
                              { objectId : window.localStorage.getItem('userSubscriptionInstanceId') }
                          ).save({
                              "userDeviceId": {
                                  "value" : newData.token
                              },
                              "status": {
                                  "value": "valid"
                              }
                          }).$promise.then(function success (){
                              console.log("Token saved in BD");
                          },function error (response){
                              console.log("UserService.addDevice error");
                          });
                    }
                    return $ionicPush.saveToken(newData);
                    }).then(function(newData) {
                        //console.log('Token saved:', newData.token);
                    });*/

                  //Add Bio
                  if ($scope.data.newUser.bio) {
                    UserService.editTextfromUserBiography({"objectId": window.localStorage.getItem("userSubscriptionInstanceId")}).save(
                      {
                        "string": {
                          "value": $scope.data.newUser.bio
                        }
                      }, function success(data) {
                        window.localStorage.setItem("userBiography", $scope.data.newUser.bio);
                      }, function (response) {
                        console.error("UserService.editTextfromUserBiography error:", error());
                      });
                  } else {
                    window.localStorage.setItem("userBiography", Utils.translate('GLOBAL.BIO'));
                  }

                  //Add profile picture if there's any
                  if ($scope.data.pictures.length === 0) {
                    AddUserService.newUser = {};
                    $state.go('menu.discovery', {}, {reload: true});
                    setTimeout(function () {
                      $rootScope.$broadcast('login.success');
                    }, 1000);
                  }
                  else {
                    var realPhotoName = $scope.data.newUser.username.replace(" ", "_");
                    var pictureName = realPhotoName + "_" + window.localStorage.getItem("simpleUserId");
                    //Steps to upload
                    var s3Service = new AWS.S3({
                      apiVersion: '2006-03-01',
                      params: {Bucket: s3.bucket}
                    });
                    //encrypt subscriptioninstanceID and folder name
                    var userSubscriptionInstanceId = md5.createHash(window.localStorage.getItem("userSubscriptionInstanceId"));
                    var folder = md5.createHash("profilePicture");

                    //create key for each picture
                    var photoSmallKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'small.jpg';
                    var photoNormalKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'normal.jpg';
                    var photoLargeKey = s3.prefix + '/' + userSubscriptionInstanceId + '/' + folder + '/' + 'large.jpg';

                    //photo to blob
                    var fileSmall = Utils.dataURLtoBlob($scope.data.pictures[2]);
                    var fileNormal = Utils.dataURLtoBlob($scope.data.pictures[1]);
                    var fileLarge = Utils.dataURLtoBlob($scope.data.pictures[0]);

                    //upload to s3
                    //small
                    s3Service.upload({
                      Key: photoSmallKey,
                      Body: fileSmall,
                      ACL: 'public-read',
                      ContentType: fileSmall.type
                    }, function (err, data) {
                      if (err) {
                        return console.error('There was an error uploading the small jpg:', err);
                      }
                      //console.log('Successfully uploaded thumb image.');
                    });
                    //normal
                    s3Service.upload({
                      Key: photoNormalKey,
                      Body: fileNormal,
                      ACL: 'public-read',
                      ContentType: fileNormal.type
                    }, function (err, data) {
                      if (err) {
                        return console.error('There was an error uploading the normal jpg:', err);
                      }
                      //console.log('Successfully uploaded thumb image.');
                    });
                    //large
                    s3Service.upload({
                      Key: photoLargeKey,
                      Body: fileLarge,
                      ACL: 'public-read',
                      ContentType: fileLarge.type
                    }, function (err, data) {
                      if (err) {
                        return console.error('There was an error uploading the large jpg:', err);
                      }
                      //console.log('Successfully uploaded thumb image.');
                    });
                    //

                    //upload to server
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
                    }, function success() {
                      //window.localStorage.setItem("photoProfileBlob", $scope.data.pictures[0] );
                      window.localStorage.setItem("photoProfileBlob", "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoLargeKey);
                      AddUserService.newUser = {};
                      FileService2.cleanImages();
                      $scope.setDefaultsDataBase(4);
                    }, function (response) {
                      console.error('changeProfilePictureService.changeProfPict error', error());
                    });
                  }

                }, function (response) {
                  $scope.data.creating = false;
                  //console.log("AddSubscriptionService.addSubscription()", response);
                })
              }, function (error) {
                $scope.data.creating = false;
                console.error("Error login with new user", error);
              })

            }, function (error) {
              $scope.data.creating = false;
              console.error("AddUserService.addUser()", error);
            });
          }, function (error) {
            $scope.data.creating = false;
            console.error("Error login with sven", error);
          }
        );
      };

      //Zone for Database about user
      $scope.setDefaultsDataBase = function (option) {
        //case to set tutorial in default
        if (option == 1) {
          var statusJson = [];
          var listOfTutorials = ["discovery", "upload", "timelineOrganize", "favorites"];

          var statusJson1 = JSON.stringify({first: true, second: true});
          var statusJson2 = JSON.stringify({first: true});

          DBServices.batch([
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["discovery", statusJson1]],
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["upload", statusJson1]],
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["favorites", statusJson1]],
            ["INSERT INTO tutorials (name, visited) VALUES (?,?)", ["timelineOrganize", statusJson2]]
          ]).then(function () {
            $scope.setDefaultsDataBase(5);
          }, function (error) {
            console.error('Transaction ERROR:', error);
            $scope.setDefaultsDataBase(5);
          });

          /*userProfileData.dataBaseUser.transaction(function (tx) {
            statusJson = {first: true, second: true};
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["discovery", JSON.stringify(statusJson)]);
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["upload", JSON.stringify(statusJson)]);
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["favorites", JSON.stringify(statusJson)]);
            statusJson = {first: true};
            tx.executeSql("INSERT INTO tutorials (name, visited) VALUES (?,?)", ["timelineOrganize", JSON.stringify(statusJson)]);
          }, function (error) {
            console.error('Transaction ERROR:', error);
            $scope.setDefaultsDataBase(5);
          }, function (resultSet) {
            //console.log('Populated Table');
            $scope.setDefaultsDataBase(5);
          });*/
        }
        //case to set log count in default
        //after
        if (option == 2) {
          DBServices.execute(
            "INSERT INTO userLogCount (name, count) VALUES (?,?)",
            [window.localStorage.getItem("name"), 1]
          ).then(function (value) {
            $scope.setDefaultsDataBase(3);
          }, function (error) {
            console.error("Insert log Count error", error);
            $scope.setDefaultsDataBase(5);
          })

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySelect = "INSERT INTO userLogCount (name, count) VALUES (?,?)";
            transaction.executeSql(querySelect, [window.localStorage.getItem("name"), 1], function (tx, resultSet) {
              $scope.setDefaultsDataBase(3);
            }, function (tx, error) {
              console.error("Insert log Count error", error);
              $scope.setDefaultsDataBase(5);
            });
          }, function (error) {
            console.error("transaction log Count error", error);
            $scope.setDefaultsDataBase(5);
          });*/
        }
        //check if table for tutorial have any data
        if (option == 3) {
          DBServices.execute("SELECT * FROM tutorials").then(function (resultSet) {
            if (resultSet.rows.length > 0) {
              $scope.setDefaultsDataBase(5);
            }
            else {
              $scope.setDefaultsDataBase(1);
            }
          }, function (error) {
            console.error("SELECT tutorials error", error);
            $scope.setDefaultsDataBase(5);
          });

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySecond = "SELECT * FROM tutorials";
            transaction.executeSql(querySecond, [], function (tx, resultSet) {
              if (resultSet.rows.length > 0) {
                $scope.setDefaultsDataBase(5);
              } else {
                $scope.setDefaultsDataBase(1);
              }
            }, function (tx, error) {
              console.error("SELECT tutorials error", error);
              $scope.setDefaultsDataBase(5);
            });
          }, function (error) {
            console.error("Transaction tutorials error", error);
            $scope.setDefaultsDataBase(5);
          })*/
        }
        //check if table for login count have any data
        if (option == 4) {
          DBServices.execute(
            "SELECT * FROM userLogCount WHERE name = ?",
            [window.localStorage.getItem("name")]
          ).then(function (resultSet) {
            if (resultSet.rows.length > 0) {
              $scope.setDefaultsDataBase(3);
            }
            else {
              $scope.setDefaultsDataBase(2);
            }
          }, function (error) {
            console.error('Execute SELECT logCount error in', error);
            $scope.setDefaultsDataBase(5);
          });

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
            transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
              if (resultSet.rows.length > 0) {
                $scope.setDefaultsDataBase(3);
              } else {
                $scope.setDefaultsDataBase(2);
              }
            }, function (tx, error) {
              console.error('Execute SELECT logCount error in', error);
              $scope.setDefaultsDataBase(5);
            })
          }, function (error) {
            console.error('Transaction SELECT logCount error out', error);
            $scope.setDefaultsDataBase(5);
          })*/
        }
        //after all we need to redirect acordly
        if (option == 5) {
          $state.go('menu.discovery', {}, {reload: true});
          setTimeout(function () {
            $rootScope.$broadcast('login.success');
          }, 1000);
        }
      };
      //End Zone for Database about user
    }])
