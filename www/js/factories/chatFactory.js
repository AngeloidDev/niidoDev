"use strict";
appServices
  .factory('ChatFactory', ['$rootScope', 'ApiEndPoint', 'chatService', 'DBServices', 'Utils', function ($rootScope, ApiEndPoint, chatService, DBServices, Utils) {
    var DB = DBServices;
    var socket = io.connect('https://ec2-54-69-184-92.us-west-2.compute.amazonaws.com:3000/');

    var isIoConnected = socket.connected;

    function connectIoSocket() {
      if (socket && isIoConnected)
        return isIoConnected;

      return isIoConnected = socket.connected;
      //var socket = io.connect('https://socketio-slack-count.now.sh');
      //var socket = io.connect('http://10.0.0.23:3001/');
    }

    function isSocketConnected() {
      return isIoConnected;
    }

    function emit(eventName, params) {
      socket.emit(eventName, params);
    }

    function on(eventName, callbackFn) {
      socket.on(eventName, callbackFn);
    }

    socket.on('connecting', function (data) {
      console.log("Socket connecting", data)
    });

    socket.on('connect', function () {
      isIoConnected = true;
      console.log("Socket is connected")
    });

    //Called when user disconnect//server shutdown - AUTOMATICO DEL SERVER
    socket.on('disconnect', function (data) {
      isIoConnected = true;
      console.log("Socket disconnect", data)
    });

    //Called when user reconnect - AUTOMATICO DEL SERVER
    socket.on('reconnect', function (data) {
      console.log("Socket reconnect", data)
    });

    //Called when can't get a connection - AUTOMATICO DEL SERVER
    socket.on('reconnect_error', function (data) {
      console.log("Socket reconnect_error", data)
    });


    /**
     * @type {{LEFT_CHAT: string, IS_TYPING: string, FRIEND_MSG: string, MY_MSG: string}}
     */
    var ACTIONS = {
      LEFT_CHAT: "0",//user left chat
      IS_TYPING: "1",//user is typing
      FRIEND_MSG: "2",
      MY_MSG: "3"
    };

    /**
     * @return {{LEFT_CHAT: string, IS_TYPING: string, FRIEND_MSG: string, MY_MSG: string}}
     */
    function getChatActionsEnum() {
      return ACTIONS
    }

    /**
     * @return Promise
     */
    function getInboxChatsList() {
      return Utils.$q(function (resolve, reject) {
        var finalChatList = [];

        DB.execute("SELECT * FROM chat_list").then(function (chatListRows) {
          console.log("chatListRows", chatListRows);
          var promises = [];
          DB.iterate(chatListRows, function (chat) {
            console.log("chat", chat);
            promises.push(
              DB.execute("SELECT * FROM chat_message_list WHERE id = ?",[chat.lastMessageId])
            )
          });

          Utils.$q.all(promises).then(function (messagesArray) {
            console.log("messagesArray", messagesArray);

            promises = [];
            messagesArray.forEach(function (messageRow) {
              console.log("messageListRow", messageRow);
              var message = messageRow.rows.item(0);
              console.log("mesage", message);
              if(!message) return;//it continues

              finalChatList.push({
                avatar: '',
                chatName: '',
                message: message.text,
                status: message.status,
                sentDate: message.sentDate,
                receivedDate: message.receivedDate
              });

              if (message.groupId) {//it's a group chat
                promises.push(
                  DB.execute("SELECT name, avatar FROM chat_group_list WHERE id = ?", [message.groupId])
                )
              }
              else {//it's a 1 to 1 chat
                promises.push(
                  DB.execute("SELECT name, avatar FROM chat_contact_list WHERE id = ?", [message.contactId])
                )
              }
            });

            Utils.$q.all(promises).then(function (sendersArray) {
              console.log("sendersArray", sendersArray);
              sendersArray.forEach(function (sender, i) {
                console.log("sender(0)", sender.rows.item(0));
                finalChatList[i].avatar = sender.rows.item(0).avatar;
                finalChatList[i].chatName = sender.rows.item(0).name;
              });

              resolve(finalChatList);
            }, function (error) {
              console.error("cant get contact/group info for chats list", error);
              reject(error);
            })
          }, function (error) {
            console.error("Can't get message list", error);
            reject(error)
          })
        }, function (error) {
          console.error("Can't get chats list", error);
          reject(error)
        });
      })
    }

    function getChatHistory(chatName) {
      return window.localStorage.getItem(chatName);
    }

    var mustWait = false;

    function getPendingMessages(idToCheck) {
      return Utils.$q(function (resolve, reject) {
        if (mustWait) return resolve(-1);
        mustWait = true;
        chatService.findPengindChatByUserSubscriptionWS(idToCheck).$promise.then(function (data) {
          resolve(data);
          mustWait = false;
        }, function (error) {
          reject(error);
          mustWait = false;
        });
      })
    }

    function getAndSaveUnreadMessagesLocally(userId) {
      getPendingMessages(userId).then(function (data) {
        //console.log("getPendingMessages", data);

        var numUnreadMessages = +(window.localStorage.getItem('pendingMessagesForUser') || 0);

        if (data === -1) {
          //console.log("Waiting for the last call to getPendingMessages() to be resolved");
          return;
        }

        Utils.removeLastItemIfHasNoAttribute(data, 'chatMessage');

        if (!data.length) {
          broadcastNumOfUnreadMessages(numUnreadMessages);
          return;
        }

        var deletePendingMessagesPromises = {};

        data.forEach(function (pendingMsg) {
          //numUnreadMessages++;
          //window.localStorage.setItem('pendingMessagesForUser', numUnreadMessages);
          if (pendingMsg.chatId != 0) {
            chatService.getChatsByIDWS(pendingMsg.chatId).$promise.then(function (data) {
              console.log("got", data);
              var changed = false;
              var tempoLSHistorial, LSLength;
              data.length--;
              var trychat = data[0].chatName;
              var gotit = window.localStorage.getItem(trychat);
              if (gotit) {
                tempoLSHistorial = JSON.parse(window.localStorage.getItem(trychat));
                LSLength = Object.keys(tempoLSHistorial).length;
                LSLength++;
                tempoLSHistorial[LSLength] = {
                  message: pendingMsg.chatMessage,
                  name: pendingMsg.userSubscriptionSendName,
                  date: pendingMsg.dateMessage,
                  sender: pendingMsg.userSubscriptionSend.href.split('/')[6],
                  type: ACTIONS.FRIEND_MSG
                };
                window.localStorage.setItem(trychat, JSON.stringify(tempoLSHistorial));
                changed = true;
              } else {
                tempoLSHistorial = {
                  1: {
                    message: pendingMsg.chatMessage,
                    name: pendingMsg.userSubscriptionSendName,
                    date: pendingMsg.dateMessage,
                    sender: pendingMsg.userSubscriptionSend.href.split('/')[6],
                    type: ACTIONS.FRIEND_MSG
                  }
                };
                window.localStorage.setItem(trychat, JSON.stringify(tempoLSHistorial));
                changed = true;
              }
              if (changed) {
                numUnreadMessages++;
                deletePendingMessagesPromises[pendingMsg.pendingChat.href.split('/')[6]] =
                  chatService.deletePendingMessageWS({objectId: pendingMsg.pendingChat.href.split('/')[6]}).save().$promise;
              }
            }, function (error) {
              console.log("mistake by: ", error);
            })
          } else {
            var changed = false;
            var tryChat01 = pendingMsg.userSubscriptionRec.href.split('/')[6] + "_" + pendingMsg.userSubscriptionSend.href.split('/')[6];
            var tryChat02 = pendingMsg.userSubscriptionSend.href.split('/')[6] + "_" + pendingMsg.userSubscriptionRec.href.split('/')[6];

            var rec_send = window.localStorage.getItem(tryChat01);
            var send_rec = window.localStorage.getItem(tryChat02);

            var tempoLSHistorial, LSLength;

            if (rec_send && !send_rec) {
              tempoLSHistorial = JSON.parse(window.localStorage.getItem(tryChat01));
              LSLength = Object.keys(tempoLSHistorial).length;
              LSLength++;
              tempoLSHistorial[LSLength] = {
                message: pendingMsg.chatMessage,
                name: pendingMsg.userSubscriptionSendName,
                date: pendingMsg.dateMessage,
                sender: pendingMsg.userSubscriptionSend.href.split('/')[6],
                type: ACTIONS.FRIEND_MSG
              };

              window.localStorage.setItem(tryChat01, JSON.stringify(tempoLSHistorial));
              changed = true;
            } else if (send_rec && !rec_send) {
              tempoLSHistorial = JSON.parse(window.localStorage.getItem(tryChat02));
              LSLength = Object.keys(tempoLSHistorial).length;
              LSLength++;
              tempoLSHistorial[LSLength] = {
                message: pendingMsg.chatMessage,
                name: pendingMsg.userSubscriptionSendName,
                date: pendingMsg.dateMessage,
                sender: pendingMsg.userSubscriptionSend.href.split('/')[6],
                type: ACTIONS.FRIEND_MSG
              };

              window.localStorage.setItem(tryChat02, JSON.stringify(tempoLSHistorial));
              changed = true;
            } else if (!rec_send && !send_rec) {
              tempoLSHistorial = {
                1: {
                  message: pendingMsg.chatMessage,
                  name: pendingMsg.userSubscriptionSendName,
                  date: pendingMsg.dateMessage,
                  sender: pendingMsg.userSubscriptionSend.href.split('/')[6],
                  type: ACTIONS.FRIEND_MSG
                }
              };

              window.localStorage.setItem(tryChat02, JSON.stringify(tempoLSHistorial));
              changed = true;
            }

            if (changed) {
              numUnreadMessages++;
              deletePendingMessagesPromises[pendingMsg.pendingChat.href.split('/')[6]] =
                chatService.deletePendingMessageWS({objectId: pendingMsg.pendingChat.href.split('/')[6]}).save().$promise;
            }
          }

        });//end forEach()

        window.localStorage.setItem('pendingMessagesForUser', numUnreadMessages.toString());

        broadcastNumOfUnreadMessages(numUnreadMessages);

        Utils.$q.all(deletePendingMessagesPromises).then(function (responseDel) {
          //console.log("done");
        }, function (errors) {
          console.error("deletePendingMessagesPromises", errors)
        })
      }, function (error) {
        console.log("mistake by: ", error);
      })
    }


    /**
     * @param data {{senderId:number|string, chatId:number|string, userId:number|string, message:string}}
     * @return Promise {boolean|*}
     */
    function addPendingMessageChatRoom(data) {
      return Utils.$q(function (resolve, reject) {
        chatService.addPendingMessageChatRoomWS({
          userSendID: data.senderId,
          chatID: data.chatId,
          userRec: ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + data.userId,
          msg: data.message
        }).$promise.then(function (getResponse) {
          console.log("added");
          resolve(true)
        }, function (getError) {
          console.error("can't add pendingChat", getError);
          reject(getError)
        })
      })
    }

    function broadcastNumOfUnreadMessages(numUnreadMessages) {
      $rootScope.$broadcast("chat_messages.unread", {numUnreadMessages: numUnreadMessages});

      setTimeout(function () {
        $rootScope.$apply();
      }, 10);
    }


    /**
     * @param data {{chatId:number|string, userId:number|string, message:string}}
     * @return Promise {boolean|*}
     */
    function updateLastMessage(data) {
      return Utils.$q(function (resolve, reject) {
        chatService.updateLastMessageWS({
          idChat: data.chatId,
          lastUser: data.userId,
          msg: data.message
        }).$promise.then(function (getResponse) {
          console.log("going out");
          resolve(true)
        }, function (getError) {
          console.error("can't add last message", getError);
          reject(getError)
        });
      })
    }


    return {
      emit: emit,
      on: on,
      connectIoSocket: connectIoSocket,
      isSocketConnected: isSocketConnected,
      getChatActionsEnum: getChatActionsEnum,
      getInboxChatsList: getInboxChatsList,

      getChatHistory: getChatHistory,
      addPendingMessageChatRoom: addPendingMessageChatRoom,
      updateLastMessage: updateLastMessage,
      getAndSaveUnreadMessagesLocally: getAndSaveUnreadMessagesLocally
    }
  }])
