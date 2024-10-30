"use strict";
appControllers
  .controller('uploadCtrl', ['$rootScope', '$scope', '$state', 'FileService', '$timeout', 'ImageService', 'ApiEndPoint', '$ionicModal', 'MultiImageService', '$ionicPopup', 'usersData', 'SequenceService', 'UserService', 'ionicService', '$ionicPlatform', 'DBServices', 's3', 'VideoService', 'FileVideoService', '$sce', 'adsService', '$ionicPickerI18n', 'AWSServices', 'Utils','notificationsService','TagsService',
    function ($rootScope, $scope, $state, FileService, $timeout, ImageService, ApiEndPoint, $ionicModal, MultiImageService, $ionicPopup, usersData, SequenceService, UserService, ionicService, $ionicPlatform, DBServices, s3, VideoService, FileVideoService, $sce, adsService, $ionicPickerI18n, AWSServices, Utils, notificationsService,TagsService) {
      var userId = UserService.get_USER_ID();

      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      $scope.customColors = adsService.customColors;

      $scope.advertisement = {
        ownerMetadata: {name: UserService.get_USER_NAME(), avatar: UserService.get_USER_PHOTO()},
        creationTime: (new Date().toString())
      };

      $scope.dateTimePickerTitle = Utils.translate("UPLOAD.DATETIME_PICKER.TITLE");

      $ionicPickerI18n.weekdays = adsService.getWeekdaysLocalized();
      $ionicPickerI18n.months = adsService.getMonthsLocalized();

      $ionicPickerI18n.ok = Utils.translate("GLOBAL.OK");
      $ionicPickerI18n.cancel = Utils.translate("GLOBAL.CANCEL");
      /*$ionicPickerI18n.okClass = "button-positive";
      $ionicPickerI18n.cancelClass = "button-stable";
      $ionicPickerI18n.arrowButtonClass = "button-positive";*/

      /**
       * STEPS:
       * Determine whether instance is a user or group cqnz
       * create cqnz record on DB for the right type of instance
       * insert images and mentions (description)
       * redirect to...
       */

      // --> ZONE OF DECLARATIONS -->

      // FOOTER VARIABLES/CONFIG
      $scope.botonUploadOn = true; //<-- Controlls upload tab/btn state in foooter
      //FOOTER VARIABLES/CONFIG

      /**
       * $state.params:
       * Previous controller must send this param
       * {isGroupTimeline: boolean, groupData: {} | {any}}
       * {} if isGroupTimeline == false
       * {any} otherwise (group timeline)
       */
      //console.log("uploadCtrl", $state.params);


      $scope.groupData = {};
      if ($state.params.isGroupTimeline)
        $scope.groupData = $state.params.groupData;


      $scope.data = {
        pictures: [],
        thumbPictures: [],
        numElements: 0,
        sequenceName: '',
        mentionsList: [],
        compareList: [],
        hashList: [],
        compareHashList: [],
        haveVideo: 0, //<-- fixme: rename to "hasVideo"
        videoBlob: null,
        commentValue: '',
        enableComments: true,
        lifetime: false,
        shareable: true,
        sharelife: 0,
        selectedBgColor: $scope.customColors[$scope.iAmAdvertiser ? 10 : 1],
        selectedFontColor: $scope.customColors[$scope.iAmAdvertiser ? 1 : 0],
        finalDate: new Date()
      };

      $scope.tags = [];
      $scope.hashs = [];
      $scope.galleryIsOpen = false;
      $scope.isIOS = ionic.Platform.isIOS();
      $scope.isAndroid = ionic.Platform.isAndroid();
      $scope.idImages = "";

      setTimeout(function () {
        $scope.container = document.getElementById("horizontal-container");
        $scope.containerItems = $scope.container.getElementsByTagName("li");
      }, 1000);


      $scope.template = document.getElementById('templates');

      $scope.itemsList = {items1: []};
      $scope.uploading = false;

      $scope.uploadButtonText = Utils.translate('UPLOAD.' + (!$state.params.isGroupTimeline ? 'UPLOAD' : 'POST_GROUP'));

      // <-- END ZONE OF DECLARATIONS <---


      FileService.cleanImages();

      /**********************Uncomment to upload to S3**********************/

      var exits = 0;
      //var mentionFix        = "";
      var deleteArray = [];
      var realTemplateName = 'templateAutomate0';
      var typeUpload = "1";
      var s3Service = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {Bucket: s3.bucket}
      });


      $scope.addNewSequence = function (template) {

        if ($scope.galleryIsOpen === true) {
          Utils.alert.show("Gallery is still open");
          return;
        }

        $scope.uploading = true;
        if ($scope.data.sequenceName === null)
          $scope.data.sequenceName = " ";
        else {
          if ($scope.data.mentionsList.length > 0) {
            //TODO add support for names with special characters
            var titleTempo = "";
            var nameToCheck = "";
            for (var x = 0; x < $scope.data.mentionsList.length; x++) {
              nameToCheck = "@" + $scope.data.mentionsList[x].name.replace(/\s+$/g, '');
              titleTempo = $scope.data.sequenceName;
              if (titleTempo.indexOf(nameToCheck, 0) != -1) {
                exits++;
              } else {
                deleteArray.push(x);
              }
            }
            if (deleteArray.length > 0) {
              for (var k = 0; k < deleteArray.length; k++) {
                $scope.data.mentionsList.splice(deleteArray[k], 1);
              }
            }
          }
        }

        /*space to make name for template slide and number of photos*/
        if ($scope.idImages == 'templateAutomate01')
          realTemplateName = realTemplateName + $scope.data.pictures.length;
        else
          realTemplateName = template;

        if (!$scope.groupData || !$scope.groupData.hrefId)
          createUserCqnzRecord();
        else
          createGroupCqnzRecord();
      };

      function createUserCqnzRecord() {
        //console.log("finalDate",$scope.data.finalDate);
        var hoursLive = 0;
        if ($scope.data.lifetime) {
          hoursLive = 24;
        }
        SequenceService.addNewSequencev100({
          userId: userId,
          description: $scope.data.sequenceName,
          templateId: realTemplateName,
          itemCount: $scope.data.pictures.length,
          sequenceType: typeUpload,
          commentsEnabled: $scope.data.enableComments,
          temporary: hoursLive,
          shareable: $scope.data.shareable,
          sharelife: $scope.data.sharelife,
          isAdvertisement: $scope.iAmAdvertiser,
          headerBgColor: $scope.data.selectedBgColor,
          headerFontColor: $scope.data.selectedFontColor,
          finalDate: $scope.data.finalDate
        }).$promise.then(function uploadSequenceImages(response) {
          uploadCqnzData(response);
        }, function failUploadSequenceImages(error) {
          $scope.uploading = false;
          //fixme: add translate support
          $scope.uploadErrorMessage = 'Unable to upload your sequence. Verify your internet connection and try again later.';
          Utils.toast.error(Utils.translate('UPLOAD.DIALOG.POST_ERROR'))
          //alert('Unable to create your sequence verify your internet connection');
        });
      }

      function createGroupCqnzRecord() {
        var hoursLive = 0;
        if ($scope.data.lifetime) {
          hoursLive = 24;
        }
        SequenceService.addNewGroupSequence({
          userId: userId,
          description: $scope.data.sequenceName,
          templateId: realTemplateName,
          itemCount: $scope.data.pictures.length,
          sequenceType: typeUpload,
          groupId: $scope.groupData.hrefId,
          commentEnable: $scope.data.enableComments,
          temporary: hoursLive,
          shareable: $scope.data.shareable,
          sharelife: $scope.data.sharelife,
          isAdvertisement: $scope.iAmAdvertiser,
          headerBgColor: $scope.data.selectedBgColor,
          headerFontColor: $scope.data.selectedFontColor
        }).then(function (createRecordResponse) {
          //console.log(createRecordResponse);
          uploadCqnzData(createRecordResponse);
        }, function (createRecordError) {
          console.error(createRecordError);
          $scope.uploading = false;
          //fixme: add translate support
          $scope.uploadErrorMessage = 'Unable to upload your sequence. Verify your internet connection and try again later.';
          Utils.toast.error(Utils.translate('UPLOAD.DIALOG.POST_ERROR'))
          //alert('Unable to create your sequence verify your internet connection');
        });
      }

      /**
       * uploads images to s3 (through uploadCqnzPhotos function)
       * inserts mentions (@ and #)'s on DB and redirects to next page
       * @param response (createCqnzRecord response object)
       */
      function uploadCqnzData(response) {

        if (typeUpload != "1") {
          Utils.alert.show("typeUpload != '1'", {title: "Config Error"});
          return;
        }

        var promises = uploadCqnzPhotos(response.result.links["0"].href);

        Utils.$q.all(promises).then(function () {
          var tagPromises = {};
          var hashPromises = {};
          var addHashPromises = {};
          var hashToStore = [];

          //check before if al tags in list are still in title
          //if not delete them
          $scope.data.mentionsList = TagsService.removeTagsNotFoundInText($scope.data.sequenceName, $scope.data.mentionsList);

          //part to add tags for the sequences
          if ($scope.data.mentionsList.length > 0) {
            for (var j = 0; j < $scope.data.mentionsList.length; j++) {
              var subscriptionInstanceId = $scope.data.mentionsList[j].id;
              var promise = SequenceService.sendTagNotificationUpload({
                sequenceId: response.result.instanceId,
                userId: subscriptionInstanceId
              }).$promise;

              tagPromises[subscriptionInstanceId] = promise;
            }
            Utils.$q.all(tagPromises).then(function (response) {
              var responseKeys = Object.keys(response);
              //var responseValues = Object.values(response)
              //IOS doesn't support Object.values
              //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values
              var responseValues = responseKeys.map(function (key) {
                return response[key];
              });
              var tokenPromises = [];
              for (var i = 0; i < responseKeys.length; i++) {
                subscriptionInstanceId = responseKeys[i];
                //if response === true then add to the promises array
                if (responseValues[i].result.value) {
                  tokenPromises[tokenPromises.length++] = UserService.getDevices(subscriptionInstanceId).$promise;
                }
              }

              //new method for push notification of tag
              notificationsService.notifyUsersTaggedInSequence(response).then(function (/*always true*/) {
                console.log("Notification sent to new tagged users")
              }, function (error) {
                console.error("notifyUsersTaggedInSequence", error);
              })

              /*Utils.$q.all(tokenPromises).then(function (response) {
                //Send push notification Tag
                var tokens = [];
                var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
                var message = name + " tagged you in a sequence";
                message = message.replace(/\s\s+/g, ' ');
                for (var i = 0; i < response.length; i++) {
                  for (var j = 0; j < response[i].value.length; j++) {
                    var endpointArn = response[i].value[j].title;
                    AWSServices.sendNotification(message, endpointArn);
                  }
                }
              }, function (response) {
              });*/
            }, function (response) {
            });
          }

          var find = 0;
          //check if the title has any hash added

          //part to add hashtags for the sequences
          if ($scope.data.hashList.length > 0) {
            //when the user selected one or more hash already created
            //we obtain each hash(#*****) to compare it
            var parts = $scope.data.sequenceName.match(/\#{1}\S+/g);
            for (var i = 0; i < parts.length; i++) {
              var hashClean = parts[i].split('#');
              var promiseHash;
              //For each tag finded we run a process acordly, add if new or add count if already exits
              for (var j = 0; j < $scope.data.hashList.length; j++) {
                if (hashClean[1] == $scope.data.hashList[j].hash) {
                  hashToStore[i] = $scope.data.hashList[j].id;
                  //ws to add count to prexist hashtag
                  promiseHash = SequenceService.modifyHashCount(
                    {"objectId": $scope.data.hashList[j].id}
                  ).save({
                    "int": {
                      "value": 1
                    }
                  }).$promise;
                  find = 1;
                }
              }

              if (find == 0) {
                hashToStore[i] = 0;
                //ws to add new hashtag
                promiseHash = SequenceService.createHashTag().save({
                  "hashtag": {
                    "value": hashClean[1]
                  }
                }).$promise;
              }
              find = 0;
              //add each ws promise to wait for all of them
              hashPromises[i] = promiseHash;
            }
            //wait to all ws have been completed
            Utils.$q.all(hashPromises).then(function (responseHash) {
              //we need to link the hashtags to the sequence
              var responseKeys = Object.keys(responseHash);
              var responseValues = responseKeys.map(function (key) {
                return responseHash[key];
              });
              //get the Id from new hashtags created into a list
              for (var a = 0; a < responseKeys.length; a++) {
                if (responseValues[a].result) {
                  hashToStore[a] = responseValues[a].result.links[0].href.split('/')[6]
                }
              }
              //the list now contains all hashtag's ids news or not
              for (var b = 0; b < hashToStore.length; b++) {
                //ws to add each hastag to sequence
                addHashPromises = SequenceService.addHashtoSequence().save({
                  "sequence": {
                    "value": {
                      "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + response.result.links["0"].href.split('/')[6]
                    }
                  },
                  "hashTag": {
                    "value": {
                      "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + hashToStore[b]
                    }
                  }
                }).$promise;
              }
              Utils.$q.all(addHashPromises).then(function () {
              }, function () {
              });
            }, function (error) {
            });
          }
          else {
            // when the user doesn't select any hashtag we check for new ones
            var parts = $scope.data.sequenceName.match(/\#{1}\S+/g);
            if (parts) {
              if (parts.length > 0) {
                //if we find #******* in the title we assume it's a hashtag
                var promiseHash;
                for (var i = 0; i < parts.length; i++) {
                  var hashClean = parts[i].split('#');
                  //Ws to create the new hashtag
                  promiseHash = SequenceService.createHashTag().save({
                    "hashtag": {
                      "value": hashClean[1]
                    }
                  }).$promise;
                  hashPromises[i] = promiseHash;
                }
              }
              //Wait to all ws to be completed
              Utils.$q.all(hashPromises).then(function (responseHash) {
                var responseKeys = Object.keys(responseHash);
                var responseValues = responseKeys.map(function (key) {
                  return responseHash[key];
                });

                for (var a = 0; a < responseKeys.length; a++) {
                  var addHashPromises = SequenceService.addHashtoSequence().save({
                    "sequence": {
                      "value": {
                        "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + response.result.links["0"].href.split('/')[6]
                      }
                    },
                    "hashTag": {
                      "value": {
                        "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + responseValues[a].result.links[0].href.split('/')[6]
                      }
                    }
                  }).$promise;
                }
                Utils.$q.all(addHashPromises).then(function () {
                }, function (response) {
                });
              }, function (response) {
              });
            }
          }

          FileService.cleanImages();

          $state.go('menu.timeline', {groupIndex: $scope.groupData.groupIndex});

          setTimeout(function () {
            $rootScope.$emit("sequence.created", {
              from: ($scope.groupData && $scope.groupData.hrefId) ? 'groupTimelineCtrl' : 'TimeLineCtrl',
              type: 'PHOTOS',
              sequenceId: response.result.instanceId
            });
          }, 800);

        }, function (response) {
          SequenceService.deleteSequence(
            //{"objectId": response.config.data.sequence.value.href.split('/')[6]}
            {"objectId": Utils.getLastUrlComponent(response.config.data.sequence.value.href)}
          ).post().$promise.then(function (onDeleteOk) {
            //CQNZ record deleted ok!
          }, function (onDeleteError) {
            console.error("Wasn't able to delete CQNZ record")
          }).finally(function () {
            //fixme: add translate support
            Utils.alert.show("The Sequence could not be created, try again")
          });
          //fixme: add translate support
          $scope.uploadErrorMessage = 'Unable to upload your sequence. Verify your internet connection and try again later.';
          $scope.uploading = false;
        });
      }

      /**
       * Uploads images/thumbnails to s3
       * @param sequenceHref
       * @returns {Array} Promises array
       */
      function uploadCqnzPhotos(sequenceHref) {
        //this will be the returned value
        var promises = [];

        var userSubscriptionInstanceId = Utils.md5.createHash(userId);
        var sequenceInstanceId = Utils.md5.createHash(Utils.getLastUrlComponent(sequenceHref));

        for (var i = 0; i < $scope.data.pictures.length; i++) {
          var photoKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/image/' + (i + 1) + '.jpg';
          var photoThumbKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/thumb/' + (i + 1) + '.jpg';

          var file = Utils.dataURLtoBlob($scope.data.pictures[i]);
          var fileThumb = Utils.dataURLtoBlob($scope.data.thumbPictures[i]);

          //fixme: No esperamos a que el promise se resuelva?
          s3Service.upload({
            Key: photoThumbKey,
            Body: fileThumb,
            ACL: 'public-read',
            ContentType: fileThumb.type
          }, function (err, data) {
            if (err) {
              //sequence.sharing = false;
              return console.log('There was an error uploading the image: ', err);
            }
            //console.log('Successfully uploaded thumb image.');
            //url: data.Location
          });

          //fixme: No esperamos a que el promise se resuelva?
          s3Service.upload({
            Key: photoKey,
            Body: file,
            ACL: 'public-read',
            ContentType: file.type
          }, function (err, data) {
            if (err) {
              //sequence.sharing = false;
              return console.log('There was an error uploading the image: ', err);
            }
            //console.log('Successfully uploaded image.');
            //url: data.Location
          });
          promises[i] = SequenceService.addItemToSequencev181().save({
            "sequence": {"value": {"href": sequenceHref}},
            "uRLPicture": {"value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey},
            "itemId": {"value": i + 1},
            "uRLThumbPicture": {"value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoThumbKey}
          }).$promise;
        }// End for()

        return promises;
      }

      $scope.defaultTemplate = function () {
        $scope.idImages = 'templateB21';
      };


      $scope.changeTemplate = function (templateId, index) {
        $timeout(function () {
          $scope.idImages = templateId;
          $scope.templateReset();
          //1 photo
          if (index == 'A11') {
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          }
          // 2 photos
          if (index == 'B21') {
            $scope.B21 = {'background': 'url(img/2.1On.svg)'};
          }
          if (index == 'B22') {
            $scope.B22 = {'background': 'url(img/2.2On.svg)'};
          }
          if (index == 'B23') {
            $scope.B23 = {'background': 'url(img/2.3On.svg)'};
          }
          if (index == 'B24') {
            $scope.B24 = {'background': 'url(img/2.4On.svg)'};
          }
          if (index == 'C21') {
            $scope.C21 = {'background': 'url(img/2.1cOn.svg)'};
          }
          if (index == 'C22') {
            $scope.C22 = {'background': 'url(img/2.1hOn.svg)'};
          }
          if (index == 'D21') {
            $scope.D21 = {'background': 'url(img/2.5On.svg)'};
          }
          if (index == 'E21') {
            $scope.E21 = {'background': 'url(img/c2.svg)'};
          }
          //3 photos
          if (index == 'B31') {
            $scope.B31 = {'background': 'url(img/3.1On.svg)'};
          }
          if (index == 'B32') {
            $scope.B32 = {'background': 'url(img/3.2On.svg)'};
          }
          if (index == 'B33') {
            $scope.B33 = {'background': 'url(img/3.3On.svg)'};
          }
          if (index == 'B34') {
            $scope.B34 = {'background': 'url(img/3.4On.svg)'};
          }
          if (index == 'B35') {
            $scope.B35 = {'background': 'url(img/3.5On.svg)'};
          }
          if (index == 'D31') {
            $scope.D31 = {'background': 'url(img/3.6On.svg)'};
          }
          if (index == 'E31') {
            $scope.E31 = {'background': 'url(img/c3.svg)'};
          }
          //4 photos
          if (index == 'B41') {
            $scope.B41 = {'background': 'url(img/4.1On.svg)'};
          }
          if (index == 'B42') {
            $scope.B42 = {'background': 'url(img/4.2On.svg)'};
          }
          if (index == 'B43') {
            $scope.B43 = {'background': 'url(img/4.3On.svg)'};
          }
          if (index == 'B44') {
            $scope.B44 = {'background': 'url(img/4.4On.svg)'};
          }
          if (index == 'C41') {
            $scope.C41 = {'background': 'url(img/4.1cOn.svg)'};
          }
          if (index == 'C42') {
            $scope.C42 = {'background': 'url(img/4.1SON.svg)'};
          }
          if (index == 'D41') {
            $scope.D41 = {'background': 'url(img/4.5On.svg)'};
          }
          if (index == 'E41') {
            $scope.E41 = {'background': 'url(img/c4.svg)'};
          }
          //5 photos
          if (index == 'B51') {
            $scope.B51 = {'background': 'url(img/5.1On.svg)'};
          }
          if (index == 'B52') {
            $scope.B52 = {'background': 'url(img/5.2On.svg)'};
          }
          if (index == 'B53') {
            $scope.B53 = {'background': 'url(img/5.3On.svg)'};
          }
          if (index == 'B54') {
            $scope.B54 = {'background': 'url(img/5.4On.svg)'};
          }
          if (index == 'B55') {
            $scope.B55 = {'background': 'url(img/5.5On.svg)'};
          }
          if (index == 'D51') {
            $scope.D51 = {'background': 'url(img/5.6On.svg)'};
          }
          if (index == 'E51') {
            $scope.E51 = {'background': 'url(img/c5.svg)'};
          }
          //6 photos
          if (index == 'B61') {
            $scope.B61 = {'background': 'url(img/6.1On.svg)'};
          }
          if (index == 'B62') {
            $scope.B62 = {'background': 'url(img/6.2On.svg)'};
          }
          if (index == 'B63') {
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
          if (index == 'B64') {
            $scope.B64 = {'background': 'url(img/6.4On.svg)'};
          }
          if (index == 'D61') {
            $scope.D61 = {'background': 'url(img/6.5On.svg)'};
          }
          if (index == 'E61') {
            $scope.E61 = {'background': 'url(img/c6.svg)'};
          }
          /*if(index == 12){
                    $scope.template.getElementsByTagName('li')[10].style.background = "url('data:image/png;base64,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')";
                }*/
        });
      };

      $scope.templateReset = function () {
        $scope.A11 = {'background': 'url(img/1.1Off.svg)'};
        //
        $scope.B21 = {'background': 'url(img/2.1Off.svg)'};
        $scope.B22 = {'background': 'url(img/2.2Off.svg)'};
        $scope.B23 = {'background': 'url(img/2.3Off.svg)'};
        $scope.B24 = {'background': 'url(img/2.4Off.svg)'};
        $scope.C21 = {'background': 'url(img/2.1cOff.svg)'};
        $scope.C22 = {'background': 'url(img/2.1hOff.svg)'};
        $scope.D21 = {'background': 'url(img/2.5Off.svg)'};
        $scope.E21 = {'background': 'url(img/c2o.svg)'};
        //
        $scope.B31 = {'background': 'url(img/3.1Off.svg)'};
        $scope.B32 = {'background': 'url(img/3.2Off.svg)'};
        $scope.B33 = {'background': 'url(img/3.3Off.svg)'};
        $scope.B34 = {'background': 'url(img/3.4Off.svg)'};
        $scope.B35 = {'background': 'url(img/3.5Off.svg)'};
        $scope.D31 = {'background': 'url(img/3.6Off.svg)'};
        $scope.E31 = {'background': 'url(img/c3o.svg)'};
        //
        $scope.B41 = {'background': 'url(img/4.1Off.svg)'};
        $scope.B42 = {'background': 'url(img/4.2Off.svg)'};
        $scope.B43 = {'background': 'url(img/4.3Off.svg)'};
        $scope.B44 = {'background': 'url(img/4.4Off.svg)'};
        $scope.C41 = {'background': 'url(img/4.1cOff.svg)'};
        $scope.C42 = {'background': 'url(img/4.1SOff.svg)'};
        $scope.D41 = {'background': 'url(img/4.5Off.svg)'};
        $scope.E41 = {'background': 'url(img/c4o.svg)'};
        //
        $scope.B51 = {'background': 'url(img/5.1Off.svg)'};
        $scope.B52 = {'background': 'url(img/5.2Off.svg)'};
        $scope.B53 = {'background': 'url(img/5.3Off.svg)'};
        $scope.B54 = {'background': 'url(img/5.4Off.svg)'};
        $scope.B55 = {'background': 'url(img/5.5Off.svg)'};
        $scope.D51 = {'background': 'url(img/5.6Off.svg)'};
        $scope.E51 = {'background': 'url(img/c5o.svg)'};
        //
        $scope.B61 = {'background': 'url(img/6.1Off.svg)'};
        $scope.B62 = {'background': 'url(img/6.2Off.svg)'};
        $scope.B63 = {'background': 'url(img/6.3Off.svg)'};
        $scope.B64 = {'background': 'url(img/6.4Off.svg)'};
        $scope.D61 = {'background': 'url(img/6.5Off.svg)'};
        $scope.E61 = {'background': 'url(img/c6o.svg)'};
      };

      $scope.sortableOptions = {
        containment: '#horizontal-container',
        //containment:'#Board-container',
        containerPositioning: 'relative',
        'ui-floating': true,
        orderChanged: function (event) {
          console.log("fuente", event.source.index);
          console.log("final", event.dest.index);
          $scope.temporalThumb = $scope.data.thumbPictures[event.source.index];
          $scope.data.thumbPictures.splice(event.source.index, 1);
          $scope.data.thumbPictures.splice(event.dest.index, 0, $scope.temporalThumb);
        }
      };

      $scope.UniqueTracking = function (index, id) {
        return index + id;
      };


      //Function for delete element by id
      $scope.removeImage = function (indexItem) {
        $scope.data.pictures.splice(indexItem, 1);
        $scope.data.thumbPictures.splice(indexItem, 1);
        $scope.data.numElements = $scope.data.pictures.length;
        $scope.showScrollBars($scope.data.modeSelect);
      };

      $scope.addMedia = function () {
        var hideSheet = Utils.$ionicActionSheet.show({
          buttons: [
            {text: Utils.translate('UPLOAD.TAKE') + ' <i class="icon ion-camera"></i>'},
            {text: Utils.translate('UPLOAD.FROM_GALLERY') + ' <i class="icon ion-images"></i>'}
          ],
          titleText: Utils.translate('UPLOAD.ADD'),
          cancelText: Utils.translate('GLOBAL.CANCEL'),
          buttonClicked: function (index) {
            hideSheet();

            $scope.galleryIsOpen = true;
            switch (index) {
              case 0:
                ImageService.saveCameraMedia(index).then(function () {
                  $scope.data.pictures = FileService.images();
                  $scope.data.thumbPictures = FileService.thumbImages();
                  $scope.galleryIsOpen = false;
                  //$scope.checkPhotosTutorial();
                });
                break;
              case 1:
                ImageService.saveAlbumMedia().then(function () {
                  $scope.data.pictures = FileService.images();
                  $scope.data.thumbPictures = FileService.thumbImages();
                  $scope.galleryIsOpen = false;
                  //$scope.checkPhotosTutorial();
                });
                break;
            }
          }
        });
      };

      $scope.time = {
        availableOptions: [
          {id: '2', name: '2'},
          {id: '6', name: '6'},
          {id: '10', name: '10'},
          {id: '16', name: '16'}
        ],
        selectedOption:
          {id: '6', name: '6'}
      };

      $scope.photo = {
        availableOptions: [
          {id: '2', name: '2'},
          {id: '3', name: '3'},
          {id: '4', name: '4'},
          {id: '5', name: '5'},
          {id: '6', name: '6'},
          {id: '7', name: '7'},
          {id: '8', name: '8'}
        ],
        selectedOption:
          {id: '4', name: '4'}
      };

      $scope.onDropComplete = function (index, obj) {
        var otherObj = $scope.pictures[index];
        var otherIndex = $scope.pictures.indexOf(obj);
        $scope.data.pictures[index] = obj;
        $scope.data.pictures[otherIndex] = otherObj;
      };

      $scope.clockTimer = 0;

      $scope.chkCount = function () {
        var index = parseInt(document.getElementById('in_second').value);
        switch (index) {
          case 2:
            $scope.photo = "";
            $scope.photo = {
              availableOptions: [
                {id: '2', name: '2'}
              ],
              selectedOption:
                {id: '2', name: '2'}
            };
            break;
          case 6:
            $scope.photo = "";
            $scope.photo = {
              availableOptions: [
                {id: '2', name: '2'},
                {id: '3', name: '3'},
                {id: '4', name: '4'},
                {id: '5', name: '5'},
                {id: '6', name: '6'}
              ],
              selectedOption:
                {id: '6', name: '6'}
            };
            break;
          case 10:
            $scope.photo = "";
            $scope.photo = {
              availableOptions: [
                {id: '2', name: '2'},
                {id: '3', name: '3'},
                {id: '4', name: '4'},
                {id: '5', name: '5'},
                {id: '6', name: '6'},
                {id: '7', name: '7'},
                {id: '8', name: '8'}
              ],
              selectedOption:
                {id: '8', name: '8'}
            };
            break;
          case 16:
            $scope.photo = "";
            $scope.photo = {
              availableOptions: [
                {id: '2', name: '2'},
                {id: '3', name: '3'},
                {id: '4', name: '4'},
                {id: '5', name: '5'},
                {id: '6', name: '6'},
                {id: '7', name: '7'},
                {id: '8', name: '8'}
              ],
              selectedOption:
                {id: '8', name: '8'}
            };
            break;
        }
      };

      $scope.cameraType = 'front';

      //
      $scope.openCamera = function () {
        var in_count = parseInt(document.getElementById('in_count').value);
        var in_second = parseInt(document.getElementById('in_second').value);
        var delay = parseInt(document.getElementById('delayTime').value);
        var type = document.getElementById('modeType').value;

        $scope.clockTimer = delay;
        $scope.clockTop = delay;

        //fixme: this var is never used
        //var real_delay = delay * 1000;

        if ($scope.clockTop === 0) {
          captureMultishot([type, in_count, in_second], successCallback, errorCallback);
        }
        else {
          //código para timer
          $ionicModal.fromTemplateUrl('templates/my-modal.html', {
            scope: $scope
          }).then(function (modal) {
            $scope.modal = modal;
            $scope.modal.show();
            //inicia intervalo para reloj
            var myTry = setInterval(
              function () {
                if ($scope.clockTimer === 0) {
                  $scope.modal.hide();
                  window.clearInterval(myTry);
                  captureMultishot([type, in_count, in_second], successCallback, errorCallback);
                }
                else {
                  $scope.clockTimer = $scope.clockTimer - 1;
                  $scope.$apply();
                }
              }, 1000);
            //termina intervalo para reloj
          });
          //fin código para timer
        }
      };

      /**
       *
       * @param data
       * @param successFn - callback function
       * @param errorFn - callback function
       */
      function captureMultishot(data, successFn, errorFn) {
        //we must wait for the platform to be ready
        $ionicPlatform.ready(function () {
          if (Utils.isAndroid()) {
            if (window.Multishot)
              window.Multishot.capture(data, successFn, errorFn);
            else
              Utils.alert.show(Utils.translate('PLUGINS.MULTISHOT.FUNCTION_NOT_AVAILABLE'));
          }
          else if (Utils.isIOS())
            cordova.exec(successCallback, errorCallback, "CameraPlugin", "camera", data);
          else
            Utils.alert.show("This platform is not supported for multishot")
        });
      }

      function successCallback(jsonArrayFilePath) {
        var isIOS = ionic.Platform.isIOS();
        var isAndroid = ionic.Platform.isAndroid();

        //Revisar que dispositivo es
        if (isAndroid === true) {
          for (var i = 0; i < jsonArrayFilePath.length; i++) {

            MultiImageService.handleMediaDialog(jsonArrayFilePath[i]).then(function () {
              $scope.data.pictures = FileService.images();
              $scope.data.thumbPictures = FileService.thumbImages();
            });
          }
        }
        else if (isIOS === true) {
          var data = JSON.parse(jsonArrayFilePath);
          for (var j = 0; j < data.length; j++) {

            MultiImageService.handleMediaDialog(data[j]).then(function () {
              $scope.data.pictures = FileService.images();
              $scope.data.thumbPictures = FileService.thumbImages();
            });
          }
        }
        $timeout(function () {
          $scope.checkPhotosTutorial();
        }, 1000);
      }

      function errorCallback(message) {
        Utils.alert.show("Can't execute Multishot");
        console.error("Can't execute Multishot because:", message);
      }

      //Fin Zona para multishot
      /*
        zona watch scope
        */
      $scope.$watch('data.pictures.length', function () {
        if ($scope.idImages.substr(0, 17) != 'templateAutomate0') {
          $scope.templateReset();
          if ($scope.data.pictures.length == 1) {
            $scope.idImages = 'templateA11';
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          }
          else if ($scope.data.pictures.length == 2) {
            $scope.idImages = 'templateB21';
            $scope.B21 = {'background': 'url(img/2.1On.svg)'};
          }
          else if ($scope.data.pictures.length == 3) {
            $scope.idImages = 'templateB34';
            $scope.B34 = {'background': 'url(img/3.4On.svg)'};
          }
          else if ($scope.data.pictures.length == 4) {
            $scope.idImages = 'templateB42';
            $scope.B42 = {'background': 'url(img/4.2On.svg)'};
          }
          else if ($scope.data.pictures.length == 5) {
            $scope.idImages = 'templateB54';
            $scope.B54 = {'background': 'url(img/5.4On.svg)'};
          }
          else if ($scope.data.pictures.length == 6) {
            $scope.idImages = 'templateB63';
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
          else {
            $scope.idImages = 'templateB63';
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
        } else {
          $scope.idImages = 'templateAutomate01' //Patch to force animation to start
          ionic.requestAnimationFrame(function () {
            $scope.showScrollBars($scope.data.modeSelect);
          });
        }
      });

      /*
        Scope to get all suggestions
        */
      $scope.data.lengthCheck = 0;

      $scope.$watch('data.mentionsList.length', function () {
        if ($scope.data.mentionsList.length != 0) {
          if ($scope.data.lengthCheck <= $scope.data.mentionsList.length) {
            $timeout(function () {
              $scope.data.lengthCheck = $scope.data.mentionsList.length;
              var textbox = document.getElementById("sequenceName");
              textbox.focus();
            }, 250);
          } else {
          }
        }
      });

      $scope.userTest = {};
      //Zone for Tags
      $scope.getTagTextRaw = function (item) {
        var cont = 0;
        if (item.label) {
          return '@' + item.name + '';
        } else {
          for (var i = 0; i < $scope.data.mentionsList.length; i++) {
            if ($scope.data.mentionsList[i].id == item.id) {
              cont++;
            }
          }
          if (cont === 0) {
            $scope.data.mentionsList.push(item);
          }
          return '@' + item.name + '';
        }

        //return '[@'+item.name+']';
      };

      $scope.searchTags = function (term) {

        var tagsList = [];
        if (term !== "") {
          if (term.length >= 3) {
            UserService.findFriendsByUserSubscriptionIdTagv167({
              userId: userId,
              term: term,
              start: 0,
              count: 25
            }).$promise.then(function (response) {
              response.length--;
              for (var i = 0; i < response.length; i++) {
                var photo = "";
                //+'?decache=' + Math.random()
                if (response[i].profilePicture !== null) {
                  photo = "data:image/jpeg;base64," + response[i].profilePicture.split(':')[2];
                } else if (response[i].profilePictureUrl !== null) {
                  photo = response[i].profilePictureUrl + '?decache=' + Math.random();
                }
                //var photo = response[i].profilePicture === null ? "img/ProfilePhoto.svg" : "data:image/jpeg;base64,"+response[i].profilePicture.split(':')[2];
                //var photo = response[i].profilePictureUrl === null ? "img/ProfilePhoto.svg" : "data:image/jpeg;base64,"+response[i].profilePicture.split(':')[2];
                tagsList.push({
                  id: response[i].userSubscription.href.split('/')[6],
                  name: response[i].name.replace(/\s\s+/g, ' '),
                  photo: photo
                });
              }
              $scope.tags = tagsList;
              $scope.tagsHidden = tagsList;
            }, function (error) {
            });
          }
        }
      };
      //END Zone for Tags

      //Zone for hashTags
      /*$scope.getHashTextRaw = function (item) {
        var cont = 0;
        if (item.label) {
          $scope.data.hashList.push(item);
          return '#' + item.label + '';
        } else {
          for (var i = 0; i < $scope.data.hashList.length; i++) {
            if ($scope.data.hashList[i].id == item.id) {
              cont++;
            }
          }
          if (cont === 0) {
            $scope.data.hashList.push(item);
          }
          return '#' + item.hash + '';
        }
      };

      $scope.searchHashs = function (term) {
        var hashsList = [];
        if (term !== "") {
          SequenceService.findHashsTagsatWriting(term).$promise.then(function (response) {
            for (var i = 0; i < response.length; i++) {
              hashsList.push({
                id: response[i].hashTagObj.href.split('/')[6],
                hash: response[i].hashTag
              })
            }
            $scope.hashs = hashsList;
            $scope.hashsHidden = hashsList;
          }, function (error) {
          });
        }
      };*/
      //End zone for hashtags

      /*
        code to multilines text area
        */
      function autosize() {
        var el = this;
        el.style.cssText = 'height:auto; padding:0';
        el.style.cssText = 'height:' + el.scrollHeight + 'px';
      }

      //check how many times the user have already logged in before show any tutorial
      $scope.chkTimesLogged = function () {
        DBServices.execute(
          "SELECT * FROM userLogCount WHERE name = ?",
          [window.localStorage.getItem("name")]
        ).then(function (resultSet) {
          if (resultSet.rows.length > 0) {
            if (resultSet.rows.item(0).count >= 1) {
              $scope.needsTutorialOne();
            }
          }
        }, function (error) {

        });

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
          transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
            if (resultSet.rows.length > 0) {
              if (resultSet.rows.item(0).count >= 1) {
                $scope.needsTutorialOne();
              }
            }
          })
        })*/
      };

      //code to show tutorial first part
      $scope.needsTutorialOne = function () {
        DBServices.execute("SELECT * FROM tutorials WHERE name = ?", ["upload"]).then(function (resultSet) {
          var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
          if (visitedJson.first) {
            document.getElementById("sideMenuCqnz").style.visibility = "hidden";
            window.localStorage.setItem("openTutorial", true);
            var intro = introJs();
            intro.setOptions({
              steps: [
                {
                  intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP1.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP1.TEXT') + '</p>',
                  position: 'auto'
                },
                {
                  intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP2.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium; padding: 0 40px 0 40px;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP2.TEXT') + '</p>',
                  position: 'auto'
                }
              ],
              nextLabel: Utils.translate('GLOBAL.NEXT'),
              prevLabel: Utils.translate('GLOBAL.BACK'),
              doneLabel: Utils.translate('GLOBAL.DONE'),
              skipLabel: Utils.translate('GLOBAL.SKIP'),
              hidePrev: false,
              hideNext: false,
              exitOnOverlayClick: false,
              showStepNumbers: false,
              showBullets: false,
              showProgress: false,
              overlayOpacity: 1,
              scrollToElement: false,
              disableInteraction: true
            });
            intro.onexit(function () {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              visitedJson.first = false;
              $scope.updateBD("upload", JSON.stringify(visitedJson));
            }).oncomplete(function () {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              visitedJson.first = false;
              $scope.updateBD("upload", JSON.stringify(visitedJson));
            }).onchange(function (step) {
            }).start();
          }
          else {
            document.getElementById("sideMenuCqnz").style.visibility = "initial";
            window.localStorage.setItem("openTutorial", false);
          }
        }, function (error) {
        });


        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM tutorials WHERE name = ?";
          transaction.executeSql(querySelect, ["upload"], function (tx, resultSet) {
            var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
            if (visitedJson.first) {
              document.getElementById("sideMenuCqnz").style.visibility = "hidden";
              window.localStorage.setItem("openTutorial", true);
              var intro = introJs();
              intro.setOptions({
                steps: [
                  {
                    intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP1.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP1.TEXT') + '</p>',
                    position: 'auto'
                  },
                  {
                    intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP2.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium; padding: 0 40px 0 40px;">' + Utils.translate('TUTORIAL.UPLOAD.FIRST.STEP2.TEXT') + '</p>',
                    position: 'auto'
                  }
                ],
                nextLabel: Utils.translate('GLOBAL.NEXT'),
                prevLabel: Utils.translate('GLOBAL.BACK'),
                doneLabel: Utils.translate('GLOBAL.DONE'),
                skipLabel: Utils.translate('GLOBAL.SKIP'),
                hidePrev: false,
                hideNext: false,
                exitOnOverlayClick: false,
                showStepNumbers: false,
                showBullets: false,
                showProgress: false,
                overlayOpacity: 1,
                scrollToElement: false,
                disableInteraction: true
              });
              intro.onexit(function () {
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.first = false;
                $scope.updateBD("upload", JSON.stringify(visitedJson));
              }).oncomplete(function () {
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.first = false;
                $scope.updateBD("upload", JSON.stringify(visitedJson));
              }).onchange(function (step) {
              }).start();
            } else {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
            }
          })
        }, function (tx, error) {
        });*/
      };

      //get when user writes @ or #
      /*$scope.data.tagAssembled = "";
      $scope.data.isTagging = false;
      $scope.data.textLength = 0;
      $scope.data.deleting = false;
      $scope.catchTagsWhenWritten = function(info){
        var re = new RegExp("([\S]{1})");
        var tagsList = [];
        if(info){
          if($scope.data.textLength <= info.length){
            $scope.data.deleting = false;
          }
          else {
            $scope.data.deleting = true;
          }
          $scope.data.textLength = info.length;
          if(info.length>=1){
            var lastChar = info.slice(info.length-1);
            if(!$scope.data.isTagging){
              //after first @ writed we enter "tag mode"
              if(lastChar == "@"){
                $scope.data.isTagging = true;
                //show suggested tag list
                UserService.findFriendsByUserSubscriptionIdTagv167({
                  userId: userId,
                  term: 'a',
                  start: 0,
                  count: 3
                }).$promise.then(function(response) {
                  response.length--;
                  for (var i = 0; i < response.length; i++) {
                    var photo = "";
                    if (response[i].profilePicture !== null) {
                      photo = "data:image/jpeg;base64," + response[i].profilePicture.split(':')[2];
                    } else if (response[i].profilePictureUrl !== null) {
                      photo = response[i].profilePictureUrl + '?decache=' + Math.random();
                    }
                    tagsList.push({
                      id: response[i].userSubscription.href.split('/')[6],
                      name: response[i].name.replace(/  +/g, ' '),
                      photo: photo
                    });
                  }
                  $scope.tags = tagsList;
                  $scope.tagsHidden = tagsList;
                  $scope.data.mentionsList = tagsList;
                }, function (error) {
                  $scope.data.isTagging = false;
                  $scope.data.tagAssembled = "";
                  $scope.tags = [];
                  $scope.tagsHidden = [];
                  $scope.data.mentionsList=[];
                });
              }
            } else {
              //check last character writed is an space
              //stop tag mode
              //if(re.test(lastChar)){
              if(lastChar==" "){
                $scope.data.isTagging = false;
                $scope.data.tagAssembled = "";
                $scope.tags = [];
                $scope.tagsHidden = [];
                $scope.data.mentionsList=[];
              } else {
                if(lastChar == "@"){
                  UserService.findFriendsByUserSubscriptionIdTagv167({
                    userId: userId,
                    term: 'a',
                    start: 0,
                    count: 3
                  }).$promise.then(function(response) {
                    response.length--;
                    for (var i = 0; i < response.length; i++) {
                      var photo = "";
                      if (response[i].profilePicture !== null) {
                        photo = "data:image/jpeg;base64," + response[i].profilePicture.split(':')[2];
                      } else if (response[i].profilePictureUrl !== null) {
                        photo = response[i].profilePictureUrl + '?decache=' + Math.random();
                      }
                      tagsList.push({
                        id: response[i].userSubscription.href.split('/')[6],
                        name: response[i].name.replace(/  +/g, ' '),
                        photo: photo
                      });
                    }
                    $scope.tags = tagsList;
                    $scope.tagsHidden = tagsList;
                    $scope.data.mentionsList = tagsList;
                  }, function (error) {
                    $scope.data.isTagging = false;
                    $scope.data.tagAssembled = "";
                    $scope.tags = [];
                    $scope.tagsHidden = [];
                    $scope.data.mentionsList=[];
                  });
                } else {
                  if($scope.data.deleting){
                    $scope.data.tagAssembled = $scope.data.tagAssembled.slice(0,-1);
                  } else {
                    $scope.data.tagAssembled = $scope.data.tagAssembled + lastChar;
                  }
                  //if the last character wasn't space we add to the list
                  //to use it for search users

                  UserService.findFriendsByUserSubscriptionIdTagv167({
                    userId: userId,
                    term: $scope.data.tagAssembled,
                    start: 0,
                    count: 3
                  }).$promise.then(function(response) {
                    response.length--;
                    for (var i = 0; i < response.length; i++) {
                      var photo = "";
                      if (response[i].profilePicture !== null) {
                        photo = "data:image/jpeg;base64," + response[i].profilePicture.split(':')[2];
                      } else if (response[i].profilePictureUrl !== null) {
                        photo = response[i].profilePictureUrl + '?decache=' + Math.random();
                      }
                      tagsList.push({
                        id: response[i].userSubscription.href.split('/')[6],
                        name: response[i].name.replace(/  +/g, ' '),
                        photo: photo
                      });
                    }
                    $scope.tags = tagsList;
                    $scope.tagsHidden = tagsList;
                    $scope.data.mentionsList = tagsList;
                  }, function (error) {
                  });
                }
              }
            }
          }
        } else {
          $scope.data.isTagging = false;
          $scope.data.tagAssembled = "";
          $scope.tags = [];
          $scope.tagsHidden = [];
          $scope.data.mentionsList=[];
        }
      };*/

      //SEND USER TO EDIT TEXT AREA
      $scope.openTextEditArea = function () {
        /*var dialog = Utils.alert.getCtrl();
        dialog.show({
          controller: "statementCtrl",
          templateUrl: 'templates/Uploads/statementTpl.html',
          //targetEvent: ev,
          clickOutsideToClose: false,
          fullscreen: true, // Only for -xs, -sm breakpoints.
          locals: {groupData: $scope.groupData, dialog: dialog},
          openFrom: '#right',
          multiple: true
        }).then(function () {
          $scope.statementBtnAction = 'open';
        }, function () {
          $scope.statementBtnAction = 'open';
        });*/

        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/partials/tags-modal.html',
          controller: 'tagsModalCtrl',
          locals: {
            description: $scope.data.sequenceName,
            mentions: $scope.data.mentionsList,
            hash: $scope.data.hashList,
            dialog: dialog
          },
          clickOutsideToClose: false,
          fullscreen: true // Only for -xs, -sm breakpoints.
        }).then(function (resp) {
          $scope.data.sequenceName = resp.description;
          $scope.data.mentionsList = resp.savedTags;
          $scope.data.hashList = resp.savedHashes;
        });
      }

      /*$timeout(function() {
            $scope.chkTimesLogged();
            //$scope.needsTutorialOne();
        }, 1500);*/
      //END code to show tutorial first part

      // revisar # fotos para mostrar o no tutorial
      $scope.checkPhotosTutorial = function () {
        if ($scope.data.pictures.length >= 2) {
          DBServices.execute(
            "SELECT * FROM userLogCount WHERE name = ?",
            [window.localstorage.getItem("name")]
          ).then(function (resultSet) {
            if (resultSet.rows.length > 0) {
              if (resultSet.rows.item(0).count >= 1) {
                $scope.needsTutorialTwo();
              }
            }
          }, function (error) {
          })

          /*userProfileData.dataBaseUser.transaction(function (transaction) {
            var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
            transaction.executeSql(querySelect, [window.localstorage.getItem("name")], function (tx, resultSet) {
              if (resultSet.rows.length > 0) {
                if (resultSet.rows.item(0).count >= 1) {
                  $scope.needsTutorialTwo();
                }
              }
            })
          });*/
        }
      }
      //

      //code to show tutorial second part
      $scope.needsTutorialTwo = function () {
        DBServices.execute("SELECT * FROM tutorials WHERE name = ?", ["upload"]).then(function (resultSet) {
          var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
          if (visitedJson.second) {
            document.getElementById("sideMenuCqnz").style.visibility = "hidden";
            window.localStorage.setItem("openTutorial", true);
            var intro = introJs();
            intro.setOptions({
              steps: [
                {
                  intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.SECOND.STEP1.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.SECOND.STEP1.TEXT') + '</p>',
                  position: 'auto',
                  tooltipClass: 'frameTitleUpload'
                }
              ],
              nextLabel: Utils.translate('GLOBAL.NEXT'),
              prevLabel: Utils.translate('GLOBAL.BACK'),
              doneLabel: Utils.translate('GLOBAL.DONE'),
              skipLabel: Utils.translate('GLOBAL.SKIP'),
              hidePrev: false,
              hideNext: false,
              exitOnOverlayClick: false,
              showStepNumbers: false,
              showBullets: false,
              showProgress: false,
              overlayOpacity: 1,
              scrollToElement: false,
              disableInteraction: true
            });
            intro.onexit(function () {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              visitedJson.second = false;
              $scope.updateBD("upload", JSON.stringify(visitedJson));
            }).oncomplete(function () {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
              visitedJson.second = false;
              $scope.updateBD("upload", JSON.stringify(visitedJson));
            }).onchange(function (step) {
            }).start();
          }
          else {
            document.getElementById("sideMenuCqnz").style.visibility = "initial";
            window.localStorage.setItem("openTutorial", false);
          }
        }, function (error) {

        });

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "SELECT * FROM tutorials WHERE name = ?";
          transaction.executeSql(querySelect, ["upload"], function (tx, resultSet) {
            var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
            if (visitedJson.second) {
              document.getElementById("sideMenuCqnz").style.visibility = "hidden";
              window.localStorage.setItem("openTutorial", true);
              var intro = introJs();
              intro.setOptions({
                steps: [
                  {
                    intro: '<p style="color:white !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.SECOND.STEP1.TITLE') + '</p><p style="color:lightgrey !important; text-align:center; font-size: medium;">' + Utils.translate('TUTORIAL.UPLOAD.SECOND.STEP1.TEXT') + '</p>',
                    position: 'auto',
                    tooltipClass: 'frameTitleUpload'
                  }
                ],
                nextLabel: Utils.translate('GLOBAL.NEXT'),
                prevLabel: Utils.translate('GLOBAL.BACK'),
                doneLabel: Utils.translate('GLOBAL.DONE'),
                skipLabel: Utils.translate('GLOBAL.SKIP'),
                hidePrev: false,
                hideNext: false,
                exitOnOverlayClick: false,
                showStepNumbers: false,
                showBullets: false,
                showProgress: false,
                overlayOpacity: 1,
                scrollToElement: false,
                disableInteraction: true
              });
              intro.onexit(function () {
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.second = false;
                $scope.updateBD("upload", JSON.stringify(visitedJson));
              }).oncomplete(function () {
                document.getElementById("sideMenuCqnz").style.visibility = "initial";
                window.localStorage.setItem("openTutorial", false);
                visitedJson.second = false;
                $scope.updateBD("upload", JSON.stringify(visitedJson));
              }).onchange(function (step) {
              }).start();
            } else {
              document.getElementById("sideMenuCqnz").style.visibility = "initial";
              window.localStorage.setItem("openTutorial", false);
            }
          })
        });*/
      };
      //code to show tutorial second part

      //code to update BD
      $scope.updateBD = function (tutorial, change) {
        DBServices.execute(
          "UPDATE tutorials SET visited = ? WHERE name = ?",
          [change, tutorial]
        ).then(function (value) {
        }, function (error) {
        });

        /*userProfileData.dataBaseUser.transaction(function (transaction) {
          var querySelect = "UPDATE tutorials SET visited = ? WHERE name = ?";
          transaction.executeSql(querySelect, [change, tutorial], function (tx, resultSet) {
          }, function (tx, error) {
          })
        }, function (error) {
        }, function () {
        });*/
      }
      //

      //Code to send photo to personalize
      $ionicModal.fromTemplateUrl('templates/personalizeImage.html', {
        scope: $scope
      }).then(function (modal) {
        $scope.modalPersonalize = modal;
      });

      $scope.initPersonalizeData = function () {
        $scope.data.threshold = 127;
        $scope.data.whiteDistance = 127;
        $scope.data.chkremoveWhite = false;
        $scope.data.textPhoto = 'Example...';
      }

      $scope.sendIndex = function (index) {
        $scope.modalPersonalize.show();
        $scope.data.selectedImageIndex = index;
        $scope.initPersonalizeData();
        //Se revisa si el área de trabajo ya esta creada sino se crea
        if (!$scope.data.workArea) {
          $scope.data.workArea = new fabric.Canvas('areaForWork');
        }
        //Damos tamaño de acuerdo al tamaño de la pantalla al área de trabajo
        $scope.data.workArea.setHeight(window.innerHeight * .7);
        $scope.data.workArea.setWidth(window.innerWidth);
        //Damos color de fondo opcional
        $scope.data.workArea.backgroundColor = 'red';
        //Se hace render de todas las opciones del area de trabajo
        $scope.data.workArea.renderAll();

        //Se coloca la imagen seleccionada como el fondo del area de trabajo
        fabric.Image.fromURL($scope.data.pictures[index], function (img) {
          // se asigna la imagen resultante a dos scope
          var hImage = img;
          $scope.mainImage = img;
          $scope.hiddenImage = hImage;

          $scope.mainImage.set({
            width: $scope.data.workArea.width,
            height: $scope.data.workArea.height,
            originX: 'left',
            originY: 'top',
            selectable: false
          });
          $scope.data.workArea.setBackgroundImage($scope.mainImage, $scope.data.workArea.renderAll.bind($scope.data.workArea));
        });
      };

      $scope.cancelEdit = function () {
        $scope.data.workArea.clear();
        $scope.modalPersonalize.hide();
      };

      $scope.applyFilter = function (index, filter) {
        $scope.mainImage.filters[index] = filter;
        $scope.mainImage.applyFilters($scope.data.workArea.renderAll.bind($scope.data.workArea));
      };

      $scope.applyFilterValue = function (index, prop, value) {
        if ($scope.mainImage.filters[index]) {
          $scope.mainImage.filters[index][prop] = value;
          $scope.mainImage.applyFilters($scope.data.workArea.renderAll.bind($scope.data.workArea));
        }
      };

      $scope.filterGrayscale = function () {
        $scope.applyFilter(0, new fabric.Image.filters.Grayscale());
      };

      $scope.filterInvert = function () {
        $scope.applyFilter(1, new fabric.Image.filters.Invert());
      };

      $scope.filterSepia = function () {
        $scope.applyFilter(2, new fabric.Image.filters.Sepia());
      };

      $scope.filterSepia2 = function () {
        $scope.applyFilter(3, new fabric.Image.filters.Sepia2());
      };

      $scope.filterWhite = function () {
        $scope.applyFilter(4, $scope.data.chkremoveWhite && new fabric.Image.filters.RemoveWhite({
          threshold: $scope.data.threshold,
          distance: $scope.data.whiteDistance
        }));
      };

      $scope.valueThreshold = function () {
        $scope.applyFilterValue(4, 'threshold', $scope.data.threshold);
      };

      $scope.valueWhiteDistance = function () {
        $scope.applyFilterValue(4, 'distance', $scope.data.whiteDistance);
      };

      $scope.clearFilter = function () {
        $scope.mainImage.filters = [];
        $scope.initPersonalizeData();
        $scope.mainImage.applyFilters($scope.data.workArea.renderAll.bind($scope.data.workArea));
      };

      $scope.saveChanges = function () {
        $scope.hiddenImage.filters = $scope.mainImage.filters;
        $scope.hiddenImage.applyFilters($scope.data.workArea.renderAll.bind($scope.data.workArea));

        $scope.data.workArea.setHeight($scope.hiddenImage.height);
        $scope.data.workArea.setWidth($scope.hiddenImage.width);

        $scope.hiddenImage.set({
          width: $scope.hiddenImage.width,
          height: $scope.hiddenImage.height,
          originX: 'left',
          originY: 'top',
          selectable: false
        });

        //var imageChanged = $scope.data.workArea.toDataURL('jpeg');
        var imageChanged = $scope.data.workArea.toDataURL({
          format: "png",
          width: $scope.hiddenImage.width,
          height: $scope.hiddenImage.height
        });

        $scope.data.pictures[$scope.data.selectedImageIndex] = imageChanged;
        $scope.data.thumbPictures[$scope.data.selectedImageIndex] = imageChanged;

        $scope.cancelEdit();
      };

      $scope.addSticker = function (sticker) {
        fabric.loadSVGFromURL("img/" + sticker + ".svg", function (objects, options) {
          var obj = fabric.util.groupSVGElements(objects, options);
          $scope.data.workArea.add(obj).renderAll();
        });
      };

      $scope.makeTextPhoto = function () {
        var text = new fabric.Text($scope.data.textPhoto, {
          left: 100,
          top: 100,
          fontSize: 50,
          fontFamily: 'Helvetica',
          fontWeight: 'bold'
        });
        $scope.data.workArea.add(text).renderAll();
      };

      $scope.removeSelected = function () {
        if ($scope.data.workArea.getActiveGroup()) {
          $scope.data.workArea.getActiveGroup().forEachObject(function (o) {
            $scope.data.workArea.remove(o)
          });
          $scope.data.workArea.discardActiveGroup().renderAll();
        }
        else {
          $scope.data.workArea.remove($scope.data.workArea.getActiveObject());
        }

      };

      $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        $scope.modalPersonalize.remove();
      });
      //END Code to send photo to personalize

      //BEGIN code to slide photo show

      $scope.data.modeSelect = 'F';

      $scope.showScrollBars = function (mode) {
        if (mode === 'S') {
          if ($scope.data.pictures.length == 1) {
            mode = 'F';
            $scope.templateReset();
            $scope.idImages = 'templateA11';
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          } else {
            $scope.idImages = 'templateAutomate01'
            if ($scope.data.pictures.length <= 6) {
              $timeout(function () {
                $scope.idImages = 'templateAutomate0' + $scope.data.pictures.length;
              })
            }
          }
        }
        else {
          $scope.templateReset();
          if ($scope.data.pictures.length == 1) {
            $scope.idImages = 'templateA11';
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          }
          else if ($scope.data.pictures.length == 2) {
            $scope.idImages = 'templateB21';
            $scope.B21 = {'background': 'url(img/2.1On.svg)'};
          }
          else if ($scope.data.pictures.length == 3) {
            $scope.idImages = 'templateB34';
            $scope.B34 = {'background': 'url(img/3.4On.svg)'};
          }
          else if ($scope.data.pictures.length == 4) {
            $scope.idImages = 'templateB42';
            $scope.B42 = {'background': 'url(img/4.2On.svg)'};
          }
          else if ($scope.data.pictures.length == 5) {
            $scope.idImages = 'templateB54';
            $scope.B54 = {'background': 'url(img/5.4On.svg)'};
          }
          else if ($scope.data.pictures.length == 6) {
            $scope.idImages = 'templateB63';
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
          else {
            $scope.idImages = 'templateB63';
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
        }
        $scope.data.modeSelect = mode;
      }

      $scope.dest = null;
      $scope.origin = null;
      $scope.changePhotoFrameOrder = function (index) {
        var arrayThumb = [];
        var arrayPics = [];
        $scope.dest = $scope.origin;
        $scope.origin = index;
        if ($scope.dest !== null) {
          $scope.idImages = 'templateAutomate01'; //Patch to force animation to start
          arrayThumb = $scope.data.thumbPictures.reverse();
          arrayPics = $scope.data.pictures.reverse();
          arrayThumb[$scope.origin] = arrayThumb.splice($scope.dest, 1, arrayThumb[$scope.origin])[0];
          arrayPics[$scope.origin] = arrayPics.splice($scope.dest, 1, arrayPics[$scope.origin])[0];
          $scope.data.thumbPictures = arrayThumb.reverse();
          $scope.data.pictures = arrayPics.reverse();
          $scope.origin = null;
          ionic.requestAnimationFrame(function () {
            $scope.showScrollBars($scope.data.modeSelect);
          });
        }
        //$scope.showPhotoSlide(index);
      };
      $scope.prev = 0;
      $scope.showPhotoSlide = function (index) {
        document.getElementById('testimagesUpload' + $scope.prev).style.display = "none";
        document.getElementById('testimagesUpload' + index).style.display = "block";
        $scope.prev = index;
      }

      //END code to slide photo show
    }])

  .controller('uploadVideoCtrl', ['$rootScope', '$scope', '$state', 'FileService', '$timeout', 'ImageService', 'ApiEndPoint', '$ionicModal', 'MultiImageService', '$ionicPopup', 'usersData', 'SequenceService', 'UserService', 'ionicService', '$ionicPlatform', 's3', 'md5', 'VideoService', 'FileVideoService', '$sce', 'adsService', '$ionicPickerI18n', 'Utils', 'AWSServices',
    function ($rootScope, $scope, $state, FileService, $timeout, ImageService, ApiEndPoint, $ionicModal, MultiImageService, $ionicPopup, usersData, SequenceService, UserService, ionicService, $ionicPlatform, s3, md5, VideoService, FileVideoService, $sce, adsService, $ionicPickerI18n, Utils, AWSServices) {
      var userId = UserService.get_USER_ID();

      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      $scope.customColors = adsService.customColors;

      $scope.advertisement = {
        ownerMetadata: {name: UserService.get_USER_NAME(), avatar: UserService.get_USER_PHOTO()},
        creationTime: (new Date().toString())
      };

      $scope.dateTimePickerTitle = Utils.translate("UPLOAD.DATETIME_PICKER.TITLE");

      $ionicPickerI18n.weekdays = adsService.getWeekdaysLocalized();
      $ionicPickerI18n.months = adsService.getMonthsLocalized();

      $ionicPickerI18n.ok = Utils.translate("GLOBAL.OK");
      $ionicPickerI18n.cancel = Utils.translate("GLOBAL.CANCEL");
      /*$ionicPickerI18n.okClass = "button-positive";
      $ionicPickerI18n.cancelClass = "button-stable";
      $ionicPickerI18n.arrowButtonClass = "button-positive";*/

      // --> ZONE OF DECLARATIONS -->

      // FOOTER VARIABLES/CONFIG
      $scope.botonUploadOn = true; //<-- Controlls upload tab/btn state in footer
      //FOOTER VARIABLES/CONFIG

      /**
       * $state.params:
       * Previous controller must send this param
       * {isGroupTimeline: boolean, groupData: {} | {any}}
       * {} if isGroupTimeline == false
       * {any} otherwise (group timeline)
       */
      console.log("uploadVideoCtrl", $state.params);


      $scope.groupData = {};
      if ($state.params.isGroupTimeline)
        $scope.groupData = $state.params.groupData;


      $scope.uploadButtonText = Utils.translate('UPLOAD.' + (!$state.params.isGroupTimeline ? 'UPLOAD' : 'POST_GROUP'));


      $scope.data = {};
      $scope.data.numElements = 0;
      $scope.data.sequenceName = null;
      $scope.data.mentionsList = [];
      $scope.data.hashList = [];
      $scope.data.compareHashList = [];
      $scope.data.selectedBgColor = $scope.customColors[$scope.iAmAdvertiser ? 10 : 1];
      $scope.data.selectedFontColor = $scope.customColors[$scope.iAmAdvertiser ? 1 : 0];
      $scope.tags = [];
      $scope.hashs = [];
      $scope.galleryIsOpen = false;
      $scope.isIOS = ionic.Platform.isIOS();
      $scope.isAndroid = ionic.Platform.isAndroid();
      var isAndroid = ionic.Platform.isAndroid();
      $scope.data.haveVideo = 0;
      $scope.data.videoBlob = null;
      FileVideoService.cleanVideo();
      $scope.uploading = false;
      $scope.data.videoFile = null;
      $scope.data.totalFileUpload = 100;
      $scope.data.totalFileloaded = 0;
      $scope.data.labelProgress = "";
      $scope.data.enableComments = true;
      $scope.data.temporalVideoThumbnail = "";
      $scope.data.lifetime = false;
      $scope.data.shareable = true;
      $scope.data.sharelife = 0;
      $scope.data.codecProgress = null;
      $scope.data.finalDate = new Date();
      //END Declare zone


      //SEND USER TO EDIT TEXT AREA
      $scope.openTextEditArea = function () {

        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/partials/tags-modal.html',
          controller: 'tagsModalCtrl',
          locals: {
            description: $scope.data.sequenceName,
            mentions: $scope.data.mentionsList,
            hash: $scope.data.hashList,
            dialog: dialog
          },
          clickOutsideToClose: false,
          fullscreen: true // Only for -xs, -sm breakpoints.
        }).then(function (resp) {
          $scope.data.sequenceName = resp.description;
          $scope.data.mentionsList = resp.savedTags;
          $scope.data.hashList = resp.savedHashes;
        });
      }

      //EXTRA Code
      //needed for autosize textArea
      function autosize() {
        var el = this;
        el.style.cssText = 'height:auto; padding:0';
        el.style.cssText = 'height:' + el.scrollHeight + 'px';
      }

      //END needed for autosize textArea

      //Default Template
      $scope.defaultTemplate = function () {
        $scope.idImages = 'templateVideo';
      };
      //END Default Template
      //END EXTRA


      var exits = 0;
      var mentionFix = "";
      var deleteArray = [];
      var typeUpload = "3"; //VIDEO
      var realTemplateName = 'templateVideo';
      var widthFinal = 0;
      var heightFinal = 0;
      var file = null;
      var thumbVideoFile = null;
      var s3Service = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {Bucket: s3.bucket}
      });

      //UPLOAD VIDEO
      $scope.addNewSequence = function (template) {
        if ($scope.galleryIsOpen === true) {
          Utils.alert.show("Gallery is still open");
          return;
        }
        $scope.uploading = true;
        console.log('before anything', $scope.data.enableComments);
        //ZONE for make thumb image
        if ($scope.data.temporalVideoThumbnail == "") {


          var video = document.getElementById('videoAreaUpload');
          var canvas = document.createElement("canvas");
          //ZONE to calcule dimensions for thumbnail
          if (video.videoWidth >= video.videoHeight) {
            widthFinal = 310;
            heightFinal = (video.videoHeight * 310) / video.videoWidth;
          } else {
            heightFinal = 310;
            widthFinal = (video.videoWidth * 310) / video.videoHeight;
          }
          //

          canvas.height = heightFinal;
          canvas.width = widthFinal;

          canvas.getContext('2d').drawImage(video, 0, 0, widthFinal, heightFinal);
          var imgDataUrl = canvas.toDataURL();

          thumbVideoFile = Utils.dataURLtoBlob(imgDataUrl);
          //END ZONE for make thumb image
        } else {
          thumbVideoFile = $scope.data.temporalVideoThumbnail;
        }
        //Convert file to blob
        //var fileChooser = document.getElementById('file-upload');
        //file = fileChooser.files[0];
        file = $scope.data.videoFile;
        //  endConvert file to blob


        //check if the sequence name is empty
        if ($scope.data.sequenceName === null) {
          $scope.data.sequenceName = " ";
        } else {
          if ($scope.data.mentionsList.length > 0) {
            //Check if any mention in list is unused
            var titleTempo = "";
            var nameToCheck = "";
            for (var x = 0; x < $scope.data.mentionsList.length; x++) {
              nameToCheck = "@" + $scope.data.mentionsList[x].name.replace(/\s+$/g, '');
              titleTempo = $scope.data.sequenceName;

              if (titleTempo.indexOf(nameToCheck, 0) != -1)
                exits++;
              else
                deleteArray.push(x);
            }
            if (deleteArray.length > 0) {
              for (var k = 0; k < deleteArray.length; k++) {
                $scope.data.mentionsList.splice(deleteArray[k], 1);
              }
            }
          }
        }


        if (!$scope.groupData || !$scope.groupData.hrefId)
          createUserCqnzRecord();
        else
          createGroupCqnzRecord();
      };

      function createUserCqnzRecord() {
        var hoursLive = 0;
        if ($scope.data.lifetime) {
          hoursLive = 24;
        }
        //Start with create empty sequence
        SequenceService.addNewSequencev100({
          userId: userId,
          description: $scope.data.sequenceName,
          templateId: realTemplateName,
          itemCount: 1,
          sequenceType: typeUpload,
          commentsEnabled: $scope.data.enableComments,
          temporary: hoursLive,
          shareable: $scope.data.shareable,
          sharelife: $scope.data.sharelife,
          isAdvertisement: $scope.iAmAdvertiser,
          headerBgColor: $scope.data.selectedBgColor,
          headerFontColor: $scope.data.selectedFontColor,
          finalDate: $scope.data.finalDate
        }).$promise.then(function uploadSequenceVideo(response) {
          uploadCqnzData(response);
        }, function failUploadSequenceVideo(error) {
          $scope.uploading = false;
          $scope.uploadErrorMessage = 'Unable to upload your sequence. Verify your internet connection and try again later.';
        })
      }

      function createGroupCqnzRecord() {
        var hoursLive = 0;
        if ($scope.data.lifetime) {
          hoursLive = 24;
        }
        SequenceService.addNewGroupSequence({
          userId: userId,
          description: $scope.data.sequenceName,
          templateId: realTemplateName,
          itemCount: 1,
          sequenceType: typeUpload,
          groupId: $scope.groupData.hrefId,
          commentEnable: $scope.data.enableComments,
          temporary: hoursLive,
          shareable: $scope.data.shareable,
          sharelife: $scope.data.sharelife,
          isAdvertisement: $scope.iAmAdvertiser,
          headerBgColor: $scope.data.selectedBgColor,
          headerFontColor: $scope.data.selectedFontColor
        }).then(function (createRecordResponse) {
          //console.log(createRecordResponse);
          uploadCqnzData(createRecordResponse);
        }, function (createRecordError) {
          console.error(createRecordError);
          $scope.uploading = false;
          //fixme: add translate support
          $scope.uploadErrorMessage = 'Unable to upload your sequence. Verify your internet connection and try again later.';
          //alert('Unable to create your sequence verify your internet connection');
        });
      }

      /**
       * uploads thumb and video to s3 (through uploadCqnzPhotos function)
       * inserts mentions (@ and #)'s on DB and redirects to next page
       * @param response (createCqnzRecord response object)
       */
      function uploadCqnzData(response) {
        uploadCqnzVideo(response.result.links["0"].href).then(function successAddVideo(responseAdd) {
          var tagPromises = {};
          var hashPromises = {};
          var addHashPromises = {};

          //part to add tags for the sequences
          if ($scope.data.mentionsList.length > 0) {
            for (var j = 0; j < $scope.data.mentionsList.length; j++) {
              var subscriptionInstanceId = $scope.data.mentionsList[j].id;
              tagPromises[subscriptionInstanceId] = SequenceService.sendTagNotificationUpload({
                sequenceId: response.result.instanceId,
                userId: subscriptionInstanceId
              }).$promise;

            }

            Utils.$q.all(tagPromises).then(function (responseTag) {
              var responseKeys = Object.keys(responseTag);
              var responseValues = responseKeys.map(function (key) {
                return responseTag[key];
              });
              var tokenPromises = [];
              for (var i = 0; i < responseKeys.length; i++) {
                subscriptionInstanceId = responseKeys[i];
                if (responseValues[i].result.value) {
                  tokenPromises[tokenPromises.length++] = UserService.getDevices(subscriptionInstanceId).$promise;
                }
              }

              Utils.$q.all(tokenPromises).then(function (responseKey) {
                var tokens = [];
                var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
                var message = name + " tagged you in a sequence";
                message = message.replace(/\s\s+/g, ' ');
                for (var i = 0; i < responseKey.length; i++) {
                  for (var j = 0; j < responseKey[i].value.length; j++) {
                    var endpointArn = responseKey[i].value[j].title;
                    AWSServices.sendNotification(message, endpointArn);
                  }
                }
              }, function (response) {
              });
              console.log("Tags added");
            }, function (response) {
            });
          }

          var find = 0;
          //check if the title has any hash added
          var hashToStore = [];
          if ($scope.data.hashList.length > 0) {
            //when the user selected one or more hash already created
            //we obtain each hash(#*****) to compare it
            var parts = $scope.data.sequenceName.match(/\#{1}\S+/g);
            for (var i = 0; i < parts.length; i++) {
              var hashClean = parts[i].split('#');
              //For each tag finded we run a process acordly, add if new or add count if already exits
              for (var j = 0; j < $scope.data.hashList.length; j++) {
                if (hashClean[1] == $scope.data.hashList[j].hash) {
                  hashToStore[i] = $scope.data.hashList[j].id;
                  //ws to add count to prexist hashtag
                  var promiseHash = SequenceService.modifyHashCount(
                    {"objectId": $scope.data.hashList[j].id}
                  ).save({
                    "int": {
                      "value": 1
                    }
                  }).$promise;
                  find = 1;
                }
              }
              if (find == 0) {
                hashToStore[i] = 0;
                //ws to add new hashtag
                var promiseHash = SequenceService.createHashTag().save({
                  "hashtag": {
                    "value": hashClean[1]
                  }
                }).$promise;
              }
              find = 0;
              //add each ws promise to wait for all of them
              hashPromises[i] = promiseHash;
            }
            //wait to all ws have been completed
            Utils.$q.all(hashPromises).then(function (responseHash) {
              //we need to link the hashtags to the sequence
              var responseKeys = Object.keys(responseHash);
              var responseValues = responseKeys.map(function (key) {
                return responseHash[key];
              });
              //get the Id from new hashtags created into a list
              for (var a = 0; a < responseKeys.length; a++) {
                if (responseValues[a].result) {
                  hashToStore[a] = responseValues[a].result.links[0].href.split('/')[6]
                }
              }
              //the list now contains all hashtag's ids news or not
              for (var b = 0; b < hashToStore.length; b++) {
                //ws to add each hastag to sequence
                var addHashPromises = SequenceService.addHashtoSequence().save({
                  "sequence": {
                    "value": {
                      "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + response.result.links["0"].href.split('/')[6]
                    }
                  },
                  "hashTag": {
                    "value": {
                      "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + hashToStore[b]
                    }
                  }
                }).$promise;
              }
              Utils.$q.all(addHashPromises).then(function () {
              }, function (response) {
              });
            }, function (response) {
            });
          } else {
            var parts = $scope.data.sequenceName.match(/\#{1}\S+/g);
            if (parts) {
              if (parts.length > 0) {
                //if we find #******* in the title we assume it's a hashtag
                for (var i = 0; i < parts.length; i++) {
                  var hashClean = parts[i].split('#');
                  //Ws to create the new hashtag
                  var promiseHash = SequenceService.createHashTag().save({
                    "hashtag": {
                      "value": hashClean[1]
                    }
                  }).$promise;
                  hashPromises[i] = promiseHash;
                }
              }
              //Wait to all ws to be completed
              Utils.$q.all(hashPromises).then(function (responseHash) {
                var responseKeys = Object.keys(responseHash);
                var responseValues = responseKeys.map(function (key) {
                  return responseHash[key];
                });

                for (var a = 0; a < responseKeys.length; a++) {
                  var addHashPromises = SequenceService.addHashtoSequence().save({
                    "sequence": {
                      "value": {
                        "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + response.result.links["0"].href.split('/')[6]
                      }
                    },
                    "hashTag": {
                      "value": {
                        "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + responseValues[a].result.links[0].href.split('/')[6]
                      }
                    }
                  }).$promise;
                }
                Utils.$q.all(addHashPromises).then(function () {
                }, function (response) {
                });
              }, function (response) {
              });
            }
          }


          FileVideoService.cleanVideo();

          $state.go('menu.timeline', {groupIndex: $scope.groupData.groupIndex});

          setTimeout(function () {
            $rootScope.$emit("sequence.created", {
              from: ($scope.groupData && $scope.groupData.hrefId) ? 'groupTimelineCtrl' : 'TimeLineCtrl',
              type: 'STATEMENT',
              sequenceId: response.result.instanceId
            });
          }, 800);

        }, function failAddVideo(error) {
          console.error(error)
          $scope.uploading = false;
          $scope.uploadErrorMessage = 'Unable to add your video. Verify your internet connection and try again later.';
          SequenceService.deleteSequence(
            {"objectId": response.config.data.sequence.value.href.split('/')[6]}
          ).post().$promise.then(function (response) {
          }, function (response) {
          });
        });
      }

      /**
       * Uploads video/thumbnails to s3
       * @param sequenceHref
       * @returns {Promise} Array
       */
      function uploadCqnzVideo(sequenceHref) {
        var deferred = Utils.$q.defer();

        var userSubscriptionInstanceId = md5.createHash(userId);
        var sequenceInstanceId = md5.createHash(sequenceHref.split('/')[6]);

        if (!file) {
          return deferred.reject("Couldn't find video file");
        }

        //if the input have an file prepare video key
        var videoKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/video/001.mp4';
        var videoThumbKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/video/Thumb001.png';

        //add thumb video to s3
        s3Service.upload({
          Key: videoThumbKey,
          Body: thumbVideoFile,
          ACL: 'public-read',
          ContentType: thumbVideoFile.type
        }, function (err, data) {
          if (err) {
            //sequence.sharing = false;
            console.log('There was an error uploading the thumb for the video: ', err);
            return deferred.reject(err);
          }
          //url: data.Location
        });

        //add video to S3
        s3Service.upload({
          Key: videoKey,
          Body: file,
          ACL: 'public-read',
          ContentType: file.type
        }, function (err, data) {
          if (err) {
            //sequence.sharing = false;
            console.log('There was an error uploading the video: ', err);
            $scope.uploading = false;
            $scope.uploadErrorMessage = 'Unable to add your video. Verify your internet connection and try again later.';
            SequenceService.deleteSequence(
              {"objectId": response.config.data.sequence.value.href.split('/')[6]}
            ).post().$promise.then(function (response) {
            }, function (response) {
            });

            return deferred.reject(err);
          }
          //
          SequenceService.addItemToSequencev181().save({
            "sequence": {"value": {"href": sequenceHref}},
            "uRLPicture": {"value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + videoKey},
            "itemId": {"value": 1},
            "uRLThumbPicture": {"value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + videoThumbKey}
          }).$promise.then(function (respCqnz) {
            deferred.resolve(respCqnz);
          }, function (error) {
            deferred.resolve(error);
          });

          //
        }).on('httpUploadProgress', function (progress) {
          var elem = document.getElementById("progressVideoUpload");
          var roundProgress = (progress.loaded / progress.total * 100);
          elem.style.width = roundProgress.toFixed(0) + '%';
          $scope.data.labelProgress = roundProgress.toFixed(0) + '%';
          $scope.$apply();
        });

        return deferred.promise;
      }

      //END UPLOAD VIDEO

      //Zone for video Data capture
      $scope.getVideoFromDevice = function () {
        $scope.galleryIsOpen = true;
        $scope.isIOS = ionic.Platform.isIOS();
        $scope.isAndroid = ionic.Platform.isAndroid();
        VideoService.saveVideoMedia().then(function () {
          //Get video from library
          $scope.data.video = FileVideoService.video();

          //edit video
          $scope.realURL = 'file://' + $scope.data.video;

          //if (!$scope.isIOS) {
          VideoEditor.getVideoInfo(
            getInfoSuccess,
            getInfoError,
            {
              fileUri: $scope.realURL
            }
          );
          /*} else {
            //AREA FOR DRAW VIDEO THUMBNAIL IN IOS
            var newSrc = document.getElementById("videoAreaUpload");
            newSrc.preload = 'metadata';
            newSrc.onloadeddata = function () {
              var videoLength = newSrc.duration;
              videoLength = videoLength * 1000;
              var realPercentage = (videoLength * 10) / 100;
              $timeout(function () {
                //ZONE for make thumb image
                var video = document.getElementById('videoAreaUpload');
                var canvas = document.createElement("canvas");
                //ZONE to calcule dimensions for thumbnail
                if (video.videoWidth >= video.videoHeight) {
                  widthFinal = 310;
                  heightFinal = (video.videoHeight * 310) / video.videoWidth;
                } else {
                  heightFinal = 310;
                  widthFinal = (video.videoWidth * 310) / video.videoHeight;
                }
                //
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight,0,0,video.videoWidth, video.videoHeight);
                var imgDataUrl = canvas.toDataURL();
                $scope.data.temporalVideoThumbnail = Utils.dataURLtoBlob(imgDataUrl);
              }, realPercentage);
            }
            newSrc.src = $scope.realURL;
            var blob = null;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", $scope.realURL);
            xhr.responseType = "blob";
            xhr.onload = function () {
              blob = xhr.response;
              $scope.data.videoFile = blob;
              console.log("blob");
            }
            xhr.send();
            $scope.data.haveVideo = 1;
            $scope.galleryIsOpen = false;
            $scope.$apply();
          }*/
        });
      };

      function getInfoSuccess(info) {
        console.log("got it" + info);
        //Steps to generate random name for video
        var firstPartName = Math.floor(Math.random() * (100 - (0 + 1))) + 0;
        var secondPartName = Math.floor(Math.random() * (200 - (101 + 1))) + 101;
        var fullRandomName = firstPartName + "video" + secondPartName;
        var transOptions = {
          fileUri: $scope.realURL,
          outputFileName: fullRandomName,
          outputFileType: VideoEditorOptions.OutputFileType.MPEG4,
          optimizeForNetworkUse: VideoEditorOptions.OptimizeForNetworkUse.YES,
          saveToLibrary: false,
          deleteInputFile: false,
          mantainAspectRatio: true,
          height: 640,
          width: 640,
          progress: function (info) {
            console.log("progress in coding video: " + info);
            //var elem = document.getElementById("progressVideoCodec");
            //var roundProgress = (info * 100);
            //elem.style.width = roundProgress.toFixed(0) + '%';
            //$scope.data.codecProgress = roundProgress.toFixed(0) + '%';
            $scope.data.codecProgress = true;
            $scope.$apply();
          }
        };
        //transOptions.height = info.orientation === 'landscape' ? 720 : 1200;
        VideoEditor.transcodeVideo(
          successCoding,
          errorCoding,
          transOptions
        );
      }

      function getInfoError(err) {
        console.log("got it" + err);
      }

      /*var canItPlayed = newSrc.canPlayType(file.type);
        switch(canItPlayed)
        {
          case 'probably':
            Utils.toast.warning("The video is compatible with mayority of devices");
            break;
          case 'maybe':
            Utils.toast.warning("The video isn't compatible with mayority of devices");
            break;
          case '':
            Utils.toast.warning("The video isn't compatible with all devices");
            break;
          default:
            Utils.toast.warning("The video isn't compatible with all devices");
            break;
        }*/

      function successCoding(result) {
        $scope.data.codecProgress = null;
        var newSrc = document.getElementById("videoAreaUpload");
        newSrc.preload = 'metadata';
        //after get video source generate video poster
        newSrc.onloadeddata = function () {
          var videoLength = newSrc.duration;
          videoLength = videoLength * 1000;
          var realPercentage = (videoLength * 10) / 100;
          $timeout(function () {
            //ZONE for make thumb image
            var video = document.getElementById('videoAreaUpload');
            var canvas = document.createElement("canvas");
            //ZONE to calcule dimensions for thumbnail
            if (video.videoWidth >= video.videoHeight) {
              widthFinal = 310;
              heightFinal = (video.videoHeight * 310) / video.videoWidth;
            } else {
              heightFinal = 310;
              widthFinal = (video.videoWidth * 310) / video.videoHeight;
            }
            //

            canvas.height = heightFinal;
            canvas.width = widthFinal;

            canvas.getContext('2d').drawImage(video, 0, 0, widthFinal, heightFinal);
            var imgDataUrl = canvas.toDataURL();
            $scope.data.temporalVideoThumbnail = Utils.dataURLtoBlob(imgDataUrl);
          }, realPercentage);
        }
        newSrc.src = 'file://' + result;
        var blob = null;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", result);
        xhr.responseType = "blob";
        xhr.onload = function () {
          blob = xhr.response;
          $scope.data.videoFile = blob;
          console.log("blob");
        }
        xhr.send();
        $scope.data.haveVideo = 1;
        $scope.galleryIsOpen = false;
        console.log("Successfull in coding " + result);
        $scope.$apply();
      }

      function errorCoding(err) {
        console.log("Error in coding " + err);
      }

      $scope.chkVideoDuration = function () {
        console.log("nothing at the moment");
      };
    }])

  .controller('statementCtrl', ['$rootScope', '$scope', '$timeout', 'UserService', 'SequenceService', 'cqnzService', 'notificationsService', 'ApiEndPoint', '$q', '$state', 'ionicService', 'locals', 'adsService', '$ionicPickerI18n', 'Utils',
    function ($rootScope, $scope, $timeout, UserService, SequenceService, cqnzService, notificationsService, ApiEndPoint, $q, $state, ionicService, locals, adsService, $ionicPickerI18n, Utils) {
      //console.log("statementCtrl created!! groupData=>", $scope.groupData);
      var userId = UserService.get_USER_ID();

      $scope.iAmAdvertiser = UserService.USER_IS_ADVERTISER();

      $scope.customColors = adsService.customColors;

      $scope.advertisement = {
        ownerMetadata: {name: UserService.get_USER_NAME(), avatar: UserService.get_USER_PHOTO()},
        creationTime: (new Date().toString())
      };

      $scope.dateTimePickerTitle = Utils.translate("UPLOAD.DATETIME_PICKER.TITLE");

      $ionicPickerI18n.weekdays = adsService.getWeekdaysLocalized();
      $ionicPickerI18n.months = adsService.getMonthsLocalized();

      $ionicPickerI18n.ok = Utils.translate("GLOBAL.OK");
      $ionicPickerI18n.cancel = Utils.translate("GLOBAL.CANCEL");

      //var deregisterBackButton;

      //hack to get the picker on top
      var mdBackdrop, statementContainer;
      $scope.hideStatementFormAndBackdrop = function () {
        mdBackdrop = document.getElementsByTagName('md-backdrop');
        statementContainer = document.getElementById('statement-dialog');
        if (mdBackdrop) mdBackdrop[0].style.opacity = 0;
        if (statementContainer) statementContainer.style.opacity = '0';

        setTimeout(function () {
          $ionicPickerI18n.popup.then(function () {
            restoreStatementVisibility();
          });
        }, 800)

        /*deregisterBackButton = Utils.$ionicPlatform.registerBackButtonAction(function(e){
          $ionicPickerI18n.popup.close();
          restoreStatementVisibility();
        }, 401);*/
      };

      /*$ionicPickerI18n.onOk = function () {
        restoreStatementVisibility();
      };
      $ionicPickerI18n.onCancel = function () {
        restoreStatementVisibility();
      };*/


      function restoreStatementVisibility() {
        if (mdBackdrop) mdBackdrop[0].style.opacity = .48;
        if (statementContainer) statementContainer.style.opacity = '1';
        //deregisterBackButton();
      }

      /*$ionicPickerI18n.okClass = "button-positive";
      $ionicPickerI18n.cancelClass = "button-stable";
      $ionicPickerI18n.arrowButtonClass = "button-positive";*/


      $scope.groupData = locals.groupData;

      $scope.closeDialog = function () {
        console.log("Hiding statement dialog")
        locals.dialog.hide();
      };

      //Declare zone
      $scope.mentionsList = [];
      $scope.tags = [];
      $scope.pictureProfileStatement = $scope.groupData.image || UserService.get_USER_PHOTO();
      $scope.UsernameStatement = $scope.groupData.name || UserService.get_USER_NAME();
      $scope.isIOS = ionic.Platform.isIOS();
      $scope.isAndroid = ionic.Platform.isAndroid();
      $scope.tags = [];
      $scope.hashs = [];
      $scope.tagsHidden = [];
      $scope.uploadErrorMessage = null;
      $scope.data = {};
      $scope.data.selectedBgColor = $scope.customColors[$scope.iAmAdvertiser ? 10 : 1];
      $scope.data.selectedFontColor = $scope.customColors[$scope.iAmAdvertiser ? 1 : 0];
      $scope.data.mentionsList = [];
      $scope.data.hashList = [];
      $scope.data.compareHashList = [];
      $scope.data.success = true;
      $scope.data.commentValue = '';
      $scope.data.enableComments = true;
      $scope.data.lifetime = false;
      $scope.data.shareable = true;
      $scope.data.sharelife = 0;
      $scope.data.finalDate = new Date();

      $scope.data.commentValue = locals.form.description;
      $scope.data.mentionsList = locals.form.savedTags || [];
      $scope.data.hashList = locals.form.savedHashes || [];
      console.log("mentions:",$scope.data.mentionsList, $scope.data.hashList);
      //END Declare zone


      //zone for tags and hashtags


      //zone to add statement
      var commentText = "";

      $scope.addStatement = function (statement) {
        if (!statement || !statement.length) return;

        commentText = $scope.data.commentValue;
        $scope.data.success = false;
        if (!commentText) {
          $scope.closeDialog();
          return;
        }

        //if we must create a group statement
        if ($scope.groupData.hrefId)
          createGroupStatement();
        else
          createUserStatement();
      };

      function createGroupStatement() {
        var hoursLive = 0;
        if ($scope.data.lifetime) {
          hoursLive = 24;
        }
        SequenceService.addNewGroupSequence({
          userId: userId,
          description: $scope.data.commentValue,
          templateId: "StatementTemplate",
          itemCount: 0,
          sequenceType: 2,
          groupId: $scope.groupData.hrefId,
          commentEnable: $scope.data.enableComments,
          temporary: hoursLive,
          shareable: $scope.data.shareable,
          sharelife: $scope.data.sharelife,
          isAdvertisement: $scope.iAmAdvertiser,
          headerBgColor: $scope.data.selectedBgColor,
          headerFontColor: $scope.data.selectedFontColor
        }).then(onStatementSuccess, onStatementError);
      }

      function createUserStatement() {
        //new Ws for upload sequence, in this case statement = sequence without any media
        var hoursLive = 0;
        if ($scope.data.lifetime) {
          hoursLive = 24;
        }
        SequenceService.addNewSequencev100({
          userId: userId,
          description: commentText,
          templateId: "StatementTemplate",
          itemCount: 0,
          sequenceType: 2,
          commentsEnabled: $scope.data.enableComments,
          temporary: hoursLive,
          shareable: $scope.data.shareable,
          sharelife: $scope.data.sharelife,
          isAdvertisement: $scope.iAmAdvertiser,
          headerBgColor: $scope.data.selectedBgColor,
          headerFontColor: $scope.data.selectedFontColor,
          finalDate: $scope.data.finalDate
        }).$promise.then(onStatementSuccess, onStatementError);
      }

      function onStatementSuccess(response) {

        var tagPromises = {};
        var hashPromises = {};

        //part to add tags for the sequences
        if ($scope.data.mentionsList.length > 0) {
          $scope.data.mentionsList.forEach(function (tag) {
            var userId = tag.id || Utils.getLastUrlComponent(tag.userSubscription.href);
            console.log("saving user tagged: ", tag);
            tagPromises[userId] = SequenceService.sendTagNotificationUpload({
              sequenceId: response.result.instanceId,
              userId: userId
            }).$promise;
          });

          $q.all(tagPromises).then(function (promiseTagData) {
            console.log("promiseTagData", promiseTagData);
            notificationsService.notifyUsersTaggedInSequence(promiseTagData).then(function (totalUsers) {
              if (totalUsers) console.log("Notification was sent to " + totalUsers + " new tagged user");
            }, function (error) {
              console.error("Couldn't sent notification(s) to new tagged user", error);
            });
          }, function (error) {
            console.error("tagPromises", error)
          });
        }

        var find = 0;
        //check if the title has any hash added
        var hashToStore = [];
        if ($scope.data.hashList.length > 0) {
          //when the user selected one or more hash already created
          //we obtain each hash(#*****) to compare it
          var parts = commentText.match(/\#{1}\S+/g);
          for (var i = 0; i < parts.length; i++) {
            var hashClean = parts[i].split('#');
            //For each tag finded we run a process acordly, add if new or add count if already exits
            for (var j = 0; j < $scope.data.hashList.length; j++) {
              if (hashClean[1] == $scope.data.hashList[j].hash) {
                hashToStore[i] = $scope.data.hashList[j].id;
                //ws to add count to prexist hashtag
                var promiseHash = SequenceService.modifyHashCount(
                  {"objectId": $scope.data.hashList[j].id}
                ).save({
                  "int": {
                    "value": 1
                  }
                }).$promise;
                find = 1;
              }
            }
            if (find == 0) {
              hashToStore[i] = 0;
              //ws to add new hashtag
              var promiseHash = SequenceService.createHashTag().save({
                "hashtag": {
                  "value": hashClean[1]
                }
              }).$promise;
            }
            find = 0;
            //add each ws promise to wait for all of them
            hashPromises[i] = promiseHash;
          }
          //wait to all ws have been completed
          $q.all(hashPromises).then(function (responseHash) {
            //we need to link the hashtags to the sequence
            var responseKeys = Object.keys(responseHash);
            var responseValues = responseKeys.map(function (key) {
              return responseHash[key];
            });
            //get the Id from new hashtags created into a list
            for (var a = 0; a < responseKeys.length; a++) {
              if (responseValues[a].result) {
                hashToStore[a] = responseValues[a].result.links[0].href.split('/')[6]
              }
            }
            //the list now contains all hashtag's ids news or not
            for (var b = 0; b < hashToStore.length; b++) {
              //ws to add each hastag to sequence
              var addHashPromises = SequenceService.addHashtoSequence().save({
                "sequence": {
                  "value": {
                    "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + response.result.links["0"].href.split('/')[6]
                  }
                },
                "hashTag": {
                  "value": {
                    "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + hashToStore[b]
                  }
                }
              }).$promise;
            }
            $q.all(addHashPromises).then(function () {
            }, function (response) {
            });
          }, function (response) {
          });
        }
        else {
          // when the user doesn't select any hashtag we check for new ones
          var parts = commentText.match(/\#{1}\S+/g);
          if (parts) {
            if (parts.length > 0) {
              //if we find #******* in the title we assume it's a hashtag
              for (var i = 0; i < parts.length; i++) {
                var hashClean = parts[i].split('#');
                //Ws to create the new hashtag
                var promiseHash = SequenceService.createHashTag().save({
                  "hashtag": {
                    "value": hashClean[1]
                  }
                }).$promise;
                hashPromises[i] = promiseHash;
              }
            }
            //Wait to all ws to be completed
            $q.all(hashPromises).then(function (responseHash) {
              var responseKeys = Object.keys(responseHash);
              var responseValues = responseKeys.map(function (key) {
                return responseHash[key];
              });

              for (var a = 0; a < responseKeys.length; a++) {
                var addHashPromises = SequenceService.addHashtoSequence().save({
                  "sequence": {
                    "value": {
                      "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + response.result.links["0"].href.split('/')[6]
                    }
                  },
                  "hashTag": {
                    "value": {
                      "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + responseValues[a].result.links[0].href.split('/')[6]
                    }
                  }
                }).$promise;
              }
              $q.all(addHashPromises).then(function () {
              }, function (response) {
              });
            }, function (response) {
            });
          }
        }
        //$state.go('menu.myProfile', {}, {reload: true});
        $scope.data.commentValue = null;
        $scope.data.mentionsList = [];
        $scope.data.hashList = [];
        $scope.data.compareHashList = [];
        $scope.closeDialog();
        $scope.data.success = true;

        $rootScope.$emit("sequence.created", {
          from: ($scope.groupData && $scope.groupData.hrefId) ? 'groupTimelineCtrl' : 'TimeLineCtrl',
          type: 'STATEMENT',
          sequenceId: response.result.instanceId
        });
      }

      function onStatementError(error) {
        $scope.data.commentValue = null;
        $scope.data.mentionsList = [];
        $scope.data.hashList = [];
        $scope.data.compareHashList = [];
        $scope.uploadErrorMessage = 'Unable to upload your sequence. Verify your internet connection and try again later.';
        $scope.data.success = true;
        Utils.toast.error(Utils.translate('UPLOAD.DIALOG.POST_ERROR'))
      }

      $scope.openTagsModal = function () {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/partials/tags-modal.html',
          controller: 'tagsModalCtrl',
          fullscreen: true,
          locals: {description: $scope.data.commentValue, dialog: dialog},
          clickOutsideToClose: false,
          multiple:true
        }).then(function (form) {
          $scope.data.commentValue = form.description;

          if(form.savedTags.length)
            $scope.data.mentionsList = $scope.data.mentionsList.concat(form.savedTags);
          if(form.savedHashes.length)
            $scope.data.hashList = $scope.data.hashList.concat(form.savedHashes);

          console.log("new mentions:",$scope.data.mentionsList, $scope.data.hashList)
        });
      }
    }])

  .controller('editMySequenceCtrl', ['$scope', '$state', 'FileService', '$timeout', 'ImageService', 'ApiEndPoint', '$ionicModal', 'MultiImageService', '$ionicPopup', 'usersData', '$q', 'SequenceService', 'UserService', 'ionicService', '$ionicPlatform', 's3', 'md5', '$ionicHistory', 'TagsService', 'cqnzService', 'Utils', 'AWSServices',
    function ($scope, $state, FileService, $timeout, ImageService, ApiEndPoint, $ionicModal, MultiImageService, $ionicPopup, usersData, $q, SequenceService, UserService, ionicService, $ionicPlatform, s3, md5, $ionicHistory, TagsService, cqnzService, Utils, AWSServices) {
      var userId = UserService.get_USER_ID();

      $scope.data = {};
      $scope.data.cqnzSeen = [];
      $scope.data.mentionsList = [];
      $scope.data.images = [];
      $scope.data.thumbImages = [];
      $scope.data.itemOrder = [];
      $scope.data.deleteList = [];

      $scope.data.tempImages = [];
      $scope.data.tempThumbImages = [];
      $scope.data.tempTitle = "";
      $scope.data.tempTemplate = "";
      $scope.data.tempMode = "";
      $scope.temporalLength = 0;

      $scope.galleryIsOpen = false;
      $scope.isIOS = ionic.Platform.isIOS();
      $scope.isAndroid = ionic.Platform.isAndroid();

      var isAndroid = ionic.Platform.isAndroid();
      $scope.idImages = "";

      $scope.uploading = false;

      //zone initalize data
      $scope.showCQNZ = function () {
        var template;
        var autoNumber = 0;
        var titleSequence = "";
        var mode = 'F';
        SequenceService.obtainSequence($state.params.sequenceInstanceId).$promise.then(
          function (dataSequence) {

            //zone to add all temporal data for change
            if (dataSequence.templateId.indexOf("templateAutomate0") >= 0) {
              mode = 'S';
              $scope.data.tempMode = 'S';
            } else {
              $scope.data.tempMode = 'F';
            }
            $scope.data.tempTemplate = dataSequence.templateId;

            if (dataSequence.description == " ") {
              titleSequence = "";
            } else {
              titleSequence = dataSequence.description;
            }
            $scope.data.tempTitle = titleSequence;

            $scope.temporalLength = dataSequence.sequenceItems.length;

            for (var i = 0; i < dataSequence.sequenceItems.length; i++) {
              if (dataSequence.sequenceItems[i].picture != null) {
                $scope.data.images[dataSequence.sequenceItems[i].itemOrder - 1] = "data:image/jpeg;base64," + dataSequence.sequenceItems[i].picture.split(':')[2];
                $scope.data.deleteList[dataSequence.sequenceItems[i].itemOrder - 1] = false;
                $scope.data.thumbImages[dataSequence.sequenceItems[i].itemOrder - 1] = "data:image/jpeg;base64," + dataSequence.sequenceItems[i].picture.split(':')[2];
                $scope.data.itemOrder[dataSequence.sequenceItems[i].itemOrder - 1] = dataSequence.sequenceItems[i].itemOrder;
              } else {
                $scope.data.images[dataSequence.sequenceItems[i].itemOrder - 1] = dataSequence.sequenceItems[i].url;
                $scope.data.deleteList[dataSequence.sequenceItems[i].itemOrder - 1] = false;
                $scope.data.thumbImages[dataSequence.sequenceItems[i].itemOrder - 1] = dataSequence.sequenceItems[i].url;
                $scope.data.itemOrder[dataSequence.sequenceItems[i].itemOrder - 1] = dataSequence.sequenceItems[i].itemOrder;
              }

            }
            //end

            //Zone editable or not to each image

            //End zone editable or not to each image

            $scope.data.tempTitle = titleSequence;

            $scope.data.cqnzSeen[0] =
              {
                key: dataSequence.sequenceId,
                user: userId,
                descriptionSequence: titleSequence,
                pictures: dataSequence.sequenceItems,
                template: dataSequence.templateId,
                sequenceInstanceId: dataSequence.sequence.href.split('/')[6],
                userOwnerSequence: dataSequence.userSubscriptionId.href.split('/')[6],
                modeSelect: mode
              };
            $scope.addTags($scope.data.cqnzSeen[0]);

          }, function (error) {
          }
        );
      };

      $scope.showCQNZ();

      $scope.addTags = function (sequenceInfo) {
        var positionTag = 0;
        var fixedHtmlFinal = "";
        var fixedHtmlPrev = "";
        var taggedUserId = 0;
        var fixedName;
        var listTags = "";
        var listIDTags = [];
        SequenceService.obtainTagwithIdandTypev166({
          sequenceId: sequenceInfo.key,
          notificationType: 7
        }).$promise.then(function (tagData) {
          if (tagData.length > 0) {
            listTags = tagData;
            for (var a = 0; a < tagData.length; a++) {
              listIDTags.push(listTags[a].sequenceTag.href.split('/')[6]);
            }
          }
          sequenceInfo.taggedUserList = listTags;
          sequenceInfo.tagIDAssociated = listIDTags;
        });
      };
      //END zone initalize data

      //zone to extra functions
      $scope.UniqueTracking = function (index, id) {
        return index + id;
      };

      $scope.goBack = function () {
        $ionicHistory.goBack();
      };

      function autosize() {
        var el = this;
        el.style.cssText = 'height:auto; padding:0';
        el.style.cssText = 'height:' + el.scrollHeight + 'px';
      }

      //end zone to extra functions

      //zone for all code about templates
      $scope.showScrollBars = function (mode) {
        if (mode === 'S') {
          if ($scope.data.images.length == 1) {
            mode = 'F';
            $scope.templateReset();
            $scope.data.tempTemplate = 'templateA11';
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          } else {
            $scope.data.tempTemplate = 'templateAutomate01'
            if ($scope.data.images.length <= 6) {
              $timeout(function () {
                $scope.data.tempTemplate = 'templateAutomate0' + $scope.data.images.length;
              })
            }
          }

        }
        else {
          $scope.templateReset();
          if ($scope.data.images.length == 1) {
            $scope.data.tempTemplate = 'templateA11';
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          }
          if ($scope.data.images.length == 2) {
            $scope.data.tempTemplate = 'templateB21';
            $scope.B21 = {'background': 'url(img/2.1On.svg)'};
          }
          else if ($scope.data.images.length == 3) {
            $scope.data.tempTemplate = 'templateB34';
            $scope.B34 = {'background': 'url(img/3.4On.svg)'};
          }
          else if ($scope.data.images.length == 4) {
            $scope.data.tempTemplate = 'templateB42';
            $scope.B42 = {'background': 'url(img/4.2On.svg)'};
          }
          else if ($scope.data.images.length == 5) {
            $scope.data.tempTemplate = 'templateB54';
            $scope.B54 = {'background': 'url(img/5.4On.svg)'};
          }
          else if ($scope.data.images.length == 6) {
            $scope.data.tempTemplate = 'templateB63';
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
          else {
            $scope.data.tempTemplate = 'templateB63';
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
        }
        $scope.data.tempMode = mode;
      };

      $scope.changeTemplate = function (templateId, index) {
        $timeout(function () {
          $scope.data.tempTemplate = templateId;
          $scope.templateReset();
          //1 photo
          if (index == 'A11') {
            $scope.A11 = {'background': 'url(img/1.1On.svg)'};
          }
          //2 photos
          if (index == 'B21') {
            $scope.B21 = {'background': 'url(img/2.1On.svg)'};
          }
          if (index == 'B22') {
            $scope.B22 = {'background': 'url(img/2.2On.svg)'};
          }
          if (index == 'B23') {
            $scope.B23 = {'background': 'url(img/2.3On.svg)'};
          }
          if (index == 'B24') {
            $scope.B24 = {'background': 'url(img/2.4On.svg)'};
          }
          if (index == 'C21') {
            $scope.C21 = {'background': 'url(img/2.1cOn.svg)'};
          }
          if (index == 'C22') {
            $scope.C22 = {'background': 'url(img/2.1hOn.svg)'};
          }
          if (index == 'D21') {
            $scope.D21 = {'background': 'url(img/2.5On.svg)'};
          }
          if (index == 'E21') {
            $scope.E21 = {'background': 'url(img/c2.svg)'};
          }
          //3 photos
          if (index == 'B31') {
            $scope.B31 = {'background': 'url(img/3.1On.svg)'};
          }
          if (index == 'B32') {
            $scope.B32 = {'background': 'url(img/3.2On.svg)'};
          }
          if (index == 'B33') {
            $scope.B33 = {'background': 'url(img/3.3On.svg)'};
          }
          if (index == 'B34') {
            $scope.B34 = {'background': 'url(img/3.4On.svg)'};
          }
          if (index == 'B35') {
            $scope.B35 = {'background': 'url(img/3.5On.svg)'};
          }
          if (index == 'D31') {
            $scope.D31 = {'background': 'url(img/3.6On.svg)'};
          }
          if (index == 'E31') {
            $scope.E31 = {'background': 'url(img/c3.svg)'};
          }
          //4 photos
          if (index == 'B41') {
            $scope.B41 = {'background': 'url(img/4.1On.svg)'};
          }
          if (index == 'B42') {
            $scope.B42 = {'background': 'url(img/4.2On.svg)'};
          }
          if (index == 'B43') {
            $scope.B43 = {'background': 'url(img/4.3On.svg)'};
          }
          if (index == 'B44') {
            $scope.B44 = {'background': 'url(img/4.4On.svg)'};
          }
          if (index == 'C41') {
            $scope.C41 = {'background': 'url(img/4.1cOn.svg)'};
          }
          if (index == 'C42') {
            $scope.C42 = {'background': 'url(img/4.1SON.svg)'};
          }
          if (index == 'D41') {
            $scope.D41 = {'background': 'url(img/4.5On.svg)'};
          }
          if (index == 'E41') {
            $scope.E41 = {'background': 'url(img/c4.svg)'};
          }
          //5 photos
          if (index == 'B51') {
            $scope.B51 = {'background': 'url(img/5.1On.svg)'};
          }
          if (index == 'B52') {
            $scope.B52 = {'background': 'url(img/5.2On.svg)'};
          }
          if (index == 'B53') {
            $scope.B53 = {'background': 'url(img/5.3On.svg)'};
          }
          if (index == 'B54') {
            $scope.B54 = {'background': 'url(img/5.4On.svg)'};
          }
          if (index == 'B55') {
            $scope.B55 = {'background': 'url(img/5.5On.svg)'};
          }
          if (index == 'D51') {
            $scope.D51 = {'background': 'url(img/5.6On.svg)'};
          }
          if (index == 'E51') {
            $scope.E51 = {'background': 'url(img/c5.svg)'};
          }
          //6 photos
          if (index == 'B61') {
            $scope.B61 = {'background': 'url(img/6.1On.svg)'};
          }
          if (index == 'B62') {
            $scope.B62 = {'background': 'url(img/6.2On.svg)'};
          }
          if (index == 'B63') {
            $scope.B63 = {'background': 'url(img/6.3On.svg)'};
          }
          if (index == 'B64') {
            $scope.B64 = {'background': 'url(img/6.4On.svg)'};
          }
          if (index == 'D61') {
            $scope.D61 = {'background': 'url(img/6.5On.svg)'};
          }
          if (index == 'E61') {
            $scope.E61 = {'background': 'url(img/c6.svg)'};
          }
          /*if(index == 12){
                        $scope.template.getElementsByTagName('li')[10].style.background = "url('data:image/png;base64,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')";
                    }*/
        });
      };

      $scope.templateReset = function () {
        $scope.A11 = {'background': 'url(img/1.1Off.svg)'};
        //
        $scope.B21 = {'background': 'url(img/2.1Off.svg)'};
        $scope.B22 = {'background': 'url(img/2.2Off.svg)'};
        $scope.B23 = {'background': 'url(img/2.3Off.svg)'};
        $scope.B24 = {'background': 'url(img/2.4Off.svg)'};
        $scope.C21 = {'background': 'url(img/2.1cOff.svg)'};
        $scope.C22 = {'background': 'url(img/2.1hOff.svg)'};
        $scope.D21 = {'background': 'url(img/2.5Off.svg)'};
        $scope.E21 = {'background': 'url(img/c2o.svg)'};
        //
        $scope.B31 = {'background': 'url(img/3.1Off.svg)'};
        $scope.B32 = {'background': 'url(img/3.2Off.svg)'};
        $scope.B33 = {'background': 'url(img/3.3Off.svg)'};
        $scope.B34 = {'background': 'url(img/3.4Off.svg)'};
        $scope.B35 = {'background': 'url(img/3.5Off.svg)'};
        $scope.D31 = {'background': 'url(img/3.6Off.svg)'};
        $scope.E31 = {'background': 'url(img/c3o.svg)'};
        //
        $scope.B41 = {'background': 'url(img/4.1Off.svg)'};
        $scope.B42 = {'background': 'url(img/4.2Off.svg)'};
        $scope.B43 = {'background': 'url(img/4.3Off.svg)'};
        $scope.B44 = {'background': 'url(img/4.4Off.svg)'};
        $scope.C41 = {'background': 'url(img/4.1cOff.svg)'};
        $scope.C42 = {'background': 'url(img/4.1SOff.svg)'};
        $scope.D41 = {'background': 'url(img/4.5Off.svg)'};
        $scope.E41 = {'background': 'url(img/c4o.svg)'};
        //
        $scope.B51 = {'background': 'url(img/5.1Off.svg)'};
        $scope.B52 = {'background': 'url(img/5.2Off.svg)'};
        $scope.B53 = {'background': 'url(img/5.3Off.svg)'};
        $scope.B54 = {'background': 'url(img/5.4Off.svg)'};
        $scope.B55 = {'background': 'url(img/5.5Off.svg)'};
        $scope.D51 = {'background': 'url(img/5.6Off.svg)'};
        $scope.E51 = {'background': 'url(img/c5o.svg)'};
        //
        $scope.B61 = {'background': 'url(img/6.1Off.svg)'};
        $scope.B62 = {'background': 'url(img/6.2Off.svg)'};
        $scope.B63 = {'background': 'url(img/6.3Off.svg)'};
        $scope.B64 = {'background': 'url(img/6.4Off.svg)'};
        $scope.D61 = {'background': 'url(img/6.5Off.svg)'};
        $scope.E61 = {'background': 'url(img/c6o.svg)'};
      };

      $scope.$watch('data.images.length', function () {
        //console.log("Cambio tamaño", $scope.data.cqnzSeen[0].pictures.length);
        if ($scope.data.cqnzSeen[0]) {
          if ($scope.data.tempTemplate.substr(0, 17) != 'templateAutomate0') {
            $scope.templateReset();
            if ($scope.data.images.length == 1) {
              $scope.data.tempTemplate = 'templateA11';
              $scope.A11 = {'background': 'url(img/1.1On.svg)'};
            }
            else if ($scope.data.images.length == 2) {
              $scope.data.tempTemplate = 'templateB21';
              $scope.B21 = {'background': 'url(img/2.1On.svg)'};
            }
            else if ($scope.data.images.length == 3) {
              $scope.data.tempTemplate = 'templateB34';
              $scope.B34 = {'background': 'url(img/3.4On.svg)'};
            }
            else if ($scope.data.images.length == 4) {
              $scope.data.tempTemplate = 'templateB42';
              $scope.B42 = {'background': 'url(img/4.2On.svg)'};
            }
            else if ($scope.data.images.length == 5) {
              $scope.data.tempTemplate = 'templateB54';
              $scope.B54 = {'background': 'url(img/5.4On.svg)'};
            }
            else if ($scope.data.images.length == 6) {
              $scope.data.tempTemplate = 'templateB63';
              $scope.B63 = {'background': 'url(img/6.3On.svg)'};
            }
            else {
              $scope.data.tempTemplate = 'templateB63';
              $scope.B63 = {'background': 'url(img/6.3On.svg)'};
            }
          } else {
            $scope.data.tempTemplate = 'templateAutomate01' //Patch to force animation to start
            ionic.requestAnimationFrame(function () {
              $scope.showScrollBars($scope.data.tempMode);
            });
          }
        }
      });
      //end zone for all code about templates

      //zone code to modify order
      $scope.sortableOptions = {
        containment: '#horizontal-container',
        //containment:'#Board-container',
        containerPositioning: 'relative',
        'ui-floating': true,
        orderChanged: function (event) {

          $scope.temporalitemOrder = $scope.data.itemOrder[event.dest.index];
          $scope.data.itemOrder[event.dest.index] = $scope.data.itemOrder[event.source.index];
          $scope.data.itemOrder[event.source.index] = $scope.temporalitemOrder;

          $scope.temporalDelete = $scope.data.deleteList[event.dest.index];
          $scope.data.deleteList[event.dest.index] = $scope.data.deleteList[event.source.index];
          $scope.data.deleteList[event.source.index] = $scope.temporalDelete;

          $scope.temporalThumb = $scope.data.thumbImages[event.dest.index];

          $scope.data.thumbImages[event.dest.index] = $scope.data.thumbImages[event.source.index];
          $scope.data.thumbImages[event.source.index] = $scope.temporalThumb;

          //$scope.data.cqnzSeen[0].pictures.splice(event.source.index, 1);
          //$scope.data.cqnzSeen[0].pictures.splice(event.dest.index, 0, $scope.temporalThumb);
        },
      };

      $scope.dest = null;
      $scope.origin = null;
      $scope.changePhotoFrameOrder = function (index) {
        var arrayPics = [];
        var arrayOrder = [];
        var arrayDelete = [];
        $scope.dest = $scope.origin;
        $scope.origin = index;
        if ($scope.dest !== null) {
          $scope.data.tempTemplate = 'templateAutomate01';
          arrayPics = $scope.data.images.reverse();
          arrayOrder = $scope.data.itemOrder.reverse();
          arrayDelete = $scope.data.deleteList.reverse();

          arrayPics[$scope.origin] = arrayPics.splice($scope.dest, 1, arrayPics[$scope.origin])[0];
          arrayOrder[$scope.origin] = arrayOrder.splice($scope.dest, 1, arrayOrder[$scope.origin])[0];
          arrayDelete[$scope.origin] = arrayDelete.splice($scope.dest, 1, arrayDelete[$scope.origin])[0];

          $scope.data.images = arrayPics.reverse();
          $scope.data.itemOrder = arrayOrder.reverse();
          $scope.data.deleteList = arrayDelete.reverse();

          $scope.origin = null;
          ionic.requestAnimationFrame(function () {
            $scope.showScrollBars($scope.data.tempMode);
          });
        }
      };
      //end zone code to modify order

      //zone to make usable tags
      $scope.getTagTextRaw = function (item) {
        var cont = 0;
        for (var i = 0; i < $scope.data.mentionsList.length; i++) {
          if ($scope.data.mentionsList[i].id == item.id) {
            cont++;
          }
        }
        if (cont === 0) {
          $scope.data.mentionsList.push(item);
          $scope.tags.length = 0;
          $scope.tagsHidden.length = 0;
        }
        return '@' + item.name + '';
        //return '[@'+item.name+']';
      };

      $scope.searchTags = function (term) {

        var tagsList = [];
        if (term !== "") {
          if (term.length >= 3) {
            UserService.findFriendsByUserSubscriptionIdTagv167({
              userId: userId,
              term: term,
              start: 0,
              count: 25
            }).$promise.then(function (response) {
              response.length--;
              for (var i = 0; i < response.length; i++) {
                var photo = "";
                //+'?decache=' + Math.random()
                if (response[i].profilePicture !== null) {
                  photo = "data:image/jpeg;base64," + response[i].profilePicture.split(':')[2];
                } else if (response[i].profilePictureUrl !== null) {
                  photo = response[i].profilePictureUrl + '?decache=' + Math.random();
                }
                //var photo = response[i].profilePicture === null ? "img/ProfilePhoto.svg" : "data:image/jpeg;base64,"+response[i].profilePicture.split(':')[2];
                tagsList.push({
                  id: response[i].userSubscription.href.split('/')[6],
                  name: response[i].name.replace(/\s\s+/g, ' '),
                  photo: photo
                });
              }
              $scope.tags = tagsList;
              $scope.tagsHidden = tagsList;
            }, function (response) {
            });
          }
        }
      };
      //end zone to make usable tags

      //zone to make usable gallery or camera
      $scope.addMedia = function () {
        $scope.hideSheet = Utils.$ionicActionSheet.show({
          buttons: [
            {text: Utils.translate('UPLOAD.TAKE') + ' <i class="icon ion-camera"></i>'},
            {text: Utils.translate('UPLOAD.FROM_GALLERY') + ' <i class="icon ion-images"></i>'}
          ],
          titleText: Utils.translate('UPLOAD.ADD'),
          cancelText: Utils.translate('GLOBAL.CANCEL'),
          buttonClicked: function (index) {
            $scope.galleryIsOpen = true;
            $scope.hideSheet();
            switch (index) {
              case 0:
                ImageService.saveCameraMedia(index).then(function () {
                  $scope.data.tempImages = FileService.images();
                  $scope.data.tempThumbImages = FileService.thumbImages();

                  $scope.data.images.push($scope.data.tempImages[0]);
                  $scope.data.thumbImages.push($scope.data.tempThumbImages[0]);

                  $scope.data.itemOrder.push($scope.data.itemOrder.length + 1);
                  $scope.data.deleteList.push(true);

                  $scope.galleryIsOpen = false;
                  $scope.data.tempImages.length = 0;
                  $scope.data.tempThumbImages = 0;
                });
                break;
              case 1:
                ImageService.saveAlbumMediaFix($scope.data.cqnzSeen[0].pictures.length).then(function () {
                  $scope.data.tempImages = FileService.images();
                  $scope.data.tempThumbImages = FileService.thumbImages();

                  $scope.data.images.push.apply($scope.data.images, $scope.data.tempImages);
                  $scope.data.thumbImages.push.apply($scope.data.thumbImages, $scope.data.tempThumbImages);

                  for (var i = 0; i < $scope.data.tempImages.length; i++) {
                    $scope.data.itemOrder.push($scope.data.itemOrder.length + 1);
                    $scope.data.deleteList.push(true);
                  }
                  $scope.galleryIsOpen = false;
                  $scope.data.tempImages.length = 0;
                  $scope.data.tempThumbImages = 0;
                });
                break;
            }
          }
        });
      };
      //end zone to make usable gallery or camera

      //zone to delete images
      $scope.removeImage = function (index, editable) {
        if (editable) {
          var alert = $ionicPopup.alert({
            template: Utils.translate('UPLOAD.NODELETE'),
            cssClass: 'alertPopUp',
            okType: 'button-assertive'
          });

          alert.then(function (res) {
          })
        } else {
          $scope.data.images.splice(index, 1);
          $scope.data.thumbImages.splice(index, 1);
          $scope.data.itemOrder.splice(index, 1);
          $scope.data.deleteList.splice(index, 1);
          $scope.showScrollBars($scope.data.tempMode);
        }
      };
      //end zone to delte images

      //zone to update cqnz
      //first step check if the user added more pictures
      $scope.checkAddedPics = function (oldData) {
        var countDiff = 0;
        var promiseOrder = [];
        var promiseAddPhoto = [];
        var countPicture = 0;
        $scope.uploading = true;
        //prepare s3
        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });
        //prepare s3
        if ($scope.galleryIsOpen === false) {
          //first check amount of pictures
          if (oldData.pictures.length != $scope.data.images.length) {
            //if we have more pictures we need to update itemOrder of oldOnes
            var promises = [];
            var baseOrder = oldData.pictures.length - 1;
            var itemId = oldData.pictures.length + 1;
            var c = 0;
            //compare new list to old one to check if we have new photos to upload
            for (var a = 0; a < $scope.data.images.length; a++) {
              for (var b = 0; b < oldData.pictures.length; b++) {
                if ($scope.data.images[a] == oldData.pictures[b].url) {
                  countPicture++;
                }
                /*var imageCompare = "data:image/jpeg;base64,"+oldData.pictures[b].picture.split(':')[2];
                                if($scope.data.images[a]==imageCompare){
                                    countPicture++;
                                }*/
              }
              if (countPicture == 0) {
                //prepare data for s3 upload
                var userSubscriptionInstanceId = md5.createHash(userId);
                var sequenceInstanceId = md5.createHash(oldData.sequenceInstanceId);
                var photoKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/image/' + itemId + '.jpg'
                var photoThumbKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/thumb/' + itemId + '.jpg'

                var file = Utils.dataURLtoBlob($scope.data.images[a]);
                var fileThumb = Utils.dataURLtoBlob($scope.data.thumbImages[a]);

                s3Service.upload({
                  Key: photoKey,
                  Body: file,
                  ACL: 'public-read',
                  ContentType: file.type
                }, function (err, data) {
                  if (err) {
                    //sequence.sharing = false;
                    return console.log('There was an error uploading the image: ', err);
                  }
                  console.log('Successfully uploaded image.');
                  //url: data.Location
                });

                s3Service.upload({
                  Key: photoThumbKey,
                  Body: fileThumb,
                  ACL: 'public-read',
                  ContentType: fileThumb.type
                }, function (err, data) {
                  if (err) {
                    //sequence.sharing = false;
                    return console.log('There was an error uploading the image: ', err);
                  }
                  //url: data.Location
                });
                /////////////////////////////////
                promises[c] = SequenceService.addItemToSequencev181().save({
                  "sequence": {"value": {"href": ApiEndPoint.url + "/restful/objects/simple.Sequence/" + oldData.sequenceInstanceId}},
                  "uRLPicture": {"value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey},
                  "itemId": {"value": itemId},
                  "uRLThumbPicture": {"value": "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoThumbKey}
                }).$promise;

                /*promises[c]= SequenceService.addItemToSequence().save({
                                    "sequence": { "value": { "href": ApiEndPoint.url + "/restful/objects/simple.Sequence/"+oldData.sequenceInstanceId }},
                                    "picture": { "value": itemId + '.jpg:image/jpeg:' + $scope.data.images[a].split(',')[1] },
                                    "itemId": { "value": itemId },
                                    "thumbPicture": {"value": itemId + '_thumb.jpg:image/jpeg:' + $scope.data.thumbImages[a].split(',')[1]}
                                }).promise;*/
                c++;
                itemId++;
              }
              countPicture = 0;
            }
            if (promises.length > 0) {
              $q.all(promises).then(function () {
                //send to check order vs new order
                $scope.changeOrder(oldData);
              }, function (response) {
                $scope.uploading = false;
                $scope.uploadErrorMessage = 'Unable to upload your news photos. Verify your internet connection and try again later.';
              });
            }
          } else {
            //redirect next step
            $scope.changeOrder(oldData);
          }
        } else {
        }
      };
      //check order of photos
      $scope.changeOrder = function (oldData) {
        //check new list vs old list if any of the pictures change itemOrder
        var promiseOrder = [];
        var countChanges = 0;
        for (var i = 0; i < oldData.pictures.length; i++) {
          //var cleanPic = "data:image/jpeg;base64," +oldData.pictures[i].picture.split(':')[2];
          var cleanPos = oldData.pictures[i].itemOrder - 1;
          if (oldData.pictures[i].itemOrder != $scope.data.itemOrder[cleanPos]) {
            promiseOrder[countChanges] = SequenceService.updateOrder({"objectId": oldData.pictures[i].$$instanceId}).save({
              "int": {
                "value": $scope.data.itemOrder[cleanPos]
              }
            }).$promise;
            countChanges++;
          }
        }
        //if at least one pic change order and we use WS to update it
        if (promiseOrder.length > 0) {
          $q.all(promiseOrder).then(function () {
            $scope.updateFrame(oldData);
          }, function (response) {
            $scope.uploading = false;
            $scope.uploadErrorMessage = 'Unable to update your CQNZ. Verify your internet connection and try again later.';
          });
        } else {
          $scope.updateFrame(oldData);
        }
      };

      //second step check template
      $scope.updateFrame = function (oldData) {
        if (oldData.template != $scope.data.tempTemplate) {
          SequenceService.updateTemplate({"objectId": oldData.sequenceInstanceId}).save(
            {
              "string": {
                "value": $scope.data.tempTemplate
              }
            }, function (changeData) {
              $scope.updateTitleTags(oldData);
            }, function (updateError) {
              $scope.uploading = false;
              $scope.uploadErrorMessage = 'Unable to update your CQNZ. Verify your internet connection and try again later.';
            });
        } else {
          $scope.updateTitleTags(oldData);
        }
      };

      //Third step check title and tags
      $scope.updateTitleTags = function (oldData) {
        var exits = 0;
        var nameToCheck = "";
        var titleTempo = "";
        var deleteArray = [];
        var toDeleteTags = [];
        var listPromiseDelete = [];
        var fixedName = "";
        var listIDTags = [];
        var positionTag = 0;
        var taggedUserId = 0;
        var tempoNonDeletedTags = [];

        var mentionFix = "";


        var findedTags = [];
        $scope.changing = true;

        if ($scope.data.tempTitle) {
          if ($scope.data.tempTitle == "") {
            $scope.data.tempTitle = " ";
          }
        } else {
          $scope.data.tempTitle = " ";
        }
        if (oldData.descriptionSequence == "") {
          oldData.descriptionSequence = " ";
        }

        if (oldData.descriptionSequence != $scope.data.tempTitle) {
          //save new title
          cqnzService.updateSequenceTitle({
            sequenceId: oldData.sequenceInstanceId,
            description: $scope.data.tempTitle
          }).$promise.then(function (changeData) {
            //check if the original sequence  had any tags
            if (oldData.taggedUserList.length > 0) {
              //Check if user leave any old tags in new title
              for (var a = 0; a < oldData.taggedUserList.length; a++) {
                fixedName = '@' + oldData.taggedUserList[a].name.replace(/\s\s+/g, ' ');
                fixedName = fixedName.replace(/\s+$/g, '');

                if (oldData.descriptionSequence.indexOf(fixedName) != -1) {
                  positionTag = oldData.descriptionSequence.indexOf(fixedName);
                  taggedUserId = oldData.taggedUserList[a].userSubscription.href.split('/')[6];
                  tempoNonDeletedTags.push(oldData.taggedUserList[a]);
                }
              }
              //Delete the old tags in sequence
              for (var x = 0; x < oldData.tagIDAssociated.length; x++) {
                listPromiseDelete[x] = TagsService.deleteTaggedUserWS(
                  oldData.tagIDAssociated[x]
                );
              }
              //after all the olds tags get deleted
              $q.all(listPromiseDelete).then(function (promiseDeleteData) {
                //clean tagged list "local"
                $scope.tags.length = 0;
                $scope.tagsHidden.length = 0;
                oldData.taggedUserList.length = 0;
                oldData.tagIDAssociated.length = 0;
                //If previous tags were saved add them to new tag list
                if (tempoNonDeletedTags.length > 0) {
                  $scope.data.mentionsList.push.apply($scope.data.mentionsList, tempoNonDeletedTags);
                }
                //check if we have new taglist
                if ($scope.data.mentionsList.length > 0) {
                  var tagPromises = {};
                  //check if any tags isn't needed
                  for (var a = 0; a < $scope.data.mentionsList.length; a++) {
                    nameToCheck = "@" + $scope.data.mentionsList[a].name.replace(/\s\s+/g, ' ');
                    nameToCheck = nameToCheck.replace(/\s+$/g, '');
                    titleTempo = $scope.data.tempTitle;
                    if (titleTempo.indexOf(nameToCheck, 0) != -1) {
                      exits++;
                    } else {
                      deleteArray.push(x);
                    }
                  }
                  // clean unused tags
                  if (deleteArray.length > 0) {
                    for (var b = 0; b < deleteArray.length; b++) {
                      $scope.data.mentionsList.splice(deleteArray[b], 1);
                    }
                  }
                  //Add tags to the sequence
                  for (var c = 0; c < $scope.data.mentionsList.length; c++) {
                    var subscriptionInstanceId = 0;
                    if ($scope.data.mentionsList[c].id) {
                      subscriptionInstanceId = $scope.data.mentionsList[c].id;
                    } else {
                      subscriptionInstanceId = $scope.data.mentionsList[c].userSubscription.href.split('/')[6];
                    }
                    var newTags = SequenceService.sendTagNotificationUpload({
                      sequenceId: oldData.sequenceInstanceId,
                      userId: subscriptionInstanceId
                    }).$promise;
                    tagPromises[subscriptionInstanceId] = newTags;
                  }
                  //After add tags to the sequence and make notification in App
                  $q.all(tagPromises).then(function (promiseTagData) {
                    var responseKeys = Object.keys(promiseTagData);
                    var responseValues = responseKeys.map(function (key) {
                      return promiseTagData[key];
                    });
                    var tokenPromises = [];
                    for (var i = 0; i < responseKeys.length; i++) {
                      subscriptionInstanceId = responseKeys[i];
                      //if response === true then add to the promises array
                      if (responseValues[i].result.value) {
                        tokenPromises[tokenPromises.length++] = UserService.getDevices(subscriptionInstanceId).$promise;
                      }
                    }
                    //prepare push notification for each tag
                    $q.all(tokenPromises).then(function (promiseTokenData) {
                      var tokens = [];
                      var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
                      var message = name + " tagged you in a sequence";
                      message = message.replace(/\s\s+/g, ' ');
                      for (var i = 0; i < promiseTokenData.length; i++) {
                        for (var j = 0; j < promiseTokenData[i].value.length; j++) {
                          var endpointArn = promiseTokenData[i].value[j].title;
                          AWSServices.sendNotification(message, endpointArn);
                        }
                      }
                      $state.go('menu.myProfile', {}, {reload: true});
                      $scope.data.mentionsList.length = 0;
                    }, function (promiseTokenError) {
                      $scope.uploading = false;
                      $state.go('menu.myProfile', {}, {reload: true});
                      $scope.data.mentionsList.length = 0;
                    })
                    //redirect to next step
                    $scope.uploading = false;
                  }, function (promiseTagError) {
                    $scope.uploading = false;
                    $state.go('menu.myProfile', {}, {reload: true});
                    $scope.data.mentionsList.length = 0;
                  });
                  //
                } else {
                  $scope.uploading = false;
                  $scope.data.mentionsList.length = 0;
                  $state.go('menu.myProfile', {}, {reload: true});
                }
              }, function (promiseDeleteError) {
                $scope.uploading = false;
                $scope.uploadErrorMessage = 'Unable to update your CQNZ. Verify your internet connection and try again later.';
              })
            } else {
              //if the sequence doesn't had any tags we pass directly to check for new tags
              if ($scope.data.mentionsList.length > 0) {
                var tagPromises = {};
                //check if any tags isn't needed
                for (var a = 0; a < $scope.data.mentionsList.length; a++) {
                  nameToCheck = "@" + $scope.data.mentionsList[a].name.replace(/\s\s+/g, ' ');
                  nameToCheck = nameToCheck.replace(/\s+$/g, '');
                  titleTempo = $scope.data.tempTitle;
                  if (titleTempo.indexOf(nameToCheck, 0) != -1) {
                    exits++;
                  } else {
                    deleteArray.push(x);
                  }
                }
                // clean unused tags
                if (deleteArray.length > 0) {
                  for (var b = 0; b < deleteArray.length; b++) {
                    $scope.data.mentionsList.splice(deleteArray[b], 1);
                  }
                }
                //Add tags to the sequence
                for (var c = 0; c < $scope.data.mentionsList.length; c++) {
                  var subscriptionInstanceId = $scope.data.mentionsList[c].id;
                  var newTags = SequenceService.sendTagNotificationUpload({
                    sequenceId: oldData.sequenceInstanceId,
                    userId: subscriptionInstanceId
                  }).$promise;
                  tagPromises[subscriptionInstanceId] = newTags;
                }
                //After add tags to the sequence and make notification in App
                $q.all(tagPromises).then(function (promiseTagData) {
                  var responseKeys = Object.keys(promiseTagData);
                  var responseValues = responseKeys.map(function (key) {
                    return promiseTagData[key];
                  });
                  var tokenPromises = [];
                  for (var i = 0; i < responseKeys.length; i++) {
                    subscriptionInstanceId = responseKeys[i];
                    //if response === true then add to the promises array
                    if (responseValues[i].result.value) {
                      tokenPromises[tokenPromises.length++] = UserService.getDevices(subscriptionInstanceId).$promise;
                    }
                  }
                  //prepare push notification for each tag
                  $q.all(tokenPromises).then(function (promiseTokenData) {
                    var tokens = [];
                    var name = window.localStorage.getItem('name') === null ? "Someone" : window.localStorage.getItem('name');
                    var message = name + " tagged you in a sequence";
                    message = message.replace(/\s\s+/g, ' ');
                    for (var i = 0; i < promiseTokenData.length; i++) {
                      for (var j = 0; j < promiseTokenData[i].value.length; j++) {
                        var endpointArn = promiseTokenData[i].value[j].title;
                        //AWSServices.sendNotification(message, endpointArn);
                      }
                    }
                    $scope.data.mentionsList.length = 0;
                    $state.go('menu.myProfile', {}, {reload: true});
                  }, function (promiseTokenError) {
                    sequenceData.activeEdit = false;
                    $state.go('menu.myProfile', {}, {reload: true});
                    $scope.data.mentionsList.length = 0;
                  });
                  //redirect to next step
                  $scope.uploading = false;
                  $state.go('menu.myProfile', {}, {reload: true});
                }, function (promiseTagError) {
                  $scope.uploading = false;
                  $scope.data.mentionsList.length = 0;
                });
              } else {
                //redirect to next step
                $scope.uploading = false;
                $state.go('menu.myProfile', {}, {reload: true});
              }
            }
          }, function (updateDescriptionError) {
          })
        } else {
          //redirect to next step
          $scope.uploading = true;
          $state.go('menu.myProfile', {}, {reload: true});
        }
      };
      //end zone to update cqnz

    }])
;
