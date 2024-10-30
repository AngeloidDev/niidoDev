"use strict";
appControllers
//controllers for functions in notifications.html for redirect and show count of messages
  .controller('messagesInboxCtrl', ['$scope', '$state', 'UserService', 'Utils', 'chatService',
    function ($scope, $state, UserService, Utils, chatService) {
      var myUserId = UserService.get_USER_ID();
      //console.log('messagesInboxCtrl', $state.params.subscriptionInstanceId);

      $scope.data = {};
      $scope.data.inboxData = [];
      $scope.searching = false;
      $scope.errorLoading = false;
      $scope.noMoreItemsAvailable = false;
      //code for chats

      $scope.data.pictureProfile = UserService.get_USER_PHOTO();


      //ZONE for init page
      $scope.init = function () {
        $scope.start = 0;
        $scope.count = 10;
        $scope.noMoreItemsAvailable = false;
        $scope.friends = [];
        $scope.errorLoading = false;
        window.localStorage.setItem('pendingMessagesForUser', '0');
      };
      $scope.init();
      //END ZONE for init page

      //Zone to fill page with list of chats
      $scope.tempoFillList = function () {
        chatService.findChatByUserSubscriptionWS({
          userId: myUserId,
          start: $scope.start,
          count: $scope.count
        }).$promise.then(function (friendList) {
          if (friendList.length > 1) {
            friendList.length--;
            for (var a = 0; a < friendList.length; a++) {
              var userForSearchData = "";
              //verificamos si trae friend ID
              //de tenerlo es chat 1 a 1
              if (friendList[a].friendId) {
                //Verificamos que el invitado al chat somos nosotros
                if (friendList[a].friendId.href.split('/')[6] == myUserId) {
                  userForSearchData = friendList[a].userSubscription.href.split('/')[6];
                }
                else {
                  userForSearchData = friendList[a].friendId.href.split('/')[6];
                }
                var userSend = UserService.getUserSubscriptionByinstanceId(userForSearchData);
                var mineMsg = false;
                if (friendList[a].lastUserSubscriptionMessage.href.split('/')[6] == myUserId) {
                  mineMsg = true;
                }
                         if(mineMsg === true){
                         friendList[a].chatMessageRead = true;
                         }

                $scope.data.inboxData.push({
                  chat_id: friendList[a].chat.href.split('/')[6],
                  chat_name: friendList[a].chatName,
                  chat_realName: friendList[a].chatName,
                  friendMessage: userSend,
                  chat_friend_list: null,
                  read: friendList[a].chatMessageRead,
                  message: friendList[a].lastChatMessage,
                  date: friendList[a].lastDateMessage,
                  mine: mineMsg,
                  idPush: friendList[a].friendId.href.split('/')[6],
                  groupal: false
                });
              }
              else {
                //sino tiene friendID es chat grupal
                if (friendList[a].lastUserSubscriptionMessage.href.split('/')[6] == myUserId) {
                  userForSearchData = myUserId;
                }
                else {
                  userForSearchData = friendList[a].lastUserSubscriptionMessage.href.split('/')[6];
                }

                /*var userInsideChat = chatService.getusersFromChatRoomWS(friendList[a].chat.href.split('/')[6]);*/
                var userSend = UserService.getUserSubscriptionByinstanceId(userForSearchData);
                var mineMsg = false;
                if (friendList[a].lastUserSubscriptionMessage.href.split('/')[6] == window.localStorage.getItem("userSubscriptionInstanceId")) {
                  mineMsg = true;
                }
                var isOwner = false;
                if (friendList[a].userSubscription.href.split('/')[6] == window.localStorage.getItem("userSubscriptionInstanceId")) {
                  isOwner = true;
                }
                $scope.data.inboxData.push({
                  chat_id: friendList[a].chat.href.split('/')[6],
                  chat_name: friendList[a].chatDescription,
                  chat_realName: friendList[a].chatName,
                  friendMessage: userSend,
                  //chat_friend_list: userInsideChat,
                  read: friendList[a].chatMessageRead,
                  message: friendList[a].lastChatMessage,
                  date: friendList[a].lastDateMessage,
                  mine: mineMsg,
                  imOwner: isOwner,
                  idPush: null,
                  groupal: true
                });
              }
            }
            $scope.start = $scope.data.inboxData.length;
          }
          else {
            $scope.noMoreItemsAvailable = true;
          }
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }, function (error) {
          console.error("Doesn't have any friends", error);
          $scope.errorLoading = true;
          $scope.noMoreItemsAvailable = true;
          $scope.$broadcast('scroll.infiniteScrollComplete');
        })
      };
      //END Zone to fill page with list of chats

      //ZONE to redirect chat
      $scope.openSelectedChat = function (data) {
        var basicParams = {
          "chatID": data.chat_id,
          "lastMsg": data.message,
          "mine": data.mine,
          "dateMsg": data.date,
          "nameFriend": (data.mine ? UserService.get_USER_NAME() : data.friendMessage.members.name.value),
          "friendID": data.friendMessage.members.userId.value,
          "read": data.read,
          "inbox": true,
          "friendTitle": data.friendMessage.members.name.value
        };

        if (data.groupal) {
          basicParams.chatName = data.chat_realName;
          basicParams.chatShowName = data.chat_name;
          basicParams.imOwner = data.imOwner;
          $state.go('chatGroupalPage', basicParams, {reload: true});
        }
        else {
          basicParams.chatName = data.chat_name;
          $state.go('chatPage', basicParams, {reload: true});
        }
      };
      //END ZONE to redirect chat

      //ZONE to redirect to search for user without a chat
      $scope.openNewChat = function () {
        console.log("Open search for new chat");
        $state.go('searchNewChats', {}, {reload: true});
      };
      //END ZONE to redirect to search for user without a chat

      //zone to show and quit button upload zone
      $scope.data.showButtonsArea = false;
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

  .controller('searchNewChatCtrl', ['$scope', '$state', 'UserService', 'Utils', 'chatService', 'AWSServices',
    function ($scope, $state, UserService, Utils, chatService, AWSServices) {
      var myUserId = UserService.get_USER_ID();

      $scope.connectedSocket = false;

      if ($scope.connectedSocket == false) {
        //old dns
        //var socket = io.connect('http://ec2-34-212-194-26.us-west-2.compute.amazonaws.com:3000/');
        //dns for development
        var socket = io.connect('http://ec2-54-69-184-92.us-west-2.compute.amazonaws.com:3000/');
        //dns for production
        //var socket = io.connect('http://ec2-54-212-245-106.us-west-2.compute.amazonaws.com:3000/');
        //dns for lady multitask
        //var socket = io.connect('http://ec2-52-13-211-102.us-west-2.compute.amazonaws.com:3000/');
        $scope.connectedSocket = true;
      }

      $scope.data = {};
      $scope.data.maxLength = 0;
      $scope.connectedSocket = false;
      $scope.me = {
        name: UserService.get_USER_NAME(),
        id: myUserId
      };
      $scope.data.typeMessage = 'Grupal';

      //function for buttons about type of message
      $scope.changeTab = function (type) {
        $scope.data.typeMessage = type;
      };

      socket.on('connect', function (data) {
        $scope.connectedSocket = true;
        console.log("obtain data from socket");
      });

      //ZONE to get suggested friends
      $scope.loadMembers = function () {
        $scope.sugestedFriends = [];
        $scope.isLoadingMembers = true;
        UserService.findFriendsByUserSubscriptionId({
          userId: myUserId,
          start: 0,
          count: 10
        }).$promise.then(function (getResponse) {
          if (getResponse.length > 0) {
            getResponse.forEach(function (user) {
              var promise = UserService.getDevices(user.userSubscription.href.split('/')[6]);

              $scope.sugestedFriends.push({
                avatar: Utils.getUserImgUrl(user),
                userSubscription: user.userSubscription.href.split('/')[6],
                name: user.name,
                dataForPush: promise
              });
            })
          }
          $scope.isLoadingMembers = false;
        }, function (getError) {
          console.error(getError);
          //ToDo: Mostrar mensaje de error...
          $scope.isLoadingMembers = false;
        })
      };
      //$scope.loadMembers();
      //

      //after enter this page show the search zone
      //if the view is cached, we need to do this...
      $scope.$on('$ionicView.afterEnter', function () {
        //console.log('$ionicView.afterEnter')
        if ($state.params.prepareSearch == 1)
          $scope.openStatementForm();
      });

      $scope.openStatementForm = function () {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          controller: "ChatSearchUsersCtrl",
          templateUrl: 'templates/Messages/selectUsersforChat.html',
          clickOutsideToClose: false,
          fullscreen: true, // Only for -xs, -sm breakpoints.
          locals: {
            groupData: $scope.asyncContacts,
            dialog: dialog
          },
          openFrom: '#right',
          multiple: true
        }).then(function (resp) {
          $scope.asyncContacts = resp;
        });

        $scope.statementBtnAction = 'close';
      };

      //Zone for searchs specific users
      $scope.asyncContacts = [];
      $scope.filterSelected = true;

      //Zone for searchs of users without a chat

      //Zone for the process to create new chat or send message to old one
      $scope.data.friendsIdList = [];
      $scope.data.friendsIdListclean = [];
      $scope.data.listDataSendMessage = [];
      $scope.data.listMessagesData = {};
      $scope.data.sentMessageChat = "";

      $scope.checkBeforeChats = function (text) {
        Utils.loading.show(Utils.translate('PRIVATEMESSAGE.SENDINGMSG'));
        $scope.data.sentMessageChat = text;
        //if we selected more than one user after send message or create new chat
        //the user must be redirect to inbox and upload it
        if ($scope.asyncContacts.length > 1) {
          var checkPromises = {};
          var checkPromisesReverse = {};
          $scope.asyncContacts.forEach(function (user) {
            console.log("Friend selected: ", user);
            //Use WS to verify if between both users already have historic chat

            //Check if i created a chat with the user
            checkPromises[user.userSubscription] = chatService.findChatByMembersWS({
              userId: myUserId,
              friendId: user.userSubscription
            }).$promise;

            $scope.data.friendsIdList.push(user.userSubscription);

            //Check if the user created a chat with me
            checkPromisesReverse[user.userSubscription] = chatService.findChatByMembersWS({
              userId: user.userSubscription,
              friendId: myUserId
            }).$promise;

            //$scope.data.friendsIdList.push(user.userSubscription);
          });//End forEach()

          var promiseAll = Utils.$q.all(checkPromises);
          var promiseAllReverse = Utils.$q.all(checkPromisesReverse);
          var sendingMsg = {};
          Utils.$q.all({
            promiseAll: promiseAll,
            promiseAllReverse: promiseAllReverse
          }).then(function (responseCheck) {
            console.log("responseCheck.promiseAll", responseCheck.promiseAll);
            console.log("responseCheck.promiseAllReverse", responseCheck.promiseAllReverse);

            $scope.data.friendsIdList.forEach(function (friendId) {
              console.log("compossing message for friend: " + friendId);
              if (responseCheck.promiseAll[friendId].length > responseCheck.promiseAllReverse[friendId].length) {
                //Have chat created by me
                //prepare data
                var dataToSend = {
                  nameChat: responseCheck.promiseAll[friendId][0].chatName,
                  idChat: responseCheck.promiseAll[friendId][0].chat.href.split('/')[6],
                  newLS: false,
                  text: text,
                  friendID: responseCheck.promiseAll[friendId][0].friendId.href.split('/')[6]
                };
                var nameForChat = responseCheck.promiseAll[friendId][0].chatName;
                $scope.data.listMessagesData[nameForChat] = dataToSend;
                //Update data
                sendingMsg[nameForChat] = chatService.updateLastMessageWS({
                  idChat: responseCheck.promiseAll[friendId][0].chat.href.split('/')[6],
                  msg: text,
                  lastUser: myUserId
                }).$promise;

              }
              else if (responseCheck.promiseAll[friendId].length < responseCheck.promiseAllReverse[friendId].length) {
                //Have chat created by the friend
                //prepare data
                var dataToSend = {
                  nameChat: responseCheck.promiseAllReverse[friendId][0].chatName,
                  idChat: responseCheck.promiseAllReverse[friendId][0].chat.href.split('/')[6],
                  newLS: false,
                  text: text,
                  friendID: responseCheck.promiseAllReverse[friendId][0].userSubscription.href.split('/')[6],
                };
                var nameForChat = responseCheck.promiseAllReverse[friendId][0].chatName;
                $scope.data.listMessagesData[nameForChat] = dataToSend;
                //Update data
                sendingMsg[nameForChat] = chatService.updateLastMessageWS({
                  idChat: responseCheck.promiseAllReverse[friendId][0].chat.href.split('/')[6],
                  msg: text,
                  lastUser: myUserId
                }).$promise;

              }
              else {
                //doesn't have chat
                //prepare data
                var nameForChat = myUserId + "_" + friendId;
                var dataToSend = {
                  nameChat: nameForChat,
                  idChat: '',
                  newLS: true,
                  text: text,
                  friendID: friendId
                };
                $scope.data.listMessagesData[nameForChat] = dataToSend;
                //Save data
                sendingMsg[nameForChat] = chatService.addChatWS({
                  userId: myUserId,
                  friendId: friendId,
                  chatName: nameForChat,
                  lastChatMessage: text,
                  lastUsersubscription: myUserId,
                  read: false
                }).$promise;

              }
            });

            Utils.$q.all(sendingMsg).then(function (responseChats) {
              console.log("done add chat or update last message");
              document.getElementById('comment').value = "";
              var referenceD = Object.keys($scope.data.listMessagesData);
              var referenceL = Object.keys($scope.data.listMessagesData).length;
              for (var i = 0; i < referenceL; i++) {
                if ($scope.data.listMessagesData[referenceD[i]].idChat == '') {
                  $scope.data.listMessagesData[referenceD[i]].idChat = responseChats[referenceD[i]].result.value;
                }
              }
              $scope.asyncContacts.forEach(function (users, index) {
                var name = $scope.me.name;
                var message = name + Utils.translate('PUSHNOTIFICATION.PRIVATEMSG');
                for (var i = 0; i < users.dataForPush.value.length; i++) {
                  var endpointArn = users.dataForPush.value[i].title;
                  AWSServices.sendNotification(message, endpointArn);
                }
              });
              $scope.prepareMessageSending();
              //Redirect to inbox page
              //$state.go('menu.messagesInbox', {"subscriptionInstanceId": window.localStorage.getItem('userSubscriptionInstanceId')}, {reload: true});
            });
          });
        }
        else {
          //Use WS to verify if between both users already have historic chat
          var checkPromises = {};
          var checkPromisesReverse = {};
          $scope.data.newChatName = "";
          $scope.data.newChatID = "";
          $scope.data.newChatDate = "";
          $scope.data.newChatFriend = "";
          $scope.data.new = false;
          checkPromises[$scope.asyncContacts[0].userSubscription] = chatService.findChatByMembersWS({
            userId: myUserId,
            friendId: $scope.asyncContacts[0].userSubscription
          }).$promise;

          checkPromisesReverse[$scope.asyncContacts[0].userSubscription] = chatService.findChatByMembersWS({
            userId: $scope.asyncContacts[0].userSubscription,
            friendId: myUserId
          }).$promise;


          var promiseAll = Utils.$q.all(checkPromises);
          var promiseAllReverse = Utils.$q.all(checkPromisesReverse);
          var sendingMsg = {};
          Utils.$q.all({
            promiseAll: promiseAll,
            promiseAllReverse: promiseAllReverse
          }).then(function (responseCheck) {
            console.log("responseCheck.promiseAll", responseCheck.promiseAll);
            console.log("responseCheck.promiseAllReverse", responseCheck.promiseAllReverse);

            if (responseCheck.promiseAll[$scope.asyncContacts[0].userSubscription].length > responseCheck.promiseAllReverse[$scope.asyncContacts[0].userSubscription].length) {
              //Have chat created by me
              //gather data before switch to chatroom
              var nameForChat = responseCheck.promiseAll[$scope.asyncContacts[0].userSubscription][0].chatName;
              $scope.data.newChatName = nameForChat;
              $scope.data.newChatID = responseCheck.promiseAll[$scope.asyncContacts[0].userSubscription][0].chat.href.split('/')[6];
              $scope.data.newChatDate = responseCheck.promiseAll[$scope.asyncContacts[0].userSubscription][0].lastDateMessage;
              $scope.data.newChatFriend = $scope.asyncContacts[0].name;
            }
            else if (responseCheck.promiseAll[$scope.asyncContacts[0].userSubscription].length < responseCheck.promiseAllReverse[$scope.asyncContacts[0].userSubscription].length) {
              //Have chat created by the friend
              //prepare data
              var nameForChat = responseCheck.promiseAllReverse[$scope.asyncContacts[0].userSubscription][0].chatName;
              $scope.data.newChatName = nameForChat;
              $scope.data.newChatID = responseCheck.promiseAllReverse[$scope.asyncContacts[0].userSubscription][0].chat.href.split('/')[6];
              $scope.data.newChatDate = responseCheck.promiseAllReverse[$scope.asyncContacts[0].userSubscription][0].lastDateMessage;
              $scope.data.newChatFriend = $scope.asyncContacts[0].name;
            }
            else {
              //doesn't have chat
              //prepare data
              var nameForChat = myUserId + "_" + $scope.asyncContacts[0].userSubscription;
              $scope.data.newChatName = nameForChat;
              //prepare chat
              //Save data
              sendingMsg[nameForChat] = chatService.addChatWS({
                userId: myUserId,
                friendId: $scope.asyncContacts[0].userSubscription,
                chatName: nameForChat,
                lastChatMessage: text,
                lastUsersubscription: myUserId,
                read: false
              }).$promise;

              console.log("sendingMsg", sendingMsg)
            }

            Utils.$q.all(sendingMsg).then(function (responseChats) {
              //console.log("done", responseChats);
              var msg = $scope.data.sentMessageChat;
              document.getElementById('comment').value = "";
              if ($scope.data.newChatID == "") {
                $scope.data.newChatID = responseChats[$scope.data.newChatName].result.value;
                var d = new Date();
                $scope.data.newChatDate = d.getTime();
              }
              //Redirect to inbox page
              Utils.loading.hide();
              $state.go('chatPage', {
                "chatID": $scope.data.newChatID,
                "chatName": $scope.data.newChatName,
                "lastMsg": msg,
                "mine": true,
                "dateMsg": $scope.data.newChatDate,
                "nameFriend": $scope.asyncContacts[0].name,
                "friendID": $scope.asyncContacts[0].userSubscription,
                "read": false,
                "inbox": false,
                "friendTitle": $scope.asyncContacts[0].name
              }, {reload: true});
            });
          });
        }

      };
      //END Zone for the process to create new chat or send message to old one

      //Zone for the process to save in LS all the historic generated from chat
      $scope.addCreateHistorial = function (newer, room, msg, name, idSend) {
        var today = new Date();
        var newChatDate = today.getTime();
        var historic = [];
        var msgMine = true;
        if (idSend == $scope.me.id) {
          msgMine = 3;
        } else {
          msgMine = 2;
        }
        if (!newer) {
          historic = JSON.parse(window.localStorage.getItem(room));
          var historicLength = Object.keys(historic).length;
          historicLength++;
          var lastMessageSent = {
            message: msg,
            name: name,
            date: newChatDate,
            sender: idSend,
            type: msgMine
          };

          historic[historicLength] = lastMessageSent;
          console.log("savin Room data LS", historic);
          window.localStorage.setItem(room, JSON.stringify(historic));
        } else {
          var lastMessageSent = {
            1: {
              message: msg,
              name: name,
              date: newChatDate,
              sender: idSend,
              type: msgMine
            }
          };

          historic = lastMessageSent;
          console.log("saving Room data LS", historic);
          window.localStorage.setItem(room, JSON.stringify(historic));
        }
      };

      $scope.prepareMessageSending = function () {
        var referenceD = Object.keys($scope.data.listMessagesData);
        var referenceL = Object.keys($scope.data.listMessagesData).length;
        $scope.data.maxLength = referenceL;
        for (var i = 0; i < referenceL; i++) {
          //First access the chat
          var data = {
            room: $scope.data.listMessagesData[referenceD[i]].nameChat,
            roomId: $scope.data.listMessagesData[referenceD[i]].idChat,
            roomText: $scope.data.listMessagesData[referenceD[i]].text,
            friendToSend: $scope.data.listMessagesData[referenceD[i]].friendID,
            user: $scope.me.name,
            idSend: $scope.me.id,
            resumeServer: false,
            noPosition: 1
          };
          if (window.localStorage.getItem($scope.data.listMessagesData[referenceD[i]].nameChat)) {
            $scope.addCreateHistorial(
              false,
              $scope.data.listMessagesData[referenceD[i]].nameChat,
              $scope.data.listMessagesData[referenceD[i]].text,
              $scope.me.name,
              $scope.me.id
            );
          } else {
            $scope.addCreateHistorial(
              true,
              $scope.data.listMessagesData[referenceD[i]].nameChat,
              $scope.data.listMessagesData[referenceD[i]].text,
              $scope.me.name,
              $scope.me.id
            );
          }
          socket.emit('enterRoomOutside', data);
        }
      };
      //END Zone for the process to save in LS all the historic generated from chat

      //ZONE for listen when "visit" the chatroom to see if there's somebody
      socket.on('userJoinedExtra', function (data) {
        if (data.list > 0) {
          socket.emit("chatMessage", {
            room: data.room,
            message: data.roomText,
            user: $scope.me.name,
            idSend: $scope.me.id
          });
          if (data.list == "1") {
            chatService.addPendingMessageWS({
              senderId: $scope.me.id,
              friendId: data.friendToSend,
              message: data.roomText
            }).$promise.then(function (data) {
              console.log("Added new messages");
            }, function (error) {
              console.error("can't add to pending messages list");
            })
          } else {
            console.log("Sent");
          }
          $scope.data.maxLength = $scope.data.maxLength - data.noPosition;
          if ($scope.data.maxLength == 0) {
            socket.emit('ForceLeave');
            Utils.loading.hide();
            $state.go('menu.messagesInbox', {"subscriptionInstanceId": window.localStorage.getItem('userSubscriptionInstanceId')}, {reload: true});
          }
        } else {
          console.error("Can't connect");
        }
      });
      //END ZONE for listen when "visit" the chatroom to see if there's somebody
    }])

  .controller('chatPageCtrl', ['$scope', '$state', 'UserService', '$timeout', '$ionicScrollDelegate', 'AWSServices', 'chatService', 'ChatFactory', 'Utils',
    function ($scope, $state, UserService, $timeout, $ionicScrollDelegate, AWSServices, chatService, ChatFactory, Utils) {
      var myUserId = UserService.get_USER_ID();

      var ACTION = ChatFactory.getChatActionsEnum();

      /*/ for test
      var ls = window.localStorage.getItem('9_6');
      ls = ls?JSON.parse(ls):{};
      var lsLen = Object.keys(ls).length;
      ls[lsLen+1] = {"message":"hola"+(lsLen+1),"name":"Andrés Vergara ","sender":"9","type":(lsLen+1) % 3 == 0 ? 2:3};
      window.localStorage.setItem('9_6', JSON.stringify(ls));*/


      //init data
      //connect socket
      //console.log("chatPageCtrl", $state.params);

      var getChatHistory = function () {
        return ChatFactory.getChatHistory($state.params.chatName)
      };

      var isFirstMessage = false;

      $scope.connectedSocket = false;
      if ($scope.connectedSocket == false) {
        //old dns
        //var socket = io.connect('http://ec2-34-212-194-26.us-west-2.compute.amazonaws.com:3000/');
        //dns for development
        var socket = io.connect('http://ec2-54-69-184-92.us-west-2.compute.amazonaws.com:3000/');
        //dns for production
        //var socket = io.connect('http://ec2-54-212-245-106.us-west-2.compute.amazonaws.com:3000/');
        //dns for lady multitask
        //var socket = io.connect('http://ec2-52-13-211-102.us-west-2.compute.amazonaws.com:3000/');
        $scope.connectedSocket = true;
      }
      $scope.chatMessage = "";
      $scope.data = {};
      $scope.data.chatData = [];
      $scope.me = {
        name: UserService.get_USER_NAME(),
        id: myUserId
      };
      $scope.connected = false;
      $scope.errorLoading = false;
      $scope.typing = false;
      var lastTypingTime;
      $scope.data.usersOnline = 1;
      $scope.data.sizeChanged = false;
      $scope.data.visualTitle = $state.params.friendTitle;
      $scope.data.chatTitle = $state.params.chatName;
      $scope.data.IdenChat = $state.params.chatID;
      $scope.data.myName = $scope.me.name;
      $scope.data.realLength = 0;
      //

      //backButton
      $scope.backClicked = function () {
        $state.go('menu.messagesInbox', {}, {reload: true});
      };
      //

      //Zone local function
      //Add all messages local/server to the list
      $scope.addChatMessage = function (data) {
        $scope.data.usersOnline = data.list;
        //check if the message was get by the other user
        //console.log("users online:", $scope.data.usersOnline);

        //Get current length of temporal historic and add the message
        //to it
        if (data.type == ACTION.MY_MSG || data.type == ACTION.FRIEND_MSG) {
          $scope.data.realLength++;
          var d = new Date();
          var newChatDate = d.getTime();
          var newMessage = {
            message: data.message,
            name: data.name,
            date: newChatDate,
            sender: data.idUser,
            type: data.type
          };

          $scope.data.sizeChanged = true;

          var tempoLSHistoric = JSON.parse(getChatHistory()) || {};
          var LSLength = Object.keys(tempoLSHistoric).length + 1;
          tempoLSHistoric[LSLength] = newMessage;

          if (!isFirstMessage) {
            //console.log("addChatMessage: saving data LS",tempoLSHistoric);
            window.localStorage.setItem($state.params.chatName, JSON.stringify(tempoLSHistoric));
            if (data.type == ACTION.FRIEND_MSG)
              $scope.data.chatData[$scope.data.realLength] = newMessage;
          }

          isFirstMessage = false;
        }

        //Zone to apply visual changes if the message isn't ours
        //if(data.type == 2){
        $scope.$apply();
        //}
        $ionicScrollDelegate.scrollBottom();
        //
        if($state.params.inbox == 'false'){
          var tempoLSHistoric = JSON.parse(getChatHistory()) || {};
          $scope.data.chatData = tempoLSHistoric;
          $scope.$apply();
          $ionicScrollDelegate.scrollBottom();
          $state.params.inbox = true;
        }
      };
      //
      //

      //Zone for functions local to chat server
      //Enter chat New/Old // Called when enter page
      (function tryConnection(resume) {
        //console.log("tryConnection...");
        var historic;
        if (resume == false) {
          historic = JSON.parse(getChatHistory());
          if (historic) {
            //console.log("there is a previous historic with "+$state.params.chatName);
            var histEachOne = Object.keys(historic);
            $scope.data.realLength = histEachOne.length;
            /*if (histEachOne.length > 10) {
              var tope = histEachOne.length;
              for (var i = 1; i <= 10; i++) {
                var currentStep = tope - (10 - i);
                $scope.data.chatData[currentStep] = historic[currentStep];
              }
            } else {*/
              $scope.data.chatData = historic;
            //}
            $ionicScrollDelegate.scrollBottom();
            if ($state.params.read == "false" && $state.params.mine != "true") {
              chatService.updateLastMsgStatusWS({
                idChat: $state.params.chatID
              }).$promise.then(function (getResponse) {
                console.log("going out");
              }, function (getError) {
                console.error("can't add last message", getError);
              });
            }
          }
          else { // if not, first create the room in Ls for this room's historic
            isFirstMessage = true;
            //console.log("There was no previous historic between "+$state.params.chatName);
            var newType = ACTION.FRIEND_MSG;
            var lastMsgOwner = $state.params.nameFriend;
            var lastMsgOwnerId = $state.params.friendID;
            if ($state.params.mine == "true") {
              newType = ACTION.MY_MSG;
              lastMsgOwner = $scope.me.name;
              lastMsgOwnerId = $scope.me.id
            }
            else {
              chatService.updateLastMsgStatusWS({
                idChat: $state.params.chatID
              }).$promise.then(function (getResponse) {
                console.log("going out");
              }, function (getError) {
                console.error("can't add last message", getError);
              });
            }

            $scope.data.realLength = 1;
            historic = {
              1: {
                message: $state.params.lastMsg,
                name: lastMsgOwner,
                date: $state.params.dateMsg,
                sender: lastMsgOwnerId,
                type: newType
              }
            };

            //console.log("tryConnection: savin data LS",historic);
            window.localStorage.setItem($state.params.chatName, JSON.stringify(historic));

            $scope.data.chatData = historic;
          }
        }

        if ($scope.connectedSocket == true) {
          //var lastType = 2;
          //var historicLength = 0;
          historic = null;
          //var d = new Date();
          //var newChatDate = d.getTime();
          //Also prepare all the devices that the friend has
          if ($state.params.friendID) {
            var promise = UserService.getDevices($state.params.friendID);
          }
          $scope.devicePromise = promise;

          //when change to this page we try to connect
          socket.emit('enterRoom', {
            room: $state.params.chatName,
            user: $scope.me.name,
            idSend: $scope.me.id,
            resumeServer: resume
          });
        }
        $ionicScrollDelegate.scrollBottom();
      })(false);

      //ZONE for mantain keyboard open
      var buttonListening;
      $scope.$on('$ionicView.afterEnter', function () {
        console.log("chatPageCtrl $ionicView.afterEnter")
        $timeout(function () {
          buttonListening = document.getElementById("sendMessageBtn");
          Utils.keepKeyboardOpenWhenHitting(buttonListening, function () {
            $scope.sendMessage($scope.chatMessage);
          });
        }, 1000);
      });

      //Leave chatroom
      $scope.$on("$ionicView.beforeLeave", function () {
        Utils.doNotKeepKeyboardOpenWhenHitting(buttonListening);
        var data = {};
        if ($scope.connected) {
          //console.log("disconnect chatroom");
          $scope.data.chatData = [];
          //before disconnect we take the last message locate in the LS
          //save it in the server
          //only if we have at least one new message user to user
          if ($scope.data.sizeChanged) {
            var tempoLSHistorial = JSON.parse(window.localStorage.getItem($scope.data.chatTitle));
            var LSLength = Object.keys(tempoLSHistorial).length;
            var text = tempoLSHistorial[LSLength].message;
            var idSender = tempoLSHistorial[LSLength].sender;
            chatService.updateLastMessageWS({
              idChat: $scope.data.IdenChat,
              msg: text,
              lastUser: idSender
            }).$promise.then(function (getResponse) {
              console.log("going out");
            }, function (getError) {
              console.error("can't add last message", getError);
            });
          }
          //

          //Send request to server
          //leave room
          //console.log(socket.adapter.rooms);
          data = {room: $scope.data.chatTitle, user: $scope.data.myName};
          socket.emit('leaveRoom', data);
          socket.emit('ForceLeave');
          //
        } else {
          console.error("Doesn't have info of chat");
        }
      });
      //END ZONE

      //When user writes a message
      $scope.sendMessage = function (text) {
        console.log("sending message", text)
        //show it first in the view
        if (text != null) {
          if (text.trim()) {
            $scope.data.realLength++;
            var d = new Date();
            var newChatDate = d.getTime();
            var newMessage = {
              message: text,
              name: $scope.me.name,
              date: newChatDate,
              sender: $scope.me.id,
              type: "3"
            };

            $scope.data.sizeChanged = true;
            $scope.data.chatData[$scope.data.realLength] = newMessage;

            //Send it to server
            if ($scope.connected) {
              socket.emit("chatMessage", {
                room: $state.params.chatName,
                message: text,
                user: $scope.me.name,
                idSend: $scope.me.id
              });

              $scope.chatMessage = null;
            }
            else {
              console.error("Can't connect to chat service");
            }
          }
        }
      };

      //When user is typing
      $scope.isTyping = function () {
        if ($scope.connected) {
          if (!$scope.typing) {
            $scope.typing = true;
            socket.emit('chatTyping', {room: $state.params.chatName, user: $scope.me.name});
          }
          lastTypingTime = (new Date()).getTime();

          $timeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= 400 && $scope.typing) {
              socket.emit('chatStopTyping', {room: $state.params.chatName, user: $scope.me.name});
              $scope.typing = false;
            }
          }, 400);
        } else {
          console.error("Can't connect to chat service");
        }
      };

      //When user wants to see Historial
      $scope.fillHistorial = function () {
        //console.log("fillHistorial...")
        var LSRealLS = JSON.parse(getChatHistory()) || {};
        var LSRealLSLength = Object.keys(LSRealLS).length;
        var chatData = Object.keys($scope.data.chatData);
        var chatDataLength = chatData.length;
        var temporalFillList = [];
        if (LSRealLSLength > chatDataLength) {
          var rest = LSRealLSLength - chatDataLength;
          if (rest >= 10) {
            for (var i = 1; i <= 10; i++) {
              var currentStep = rest - (10 - i);
              $scope.data.chatData[currentStep] = LSRealLS[currentStep];
            }

          } else {
            for (var i = 1; i <= rest; i++) {
              var currentStep = rest - (rest - i);
              $scope.data.chatData[currentStep] = LSRealLS[currentStep];
            }
          }
          $scope.$broadcast('scroll.refreshComplete');
        } else {
          $scope.$broadcast('scroll.refreshComplete');
        }
      };



      //END for functions local to chat server


      //Zone LISTEN TO server
      //Trigger when a user joins an chatroom
      socket.on('userJoined', function (data) {
        console.log("socket.on.userJoined", data);
        //var historic = "";
        if (data.list > 0) { //after somebody joins the chat need to check if was made the connection
          if (data.idUser != $scope.me.id) { //check if the joined user it's me or friend
            data.type = ACTION.LEFT_CHAT;
            data.message = data.name + Utils.translate('PRIVATEMESSAGE.JOINED_USER');
            //data.message = data.name + " enter the chat";
            $scope.addChatMessage(data);
          }
          else {
            $scope.connected = true;
            if (!data.resumeServer) { //if the connection isn't resumed to avoid duplicate historic
              if ($state.params.inbox == 'false') { //if we came from newMsgPage we send any message
                socket.emit("chatMessage", {
                  room: $state.params.chatName,
                  message: $state.params.lastMsg,
                  user: $scope.me.name,
                  idSend: $scope.me.id
                });
              }
            }
            $ionicScrollDelegate.scrollBottom();
          }
        } else {
          console.error("Can't connect");
        }
      }, function (error) {
        console.error("socket.on.userJoined", error);
      });

      //Called when other user send new message // count mine's - USED
      socket.on('chatMessage', function (responseData) {
        console.log("data", responseData)
        if (responseData.idUser == $scope.me.id) {
          responseData.type = ACTION.MY_MSG;
          //the number of users in the room...
          if (responseData.list == "1") {
            //if the server return the last message (mine)
            //but at the moment only me was present
            //first save the msg in server to pending messages
            chatService.addPendingMessageWS({
              senderId: $scope.me.id,
              friendId: $state.params.friendID,
              message: responseData.message
            }).$promise.then(function (data) {
              var message = $scope.me.name + Utils.translate('PUSHNOTIFICATION.PRIVATEMSG');
              for (var i = 0; i < $scope.devicePromise.value.length; i++) {
                var endpointArn = $scope.devicePromise.value[i].title;
                AWSServices.sendNotification(message, endpointArn, true, $scope.me.name);
              }
            }, function (error) {
              console.error("can't add to pending messages list", error);
            })
          }

          ChatFactory.updateLastMessage({
            chatId: $scope.data.IdenChat,
            userId: responseData.idUser,
            message: responseData.message
          }).then();
        }
        else {
          responseData.type = ACTION.FRIEND_MSG;
        }
        $scope.addChatMessage(responseData);
      });

      //Called when other user lefts the chat - USED
      socket.on('userLeaved', function (data) {
        data.type = ACTION.LEFT_CHAT;
        data.message = data.name + " left";
        $scope.addChatMessage(data);
      });

      //Called when other user is typing - USED
      socket.on('chatTyping', function (data) {
        data.type = ACTION.IS_TYPING;
        data.message = data.name + " is typing";
        $scope.addChatMessage(data);
      });

      //Called when other user stop Typing - IMPLEMENTADA NO USADA
      socket.on('chatStopTyping', function (data) {
        //data.type = 4;
        //$scope.addChatMessage(data);
      });

      //Called when user disconnect//server shutdown - AUTOMATICO DEL SERVER
      socket.on('disconnect', function () {
        $scope.connected = false;
        console.log("got out of chat");
      });

      //Called when user reconnect - AUTOMATICO DEL SERVER
      socket.on('reconnect', function () {
        $scope.connected = true;
        console.log("reconnect server");
      });

      //Called when can't get a connection - AUTOMATICO DEL SERVER
      socket.on('reconnect_error', function () {
        $scope.connected = false;
        console.log("Can't connect with user");
      });

      //Called when the user connect with socket - AUTOMATICA DEL SERVER
      //triggers if the server reopen
      socket.on('connect', function (data) {
        $scope.connected = true;
        //$scope.tryConnection(true);
        //console.log("Conectado a server");
      });


      //Called when an user enters chat - NO USADA YA
      socket.on('login', function (data) {
        $scope.connected = true;
        data.type = ACTION.LEFT_CHAT;
        data.message = "Logged in";
        $scope.addChatMessage(data);
      });
      //
      //END LISTEN to server

    }])

  .controller("ChatSearchUsersCtrl", ["$scope", '$state', 'UserService', 'Utils', 'AsyncSearch', 'AWSServices', 'chatService', '$ionicPopup',
    function ($scope, $state, UserService, Utils, AsyncSearch, AWSServices, chatService, $ionicPopup) {

      var lastSearch, pendingSearch;
      var myUserHref = UserService.get_USER_INSTANCE_HREF();
      var myUserId = UserService.get_USER_ID();
      $scope.usersFound = [];
      $scope.connectedSocket = false;
      $scope.isSearching = false;
      $scope.isTexting = false;
      $scope.data = {
        userName: "",
        selectedUsers: [],
        showSelectedContactsList: false,
        readyForMessage: false,
        multipleUsers: false,
        maxLength: 0,
        typeMessage: 'Grupal',
        friendsIdList: [],
        friendsIdListclean: [],
        listDataSendMessage: [],
        listMessagesData: {},
        sentMessageChat: ""
      };
      $scope.me = {
        name: UserService.get_USER_NAME(),
        id: myUserId
      };
      $scope.usersChat = {};
      if ($scope.connectedSocket == false) {
        //old dns
        //var socket = io.connect('http://ec2-34-212-194-26.us-west-2.compute.amazonaws.com:3000/');
        //dns for development
        var socket = io.connect('http://ec2-54-69-184-92.us-west-2.compute.amazonaws.com:3000/');
        //dns for production
        //var socket = io.connect('http://ec2-54-212-245-106.us-west-2.compute.amazonaws.com:3000/');
        //dns for lady multitask
        //var socket = io.connect('http://ec2-52-13-211-102.us-west-2.compute.amazonaws.com:3000/');
        $scope.connectedSocket = true;
      }
      var pagination = {
        start: 0,
        count: 25
      };

      //funciones para el manejo de usuarios, selección y deselección
      $scope.findSuggestedFriends = function () {
        $scope.isSearching = true;
        UserService.findSuggestedFriends({
          userId: myUserId,
          start: pagination.start,
          count: pagination.count
        }).$promise.then(function (suggestedFriends) {
          console.log("here");
          var foundUsers = [];
          suggestedFriends.forEach(function (user) {
            if (user.name) {
              var promise = UserService.getDevices(user.userSubscription.href.split('/')[6]);
              foundUsers.push({
                avatar: user.profilePictureUrl || (user.profilePicture ? "data:image/jpeg;base64," + user.profilePicture.split(':')[2] : "img/ProfilePhoto.svg"),
                userSubscription: user.userSubscription.href.split('/')[6],
                //verified: user.verifyUser,
                name: user.name,
                _lowername: user.name.toLowerCase(),
                dataForPush: promise,
                isSelected: false
              });
            }
          });
          $scope.usersFound = foundUsers;
          $scope.data.showSelectedContactsList = false;
          $scope.isSearching = false;
        }, function (error) {
          console.error("couldn't get user list", error);
          $scope.errorLoading = true;
          $scope.isSearching = false;
        });
      };
      $scope.findSuggestedFriends();

      $scope.searchUsers = function () {
        $scope.usersFound = [];

        if (!$scope.data.userName || !debounceSearch()) return;

        $scope.isSearching = true;

        var term = $scope.data.userName;

        var deferred = Utils.$q.defer();
        AsyncSearch.findFriendUserSubscriptionsByUserNamev157({
          'userName': term,
          'withStart': pagination.start,
          'withCount': pagination.count
        }).then(function (UserResults) {
          var foundUsers = [];
          UserResults.forEach(function (user) {
            if (user.name) {
              var isInList = false;
              if ($scope.data.selectedUsers.length > 1) {
                isInList = $scope.data.selectedUsers.some(function (prevUser) {
                  return prevUser.userSubscription === user.userSubscription.href.split('/')[6];
                });
              }
              var promise = UserService.getDevices(user.userSubscription.href.split('/')[6]);
              foundUsers.push({
                avatar: user.profilePictureUrl || (user.profilePicture ? "data:image/jpeg;base64," + user.profilePicture.split(':')[2] : "img/ProfilePhoto.svg"),
                userSubscription: user.userSubscription.href.split('/')[6],
                verified: user.verifyUser,
                name: user.name,
                _lowername: user.name.toLowerCase(),
                dataForPush: promise,
                isSelected: isInList
              });
            }
          });
          $scope.usersFound = foundUsers;
          $scope.data.showSelectedContactsList = false;
          //console.log("UserResults", UserResults);
          refreshDebounce();
        }, function (error) {
          console.error("couldn't get user list", error);
          $scope.errorLoading = true;
        }).finally(function () {
          $scope.isSearching = false;
        });
      };

      $scope.selectUser = function (user, listIndex) {
        //verificar que no sea mi mismo usuario
        var itsMe = user.userSubscription === Utils.getLastUrlComponent(myUserHref);

        //Verificar que no este en lista previa
        var isInList = $scope.data.selectedUsers.some(function (prevUser) {
          return prevUser.userSubscription === user.userSubscription;
        });

        var whatIndex = $scope.data.selectedUsers.findIndex(function (prevUser) {
          return prevUser.userSubscription === user.userSubscription;
        });

        var idx = -1;
        if (!itsMe && !isInList) {
          //Select user
          user.isSelected = true;
          $scope.data.selectedUsers.push(user);
        } else if (itsMe) {
          //Utils.toast.info(Utils.translate("GROUPS.MEMBERS_MGMT.DIALOG.YOULL_BE_THE_ADMIN"));
          Utils.toast.info("Can't add yourself");
        } else if (isInList) {
          //Deselect user
          user.isSelected = false;
          //idx = $scope.data.selectedUsers.indexOf(user);
          $scope.data.selectedUsers.splice(whatIndex, 1);
        }
      };

      $scope.unselectUser = function (user, listIndex) {
        $scope.data.selectedUsers.splice(listIndex, 1);
        if (!$scope.data.selectedUsers.length)
          $scope.hideSelectedUsersList();
      };

      $scope.showSelectedUsersList = function () {
        $scope.data.showSelectedContactsList = $scope.data.selectedUsers.length > 0;
      };

      $scope.hideSelectedUsersList = function () {
        $scope.data.showSelectedContactsList = false;
        focusSearchInput();
      };
      //

      //funciones para la ventana

      //funcion when the users finally select all the users needed for chat
      $scope.okClicked = function () {
        $scope.data.showSelectedContactsList = false;
        //locals.dialog.hide($scope.data.selectedUsers);
        //first check how many users have selected
        if ($scope.data.selectedUsers.length == 1) {
          //Utils.toast.info(Utils.translate("GROUPS.MEMBERS_MGMT.DIALOG.YOULL_BE_THE_ADMIN"));
          var checkPromises = {};
          var checkPromisesReverse = {};
          $scope.data.newChatName = "";
          $scope.data.newChatID = "";
          $scope.data.newChatDate = "";
          $scope.data.newChatFriend = "";
          $scope.data.new = false;
          // check if anyone of the two users had created previously the chat
          checkPromises[$scope.data.selectedUsers[0].userSubscription] = chatService.findChatByMembersWS({
            userId: myUserId,
            friendId: $scope.data.selectedUsers[0].userSubscription
          }).$promise;


          checkPromisesReverse[$scope.data.selectedUsers[0].userSubscription] = chatService.findChatByMembersWS({
            userId: $scope.data.selectedUsers[0].userSubscription,
            friendId: myUserId
          }).$promise;

          //
          var promiseAll = Utils.$q.all(checkPromises);
          var promiseAllReverse = Utils.$q.all(checkPromisesReverse);
          var sendingMsg = {};
          Utils.$q.all({
            promiseAll: promiseAll,
            promiseAllReverse: promiseAllReverse
          }).then(function (responseCheck) {
            var nameForChat = "";
            if (responseCheck.promiseAll[$scope.data.selectedUsers[0].userSubscription].length > responseCheck.promiseAllReverse[$scope.data.selectedUsers[0].userSubscription].length) {
              //Have chat created by me
              //gather data before switch to chatroom
              nameForChat = responseCheck.promiseAll[$scope.data.selectedUsers[0].userSubscription][0].chatName;
              sendingMsg = {
                chatName: nameForChat,
                chatID: responseCheck.promiseAll[$scope.data.selectedUsers[0].userSubscription][0].chat.href.split('/')[6],
                chatDate: responseCheck.promiseAll[$scope.data.selectedUsers[0].userSubscription][0].lastDateMessage,
                chatFriend: $scope.data.selectedUsers[0].name,
                chatFriendID: $scope.data.selectedUsers[0].userSubscription,
                new: false,
                newLS: false
              }
            }
            else if (responseCheck.promiseAll[$scope.data.selectedUsers[0].userSubscription].length < responseCheck.promiseAllReverse[$scope.data.selectedUsers[0].userSubscription].length) {
              //Have chat created by the friend
              //prepare data
              nameForChat = responseCheck.promiseAllReverse[$scope.data.selectedUsers[0].userSubscription][0].chatName;
              sendingMsg = {
                chatName: nameForChat,
                chatID: responseCheck.promiseAllReverse[$scope.data.selectedUsers[0].userSubscription][0].chat.href.split('/')[6],
                chatDate: responseCheck.promiseAllReverse[$scope.data.selectedUsers[0].userSubscription][0].lastDateMessage,
                chatFriend: $scope.data.selectedUsers[0].name,
                chatFriendID: $scope.data.selectedUsers[0].userSubscription,
                new: false,
                newLS: false
              }
            }
            else {
              //doesn't have chat
              //prepare data
              nameForChat = myUserId + "_" + $scope.data.selectedUsers[0].userSubscription;
              sendingMsg = {
                chatName: nameForChat,
                chatID: "",
                chatDate: "",
                chatFriend: $scope.data.selectedUsers[0].name,
                chatFriendID: $scope.data.selectedUsers[0].userSubscription,
                new: true,
                newLS: true
              }
              //prepare chat
            }
            $scope.data.listMessagesData[nameForChat] = sendingMsg;
            //show area for write message
            $scope.data.readyForMessage = true;
            document.getElementById("list-before-chat").style.marginTop = "60px";
            $scope.data.multipleUsers = false;
          })
        } else if ($scope.data.selectedUsers.length > 1) {

          var checkPromises = {};
          var checkPromisesReverse = {};
          //check for each user selected if we have a chat in common
          $scope.data.selectedUsers.forEach(function (user) {
            console.log("Friend selected: ", user);
            //Use WS to verify if between both users already have historic chat

            //Check if i created a chat with the user
            checkPromises[user.userSubscription] = chatService.findChatByMembersWS({
              userId: myUserId,
              friendId: user.userSubscription
            }).$promise;

            $scope.data.friendsIdList.push(user.userSubscription);

            //Check if the user created a chat with me
            checkPromisesReverse[user.userSubscription] = chatService.findChatByMembersWS({
              userId: user.userSubscription,
              friendId: myUserId
            }).$promise;

            //$scope.data.friendsIdList.push(user.userSubscription);
          });
          //

          var promiseAll = Utils.$q.all(checkPromises);
          var promiseAllReverse = Utils.$q.all(checkPromisesReverse);
          var sendingMsg = {};
          //after checking for chats between user and the list
          Utils.$q.all({
            promiseAll: promiseAll,
            promiseAllReverse: promiseAllReverse
          }).then(function (responseCheck) {
            console.log("responseCheck.promiseAll", responseCheck.promiseAll);
            console.log("responseCheck.promiseAllReverse", responseCheck.promiseAllReverse);
            var nameForChat = "";
            $scope.data.selectedUsers.forEach(function (friendId) {
              console.log("compossing message for friend: " + friendId);
              if (responseCheck.promiseAll[friendId.userSubscription].length > responseCheck.promiseAllReverse[friendId.userSubscription].length) {
                //Have chat created by me
                //prepare data
                nameForChat = responseCheck.promiseAll[friendId.userSubscription][0].chatName;
                sendingMsg = {
                  chatName: nameForChat,
                  chatID: responseCheck.promiseAll[friendId.userSubscription][0].chat.href.split('/')[6],
                  chatDate: responseCheck.promiseAll[friendId.userSubscription][0].lastDateMessage,
                  chatFriend: friendId.name,
                  chatFriendID: friendId.userSubscription,
                  new: false,
                  newLS: false
                }
                $scope.data.listMessagesData[nameForChat] = sendingMsg;
              }
              else if (responseCheck.promiseAll[friendId.userSubscription].length < responseCheck.promiseAllReverse[friendId.userSubscription].length) {
                //Have chat created by the friend
                //prepare data
                nameForChat = responseCheck.promiseAllReverse[friendId.userSubscription][0].chatName;
                sendingMsg = {
                  chatName: nameForChat,
                  chatID: responseCheck.promiseAllReverse[friendId.userSubscription][0].chat.href.split('/')[6],
                  chatDate: responseCheck.promiseAllReverse[friendId.userSubscription][0].lastDateMessage,
                  chatFriend: friendId.name,
                  chatFriendID: friendId.userSubscription,
                  new: false,
                  newLS: false
                }
                $scope.data.listMessagesData[nameForChat] = sendingMsg;
              }
              else {
                //doesn't have chat
                //prepare data
                nameForChat = myUserId + "_" + friendId.userSubscription;
                sendingMsg = {
                  chatName: nameForChat,
                  chatID: "",
                  chatDate: "",
                  chatFriend: friendId.name,
                  chatFriendID: friendId.userSubscription,
                  new: true,
                  newLS: true
                }
                $scope.data.listMessagesData[nameForChat] = sendingMsg;
              }
            });
          });
          //
          $scope.data.readyForMessage = true;
          document.getElementById("list-before-chat").style.marginTop = "112px";
          $scope.data.multipleUsers = true;
        }
      };

      //function when only 1 user or X uers are selected
      //but it'll be direct messages
      $scope.chatOneforOne = function () {
        //do all if the user at least write 1 letter
        Utils.loading.show(Utils.translate('PRIVATEMESSAGE.SENDINGMSG'));
        if ($scope.data.sentMessageChat.length > 0) {
          //prepare the JSONlist with all the promises
          var sendingMsg = {};
          if (Object.keys($scope.data.listMessagesData).length == 1) {
            //get all index from json
            $scope.indexData = Object.keys($scope.data.listMessagesData)[0];
            // direct message 1x1
            if ($scope.data.listMessagesData[$scope.indexData].new) {
              //need to create new chat
              sendingMsg[$scope.data.listMessagesData[$scope.indexData].chatName] = chatService.addChatWS({
                userId: myUserId,
                friendId: $scope.data.listMessagesData[$scope.indexData].chatFriendID,
                chatName: $scope.data.listMessagesData[$scope.indexData].chatName,
                lastChatMessage: $scope.data.sentMessageChat,
                lastUsersubscription: myUserId,
                read: false
              }).$promise;

              //
            }
            //after create the chat if needed
            //prepare to send the user to the chat new or not
            Utils.$q.all(sendingMsg).then(function (responseChats) {
              var msg = $scope.data.sentMessageChat;
              if ($scope.data.listMessagesData[$scope.indexData].chatID == "") {
                $scope.data.listMessagesData[$scope.indexData].chatID = responseChats[$scope.data.listMessagesData[$scope.indexData].chatName].result.value;
                var d = new Date();
                $scope.data.listMessagesData[$scope.indexData].chatDate = d.getTime();
              }
              //Redirect to inbox page
              Utils.loading.hide();
              $state.go('chatPage', {
                "chatID": $scope.data.listMessagesData[$scope.indexData].chatID,
                "chatName": $scope.data.listMessagesData[$scope.indexData].chatName,
                "lastMsg": msg,
                "mine": true,
                "dateMsg": $scope.data.listMessagesData[$scope.indexData].chatDate,
                "nameFriend": $scope.data.listMessagesData[$scope.indexData].chatFriend,
                "friendID": $scope.data.listMessagesData[$scope.indexData].chatFriendID,
                "read": false,
                "inbox": false,
                "friendTitle": $scope.data.listMessagesData[$scope.indexData].chatFriend
              }, {reload: true});
            });
          } else if (Object.keys($scope.data.listMessagesData).length > 1) {
            //get size of array with selected users
            var sizeofUsers = Object.keys($scope.data.listMessagesData).length;
            //for each users repeat this process
            for (var i = 0; i < sizeofUsers; i++) {
              //get index to get info
              var indexDataArray = Object.keys($scope.data.listMessagesData)[i];
              //if the user doesn't have chat with us
              //create it first in server
              if ($scope.data.listMessagesData[indexDataArray].new) {
                sendingMsg[$scope.data.listMessagesData[indexDataArray].chatName] = chatService.addChatWS({
                  userId: myUserId,
                  friendId: $scope.data.listMessagesData[indexDataArray].chatFriendID,
                  chatName: $scope.data.listMessagesData[indexDataArray].chatName,
                  lastChatMessage: $scope.data.sentMessageChat,
                  lastUsersubscription: myUserId,
                  read: false
                }).$promise;

              } else {
                //if the user have already a chat with us
                //update the chat in server
                sendingMsg[$scope.data.listMessagesData[indexDataArray].chatName] = chatService.updateLastMessageWS({
                  idChat: $scope.data.listMessagesData[indexDataArray].chatID,
                  msg: $scope.data.sentMessageChat,
                  lastUser: myUserId
                }).$promise;

              }
            }

            Utils.$q.all(sendingMsg).then(function (responseChats) {
              var msg = $scope.data.sentMessageChat;
              var referenceD = Object.keys($scope.data.listMessagesData);
              var referenceL = Object.keys($scope.data.listMessagesData).length;
              for (var i = 0; i < referenceL; i++) {
                if ($scope.data.listMessagesData[referenceD[i]].idChat == '') {
                  $scope.data.listMessagesData[referenceD[i]].idChat = responseChats[referenceD[i]].result.value;
                }
              }
              $scope.data.selectedUsers.forEach(function (users, index) {
                var name = $scope.me.name;
                var message = name + Utils.translate('PUSHNOTIFICATION.PRIVATEMSG');
                for (var i = 0; i < users.dataForPush.value.length; i++) {
                  var endpointArn = users.dataForPush.value[i].title;
                  AWSServices.sendNotification(message, endpointArn);
                }
              });
              $scope.prepareMessageSending();
            })
          }
        } else {
          Utils.loading.hide();
        }
      }

      //function when multiple users are selected and
      //the main user want to create a new chatroom with them
      //Ask if wanna name the chat
      $scope.nameChatRoom = function () {
        if ($scope.data.sentMessageChat.length > 0) {
          var myPopup = $ionicPopup.prompt({
            title: Utils.translate('PRIVATEMESSAGE.WANNA_NAME_CHATROOM'),
            template: Utils.translate('PRIVATEMESSAGE.WRITE_NAME_CHATROOM'),
            inputType: 'text',
            inputPlaceholder: Utils.translate('PRIVATEMESSAGE.TITLE_CHATROOM')
          });
          myPopup.then(function (res) {
            if (res) {
              if (res != "") {
                $scope.chatRoomCreation(res);
              } else {
                //var nameRandom = "ChatRoom" + Math.floor(Math.random()*1000);
                var nameRandom = Utils.translate('PRIVATEMESSAGE.TEMPLATE_CHAT_NAME');
                $scope.chatRoomCreation(nameRandom);
              }
            } else {
              //var nameRandom = "ChatRoom" + Math.floor(Math.random()*1000);
              var nameRandom = Utils.translate('PRIVATEMESSAGE.TEMPLATE_CHAT_NAME');
              $scope.chatRoomCreation(nameRandom);
            }
          });
        }
      }

      $scope.chatRoomCreation = function (title) {
        $scope.data.chatRoomTitle = title;
        Utils.loading.show(Utils.translate('PRIVATEMESSAGE.SENDINGMSG'));
        if ($scope.data.sentMessageChat.length > 0) {
          if (Object.keys($scope.data.listMessagesData).length > 1) {
            //get all index from json
            var sizeofUsers = Object.keys($scope.data.listMessagesData).length;
            var chatRealName = $scope.me.id + '_';
            //create real name needed for socket
            for (var i = 0; i < sizeofUsers; i++) {
              var indexDataArray = $scope.data.listMessagesData[Object.keys($scope.data.listMessagesData)[i]].chatFriendID;
              chatRealName += indexDataArray + "_";
            }
            chatRealName += "" + Math.floor(Math.random() * 1000);
            $scope.data.chatRoomRealName = chatRealName;

            //create chatroom
            chatService.createChatRoomWS({
              id: myUserId,
              name: chatRealName,
              title: title,
              msg: $scope.data.sentMessageChat,
              user: myUserId,
              read: false
            }).$promise.then(function (getResponse) {
              $scope.data.ChatRoomID = getResponse.result.value;
              //$scope.data.listMessagesData[i].chatFriendID
              //Add all users in the list
              console.log("created chatroom");
              var promiseAddUsers = {};
              var sizeofUsers = Object.keys($scope.data.listMessagesData).length;
              for (var i = 0; i < sizeofUsers; i++) {
                var indexDataArray = Object.keys($scope.data.listMessagesData)[i];
                promiseAddUsers[indexDataArray] = chatService.addChatMemberWS({
                  id: $scope.data.listMessagesData[indexDataArray].chatFriendID,
                  chatID: '' + getResponse.result.value
                }).$promise;

              }

              Utils.$q.all(promiseAddUsers).then(function (responseChatAdd) {
                Utils.loading.hide();
                var d = new Date();
                var dateTime = d.getTime();
                $state.go('chatGroupalPage', {
                  "chatID": $scope.data.ChatRoomID,
                  "chatName": $scope.data.chatRoomRealName,
                  "chatShowName": $scope.data.chatRoomTitle,
                  "lastMsg": $scope.data.sentMessageChat,
                  "mine": true,
                  "imOwner": true,
                  "dateMsg": dateTime,
                  "nameFriend": window.localStorage.getItem("name"),
                  "friendID": window.localStorage.getItem("userSubscriptionInstanceId"),
                  "read": false,
                  "inbox": false,
                  "friendTitle": window.localStorage.getItem("name")
                }, {reload: true});
              }, function (errors) {
                Utils.loading.hide();
                console.error("createChatRoomWS All promises", errors)
              })
            }, function (getError) {
              Utils.loading.hide();
              console.error("can't create chatroom", getError);
            })
          }
        } else {
          Utils.loading.hide();
        }
      };

      //function to prepare all data for chatroom 1x1 and for LS
      $scope.prepareMessageSending = function () {
        var referenceD = Object.keys($scope.data.listMessagesData);
        var referenceL = Object.keys($scope.data.listMessagesData).length;
        $scope.data.maxLength = referenceL;
        for (var i = 0; i < referenceL; i++) {
          //First access the chat
          var data = {
            room: $scope.data.listMessagesData[referenceD[i]].chatName,
            roomId: $scope.data.listMessagesData[referenceD[i]].chatID,
            roomText: $scope.data.sentMessageChat,
            friendToSend: $scope.data.listMessagesData[referenceD[i]].chatFriendID,
            user: $scope.me.name,
            idSend: $scope.me.id,
            resumeServer: false,
            noPosition: 1
          };
          if (window.localStorage.getItem($scope.data.listMessagesData[referenceD[i]].chatName)) {
            $scope.addCreateHistorial(
              false,
              $scope.data.listMessagesData[referenceD[i]].chatName,
              $scope.data.sentMessageChat,
              $scope.me.name,
              $scope.me.id
            );
          } else {
            $scope.addCreateHistorial(
              true,
              $scope.data.listMessagesData[referenceD[i]].chatName,
              $scope.data.sentMessageChat,
              $scope.me.name,
              $scope.me.id
            );
          }
          socket.emit('enterRoomOutside', data);
        }
      }

      //Add Ls from the message sent to X users
      $scope.addCreateHistorial = function (newer, room, msg, name, idSend) {
        var today = new Date();
        var newChatDate = today.getTime();
        var historic = [];
        var msgMine = true;
        if (idSend == $scope.me.id) {
          msgMine = 3;
        } else {
          msgMine = 2;
        }
        if (!newer) {
          historic = JSON.parse(window.localStorage.getItem(room));
          var historicLength = Object.keys(historic).length;
          historicLength++;
          var lastMessageSent = {
            message: msg,
            name: name,
            date: newChatDate,
            sender: idSend,
            type: msgMine
          };
          historic[historicLength] = lastMessageSent;
          console.log("savin Room data LS", historic);
          window.localStorage.setItem(room, JSON.stringify(historic));
        } else {
          var lastMessageSent = {
            1: {
              message: msg,
              name: name,
              date: newChatDate,
              sender: idSend,
              type: msgMine
            }
          }
          historic = lastMessageSent;
          console.log("savin Room data LS", historic);
          window.localStorage.setItem(room, JSON.stringify(historic));
        }
      };

      $scope.cancelClicked = function () {
        if ($scope.data.showSelectedContactsList)
          $scope.hideSelectedUsersList();
        else if ($scope.data.readyForMessage) {
          $scope.data.readyForMessage = false;
          $scope.data.multipleUsers = false;
          focusSearchInput();
        } else {
          //$ionicHistory.goBack(1);
          //window.history.back();
          $state.go('menu.messagesInbox', {}, {reload: true});
          //locals.dialog.cancel();
        }
      };

      function debounceSearch() {
        var now = new Date().getMilliseconds();
        lastSearch = lastSearch || now;
        return ((now - lastSearch) < 300);
      }

      function refreshDebounce() {
        lastSearch = 0;
        pendingSearch = null;
        //cancelSearch  = angular.noop;
      }

      var searchInput;

      function focusSearchInput() {
        setTimeout(function () {
          if (!searchInput)
            searchInput = document.getElementById('search-input');

          if (searchInput) {
            //searchInput = searchInput[searchInput.length - 1];
            searchInput.selectionStart = $scope.data.userName.length;
            searchInput.selectionEnd = $scope.data.userName.length;
            searchInput.focus();
          }
          else
            console.log("can't find search input")
        }, 900);
      }

      focusSearchInput();

      var deregisterHardBack = Utils.$ionicPlatform.registerBackButtonAction(
        $scope.cancelClicked, 101
      );

      // cancel custom back behaviour
      /*$scope.$on('$destroy', function () {
        deregisterHardBack();
      });*/

      //

      //funciones para chat; conexion, envío de información
      socket.on('connect', function (data) {
        $scope.connectedSocket = true;
        console.log("obtain data from socket");
      });

      //ZONE for listen when "visit" the chatroom to see if there's somebody
      socket.on('userJoinedExtra', function (data) {
        if (data.list > 0) {
          socket.emit("chatMessage", {
            room: data.room,
            message: data.roomText,
            user: $scope.me.name,
            idSend: $scope.me.id
          });
          if (data.list == "1") {
            chatService.addPendingMessageWS({
              senderId: $scope.me.id,
              friendId: data.friendToSend,
              message: data.roomText
            }).$promise.then(function (data) {
              console.log("Added new messages");
            }, function (error) {
              console.log("can't add to pending messages list");
            })
          } else {
            console.log("Sent");
          }
          $scope.data.maxLength = $scope.data.maxLength - data.noPosition;
          if ($scope.data.maxLength == 0) {
            socket.emit('ForceLeave');
            Utils.loading.hide();
            $state.go('menu.messagesInbox', {"subscriptionInstanceId": window.localStorage.getItem('userSubscriptionInstanceId')}, {reload: true});
          }
        } else {
          console.log("Can't connect");
        }
      });
      //
    }])

  .controller('chatGroupalCtrl', ['$scope', '$state', 'UserService', '$timeout', '$ionicScrollDelegate', 'AWSServices', 'chatService', 'ChatFactory', 'Utils',
    function ($scope, $state, UserService, $timeout, $ionicScrollDelegate, AWSServices, chatService, ChatFactory, Utils) {
      var myUserId = UserService.get_USER_ID();

      var ACTION = ChatFactory.getChatActionsEnum();

      //init data
      //connect socket
      //console.log("chatPageCtrl", $state.params);

      $scope.showSettingsBtn = true;

      var getChatHistory = function () {
        return ChatFactory.getChatHistory($state.params.chatName)
      };

      //Data
      var isFirstMessage = false;

      $scope.connectedSocket = false;
      if ($scope.connectedSocket == false) {
        //old dns
        //var socket = io.connect('http://ec2-34-212-194-26.us-west-2.compute.amazonaws.com:3000/');
        //dns for development
        var socket = io.connect('http://ec2-54-69-184-92.us-west-2.compute.amazonaws.com:3000/');
        //dns for production
        //var socket = io.connect('http://ec2-54-212-245-106.us-west-2.compute.amazonaws.com:3000/');
        //dns for lady multitask
        //var socket = io.connect('http://ec2-52-13-211-102.us-west-2.compute.amazonaws.com:3000/');
        $scope.connectedSocket = true;
      }
      $scope.chatMessage = "";
      $scope.data = {};
      $scope.data.chatData = [];
      $scope.me = {
        name: UserService.get_USER_NAME(),
        id: myUserId
      };
      $scope.connected = false;
      $scope.errorLoading = false;
      $scope.typing = false;
      var lastTypingTime;
      $scope.data.usersOnline = 1;
      $scope.data.sizeChanged = false;
      $scope.data.visualTitle = $state.params.chatShowName;
      $scope.data.chatTitle = $state.params.chatName;
      $scope.data.IdenChat = $state.params.chatID;
      $scope.data.myName = $scope.me.name;
      $scope.data.realLength = 0;
      $scope.data.deviceList = "";
      /**
       * @type {{chat:*, chatMember:*, userSubscription:{href:string}}[]|null}
       */
      $scope.data.usersInChat = null;
      $scope.data.imOwner = $state.params.imOwner;
      $scope.data.usersNeeded = 2;
      $scope.data.usersOnlineIDList = [];
      //

      //backButton
      $scope.backClicked = function () {
        $state.go('menu.messagesInbox', {}, {reload: true});
      };
      //

      //Zone local function
      //Add all messages local/server to the list
      $scope.addChatMessage = function (data) {
        $scope.data.usersOnline = data.list;
        //check if the message was get by the other user
        //console.log("users online:", $scope.data.usersOnline);

        //Get current length of temporal historic and add the message
        //to it
        if (data.type == ACTION.MY_MSG || data.type == ACTION.FRIEND_MSG) {
          $scope.data.realLength++;
          var d = new Date();
          var newChatDate = d.getTime();
          var newMessage = {
            message: data.message,
            name: data.name,
            date: newChatDate,
            sender: data.idUser,
            type: data.type
          };

          $scope.data.sizeChanged = true;

          var tempoLSHistoric = JSON.parse(getChatHistory()) || {};
          var LSLength = Object.keys(tempoLSHistoric).length + 1;
          tempoLSHistoric[LSLength] = newMessage;

          if (!isFirstMessage) {
            //console.log("addChatMessage: saving data LS",tempoLSHistoric);
            window.localStorage.setItem($state.params.chatName, JSON.stringify(tempoLSHistoric));
            if (data.type == ACTION.FRIEND_MSG)
              $scope.data.chatData[$scope.data.realLength] = newMessage;
          }

          isFirstMessage = false;
        }

        //Zone to apply visual changes if the message isn't ours
        //if(data.type == 2){
        $scope.$apply();
        //}
        $ionicScrollDelegate.scrollBottom();
        //
      };
      //
      $scope.openConfigPanel = function () {
        //$scope.data.invitedUsers
        //$scope.data.imOwner
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/Messages/configChat.html',
          controller: 'configChatCtrl',
          locals: {
            ownerShip: $scope.data.imOwner,
            invited: $scope.data.invitedUsers,
            title: $scope.data.visualTitle,
            chatID: $scope.data.IdenChat,
            ownID: $scope.me.id,
            activeUsers: $scope.data.usersOnlineIDList,
            dialog: dialog
          },
          clickOutsideToClose: false,
          fullscreen: true // Only for -xs, -sm breakpoints.
        }).then(function (resp) {
          if (resp.changeTitle) {
            $scope.data.visualTitle = resp.title;
            if ($scope.connected) {
              socket.emit("titleHasChanged", {
                room: $state.params.chatName,
                newTitle: $scope.data.visualTitle,
                user: $scope.me.name,
                idSend: $scope.me.id
              })
            }
            //function to server
            //change title for everyone
          }
          if (resp.kickoutUsers) {
            if (resp.kickoutUsers === true) {
              for (var i = 0; i < resp.ExpellIDArray.length; i++) {
                socket.emit("kickedOut", {
                  room: $state.params.chatName,
                  expellUser: resp.ExpellIDArray[i],
                  user: $scope.me.name,
                  idSend: $scope.me.id
                })
              }
            }
          }
          if (resp.getOut) {
            if (resp.getOut === true) {
              socket.emit("chatDied", {
                room: $state.params.chatName,
                user: $scope.me.name,
                idSend: $scope.me.id
              })
              $state.go('menu.messagesInbox', {}, {reload: true});
            }
          }
          $scope.data.invitedUsers = resp.userList;
          /*$scope.data.sequenceName = resp.description;
          $scope.data.mentionsList = resp.savedTags;*/
        });
      };
      //

      //Zone for functions local to chat server
      //Enter chat New/Old // Called when enter page
      (function tryConnection(resume) {
        //console.log("tryConnection...");
        var historic;
        if (resume == false) {
          historic = JSON.parse(getChatHistory());
          //trying to see if we have any historial saved
          if (historic) {
            //console.log("there is a previous historic with "+$state.params.chatName);
            var histEachOne = Object.keys(historic);
            $scope.data.realLength = histEachOne.length;
            if (histEachOne.length > 10) {
              var tope = histEachOne.length;
              for (var i = 1; i <= 10; i++) {
                var currentStep = tope - (10 - i);
                $scope.data.chatData[currentStep] = historic[currentStep];
              }
            } else {
              $scope.data.chatData = historic;
            }
            $ionicScrollDelegate.scrollBottom();
            if ($state.params.read == "false" && $state.params.mine != "true") {
              chatService.updateLastMsgStatusWS({
                idChat: $state.params.chatID
              }).$promise.then(function (getResponse) {
                console.log("going out");
              }, function (getError) {
                console.error("can't add last message", getError);
              });
            }
          }
          else { // if not, first create the room in Ls for this room's historic
            isFirstMessage = true;
            //console.log("There was no previous historic between "+$state.params.chatName);
            var newType = ACTION.FRIEND_MSG;
            var lastMsgOwner = $state.params.nameFriend;
            var lastMsgOwnerId = $state.params.friendID;
            if ($state.params.mine == "true") {
              newType = ACTION.MY_MSG;
              lastMsgOwner = $scope.me.name;
              lastMsgOwnerId = $scope.me.id
            }
            else {
              chatService.updateLastMsgStatusWS({
                idChat: $state.params.chatID
              }).$promise.then(function (getResponse) {
                console.log("going out");
              }, function (getError) {
                console.error("can't add last message", getError);
              });
            }

            $scope.data.realLength = 1;
            historic = {
              1: {
                message: $state.params.lastMsg,
                name: lastMsgOwner,
                date: $state.params.dateMsg,
                sender: lastMsgOwnerId,
                type: newType
              }
            };

            //console.log("tryConnection: savin data LS",historic);
            window.localStorage.setItem($state.params.chatName, JSON.stringify(historic));

            $scope.data.chatData = historic;
          }
        }

        if ($scope.connectedSocket == true) {
          historic = null;
          //in  chatrooms we have many users inside
          //so we need an array to save al userDevices

          chatService.getusersFromChatRoomWS($state.params.chatID).$promise.then(
            /**
             * @type {{chat:*, chatMember:*, userSubscription:{href:string}}[]|null}
             */
            function (getUsersforDevice) {
              console.log("got them", getUsersforDevice);
              getUsersforDevice.length--;
              $scope.data.invitedUsers = getUsersforDevice;
              $scope.data.usersNeeded = getUsersforDevice.length;
              $scope.data.usersInChat = getUsersforDevice;

              var devicesPromises = {};
              getUsersforDevice.forEach(function (usersList) {
                var userId = Utils.getLastUrlComponent(usersList.userSubscription.href);
                devicesPromises[userId] = UserService.getDevices(userId).$promise;
              });

              Utils.$q.all(devicesPromises).then(function (responseCheck) {
                console.log(responseCheck);
                $scope.data.deviceList = responseCheck;
                socket.emit('enterRoom', {
                  room: $state.params.chatName,
                  user: $scope.me.name,
                  idSend: $scope.me.id,
                  resumeServer: resume
                });
              });
            }, function (getError) {
              console.error("can't add last message", getError);
            });

          /*if ($state.params.friendID) {
            var promise = UserService.getDevices($state.params.friendID);
          }
          $scope.devicePromise = promise;

          //when change to this page we try to connect
          */
        }
        $ionicScrollDelegate.scrollBottom();
      })(false);

      //ZONE for mantain keyboard open
      var buttonListening;
      $scope.$on('$ionicView.afterEnter', function () {
        console.log("chatPageCtrl $ionicView.afterEnter")
        $timeout(function () {
          buttonListening = document.getElementById("sendMessageBtn");
          Utils.keepKeyboardOpenWhenHitting(buttonListening, function () {
            $scope.sendMessage($scope.chatMessage);
          });
        }, 1000);
      });

      //END ZONE

      //When user writes a message
      $scope.sendMessage = function (text) {
        console.log("trying to send message", text);
        //show it first in the view
        if (text != null) {
          if (text.trim()) {
            $scope.data.realLength++;
            var d = new Date();
            var newChatDate = d.getTime();
            var newMessage = {
              message: text,
              name: $scope.me.name,
              date: newChatDate,
              sender: $scope.me.id,
              type: ACTION.MY_MSG
            };

            $scope.data.sizeChanged = true;
            $scope.data.chatData[$scope.data.realLength] = newMessage;

            //Send it to server
            if ($scope.connected) {
              socket.emit("chatMessage", {
                room: $state.params.chatName,
                message: text,
                user: $scope.me.name,
                idSend: $scope.me.id
              });
              $scope.chatMessage = null;
            }
            else {
              console.error("Can't connect to chat service");
            }
          }
        }
      };

      //When user is typing
      $scope.isTyping = function () {
        if ($scope.connected) {
          if (!$scope.typing) {
            $scope.typing = true;
            socket.emit('chatTyping', {room: $state.params.chatName, user: $scope.me.name});
          }
          lastTypingTime = (new Date()).getTime();

          $timeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= 400 && $scope.typing) {
              socket.emit('chatStopTyping', {room: $state.params.chatName, user: $scope.me.name});
              $scope.typing = false;
            }
          }, 400);
        } else {
          console.error("Can't connect to chat service");
        }
      };

      //When user wants to see Historial
      $scope.fillHistorial = function () {
        //console.log("fillHistorial...")
        var LSRealLS = JSON.parse(getChatHistory()) || {};
        var LSRealLSLength = Object.keys(LSRealLS).length;
        var chatData = Object.keys($scope.data.chatData);
        var chatDataLength = chatData.length;
        var temporalFillList = [];
        if (LSRealLSLength > chatDataLength) {
          var rest = LSRealLSLength - chatDataLength;
          if (rest >= 10) {
            for (var i = 1; i <= 10; i++) {
              var currentStep = rest - (10 - i);
              $scope.data.chatData[currentStep] = LSRealLS[currentStep];
            }

          } else {
            for (var i = 1; i <= rest; i++) {
              var currentStep = rest - (rest - i);
              $scope.data.chatData[currentStep] = LSRealLS[currentStep];
            }
          }
          $scope.$broadcast('scroll.refreshComplete');
        } else {
          $scope.$broadcast('scroll.refreshComplete');
        }
      };

      //Leave chatroom
      $scope.$on("$ionicView.beforeLeave", function () {
        Utils.doNotKeepKeyboardOpenWhenHitting(buttonListening);
        var data = {};
        if ($scope.connected) {
          //console.log("disconnect chatroom");
          $scope.data.chatData = [];
          //before disconnect we take the last message locate in the LS
          //save it in the server
          //only if we have at least one new message user to user
          if ($scope.data.sizeChanged) {
            var tempoLSHistorial = JSON.parse(window.localStorage.getItem($scope.data.chatTitle));
            var LSLength = Object.keys(tempoLSHistorial).length;
            var text = tempoLSHistorial[LSLength].message;
            var idSender = tempoLSHistorial[LSLength].sender;
            chatService.updateLastMessageWS({
              idChat: $scope.data.IdenChat,
              msg: text,
              lastUser: idSender
            }).$promise.then(function (getResponse) {
              console.log("going out");
            }, function (getError) {
              console.error("can't add last message", getError);
            });
          }
          //

          //Send request to server
          //leave room
          //console.log(socket.adapter.rooms);
          data = {room: $scope.data.chatTitle, user: $scope.data.myName, idSend: $scope.me.id};
          socket.emit('leaveRoom', data);
          socket.emit('ForceLeave');
          //
        } else {
          console.error("Doesn't have info of chat");
        }
      });

      //END for functions local to chat server


      //Zone LISTEN TO server
      //Trigger when a user joins an chatroom
      socket.on('userJoined', function (data) {
        console.log("socket.on.userJoined", data);
        $scope.data.usersOnlineIDList = data.friendsList;
        //var historic = "";
        if (data.list > 0) { //after somebody joins the chat need to check if was made the connection
          if (data.idUser != $scope.me.id) { //check if the joined user it's me or friend
            data.type = 0;
            data.message = data.name + Utils.translate('PRIVATEMESSAGE.JOINED_USER');
            //data.message = data.name + " enter the chat";
            $scope.addChatMessage(data);
          }
          else {
            $scope.connected = true;
            if (!data.resumeServer) { //if the connection isn't resumed to avoid duplicate historic
              if ($state.params.inbox == 'false') { //if we came from newMsgPage we send any message
                socket.emit("chatMessage", {
                  room: $state.params.chatName,
                  message: $state.params.lastMsg,
                  user: $scope.me.name,
                  idSend: $scope.me.id
                });
              }
            }
            $ionicScrollDelegate.scrollBottom();
          }
        } else {
          console.error("Can't connect");
        }
      }, function (error) {
        console.error("socket.on.userJoined", error);
      });

      //Called when other user send new message // count mine's - USED
      socket.on('chatMessage', function (responseData) {
        if (responseData.idUser == $scope.me.id) {
          responseData.type = ACTION.MY_MSG;
          //the number of users in the room... $scope.data.usersNeeded
          var onlineUsers = Number(responseData.list);
          if ($scope.data.usersNeeded > onlineUsers) {//some users are offline
            //CHANGE to an WS with all the users
            if ($scope.data.usersInChat) {

              var offlineUsers = [];
              $scope.data.usersInChat.forEach(
                /**@param userInChat {{chat:*, chatMember:*, userSubscription:{href:string}}}*/
                function (userInChat) {
                  var found = $scope.data.usersOnlineIDList.some(function (onlineUserId) {
                    return Utils.getLastUrlComponent(userInChat.userSubscription.href) == onlineUserId;
                  });

                  if (!found) {
                    offlineUsers.push(userInChat);

                    var userInChatId = Utils.getLastUrlComponent(userInChat.userSubscription.href);
                    if (userInChatId != $scope.me.id) {
                      ChatFactory.addPendingMessageChatRoom({
                        senderId: $scope.me.id,
                        chatId: $scope.data.IdenChat,
                        userId: userInChatId,
                        message: responseData.message
                      }).then();
                    }
                  }
                });

              offlineUsers.forEach(
                /**@param user {{chat:*, chatMember:*, userSubscription:{href:string}}}*/
                function (user) {
                  var name = $scope.me.name;
                  var message = name + Utils.translate('PUSHNOTIFICATION.PRIVATEMSG');
                  var offlineUserId = Utils.getLastUrlComponent(user.userSubscription.href);

                  Utils.removeLastItemIfHasNoAttribute($scope.data.deviceList[offlineUserId].value, 'title');
                  $scope.data.deviceList[offlineUserId].value.forEach(function (device) {
                    if ($scope.me.id != offlineUserId) {
                      AWSServices.sendNotification(message, device.title, true, $scope.me.name);
                    }
                  })
                });
            }
          }

          ChatFactory.updateLastMessage({
            chatId: $scope.data.IdenChat,
            userId: responseData.idUser,
            message: responseData.message
          }).then();
        }
        else {
          responseData.type = ACTION.FRIEND_MSG;
        }

        $scope.addChatMessage(responseData);
      });

      //Called when other user lefts the chat - USED
      socket.on('userLeaved', function (data) {
        data.type = ACTION.LEFT_CHAT;
        data.message = data.name + " left";
        //$scope.addChatMessage(data);
      });

      //Called when other user is typing - USED
      socket.on('chatTyping', function (data) {
        data.type = ACTION.IS_TYPING;
        data.message = data.name + " is typing";
        $scope.addChatMessage(data);
      });

      //Called when other user have changed the Title
      socket.on('titleHasChanged', function (data) {
        $scope.data.visualTitle = data.title;
        $scope.$apply();
      });
      //

      //Called when the owner deletes the chat
      socket.on('expellAll', function (data) {
        $state.go('menu.messagesInbox', {}, {reload: true});
      });
      //

      //Called when the owner kickout some users
      socket.on('expellUser', function (data) {
        if (data.idExpell === $scope.me.id) {
          $state.go('menu.messagesInbox', {}, {reload: true});
        }
      });
      //

      //Called when other user stop Typing - IMPLEMENTADA NO USADA
      socket.on('chatStopTyping', function (data) {
        //data.type = 4;
        //$scope.addChatMessage(data);
      });

      //Called when user disconnect//server shutdown - AUTOMATICO DEL SERVER
      socket.on('disconnect', function () {
        $scope.connected = false;
        console.log("got out of chat");
      });

      //Called when user reconnect - AUTOMATICO DEL SERVER
      socket.on('reconnect', function () {
        $scope.connected = false;
        console.log("reconnect server");
      });

      //Called when can't get a connection - AUTOMATICO DEL SERVER
      socket.on('reconnect_error', function () {
        $scope.connected = false;
        console.log("Can't connect with user");
      });

      //Called when the user connect with socket - AUTOMATICA DEL SERVER
      //triggers if the server reopen
      socket.on('connect', function (data) {
        $scope.connected = true;
        //$scope.tryConnection(true);
        //console.log("Conectado a server");
      });


      //Called when an user enters chat - NO USADA YA
      socket.on('login', function (data) {
        $scope.connected = true;
        data.type = ACTION.LEFT_CHAT;
        data.message = "Logged in";
        $scope.addChatMessage(data);
      });
      //
      //END LISTEN to server

    }])

  .controller('configChatCtrl', ['$scope', 'UserService', 'Utils', 'locals', 'chatService', 'AsyncSearch',
    function ($scope, UserService, Utils, locals, chatService, AsyncSearch) {
      var lastSearch,
        pendingSearch,
        cancelSearch = angular.noop;

      //Data
      var TAG = "Tag";
      var HASH = "Hash";
      var NONE = "none";

      //declare data
      var tagsSelected = [];
      var hashtagsSelected = [];
      /*
      ownerShip: $scope.data.imOwner,
      invited: $scope.data.invitedUsers
      */
      $scope.form = {
        chatIDForChanges: locals.chatID,
        imOwner: locals.ownerShip || false,
        userList: locals.invited || [],
        title: locals.title || "",
        savedTitle: locals.title || "",
        showActuals: true,
        changeTitle: false,
        myID: locals.ownID,
        activeUsersList: locals
      };
      $scope.data = {};
      $scope.data.textSearch = "";
      var pagination = {
        start: 0,
        count: 25
      };
      $scope.data.showAdded = [];
      $scope.data.userForAdd = [];
      $scope.data.userForDelete = [];
      $scope.isSearching = false;
      $scope.usersFound = [];
      //

      var description = "";
      var previousText = "";
      var textForSearch = "";
      var taskDoing = NONE;
      var textLength = 0;
      var deleting = false;
      $scope.isIOS = Utils.platformName() === 'ios';

      //functions for buttons
      $scope.cancelClicked = function () {
        locals.dialog.cancel();
      };

      $scope.okClicked = function () {
        //delete areaIsExpanded
        //show confirmation before anything
        var anyChanges = 0;
        if ($scope.form.title != $scope.form.savedTitle) {
          anyChanges++;
        }
        if ($scope.data.userForAdd.length > 0) {
          anyChanges++;
        }
        if ($scope.data.userForDelete.length > 0) {
          anyChanges++;
        }
        if (anyChanges > 0) {
          $scope.chainSaveTitle();
        } else {
          locals.dialog.cancel();
        }
      };

      $scope.chainSaveTitle = function () {
        var promiseAddUsers = {};
        if ($scope.form.title != $scope.form.savedTitle) {
          chatService.editTitleForChatWS({
            id: $scope.form.chatIDForChanges,
            description: $scope.form.title
          }).$promise.then(function (responseTitle) {
            $scope.form.changeTitle = true;
            $scope.form.savedTitle = $scope.form.title;
          }, function (errorTitle) {
            console.error('here', errorTitle);
          }).finally(function () {
            $scope.chainSaveUsers();
          });
        } else {
          $scope.form.changeTitle = false;
          $scope.chainSaveUsers();
        }
      };

      $scope.chainSaveUsers = function () {
        if ($scope.data.userForAdd.length > 0) {
          if ($scope.form.imOwner === "true") {
            var promiseAddUsers = [];
            for (var i = 0; i < $scope.data.userForAdd.length; i++) {
              promiseAddUsers.push(chatService.addChatMemberWS({
                id: $scope.data.userForAdd[i].userSubscription,
                chatID: '' + $scope.form.chatIDForChanges
              }).$promise);
            }
            Utils.$q.all(promiseAddUsers).then(function (gotUsers) {
              chatService.getusersFromChatRoomWS($scope.form.chatIDForChanges).$promise.then(function (gotInfoNeeded) {
                gotInfoNeeded.length--;
                $scope.form.userList = gotInfoNeeded;
              }, function (errorInfoNeeded) {
                console.error("can't add last message", errorInfoNeeded);
              }).finally(function () {
                $scope.chainDeleteUsers();
              })
            })
          } else {
            $scope.form.errorDel = "Only chat's owner can add/delete users";
            $scope.chainDeleteUsers();
          }
        } else {
          $scope.chainDeleteUsers();
        }
      };

      $scope.chainDeleteUsers = function () {
        if ($scope.data.userForDelete.length > 0) {
          if ($scope.form.imOwner === "true") {
            //check if user try to delete itself
            var deleteChat = false;
            for (var i = 0; i < $scope.data.userForDelete.length; i++) {
              if ($scope.data.userForDelete[i].userSubscription === $scope.form.myID) {
                deleteChat = true;
              }
            }
            if (deleteChat) {
              chatService.deleteChatroomWS({
                id: $scope.form.chatIDForChanges
              }).$promise.then(function (getResponse) {
                console.log("deletechat", getResponse);
              }, function (getError) {
                console.error("cant", getError);
              }).finally(function () {
                $scope.form.getOut = true;
                locals.dialog.hide($scope.form);
              });
            } else {
              //save list of users for individual expell
              var idNeedExpell = [];
              for (var a = 0; a < $scope.data.userForDelete.length; a++) {
                var forDel = $scope.data.userForDelete[a].userSubscription;
                idNeedExpell.push(forDel);
              }

              //get chatmemberID in array for delete WS
              var userForExpell = [];
              for (var a = 0; a < $scope.data.userForDelete.length; a++) {
                for (var b = 0; b < $scope.form.userList.length; b++) {
                  var origin = Utils.getLastUrlComponent($scope.form.userList[b].userSubscription.href);
                  var waiter = $scope.data.userForDelete[a].userSubscription;
                  if (origin === waiter) {
                    userForExpell.push($scope.form.userList[b].chatMember.href);
                  }
                }
              }
              var promiseAddUsers = [];
              for (var i = 0; i < userForExpell.length; i++) {
                var atentAddUser = chatService.deleteChatMemberWS({
                  id: Utils.getLastUrlComponent(userForExpell[i])
                }).$promise;
                promiseAddUsers.push(atentAddUser);
              }
              Utils.$q.all(promiseAddUsers).then(function (gotUsers) {
                chatService.getusersFromChatRoomWS($scope.form.chatIDForChanges).$promise.then(function (gotInfoNeeded) {
                  gotInfoNeeded.length--;
                  $scope.form.userList = gotInfoNeeded;
                }, function (errorInfoNeeded) {
                  console.error("can't add last message", errorInfoNeeded);
                }).finally(function () {
                  $scope.form.ExpellIDArray = idNeedExpell;
                  $scope.form.kickoutUsers = true;
                  locals.dialog.hide($scope.form);
                })
              })
            }
          } else {
            $scope.form.errorDel = "Only chat's owner can add/delete users";
            locals.dialog.hide($scope.form);
          }
        } else {
          locals.dialog.hide($scope.form);
        }
      };

      $scope.triggerSelect = function (user, listIndex, prevList) {
        if ($scope.form.imOwner === "true") {
          if (user.isSelected) {
            if (user.original) {
              $scope.data.showAdded[listIndex].isSelected = false;
              $scope.data.userForDelete.push(user);
            } else {
              if (prevList) {
                $scope.data.showAdded.splice(listIndex, 1);
              } else {
                var indexSaved = null;
                for (var i = 0; i < $scope.data.showAdded.length; i++) {
                  if ($scope.data.showAdded[i].userSubscription === user.userSubscription) {
                    indexSaved = i;
                  }
                }
                if (indexSaved != null) {
                  $scope.data.showAdded.splice(indexSaved, 1);
                }
                user.isSelected = false;
              }
              var indexSaved = null;
              for (var i = 0; i < $scope.data.userForAdd.length; i++) {
                if ($scope.data.userForAdd[i].userSubscription === user.userSubscription) {
                  indexSaved = i;
                }
              }
              if (indexSaved != null) {
                $scope.data.userForAdd.splice(indexSaved, 1);
              }
            }
          } else {
            if (user.original) {
              $scope.data.showAdded[listIndex].isSelected = true;
              var indexSaved02 = null;
              for (var i = 0; i < $scope.data.userForDelete.length; i++) {
                if ($scope.data.userForDelete[i].userSubscription === user.userSubscription) {
                  indexSaved02 = i;
                }
              }
              if (indexSaved02 != null) {
                $scope.data.userForDelete.splice(indexSaved, 1);
              }
            } else {
              var indexSaved01 = null;
              for (var i = 0; i < $scope.data.showAdded.length; i++) {
                if ($scope.data.showAdded[i].userSubscription === user.userSubscription) {
                  indexSaved01 = i;
                }
              }
              if (indexSaved01 != null) {
                console.log("already in members or selected to add");
              } else {
                user.isSelected = true;
                $scope.data.showAdded.push(user);
                $scope.data.userForAdd.push(user);
                $scope.usersFound.splice(listIndex, 1);
              }
            }
          }
        }
      };

      $scope.triggerViewList = function () {
        if ($scope.form.showActuals) {
          $scope.form.showActuals = false;
        } else {
          $scope.form.showActuals = true;
        }
      };
      //

      //functions for display data
      $scope.initData = function () {
        $scope.isSearching = true;
        var invitedLength = $scope.form.userList.length;
        for (var i = 0; i < invitedLength; i++) {
          chatService.findUserSubscriptionbyInstanceIdWS($scope.form.userList[i].userSubscription.href).$promise.then(function (getFind) {
            console.log("get", getFind);
            getFind.length--;
            var promise = UserService.getDevices(getFind[0].userSubscription.href.split('/')[6]);
            $scope.data.showAdded.push({
              avatar: Utils.getUserImgUrl(getFind[0]),
              userSubscription: getFind[0].userSubscription.href.split('/')[6],
              name: getFind[0].name,
              _lowername: getFind[0].name.toLowerCase(),
              dataForPush: promise,
              isSelected: true,
              original: true
            });
            $scope.isSearching = false;
            $scope.form.showActuals = true;
          }, function (errorFind) {
            console.error(errorFind);
          })
        }
      };
      $scope.initData();

      $scope.searchUsers = function () {
        $scope.usersFound = [];

        if (!$scope.data.textSearch || !debounceSearch()) return;

        $scope.isSearching = true;

        var term = $scope.data.textSearch;

        var deferred = Utils.$q.defer();
        AsyncSearch.findFriendUserSubscriptionsByUserNamev157({
          'userName': term,
          'withStart': pagination.start,
          'withCount': pagination.count
        }).then(function (UserResults) {
          var foundUsers = [];
          UserResults.forEach(function (user) {
            if (user.name) {
              var isInList = false;
              if ($scope.data.showAdded.length > 1) {
                isInList = $scope.data.showAdded.some(function (prevUser) {
                  return prevUser.userSubscription === user.userSubscription.href.split('/')[6];
                });
              }
              var promise = UserService.getDevices(user.userSubscription.href.split('/')[6]);
              foundUsers.push({
                avatar: user.profilePictureUrl || (user.profilePicture ? "data:image/jpeg;base64," + user.profilePicture.split(':')[2] : "img/ProfilePhoto.svg"),
                userSubscription: user.userSubscription.href.split('/')[6],
                verified: user.verifyUser,
                name: user.name,
                _lowername: user.name.toLowerCase(),
                dataForPush: promise,
                isSelected: isInList,
                original: false
              });
            }
          });
          $scope.usersFound = foundUsers;
          $scope.form.showActuals = false;
          $scope.isSearching = false;
          refreshDebounce();
        }, function (error) {
          console.error("couldn't get user list", error);
          $scope.errorLoading = true;
        }).finally(function () {
          $scope.isSearching = false;
        });
      };
      //

      $scope.fullLookUp = function () {
        if (taskDoing == TAG)
          searchTags($scope.form.searchTerm);
        else if (taskDoing == HASH)
          searchHashTags($scope.form.searchTerm);
      };


      function clearSearch() {
        taskDoing = NONE;
        textForSearch = "";
        $scope.tagList = [];
        $scope.hashList = [];
      }

      function refreshDebounce() {
        lastSearch = 0;
        pendingSearch = null;
        cancelSearch = angular.noop;
      }

      /**
       * Debounce if querying faster than 300ms
       */
      function debounceSearch() {
        var now = new Date().getMilliseconds();
        lastSearch = lastSearch || now;
        return ((now - lastSearch) < 300);
      }

      var deregisterHardBack = Utils.$ionicPlatform.registerBackButtonAction(
        $scope.cancelClicked, 101
      );

      // cancel custom back behaviour
      $scope.$on('$destroy', function () {
        //console.log("deregistering back button");
        deregisterHardBack();
      });
    }])
;
