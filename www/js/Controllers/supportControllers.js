"use strict";
appControllers
.controller('msgSupportCtrl', ['$scope', 'SignUpService', 'AuthService', '$state', '$ionicPopup', '$timeout', 'UserServiceFb', '$ionicActionSheet','$ionicLoading','UserService', '$filter',
    function($scope, SignUpService, AuthService, $state, $ionicPopup,$timeout, UserServiceFb, $ionicActionSheet,$ionicLoading,UserService, $filter) {

        //code to init data required in type of support
        $scope.types = [{
          "value" : 1,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.QUESTION')
        }, {
          "value" : 2,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.ERROR')
        }, {
          "value" : 3,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.FEATURE')
        }, {
          "value" : 4,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.REQUEST')
        }, {
          "value" : 5,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.BETA_REPORT')
        }, {
          "value" : 6,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.INAPPROPRIATE')
        }, {
          "value" : 7,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.HELP_WITH_YOUR_ACCOUNT')
        }, {
          "value" : 8,
          "label" : $filter('translate')('MENU.SUPPORT.TYPE.OTHER')
        }];

        $scope.supportType = $scope.types[0].label;

        $scope.fillEmail = function()
        {
            facebookConnectPlugin.getLoginStatus(function(response){
                if(response.status == 'connected'){
                    console.log("Se logeo por Face");
                    facebookConnectPlugin.logout(function()
                    {
                        $scope.webUser = "";
                    },function(fail){
                        console.log("no se pudo deslogear");
                    });
                } else {
                    console.log("No se logeo por Face");
                }
            },function(error){
                console.log("getLoginStatus error");
            });
        };

        $scope.user = UserServiceFb.getUser();
        $scope.mailSuppMail = "support@mycqnz.zohosupport.com";
        $scope.mailUserMail = "";
        $scope.mailSubject = "Support Message CQNZ type:";
        $scope.userSubscriptionId = window.localStorage.getItem("userSubscriptionId");

        $scope.formMail = function(){
            $scope.mailSubject += " " + $scope.supportType;
            $scope.mailUserMail = $scope.data.userMail;
            $scope.mailBody = "You have recieved an support email from the user: <br>" +
                            $scope.user.name + "<br>" +
                            "with  User subscription Id: <br>" +
                            $scope.userSubscriptionId + "<br>" +
                            "with the topic:<br>" +
                            $scope.supportType + "<br>" +
                            "using the versíon:<br> " +
                            //appVersion + "<br>" +
                            $scope.appVersion + "<br>" +
                            "and the message: <br>" +
                            "Request: <br>" + $scope.data.body;
            $ionicLoading.show({
                    template: 'Sending...'
                });
            $scope.sendMail($scope);
        };

        $scope.sendMail = function($scope){
            UserService.sendSupportEmail({"objectId": window.localStorage.getItem("simpleUserInstanceId") }).save({
                "string1": {"value": $scope.mailSuppMail},
                "string2": {"value": $scope.mailUserMail},
                "string3": {"value": $scope.mailSubject},
                "string4": {"value": $scope.mailBody},
            }, function(data){
                $ionicLoading.hide();
                $scope.data.userMail="";
                $scope.data.body="";
                $ionicPopup.alert({
                    template: $filter('translate')('MENU.SUPPORT.SENT_MAIL'),
                    cssClass: 'alertPopUp',
                    okType: 'button-assertive'
                });
                $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
            });
        };

        $scope.cancelMail = function(){
            $state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});
        };

        $scope.data={};
        $scope.data.showButtonsArea=false;
        //zone to show and quit button upload zone
        $scope.showButtonArea = function(){
            console.log("in");
            if($scope.data.showButtonsArea){
                var area = document.getElementById("ButtonsAreaRedirect");
                area.className = "";
                $scope.data.showButtonsArea = false;
            } else{
                var area = document.getElementById("ButtonsAreaRedirect");
                area.className = "bounceInUp";
                $scope.data.showButtonsArea = true;
            }

        };
            //END zone to show and quit button upload zone
    }])

