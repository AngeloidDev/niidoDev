"use strict";

appServices
  .service('chatService', ['$rootScope', '$resource', 'ApiEndPoint', 'Utils',
    function ($rootScope, $resource, ApiEndPoint, Utils) {

      function deletePendingMessageWS(objectId) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.PendingChat/:objectId/actions/delete/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          });
      }

      function getChatsByIDWS(ID) {
        return $resource(ApiEndPoint.url + 'restful/services/ChatRepository/actions/findChatByChatId/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "x-isis-querystring": {
            "chatId": {
              "value": '' + ID
            }
          }
        })
      }

      //---------------------------------

      /**
       * @param data {{
       *   userId:number|string,
       *   friendId:number|string,
       *   chatName:string,
       *   lastChatMessage:string,
       *   lastUsersubscription:number|string,
       *   read:boolean
       * }}
       * @return {*}
       */
      function addChatWS(data) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addChat/invoke',
          {objectId:data.userId},
          {
            post: {
              method: 'POST',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "x-isis-querystring": {
            friend: {
              value: {
                href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.friendId
              }
            },
            chatName: {value: data.chatName},
            lastChatMessage: {value: data.lastChatMessage},
            lastUsersubscription: {
              value: {
                href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.lastUsersubscription
              }
            },
            read: {value: data.read || false}
          }
        })
      }

      function findPengindChatByUserSubscriptionWS(idToCheck) {
        return $resource(
          ApiEndPoint.url + 'restful/services/PendingChatRepository/actions/findPengindChatByUserSubscription/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "x-isis-querystring": {
            "userSubscriptionRec": {
              "value": {
                "href": ApiEndPoint.url + 'restful/objects/simple.UserSubscription/' + idToCheck
              }
            }
          }
        })
      }

      /**
       * @param data {{userId:number|string, start:number, count:number}}
       * @return {*}
       */
      function findChatByUserSubscriptionWS(data) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findChatByUserSubscription/invoke',
          {"objectId": data.userId},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "withStart": '"' + data.start + '"',
          "withCount": '"' + data.count + '"'
        })
      }

      function updateLastMessageWS(chatInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.Chat/:objectId/actions/updateLastMessage/invoke',
          {objectId: chatInfo.idChat},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          lastChatMessage: {value: chatInfo.msg},
          userSubscription: {value: {href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + chatInfo.lastUser}}
        })
      }

      /**
       * @param data {{userId:number|string, friendId:number|string}}
       * @return {*}
       */
      function findChatByMembersWS(data) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findChatByUserSubscriptionAndFriend/invoke',
          {objectId: data.userId},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "x-isis-querystring":
            {
              friend:
                {
                  value:
                    {
                      href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.friendId
                    }
                }
            }
        })
      }

      function updateLastMsgStatusWS(chatInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.Chat/:objectId/actions/changeChatMessageRead/invoke',
          {objectId: chatInfo.idChat},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({})
      }

      function chkHowManyPendingMsgWS() {
        return $resource(ApiEndPoint.url + 'restful/services/PendingChatRepository/actions/CountPengindChatByUserSubscription/invoke', {},
          {
            get: {
              method: 'GET',
              //isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          })
      }

      /**
       * @param data {{
       *   senderId:number|string,
       *   friendId:number|string,
       *   message:string
       * }}
       * @return {*}
       */
      function addPendingMessageWS(data) {
        return $resource(ApiEndPoint.url + 'restful/services/PendingChatRepository/actions/addPendingChat/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "x-isis-querystring":
            {
              "userSubscriptionSend": {
                "value": {
                  "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + data.senderId
                }
              },
              "userSubscriptionRec": {
                "value": {
                  "href": ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + data.friendId
                }
              },
              "chatMessage": {
                "value": data.message
              }
            }
        })
      }

      function addPendingMessageChatRoomWS(dataInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addPendingChatRoom/invoke',
          {objectId: dataInfo.userSendID},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          chatId: {value: dataInfo.chatID},
          userSubscriptionRec: {value: {href: dataInfo.userRec}},
          chatMessage: {value: dataInfo.msg}
        })
      }

      /**
       * @param chatID {{number}}
       * @return {*}
       */
      function getusersFromChatRoomWS(chatID) {
        return $resource(ApiEndPoint.url + 'restful/services/ChatMemberRepository/actions/findChatMembersByChatId/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          chatId: '"' + chatID + '"'
        })
      }

      function createChatRoomWS(data) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addChatRooms/invoke',
          {objectId: data.id},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          chatName: {value: data.name},
          description: {value: data.title},
          lastChatMessage: {value: data.msg},
          lastUsersubscription: {value: {href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" +data.user}},
          read: {value: data.read}
        })
      }

      function addChatMemberWS(userInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addChatMember/invoke',
          {objectId: userInfo.id},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          chatId: {value: userInfo.chatID}
        })
      }

      /**
       * @param userHref {{string}} -- the user href subscription
       * @return {*}
       */
      function findUserSubscriptionbyInstanceIdWS(userHref) {
        return $resource(ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionsByInstanceId/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "x-isis-querystring": {
            userSubscription: {
              value: {
                href: userHref
              }
            }
          }
        })
      }

      function editTitleForChatWS(chatInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.Chat/:objectId/actions/updateDescription/invoke',
          {objectId: chatInfo.id},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          chatDescription: {value: chatInfo.description}
        })
      }

      function deleteChatroomWS(chatInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.Chat/:objectId/actions/delete/invoke',
          {objectId: chatInfo.id},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({})
      }

      function deleteChatMemberWS(userInfo) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.ChatMember/:objectId/actions/delete/invoke',
          {objectId: userInfo.id},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({})
      }


      return {
        //numUnreadMessages: numUnreadMessages,
        findPengindChatByUserSubscriptionWS: findPengindChatByUserSubscriptionWS,
        addChatWS: addChatWS,
        findChatByUserSubscriptionWS: findChatByUserSubscriptionWS,
        updateLastMessageWS: updateLastMessageWS,
        findChatByMembersWS: findChatByMembersWS,
        updateLastMsgStatusWS: updateLastMsgStatusWS,
        chkHowManyPendingMsgWS: chkHowManyPendingMsgWS,
        addPendingMessageWS: addPendingMessageWS,
        addPendingMessageChatRoomWS: addPendingMessageChatRoomWS,
        getusersFromChatRoomWS: getusersFromChatRoomWS,
        createChatRoomWS: createChatRoomWS,
        addChatMemberWS: addChatMemberWS,
        findUserSubscriptionbyInstanceIdWS: findUserSubscriptionbyInstanceIdWS,
        editTitleForChatWS: editTitleForChatWS,
        deleteChatroomWS: deleteChatroomWS,
        deleteChatMemberWS: deleteChatMemberWS,
        deletePendingMessageWS: deletePendingMessageWS,
        getChatsByIDWS: getChatsByIDWS
      };
    }]);
