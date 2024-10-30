"use strict";

appServices
	.factory('AWSServices', ["$resource", "ApiEndPoint", "s3", "UserService", function($resource, ApiEndPoint, s3, UserService){

		var sns = new AWS.SNS({
    		apiVersion: '2010-03-31'
    	});

		/*
		Function to send notification
    	*/
    	function sendNotification(msg, arn, extra, name){
            //if(ionic.Platform.isAndroid())
            var payload = "";
            if(extra!=null){
                payload = {
                    default:msg,
                    GCM: {
                        notification: {
                            text: msg,
                            sound: 'default'
                        },
                        data: {
                            typeData: 'Message',
                            name: name
                        }
                    },
                    APNS:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        },
                        data: {
                            typeData: 'Message',
                            name: name
                        }
                    },
                    APNS_SANDBOX:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        },
                        data: {
                            typeData: 'Message',
                            name: name
                        }
                    }
                }
            } else {
                payload = {
                    default:msg,
                    GCM: {
                        notification: {
                            text: msg,
                            sound: 'default'
                        }/*,
                        data: {
                            testdata: 'eleven',
                            testDataNumb: 11
                        }*/
                        //"time_to_live": 3600,
                    },
                    APNS:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        }/*,
                        data: {
                            testdata: 'eleven',
                            testDataNumb: 11
                        }*/
                    },
                    APNS_SANDBOX:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        }/*,
                        data: {
                            testdata: 'eleven',
                            testDataNumb: 11
                        }*/
                    }
                }
            }
    		payload.GCM = JSON.stringify(payload.GCM);
            payload.APNS = JSON.stringify(payload.APNS);
            payload.APNS_SANDBOX = JSON.stringify(payload.APNS_SANDBOX);
            payload = JSON.stringify(payload);
    		sns.publish({
                TargetArn: arn,
                Message: payload,
                MessageStructure: 'json'
            }, function(err, data){
    			if(err){
    				console.log(err.stack);
      				return;
    			}
    			console.log("push send", JSON.stringify(data));
    		})
    	}

        /*
        Function to send notification
        */
        function sendNotificationChats(msg, arn, extra, name){
            //if(ionic.Platform.isAndroid())
            var payload = "";
            if(extra!=null){
                payload = {
                    default:msg,
                    GCM: {
                        notification: {
                            text: msg,
                            sound: 'default'
                        },
                        data: {
                            typeData: 'Message',
                            name: name
                        }
                    },
                    APNS:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        },
                        data: {
                            typeData: 'Message',
                            name: name
                        }
                    },
                    APNS_SANDBOX:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        },
                        data: {
                            typeData: 'Message',
                            name: name
                        }
                    }
                }
            } else {
                payload = {
                    default:msg,
                    GCM: {
                        notification: {
                            text: msg,
                            sound: 'default'
                        }/*,
                        data: {
                            testdata: 'eleven',
                            testDataNumb: 11
                        }*/
                        //"time_to_live": 3600,
                    },
                    APNS:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        }/*,
                        data: {
                            testdata: 'eleven',
                            testDataNumb: 11
                        }*/
                    },
                    APNS_SANDBOX:{
                        aps:{
                            alert: msg,
                            badge: 1,
                            sound: 'default'
                        }/*,
                        data: {
                            testdata: 'eleven',
                            testDataNumb: 11
                        }*/
                    }
                }
            }
            payload.GCM = JSON.stringify(payload.GCM);
            payload.APNS = JSON.stringify(payload.APNS);
            payload.APNS_SANDBOX = JSON.stringify(payload.APNS_SANDBOX);
            payload = JSON.stringify(payload);
            sns.publish({
                TargetArn: arn,
                Message: payload,
                MessageStructure: 'json'
            }, function(err, data){
                if(err){
                    console.log(err.stack);
                    return;
                }
                console.log("push send", JSON.stringify(data));
            })
        }        

		/*
		Function to obtain platformEndpoint
		needed to send notifications device to device or server to device
    	*/
    	function awsInit(){
            var isIOS = ionic.Platform.isIOS();
            var isAndroid = ionic.Platform.isAndroid();
            var ARN = null;
            if(isAndroid === true){
                ARN = s3.platformARN_ANDROID;
            } else {
                //ARN = s3.platformARN_IOS;
                ARN = s3.platformARN_IOSDEV;
            }
    		sns.createPlatformEndpoint({
    			//PlatformApplicationArn: 'arn:aws:sns:us-west-2:924430439314:app/GCM/niidoApp',
	        	PlatformApplicationArn: ARN,
	        	Token: window.localStorage.getItem('AWSToken')
	        }, function(err,data){
	        	if(err){
	        		console.log(err, err.stack);
	        	}
	        	else{
	        		//console.log(data);
	        		window.localStorage.setItem('EndpointArn', data.EndpointArn);
                    UserService.getDevices(
                      window.localStorage.getItem('userSubscriptionInstanceId')
                    ).$promise.then(function success(response){
                        var counter =0;
                        for(var i=0; i< response.value.length; i++){
                            if(window.localStorage.getItem('EndpointArn') == response.value[i].title){
                                counter++;
                            }
                        }
                        if(counter==0){
                            UserService.addDevice({
                                objectId: window.localStorage.getItem('userSubscriptionInstanceId')
                            }).save({
                                "userDeviceId":{
                                    "value": window.localStorage.getItem('EndpointArn')
                                },
                                "status":{
                                    "value": "valid"
                                }
                            }).$promise.then(function success(){
                                console.log("nice addDevice");
                            }, function (response){
                                console.log("error addDevice");
                            })
                        }
                    });
	        		suscribeAWS();
	        	}
	        })
	    }

	    /*
		Function to obtain platformEndpoint
		needed to send notifications device to device or server to device
    	*/
    	function suscribeAWS(){
        	sns.subscribe({
        		Protocol: 'application',
        		TopicArn: s3.topicARN,
        		Endpoint: window.localStorage.getItem('EndpointArn')
        	}, function(err,data){
        		if(err){
        			console.log(err, err.stack);
        		} else {
        			window.localStorage.setItem('suscriptionIdAWS', data.SubscriptionArn);
        			//console.log(data);
        		}
        	});
    	}

    	/*
    	Function to delete platformendpoint
    	when user log out or when user delete account
    	*/
    	function deletePlatformEndpoint(logout){
    		sns.deleteEndpoint({
    			EndpointArn: window.localStorage.getItem("EndpointArn")
    		}, function(err, data){
    			if(err){
    				console.log(err, err.stack);
    			} else {
    				//window.localStorage.removeItem('EndpointArn');
    				//window.localStorage.removeItem('suscriptionIdAWS');
    			}
    		});
            if(logout == 1){
                window.localStorage.clear();
                window.localStorage.setItem("onboardingComplete", "yes");
            }
    	}

    	return{
            sendNotification:sendNotification,
    		awsInit:awsInit,
    		suscribeAWS:suscribeAWS,
    		deletePlatformEndpoint:deletePlatformEndpoint
    	}
	}])
