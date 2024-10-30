"use strict";
appControllers
.controller('friendsCtrl', ['$scope','$state','$ionicPopup', 'UserServiceFb', '$ionicLoading','FindUserSubscriptionbyWebUser','UserService','ApiEndPoint','usersData','$q','reDirectService','Utils',
	function($scope,$state,$ionicPopup,UserServiceFb, $ionicLoading,FindUserSubscriptionbyWebUser,UserService,ApiEndPoint,usersData,$q,reDirectService,Utils){
		$scope.searching=true;
		$scope.users = [];
		/*
		part to request the facebook info again
		*/
		var getFacebookProfileInfo = function (authResponse) {
			var info = $q.defer();
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

		$scope.updatedata = function(){
			facebookConnectPlugin.getLoginStatus(function(response)
			{
				console.log("status", response);
				if(response.status == 'connected')
				{
					console.log('Accede a facebook y la app ya esta registrada');
					var user = UserServiceFb.getUser('facebook');
					if(user.userID)
					{
						getFacebookProfileInfo(response.authResponse)
							.then(function(profileInfo) {
								UserServiceFb.setUser({
									authResponse: response.authResponse,
									userID: profileInfo.id,
									name: profileInfo.name,
									firstName: profileInfo.first_name,
									lastName: profileInfo.last_name,
									userWebLink: profileInfo.link,
									email: profileInfo.email,
									birthday: profileInfo.birthday, //
									appFriends: profileInfo.friends,
									pictureSmall : "https://graph.facebook.com/" + response.authResponse.userID + "/picture?type=small",
									pictureNormal : "https://graph.facebook.com/" + response.authResponse.userID + "/picture?type=normal",
									pictureLarge : "https://graph.facebook.com/" + response.authResponse.userID + "/picture?type=large"
								});
								$scope.fillList();
							}, function(fail){
								$scope.showErrorAndClean($scope,
									Utils.translate('LOGIN.FACEBOOK_ERR01'),
									0,
									0);
								console.log('profile info fail', fail);
							});
					}
				} else {
					console.log('Enter facebook but the app isnt registred');
				}
			});
		};

		$scope.fillList = function(){
			$scope.user = UserServiceFb.getUser();
			$scope.friends = $scope.user.appFriends.data;
			$scope.chkStatus($scope);
		};

		$scope.chkStatus = function($scope){
			for (var i = 0; i < $scope.friends.length; i++) {
				//$scope.findUserSubscriptionByUserName($scope.friends[i]);
				UserService.findUserSubscriptionByUserName().get({
					'userName': $scope.friends[i].name
				}).$promise.then(function success(response){
					if(response.length>1)
					{
						var friendID = UserService.getFollowingIsActive().get(
						{
							"objectId": window.localStorage.getItem('userSubscriptionInstanceId'),
							"x-isis-querystring":
								{"friendId":
									{"value":
										{"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/"+response[0].userSubscription.href.split('/')[6]}
									}
								}
						});

						$scope.users.push({
							id: response[0].userSubscription.href.split('/')[6],
							name: response[0].name,
							verify: response[0].verifyUser,
							friend: friendID,
							photoId: response[0].profilePicture
						});


						if($scope.users.length>0)
						{
							$scope.searching=false;
						}
					}
				});
			}
		};

		$scope.sendContactRequest = function (user,isFriend){
			console.log('isFriend');
			UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).
			save({
				"friendId":{
					"value":{
						"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + user
					}
				}
			}, function success(){
				$ionicPopup.alert({
					//template: 'You have sent the request to follow him/her',
					template: Utils.translate('FIND_FACEBOOK_FRIENDS.FB_FRIEND_REQUEST'),
					cssClass: 'alertPopUp',
					okType: 'button-assertive'
				});
			}, function (error){
				console.log("addFriends error", error);
				$ionicPopup.alert({
					//template: 'You are already following this user',
					template: Utils.translate('FIND_FACEBOOK_FRIENDS.ALREADY'),
					cssClass: 'alertPopUp',
					okType: 'button-assertive'
				});
			});
		};

		$scope.sendUserProfile = function(userChosen){
			reDirectService.reDirectProfile(userChosen);
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

//Controller toinvite friends for new Facebook users
.controller('firstFBFriendsCtrl', ['$scope','$state','$ionicPopup', 'UserServiceFb', '$ionicLoading','FindUserSubscriptionbyWebUser','UserService','ApiEndPoint','usersData','$q','reDirectService',
	function($scope,$state,$ionicPopup,UserServiceFb, $ionicLoading,FindUserSubscriptionbyWebUser,UserService,ApiEndPoint,usersData,$q,reDirectService){
		$scope.data = [];
		$scope.data.searching=true;
		$scope.data.users = [];

		$scope.fillList = function(){
			$scope.data.user = UserServiceFb.getUser();
			$scope.data.friends = $scope.data.user.appFriends.data;
			if($scope.data.friends.length > 0)
			{
				$scope.chkStatus($scope);	
			}
			else
			{
				$scope.data.searching=false;
			}
		};

		$scope.chkStatus = function($scope){
			for (var i = 0; i < $scope.data.friends.length; i++) {
				UserService.findUserSubscriptionByUserName().get({
					'userName': $scope.data.friends[i].name
				}).$promise.then(function success(response){
					if(response.length>1)
					{
						var friendID = UserService.getFollowingIsActive().get(
						{
							"objectId": window.localStorage.getItem('userSubscriptionInstanceId'),
							"x-isis-querystring":
								{"friendId":
									{"value":
										{"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/"+response[0].userSubscription.href.split('/')[6]}
									}
								}
						});

						$scope.data.users.push({
							id: response[0].userSubscription.href.split('/')[6],
							name: response[0].name,
							verify: response[0].verifyUser,
							friend: friendID,
							photoId: response[0].profilePicture,
                            sending: false
						});


						if($scope.data.users.length>0)
						{
							$scope.data.searching=false;
						}
					}
				});
			}
            if($scope.data.users.length<=0){
                $scope.data.friends.length = 0;
            }
		};

		$scope.sendContactRequest = function (user,isFriend,userData){
			console.log('isFriend');
            userData.sending = true;
			UserService.addFriends({"objectId": window.localStorage.getItem('userSubscriptionInstanceId')}).
			save({
				"friendId":{
					"value":{
						"href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + user
					}
				}
			}, function success(){
                userData.sending = false;
			}, function (error){
                userData.sending = false;
				console.log("addFriends error");
			});
		};

		$scope.sendUserProfile = function(userChosen){
			reDirectService.reDirectProfile(userChosen);
		};

		$scope.Appmessage = function(){
			var isIOS = ionic.Platform.isIOS();
			var isAndroid = ionic.Platform.isAndroid();
			window.plugins.socialsharing.share(
				'Are you in niido? \n Download in:\n', // Text, some apps not support this
				null, // subject
				null, //image needed
				'http://cqnz.rocks' //url
				);
		};

		$scope.skipFriends = function(){
			$state.go('menu.timeline', {"prepareStatement": 0}, {reload: true});	
		};
	}])

;