// Controller for update Password
.controller('forgotPasswordCtrl',['$scope','UserService','AuthService', '$filter',
    function($scope,UserService,AuthService, $filter){

        $scope.answer = 0;
        $scope.messageAfter ='';
        $scope.uploading = false;
        $scope.correct = 0;

        $scope.mailSuppMail = "support@mycqnz.zohosupport.com";
        $scope.mailUserMail = "";
        $scope.mailSubject = "Login Error";

        $scope.formMailLogin = function() {
            $scope.mailUserMail = $scope.data.Email;
            $scope.mailBody = "You have recieved an support email:" + "the message:" + $scope.data.Body;
            $scope.sendMailLogin($scope);
        };

        $scope.sendMailLogin = function($scope) {
            $scope.uploading = true;
            AuthService.login("sven", 'm<}WU6ZEFvKqks-"').then(function success() {
                UserService.sendEmailToSupportLogin().save({
                    "string1": {
                        "value": $scope.mailSuppMail
                    },
                    "string2": {
                        "value": $scope.mailUserMail
                    },
                    "string3": {
                        "value": $scope.mailSubject
                    },
                    "string4": {
                        "value": $scope.mailBody
                    }
                }, function(data) {
                    $scope.uploading = false;
                    $scope.data.userMail = "";
                    $scope.data.Body = "";
                    AuthService.logout();
                }, function(error) {
                    console.log("sendSupportEmailLogin error");
                });
            }, function error(response) {
                console.log("login error:");
                $scope.uploading = false;
            });
        };

        $scope.data = {
            model: null,
            availableOptions: [{
                id: '1',
                name: 'Username & password'
            }, {
                id: '2',
                name: 'Something else'
            }]
        };

        //Find the recovery question
        $scope.findEmail = function() {
            $scope.correct = 0;
            $scope.answer = 0;
            if (/\s/g.test($scope.data.Email) > 0) {
                $scope.error = $filter('translate')('RECOVER.SPACES');
                $scope.answer = 1;
            } else {
                if ($scope.data.Email.length > 3) {
                    AuthService.login("sven", 'm<}WU6ZEFvKqks-"').then(function success() {
                        UserService.validateUserEmail().get({
                            'email': $scope.data.Email
                        }, function(response) {
                            if (response.length > 1) {
                                if (response[0].webUser) {
                                    $scope.answer = 2;
                                } else {
                                    $scope.answer = 3;
                                    $scope.sendNewPasswordLogin();
                                }
                            } else {
                                $scope.answer = 4;
                                $scope.questionRecovery = null;
                            }
                            AuthService.logout();
                        }, function(error) {
                            console.log("validateEmail error");
                            $scope.answer = 0;
                        });
                    }, function error(response) {
                        console.log("login error:");
                    });
                }
            }
        };

        $scope.sendNewPasswordLogin = function() {
            $scope.uploading = true;
            AuthService.login("sven", 'm<}WU6ZEFvKqks-"').then(function success() {
                UserService.sendNewPasswordEmail().save({
                    "email": {
                        "value": $scope.data.Email
                    }
                }).$promise.then(function(emailNotifications) {
                    if (emailNotifications.result.value == "Success: You have a new password, check your email") {
                        $scope.correct = 1;
                        $scope.messageAfter = emailNotifications.result.value;
                        $scope.questionRecovery = null;
                        $scope.answer = 0;
                        $scope.data.securityAnswer = "";
                    } else {
                        $scope.correct = 2;
                        $scope.messageAfter = emailNotifications.result.value;
                        $scope.data.securityAnswer = "";
                    }
                    $scope.uploading = false;
                    AuthService.logout();
                }, function(error) {
                    console.log("sendNewPassword error");
                });
            }, function error(response) {
                console.log("login error:");
                $scope.uploading = false;
            });
            window.localStorage.setItem("changePassword", true);
        };
    }])
;
