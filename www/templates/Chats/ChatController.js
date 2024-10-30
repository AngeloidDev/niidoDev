"use strict";
appControllers.controller("chatInboxCtrl",['$scope', '$state', 'ChatFactory', 'Utils', function ($scope, $state, ChatFactory, Utils) {
  var chat = ChatFactory;
  $scope.isConnected = chat.isSocketConnected();

  $scope.chatInboxList = [];

  chat.getInboxChatsList().then(function (list) {
    console.log("chatInboxList", list);
    $scope.chatInboxList = list;
  }, function (error) {
    console.error("getInboxChatsList", error);
    Utils.toast.error("No se pudo obtener la lista de chats")
  });

  $scope.openChat = function(chatId){
    $state.go("anywhere",{"your": "params here"})
  };

  $scope.createChat = function () {
    $state.go("anywhere",{"your": "params here"})
  }

}])

.controller("myChatCtrl",['$scope', 'ChatFactory', 'Utils', function ($scope, ChatFactory, Utils) {
  var chat = ChatFactory;
  $scope.isConnected = chat.connectIoSocket();

  setTimeout(function () {

    chat.emit('enterRoom', {
      room: "Andrew_room",
      user: "Andrew VB",
      idSend: "1024",
      resumeServer: false
    });
  }, 5500);


}]);
