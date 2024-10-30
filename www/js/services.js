"use strict";
angular.module('app.services', ['ngResource'])

  .factory('FileService', function () {
    var images = [];
    var thumbImages = [];

    //var IMAGE_STORAGE_KEY = 'dav-images';

    function getImages() {

      //images = [];

      return images;
    }

    function getThumbImages() {
      //thumbImages = [];

      return thumbImages;
    }

    function addImage(img) {
      images.push('data:image/jpeg;base64,' + img);
      //images.push(img);
      //window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
      //console.log(window.localStorage.getItem('IMAGE_STORAGE_KEY'));
      //test
    }

    function addThumb(img) {
      thumbImages.push(img);
      //window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
      //console.log(img);
    }

    function cleanImages() {
      images = [];
      thumbImages = [];
    }

    return {
      storeImage: addImage,
      images: getImages,
      storeThumb: addThumb,
      thumbImages: getThumbImages,
      cleanImages: cleanImages
    };
  })

  .factory('ImageService', function ($cordovaCamera, FileService, $q, $cordovaFile, $cordovaImagePicker) {

    function optionsForType(type) {
      var source;
      switch (type) {
        case 0:
          source = Camera.PictureSourceType.CAMERA;
          break;
        case 1:
          source = Camera.PictureSourceType.PHOTOLIBRARY;
          break;
      }
      return {
        quality: 100,
        targetWidth: 648,
        targetHeight: 648,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: source,
        allowEdit: false,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false,
        correctOrientation: false
      };
    }

    function saveCameraMedia(type) {
      return $q(function (resolve) {
        var options = optionsForType(type);
        $cordovaCamera.getPicture(options).then(function (imageUri) {
          var promise1 = imageUriToImage64(imageUri);
          var promise2 = imageUriToImage64Thumb(imageUri);
          $q.all([promise1, promise2]).then(function success() {
            resolve(FileService);
          });
          //imageUriToImage64(imageUri, callback);
          //imageUriToImage64Thumb(imageUri, callback);
        });
      });
    }

    function saveAlbumMedia(opts) {
      return $q(function (resolve) {
        var options = opts || {
          width: 648,
          height: 648,
          quality: 100,
          maximumImagesCount: 6
        };

        $cordovaImagePicker.getPictures(options)
          .then(function (results) {
            var promises = [];
            for (var i = 0; i < results.length; i++) {
              console.log('Image URI: ' + results[i]);
              promises.push(imageUriToImage64(results[i]));
              promises.push(imageUriToImage64Thumb(results[i]));
              //imageUriToImage64Thumb(results[i], callback);
            }
            $q.all(promises).then(function success() {
              resolve(FileService);
            });
          }, function error() {
            console.log(' error getting photos');
          });

      });
    }

    function saveAlbumMediaFix(preExisted) {
      var picsAllowed = 6 - preExisted;
      return $q(function (resolve) {
        var options = {
          width: 648,
          height: 648,
          quality: 100,
          maximumImagesCount: picsAllowed
        };

        $cordovaImagePicker.getPictures(options)
          .then(function (results) {
            var promises = [];
            for (var i = 0; i < results.length; i++) {
              console.log('Image URI: ' + results[i]);
              promises.push(imageUriToImage64(results[i]));
              promises.push(imageUriToImage64Thumb(results[i]));
              //imageUriToImage64Thumb(results[i], callback);
            }
            $q.all(promises).then(function success() {
              resolve(FileService);
            });
          }, function error() {
            console.log(' error getting photos');
          });

      });
    }

    function imageUriToImage64(imageUri) {
      return $q(function (resolve) {
        //FileService.storeImage(imageUri);
        //resolve();
        var c = document.createElement('canvas');
        var ctx = c.getContext("2d");
        var img = new Image();
        img.onload = function () {
          c.width = this.width;
          c.height = this.height;
          ctx.drawImage(img, 0, 0);
          var dataURL = c.toDataURL("image/jpeg");
          FileService.storeImage(dataURL.replace("data:image/jpeg;base64,", ""));
          console.log("image is loaded");
          resolve();
        };
        img.src = imageUri;
      });
    }

    function imageUriToImage64Thumb(imageUri) {
      return $q(function (resolve) {
        //FileService.storeThumb(imageUri);
        //resolve();
        var c = document.createElement('canvas');
        var ctx = c.getContext("2d");
        var img = new Image();
        img.onload = function () {
          c.width = Math.floor(this.width * 0.5);
          c.height = Math.floor(this.height * 0.5);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          var dataURL = c.toDataURL("image/jpeg");
          FileService.storeThumb(dataURL);
          console.log("image is loaded");
          resolve();
        };
        img.src = imageUri;
      });
    }

    return {
      saveCameraMedia: saveCameraMedia,
      saveAlbumMedia: saveAlbumMedia,
      saveAlbumMediaFix: saveAlbumMediaFix
    };
  })

  .factory('FileVideoService', function () {
    var video = null;
    var videoThumb = null;

    function addVideo(data) {
      video = data;
    }

    function getVideo() {
      return video;
    }

    function cleanVideo() {
      video = null;
    }

    return {
      storeVideo: addVideo,
      video: getVideo,
      cleanVideo: cleanVideo
    };
  })

  .factory('VideoService', function ($cordovaCamera, $q, FileVideoService) {
    function optionsForType() {
      return {
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        allowEdit: false,
        mediaType: Camera.MediaType.VIDEO
      };
    }

    function saveVideoMedia() {
      var options = optionsForType();
      return $q(function (resolve) {
        var promise = [];
        $cordovaCamera.getPicture(options).then(function (videoData) {
          console.log("video URI= " + videoData);
          promise.push(FileVideoService.storeVideo(videoData));
          $q.all(promise).then(function success() {
            resolve(FileVideoService);
          });
        });
      });
    }

    return {
      saveVideoMedia: saveVideoMedia
    };
  })


  //service to pass selected data between pages
  .factory('network', function () {
    return {status: null};
  })

  //service to pass selected data between pages
  .factory('usersData', function () {
    var ret = function () {
    };
    ret.userChosen = "";
    ret.anadir = function (nuevoElemento) {
      ret.userChosen = nuevoElemento;
    };
    ret.limpiar = function () {
      ret.userChosen = "";
    };
    return ret;
  })

  //service to pass cqnz data between pages
  .factory('cqnzData', function () {
    var ret = function () {
    };
    ret.keycomment = "";
    ret.sequenceSelected = "";
    ret.subscriptionInstanceId = "";
    ret.owns = "";
    ret.listIndex = null;
    ret.anadir = function (keycomment, sequenceSelected, subscriptionInstanceId, owns) {
      ret.keycomment = keycomment;
      ret.sequenceSelected = sequenceSelected;
      ret.subscriptionInstanceId = subscriptionInstanceId;
      ret.owns = owns;
    };
    ret.limpiar = function () {
      ret.keycomment = "";
      ret.sequenceSelected = "";
      ret.subscriptionInstanceId = "";
      ret.owns = "";
    };
    return ret;
  })

  //service to pass friends data between pages
  .factory('friendsData', function () {
    var ret = function () {
    };
    ret.friends = [];
    ret.anadir = function (nuevoElemento) {
      ret.friends = nuevoElemento;
    };
    ret.limpiar = function () {
      ret.followers = "";
    };
    return ret;
  })

  //service to pass followers data between pages
  .factory('followersData', function () {
    var ret = function () {
    };
    ret.followers = "";
    ret.anadir = function (nuevoElemento) {
      ret.followers = nuevoElemento;
    };
    ret.limpiar = function () {
      ret.followers = "";
    };
    return ret;
  })

  //Service to pass likes/users data between pages
  .factory('likeUsersData', function () {
    var like = function () {
    };
    like.count = "";
    like.data = "";
    //like.count = [];
    like.anadir = function (nuevoElemento, nuevoElemento2) {
      like.count = nuevoElemento;
      like.data = nuevoElemento2;
    };
    like.limpiar = function () {
      like.count = "";
      like.count = "";
    };
    return like;
  })

  .factory('visitedFriendData', function () {
    var num = function () {
    };
    num.idVisited = "";
    //like.count = [];
    num.anadir = function (nuevoElemento) {
      num.idVisited = nuevoElemento;
    };
    num.limpiar = function () {
      num.idVisited = "";
    };
    return num;
  })

  .factory('selectedSequenceData', function () {
    var cqnz = function () {
    };
    cqnz.idSelected = "";
    cqnz.idInstanceSelected = "";
    cqnz.ownerSelected = "";
    cqnz.anadir = function (newElement, newElement2, newElement3) {
      cqnz.idSelected = newElement;
      cqnz.idInstanceSelected = newElement2;
      cqnz.ownerSelected = newElement3;
    };
    cqnz.limpiar = function () {
      cqnz.idSelected = "";
    };
    return cqnz;
  })

  //Service to pass data for Number of pending notifications
  .factory('pendingNotificationData', function () {
    var num = function () {
    };
    num.pending = "";
    //like.count = [];
    num.anadir = function (nuevoElemento) {
      num.pending = nuevoElemento;
    };
    num.limpiar = function () {
      num.pending = "";
    };
    return num;
  })

  .factory('MultiImageService', function (FileService, $q) {
    function saveMedia(imageMulti) {
      return $q(function (resolve) {

        FileService.storeImage(imageMulti);
        FileService.storeThumb('data:image/jpeg;base64,' + imageMulti);
        resolve(FileService);
      });
    }

    return {
      //
      handleMediaDialog: saveMedia
    };
  })

  //Service for socket
  .factory('socket', function (socketFactory) {
    //var myIoSocket = io.connect('https://socket-io-chat.now.sh/');
    //var myIoSocket = io.connect('http://ec2-34-212-194-26.us-west-2.compute.amazonaws.com:3000/');
    var myIoSocket = io.connect('http://ec2-54-69-184-92.us-west-2.compute.amazonaws.com:3000/');

    var mySocket = socketFactory({
      ioSocket: myIoSocket
    });

    return mySocket;
  })


  .factory('FileService2', function () {
    var images = [];

    //var IMAGE_STORAGE_KEY = 'dav-images';

    function getImages() {

      //images = [];

      return images;
    }

    function addImage(img) {
      images.push('data:image/jpeg;base64,' + img);
      //window.localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
      //console.log(window.localStorage.getItem('IMAGE_STORAGE_KEY'));
    }

    function cleanImages() {
      images = [];
    }

    return {
      storeImage: addImage,
      images: getImages,
      cleanImages: cleanImages
    };
  })

  .factory('ImageService2', function ($cordovaCamera, FileService2, $q) {

    function optionsForType(type, height, width, edit) {
      var source;
      switch (type) {
        case 0:
          source = Camera.PictureSourceType.CAMERA;
          break;
        case 1:
          source = Camera.PictureSourceType.PHOTOLIBRARY;
          break;
      }
      return {
        quality: 90,
        cameraDirection: Camera.Direction.FRONT,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: source,
        allowEdit: edit,
        targetHeight: height,
        targetWidth: width,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false,
        correctOrientation: true
      };
    }

    function optionsProfilePhoto(type) {
      var source;
      switch (type) {
        case 0:
          source = Camera.PictureSourceType.CAMERA;
          break;
        case 1:
          source = Camera.PictureSourceType.PHOTOLIBRARY;
          break;
      }
      return {
        quality: 100,
        cameraDirection: Camera.Direction.FRONT,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: source,
        targetWidth: 400,
        targetHeight: 396,
        allowEdit: true,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        saveToPhotoAlbum: false,
        correctOrientation: true
      };
    }

    function saveMedia(type, height, width, edit) {
      return $q(function () {

        console.log(height + " - " + width);

        var options = optionsForType(type, height, width, edit);

        $cordovaCamera.getPicture(options).then(function (imageBase64) {
          FileService2.storeImage(imageBase64);
        });
      });
    }

    function saveProfilePhoto(type) {
      return $q(function (resolve) {

        var options = optionsProfilePhoto(type);

        $cordovaCamera.getPicture(options).then(function (imageUri) {
          FileService2.cleanImages();
          var promise1 = imageUriToImage64(imageUri, 400, 396);
          var promise2 = imageUriToImage64(imageUri, 200, 198);
          var promise3 = imageUriToImage64(imageUri, 100, 99);
          $q.all([promise1, promise2, promise3]).then(function success() {
            resolve(FileService2);
          });
        });
      });
    }

    function imageUriToImage64(imageUri, width, height) {
      return $q(function (resolve) {
        var c = document.createElement('canvas');
        var ctx = c.getContext("2d");
        var img = new Image();
        img.onload = function () {
          c.width = width;
          c.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          var dataURL = c.toDataURL("image/jpeg");
          FileService2.storeImage(dataURL.replace("data:image/jpeg;base64,", ""));
          console.log("image is loaded");
          resolve();
        };
        img.src = imageUri;
      });
    }

    return {
      saveMedia: saveMedia,
      saveProfilePhoto: saveProfilePhoto
    };
  })

  .factory('SequenceService', ['$resource', '$q', 'ApiEndPoint', function ($resource, $q, ApiEndPoint) {
    return {
      addNewSequence: function (userSubscriptionInstanceId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:userSubscriptionInstanceId/actions/addSequence/invoke', userSubscriptionInstanceId,
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        );
      },
      addNewSequencev181: function (userSubscriptionInstanceId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:userSubscriptionInstanceId/actions/addSequencev181/invoke', userSubscriptionInstanceId,
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        );
      },
      /**
       * @param data {{
       *   userId:number,
       *   description:string,
       *   templateId:string,
       *   itemCount:number,
       *   sequenceType:number,
       *   commentsEnabled:boolean,
       *   temporary:number,
       *   shareable:boolean,
       *   sharelife:number,
       *   isAdvertisement:boolean,
       *   headerBgColor:string,
       *   headerFontColor:string,
       *   finalDate:string
       * }}
       */
      addNewSequencev100: function (data) {
        //comment the next lines if you want to send the time in the UTC time
        //it means, without consider your local time offset
        // e.g. in mexico is located at GMT-6 so when the local time is 17:00:00 you'll get 23:00:00
        if (data.finalDate && data.finalDate instanceof Date) {
          var timeOffsetInMS = data.finalDate.getTimezoneOffset() * 60000;
          data.finalDate.setTime(data.finalDate.getTime() - timeOffsetInMS);
        }

        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:userSubscriptionInstanceId/actions/addSequencev100/invoke',
          {userSubscriptionInstanceId: data.userId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({
          description: {value: data.description},
          templateId: {value: data.templateId},
          itemCount: {value: data.itemCount},
          sequenceType: {value: data.sequenceType},
          commentEnable: {value: data.commentsEnabled},
          temporary: {value: data.temporary},
          shareable: {value: data.shareable},
          sharelife: {value: data.sharelife},
          isAdvertisement: {value: data.isAdvertisement},
          headerBgColor: {value: data.headerBgColor || ''},
          headerFontColor: {value: data.headerFontColor || ''},
          finalDate: {value: data.finalDate || ''}
        });
      },
      /**
       * @param cqnzData {{
       *   userId:number,
       *   description:string,
       *   templateId:string,
       *   itemCount:number,
       *   sequenceType:number,
       *   groupId:number,
       *   commentEnable:boolean,
       *   temporary:number,
       *   shareable:boolean,
       *   sharelife:number,
       *   isAdvertisement:boolean,
       *   headerBgColor:string,
       *   headerFontColor:string
       * }}
       * @return {Promise}
       */
      addNewGroupSequence: function (cqnzData) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:groupSubscriptionInstanceId/actions/addSequenceGroup/invoke',
          {groupSubscriptionInstanceId: cqnzData.userId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({
          description: {value: cqnzData.description},
          templateId: {value: cqnzData.templateId},
          itemCount: {value: cqnzData.itemCount},
          sequenceType: {value: cqnzData.sequenceType},
          groupId: {value: cqnzData.groupId},
          commentEnable: {value: cqnzData.commentEnable},
          temporary: {value: cqnzData.temporary},
          shareable: {value: cqnzData.shareable},
          sharelife: {value: cqnzData.sharelife},
          isAdvertisement: {value: cqnzData.isAdvertisement},
          headerBgColor: {value: cqnzData.headerBgColor || ''},
          headerFontColor: {value: cqnzData.headerFontColor || ''}
        }).$promise;
      },

      findSequenceBySequenceIdV2: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/findSequenceBySequenceId/invoke', {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json"}
            }
          }
        );
      },

      /**
       * @param sequenceId {string|number}
       * @return {*}
       */
      findSequenceBySequenceIdV181: function (sequenceId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/findSequenceBySequenceIdv181/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          "secuenceId": '"' + sequenceId + '"'
          //,"x-ro-follow-links": "value.members[userSubscriptionID].value"
        });
      },

      addItemToSequence: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceItemRepository/actions/addSequenceItem/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      },

      addItemToSequencev181: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceItemRepository/actions/addSequenceItemv181/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      },

      /**
       * @param sequenceId {number}
       * @return {Promise}
       */
      findItemsToSequence: function (sequenceId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceItemRepository/actions/findItemsBelongingToASequence/invoke', {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json"}
            }
          }
        ).get({
          sequence: '"' + sequenceId + '"',
          "x-ro-follow-links": "value"
        });
      },

      addSequenceItemComment: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addSequenceItemComment/invoke',
          objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          });
      },

      addSequenceComment: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceCommentsRepository/actions/addSequenceComments/invoke',
          {},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          });
      },

      /**
       * @param data {{sequenceId:number|string, userId:number|string, comment: string}}
       * @return {Promise}
       */
      addSequenceCommentv166: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceCommentsRepository/actions/addSequenceCommentsv166/invoke',
          {},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).post({
          sequence: {
            value: {href: ApiEndPoint.url + '/restful/objects/simple.Sequence/' + data.sequenceId}
          },
          userSubscriptionId: {
            value: {href: ApiEndPoint.url + '/restful/objects/simple.UserSubscription/' + data.userId}
          },
          comment: {value: data.comment}
        }).$promise;
      },

      /**
       * @param data: {{sequenceId:string|number,start:number, count: number}}
       * @return {Promise}
       */
      findTheCommentsOfASequence: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceCommentsRepository/actions/findTheCommentsOfASequence/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json"}
            }
          }).get({
          "sequence": '"' + data.sequenceId + '"', //idSequence
          "withStart": '"' + data.start + '"',
          "withCount": '"' + data.count + '"',
          "x-ro-follow-links": "value.members[userId].value"
        }).$promise;
      },

      findTheCommentsOfASequencev157: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceCommentsRepository/actions/findTheCommentsOfASequencev157/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          "sequence": '"' + data.sequenceId + '"', //idSequence
          "withStart": '"' + data.start + '"',
          "withCount": '"' + data.count + '"'/*,
          "x-ro-follow-links": "value.members[userId].value"*/
        }).$promise;
      },

      setLikeToItem: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.SequenceItem/:objectId/actions/like/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      },

      /**
       * @param cqnzId {number}
       * @return Promise{{*}}
       */
      increaseSharesCount: function (cqnzId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/shareCount/invoke',
          {objectId: cqnzId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save().$promise
      },


      findTheCommentsOfASequenceItem: function () {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.SequenceItem/:objectId/actions/findTheCommentsOfASequenceItem/invoke',
          {objectId: '@objectId'},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;repr-type=object"}
            }
          }
        );
      },

      /**
       * @param data{{sequenceId: number|string, userId: number|string}}
       * @return {Promise}
       */
      findSmileysCount: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/findSmileysCount/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Content-Type": "application/json;profile=urn:org.apache.isis/v1;repr-type=object"}
            }
          }
        ).get({
          "x-isis-querystring":
            {
              sequence:
                {
                  value:
                    {href: ApiEndPoint.url + "restful/objects/simple.Sequence/" + data.sequenceId}
                },
              userSubs:
                {
                  value:
                    {href: ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + data.userId}
                }
            }
        });
      },

      findSmileysItemCount: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceItemRepository/actions/findSmileysCountbyUserItems/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Content-Type": "application/json;profile=urn:org.apache.isis/v1;repr-type=object"}
            }
          }
        );
      },


      deleteSequence: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/delete/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          });
      },

      /**
       * @param data:{{userId: number|string, friendId: number|string}}
       * @return {Promise}
       */
      followEachOther: function (data) {
        return $resource(ApiEndPoint.url + 'restful/services/FriendRepository/actions/followEachOther/invoke',
          {},
          {
            get:
              {
                method: 'GET',
                headers: {"Accept": "application/json"}
              }
          }
        ).get({
          "x-isis-querystring":
            {
              userSubscriptionId: {value: {href: ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + data.userId}},
              friendId: {value: {href: ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + data.friendId}}
            }
        });
      },

      sequenceCounts: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/sequencesCounts/invoke',
          objectId,
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      },

      obtainSequence: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId',
          {objectId: objectId},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({});
      },

      /**
       * @param data {{sequenceId:number|string, userId: number|string}}
       */
      sendTagNotificationUpload: function (data) {
        //console.log(objectId);
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/tag/invoke',
          {objectId: data.sequenceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          userSubscription: {
            value: {
              href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.userId
            }
          }
        });
      },

      /**
       * @param data {{sequenceId: number, notificationType: number}}
       * @return {Promise}
       */
      obtainTagwithIdandType: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceTagRepository/actions/findTagSequence/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        ).get({
          sequenceId: '"' + data.sequenceId + '"',
          notificationType: '"' + data.notificationType + '"'
        }).$promise;
      },

      /**
       * @param data {{sequenceId:number, notificationType:number}}
       */
      obtainTagwithIdandTypev166: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceTagRepository/actions/findTagSequencev166/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        ).get({
          sequenceId: '"' + data.sequenceId + '"',
          notificationType: '"' + data.notificationType + '"'
        }).$promise;
      },

      obtainTagFromComments: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceTagRepository/actions/findTagSequenceComment/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        );
      },

      uploadError: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/uploadError/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        );
      },


      updateOrder: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.SequenceItem/:objectId/actions/changeItemOrder/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        );
      },

      updateTemplate: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changeTemplateId/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      },


      createHashTag: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/HashTagRepository/actions/addHashTag/invoke',
          {},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        );
      },
      modifyHashCount: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.HashTag/:objectId/actions/hashTagCount/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        )
      },
      addHashtoSequence: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceHashTagRepository/actions/addSequenceHashTag/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        )
      },
      /**
       * @param sequenceId {number}
       * @return {Promise}
       */
      getHashFromSequence: function (sequenceId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceHashTagRepository/actions/findHashTagSequence/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        ).get({
          "sequenceId": '"' + sequenceId + '"'
        }).$promise;
      },

      /**
       * @param hashName {string}
       */
      findHashDataFromHash: function (hashName) {
        return $resource(
          ApiEndPoint.url + 'restful/services/HashTagRepository/actions/findHashTag/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        ).get({
          "hashTag": '"' + hashName + '"'
        })
      },
      /**
       * @param data {{hashtagId:number, start:string, count:string}}
       */
      getSequenceFromHashtags: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceHashTagRepository/actions/findSequenceByHashTag/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        ).get({
          "x-isis-querystring": {
            "hashTag": {
              "value": {
                "href": ApiEndPoint.url + "/restful/objects/simple.HashTag/" + data.hashtagId
              }
            },
            "withStart": {
              "value": data.start.toString()
            },
            "withCount": {
              "value": data.count.toString()
            }
          }
        })
      },
      getTrending: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/HashTagRepository/actions/findAllHashTag/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        )
      },
      //end zone Webservices for hashtags

      findSequenceByDescription: function (description) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/findSequenceByDescription/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        ).get({
          description: description
        })
      }
    };
  }])

  .factory('TimeLineService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {

      findLatestSequencesBelongingToAUser: function (data) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findLatestSequencesBelongingToAUser/invoke',
          {itemId: data.userId},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          "withStart": '"' + data.start + '"',
          "withCount": '"' + data.count + '"'
        }).$promise;
      },

      findLatestSequencesBelongingToAGroup: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/findLatestSequencesBelongingToAGroupId/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      },

      /**
       *
       * @param objectId {number|string}
       * @param pagination {{start:number, count:number, order:number}}
       * @return {Promise}
       */
      findPendingLogByUserSubscription: function (objectId, pagination) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findPendingLogByUserSubscription/invoke',
          {objectId: objectId},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        ).get({
            "withStart": '"' + pagination.start + '"',
            "withCount": '"' + pagination.count + '"',
            "order": pagination.order
          }
        ).$promise
      },

      createSmileyCount: function () {
        return $resource(
          ApiEndPoint.url + '/services/SequenceRepository/actions/createSmileysCount/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {'Content-Type': 'application/json'}
            }
          });
      },

      findMyFavoriteFriendsByUserSubscriptionId: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findMyFavoriteFriendsByUserSubscriptionId/invoke',
          objectId,
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        );
      },

      /**
       * Shares a cqnz to a group's timeline
       * @param cqnzId {string|number}
       * @param groupHrefId {string|number}
       * @returns {Promise}
       */
      shareTimelineCqnzToGroup: function (cqnzId, groupHrefId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/shareTimeLineToGroup/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          "x-isis-querystring": {
            sequenceId: {value: (typeof cqnzId == 'string' ? cqnzId : cqnzId.toString())},
            groupId: {value: (typeof groupHrefId == 'string' ? groupHrefId : groupHrefId.toString())}
          }
        }).$promise;
      },

      setPostVideoCount: function (objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/playVideoCount/invoke', objectId,
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          });
      }

    };
  }])

  .service('UserService', ['$rootScope', '$resource', 'ApiEndPoint', 'Utils', function ($rootScope, $resource, ApiEndPoint, Utils) {
    /**
     * @type {string[]}
     */
    var PERMISSIONS = get_USER_PERMISSIONS();

    var PREFERENCES = get_USER_PREFERENCES();

    /**
     * @return {string | null}
     */
    function get_USER_ID() {
      return window.localStorage.getItem("userSubscriptionInstanceId")
    }

    function get_USER_INSTANCE_HREF() {
      return window.localStorage.getItem("userSubscriptionHref");
    }

    function get_USER_USERNAME() {
      return window.localStorage.getItem("userName");
    }

    function get_USER_NAME() {
      return window.localStorage.getItem("name") || "Someone";
    }

    function get_USER_BIO() {
      return window.localStorage.getItem("userBiography");
    }

    function get_USER_PHOTO() {
      var localPhoto = window.localStorage.getItem("photoProfileBlob");
      return localPhoto ? localPhoto : 'img/ProfilePhoto.svg';
    }

    function get_USER_EMAIL() {
      return window.localStorage.getItem("userEmail");
    }

    function get_USER_ROLE_ID() {
      return window.localStorage.getItem("userRoleId");
    }

    /**
     * @returns {string[]}
     */
    function get_USER_PERMISSIONS() {
      if (PERMISSIONS) return PERMISSIONS;

      var p = window.localStorage.getItem("userPermissions");
      return p ? JSON.parse(p) : [];
    }

    /**
     * @param permissions {string[]}
     * @param newDate {string?}
     */
    function set_USER_PERMISSIONS(permissions, newDate) {
      PERMISSIONS = permissions;
      window.localStorage.setItem("userPermissions", JSON.stringify(permissions));
      $rootScope.$broadcast("rolePermissions-changed", {newDate: newDate});
    }

    function USER_IS_SUPERADMIN() {
      return [1, '1'].indexOf(get_USER_ROLE_ID()) > -1;
    }

    function USER_IS_ADVERTISER() {
      return [3, '3'].indexOf(get_USER_ROLE_ID()) > -1;
    }

    function get_USER_PREFERENCES() {
      if (PREFERENCES) return PREFERENCES;

      var p = window.localStorage.getItem("userPreferences");
      return p ? JSON.parse(p) : [];
    }

    /**
     * @param preferences {string[]}
     */
    function set_USER_PREFERENCES(preferences) {
      PREFERENCES = preferences;
      window.localStorage.setItem("userPreferences", JSON.stringify(preferences));
    }

    //fixme: it gets too much info
    /**
     * @param userInstanceId {number|string}
     * @return {*}
     */
    function getUserSubscriptionByinstanceId(userInstanceId) {
      return $resource(ApiEndPoint.url + "restful/objects/simple.UserSubscription/:userInstanceId", {}, {
        get: {
          method: 'GET',
          headers: {'Content-Type': 'application/json;profile=urn:org.apache.isis/v1'}
        }
      }).get({
        userInstanceId: userInstanceId
      });
    }

    function getFollowingIsActive() {
      return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/getFollowingIsActive/invoke',
        {objectId: '@objecId'},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json"}
          }
        });
    }

    //Service for login
    function findUserSubscriptionByUserName() {
      return $resource(ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionsByUserName/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    //Service for search friends
    function findFriendUserSubscriptionsByUserName() {
      return $resource(ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findFriendUserSubscriptionsByUserName/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function findFriendUserSubscriptionsByUserNamev157() {
      return $resource(ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findFriendUserSubscriptionsByUserNamev157/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }


    //new Service for search sugested friends
    /**
     * @param data {{userId:number|string, start:number, count:number}}
     * @return {*}
     */
    function findSuggestedFriends(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findUsersRandom/invoke',
        {objectId: data.userId},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true;"}
          }
        }).get({
        "withStart": '"' + data.start + '"',
        "withCount": '"' + data.count + '"'
      });
    }

    function addFriends(objectId) {
      return $resource(ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addFriends/invoke',
        objectId,
        {
          post: {
            method: 'POST',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function followersByUserId(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findFollowersByUserId/invoke',
        objectId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true;"}
          }
        }
      );
    }

    /**
     * @param data {{userId:number|string, start:number, count:number}}
     * @return {*}
     */
    function findFriendsByUserSubscriptionId(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findFriendsByUserSubscriptionId/invoke',
        {objectId: data.userId},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        }
      ).get({
        withStart: '"' + data.start + '"',
        withCount: '"' + data.count + '"'
      });
    }

    function changePrivateAccount(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/changePrivateAccount/invoke',
        objectId,
        {

          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }

        }
      );
    }

    function blockToUser(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/Block/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function unblockUser(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/unBlock/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function findBlockUserById() {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserBlackListRepository/actions/findBlockedUserBlackListById/invoke', {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      );
    }

    function updatePassword(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/isissecurity.ApplicationUser/:objectId/actions/updatePassword/invoke', objectId,
        {
          put: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function sendEmail(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.users/:objectId/actions/sendEmail/invoke', objectId,
        {
          post: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function findUserByUserName() {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserRepository/actions/findUsersByName/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      );
    }

    function sendNewPassword() {
      return $resource(ApiEndPoint.url + 'restful/services/UserRepository/actions/sendNewPassword/invoke', {},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        });
    }

    function updateNotificationStatus(objectId) {
      return $resource(ApiEndPoint.url + 'restful/objects/simple.UserNotification/:objectId/actions/updateNotificationStatus/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        });
    }

    function findUserSubscriptionById() {
      return $resource(ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionById/invoke', {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        });
    }

    //only returns status account and role
    function findUserSubscriptionv157() {
      return $resource(ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionv157/invoke', {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        });
    }

    function sendSupportEmail(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.User/:objectId/actions/sendEmailToSupport/invoke', objectId,
        {
          post: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function getsupportType() {
      return $resource(
        ApiEndPoint.url + 'restful/services/SupportTypeRepository/actions/findAll/invoke', {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      );
    }

    function cancelUserSubscription(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/cancel/invoke', objectId,
        {
          post: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function changeProfilePicture(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/changeProfilePicture/invoke', objectId,
        {
          post: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function sendReaction(objectId) {
      return $resource(ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/sendReaction/invoke', objectId,
        {
          post:
            {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
            }
        });
    }

    function acceptFriend(objectId) {
      return $resource(ApiEndPoint.url + 'restful/objects/simple.Friend/:objectId/actions/approved/invoke', objectId,
        {
          post:
            {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
            }
        });
    }

    // function needed to check if the username is already taken
    function validateUserName() {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserRepository/actions/verifyUserName/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      );
    }

    // function that returns only the pending notifications (everything except followers) count
    function countPendingNotifications() {
      return $resource(ApiEndPoint.url + 'restful/services/UserNotificationRepository/actions/countPendingNotifications/invoke', {},
        {
          get: {
            method: 'GET',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        });
    }

    /**
     * function that returns only the pending followers notifications count
     * @param userInstanceId
     * @returns {Promise}
     */
    function countPendingFollowersNotifications(userInstanceId) {
      return $resource(ApiEndPoint.url + 'restful/services/UserNotificationRepository/actions/countPendingNotificationsFollow/invoke', {},
        {
          get: {
            method: 'GET',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).get({
        "x-isis-querystring":
          {
            "userSubscription":
              {
                "value":
                  {
                    "href": ApiEndPoint.url + 'restful/objects/simple.UserSubscription/' + userInstanceId
                  }
              }
          }
      }).$promise;
    }

    //function that returns all the needed notifications
    function findAllUserNotificationsByUserSubscription(userSub) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:userSub/actions/allUserNotificationByUserSubscription/invoke',
        userSub,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;suppress=true'}
          }
        });
    }

    /**
     * @param userId {number|string}
     * @param pagination {{start:number,count:number}}
     * @returns {Promise}
     */
    function findAllUserNotificationsByUserSubscriptionNotifications(userId, pagination) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:userSub/actions/allUserNotificationByUserSubscriptionNotification/invoke',
        {userSub: userId}, {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;suppress=true'}
          }
        }).get({
        withStart: '"' + pagination.start + '"',
        withCount: '"' + pagination.count + '"'
      }).$promise;
    }

    /**
     * @param userId {number|string}
     * @param pagination {{start:number,count:number}}
     * @returns {Promise}
     */
    function findAllUserNotificationsByUserSubscriptionFollow(userId, pagination) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:userSub/actions/allUserNotificationByUserSubscriptionFollow/invoke',
        {userSub: userId},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;suppress=true'}
          }
        }).get({
        withStart: '"' + pagination.start + '"',
        withCount: '"' + pagination.count + '"'
      }).$promise;
    }

    function countSequencesToAUser(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/countSequencesToAUser/invoke',
        objectId,
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function countFollowersToAUser(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/services/FriendRepository/actions/countFollowersByUserId/invoke',
        {},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function countFollowingToAUser(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/services/FriendRepository/actions/countFriendsByUserSubscriptionId/invoke',
        {},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function findUserProfilePictureLargeById(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/collections/findUserProfilePictureLargeById',
        objectId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function findFriendsByUserSubscriptionIdTag(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findFriendsByUserSubscriptionIdTag/invoke',
        objectId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }


    function findFriendsByUserSubscriptionIdTagv167(data) {//stop
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findFriendsByUserSubscriptionIdTagv167/invoke',
        {objectId: data.userId},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            //timeout: stop.promise
          }
        }).get({
        "string": data.term,
        "withStart": data.start,
        "withCount": data.count
      });
    }

    function findFriendsByUserSubscriptionIdTagv157(data) {//stop
      return $resource(
        ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionTagv157/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }).get({
        pagTag: data.term,
        withStart: data.start,
        withCount: data.count
      });
    }

    /**
     * Finds the users whose name are LIKE term and/or includes spaces
     * @example term = 'an' will return: "Andres VB", "Angel Manuel", etc..
     * @param data {{term:string, start:number, count:number}}
     * @return Promise {{
     *  id:string,
     *  href:string
     *  name:string,
     *  photo:string,
     * }}|*
     */
    function searchUsersByPartialNameOrIncludingSpaces(data) {
      return Utils.$q(function (resolve, reject) {
        return $resource(
          ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionTagv157/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).get({
          pagTag: data.term,
          withStart: data.start,
          withCount: data.count
        }).$promise.then(
          /**
           * @param response {[{
           *  name:string,
           *  profilePicture:string|null,
           *  profilePictureUrl:string|null,
           *  userSubscription:{}
           * }] | []}
           */
          function (response) {
            var tagsList = [];

            if (!response) return resolve(tagsList);

            Utils.removeLastItemIfHasNoAttribute(response, 'userSubscription');

            response.forEach(function (tag) {
              tagsList.push({
                id: Utils.getLastUrlComponent(tag.userSubscription.href),
                href: tag.userSubscription.href,
                name: tag.name.replace(/\s\s+/g, ' '),
                photo: Utils.getUserImgUrl(tag)
              });
            });

            resolve(tagsList)
          }, function (error) {
            console.error("findFriendsByUserSubscriptionIdTagv167", error);
            reject(error)
          });
      })
    }

    function editTextfromUserBiography(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/changeUserBio/invoke', objectId,
        {
          post: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    function addDevice(objectId) {

      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/addUserDevice/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      );
    }

    /**
     * @param userId {number|string}
     */
    function getDevices(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/collections/userDevices',
        {objectId: userId},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json"}
          }
        }).get();
    }

    function deleteDevice() {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserDeviceRepository/actions/deleteUserDevice/invoke', {},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        });
    }

    function getPushNotificationsConfig(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/findConfigureUserNotificationByUserSubscription/invoke',
        objectId,
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json"}
          }
        });
    }

    function updatePushNotificationConfig(objectId) {

      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.ConfigureUserNotification/:objectId/actions/updateSendNotification/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json'}
          }
        }
      );
    }

    function findNewUsers(itemId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findNewUsers/invoke',
        itemId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        }
      );
    }

    function findFeatured(itemId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findFeatured/invoke',
        itemId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        }
      );
    }

    function findLatestItemBelongingToAUserSubscription(itemId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findLatestItemBelongingToAUserSubscription/invoke',
        itemId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        }
      );
    }

    function findLatestItemThumbBelongingToAUserSubscription(itemId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findLatestItemThumbBelongingToAUserSubscription/invoke',
        itemId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        }
      );
    }

    function findLatestItemThumbBelongingToAUserSubscriptionByType(itemId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findLatestItemThumbBelongingToAUserSubscriptionByType/invoke',
        itemId,
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        }
      );
    }

    /**
     * @param data{{userId:number, friendId:number}}
     * @return {*}
     */
    function findFriendInstanceId(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:itemId/actions/findFriendsByUserSubscriptionIdAndFriendId/invoke',
        {itemId: data.userId},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json"}
          }
        }
      ).get({
        "x-isis-querystring":
          {
            friendId:
              {
                value:
                  {href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.friendId}
              }
          }
      }).$promise;
    }

    function getFriend(itemId) {
      return $resource(ApiEndPoint.url + "restful/objects/simple.Friend/:itemId", itemId,
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
          }
        });
    }

    function favorite(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Friend/:objectId/actions/favorite/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json'}
          }
        }
      );
    }

    function email(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.User/:objectId/actions/ChangeEmail/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json'}
          }
        }
      );
    }

    function name(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.User/:objectId/actions/ChangeName/invoke', objectId,
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json'}
          }
        }
      );
    }

    function sendNewPasswordEmail() {
      return $resource(ApiEndPoint.url + 'restful/services/UserRepository/actions/sendNewPasswordEmail/invoke', {}, {
        post: {
          method: 'POST',
          headers: {
            'Accept': 'application/json;profile=urn:org.apache.isis/v1'
          }
        }
      });
    }

    function sendEmailToSupportLogin() {
      return $resource(ApiEndPoint.url + 'restful/services/UserRepository/actions/sendEmailToSupportLogin/invoke', {}, {
        post: {
          method: 'POST',
          headers: {
            'Accept': 'application/json;profile=urn:org.apache.isis/v1'
          }
        }
      });
    }

    function validateUserEmail() {
      return $resource(ApiEndPoint.url + 'restful/services/UserRepository/actions/findUserByEmail/invoke', {}, {
        get: {
          method: 'GET',
          isArray: true,
          headers: {
            'Accept': 'application/json;profile=urn:org.apache.isis/v1'
          }
        }
      });
    }

    function deleteUserComplete(objectId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/deleteSubscription/invoke', objectId,
        {
          post: {
            method: 'PUT',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      );
    }

    /**
     * @param data {{userInstanceId:number|string, start:number, count:number}}
     * @return {*}
     */
    function findUsersRandomWS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUsersRandom/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {
          userSubscription: {
            value: {
              href: ApiEndPoint.url + 'restful/objects/simple.UserSubscription/' + data.userInstanceId
            }
          },
          withStart: {value: data.start},
          withCount: {value: data.count}
        }
      });
    }

    return {
      get_USER_ID: get_USER_ID,
      get_USER_INSTANCE_HREF: get_USER_INSTANCE_HREF,
      get_USER_USERNAME: get_USER_USERNAME,
      get_USER_NAME: get_USER_NAME,
      get_USER_BIO: get_USER_BIO,
      get_USER_PHOTO: get_USER_PHOTO,
      get_USER_EMAIL: get_USER_EMAIL,
      get_USER_ROLE_ID: get_USER_ROLE_ID,
      get_USER_PERMISSIONS: get_USER_PERMISSIONS,
      set_USER_PERMISSIONS: set_USER_PERMISSIONS,
      USER_IS_SUPERADMIN: USER_IS_SUPERADMIN,
      USER_IS_ADVERTISER: USER_IS_ADVERTISER,
      get_USER_PREFERENCES: get_USER_PREFERENCES,
      set_USER_PREFERENCES: set_USER_PREFERENCES,
      getUserSubscriptionByinstanceId: getUserSubscriptionByinstanceId,
      getFollowingIsActive: getFollowingIsActive,
      findUserSubscriptionByUserName: findUserSubscriptionByUserName,
      findFriendUserSubscriptionsByUserName: findFriendUserSubscriptionsByUserName,
      findFriendUserSubscriptionsByUserNamev157: findFriendUserSubscriptionsByUserNamev157,
      findSuggestedFriends: findSuggestedFriends,
      addFriends: addFriends,
      followersByUserId: followersByUserId,
      findFriendsByUserSubscriptionId: findFriendsByUserSubscriptionId,
      changePrivateAccount: changePrivateAccount,
      blockToUser: blockToUser,
      unblockUser: unblockUser,
      findBlockUserById: findBlockUserById,
      updatePassword: updatePassword,
      sendEmail: sendEmail,
      findUserByUserName: findUserByUserName,
      sendNewPassword: sendNewPassword,
      updateNotificationStatus: updateNotificationStatus,
      findUserSubscriptionById: findUserSubscriptionById,
      findUserSubscriptionv157: findUserSubscriptionv157,
      sendSupportEmail: sendSupportEmail,
      getsupportType: getsupportType,
      cancelUserSubscription: cancelUserSubscription,
      changeProfilePicture: changeProfilePicture,
      sendReaction: sendReaction,
      acceptFriend: acceptFriend,
      validateUserName: validateUserName,
      countPendingNotifications: countPendingNotifications,
      countPendingFollowersNotifications: countPendingFollowersNotifications,
      findAllUserNotificationsByUserSubscription: findAllUserNotificationsByUserSubscription,
      findAllUserNotificationsByUserSubscriptionNotifications: findAllUserNotificationsByUserSubscriptionNotifications,
      findAllUserNotificationsByUserSubscriptionFollow: findAllUserNotificationsByUserSubscriptionFollow,
      countSequencesToAUser: countSequencesToAUser,
      countFollowersToAUser: countFollowersToAUser,
      countFollowingToAUser: countFollowingToAUser,
      findUserProfilePictureLargeById: findUserProfilePictureLargeById,
      findFriendsByUserSubscriptionIdTag: findFriendsByUserSubscriptionIdTag,
      findFriendsByUserSubscriptionIdTagv167: findFriendsByUserSubscriptionIdTagv167,
      findFriendsByUserSubscriptionIdTagv157: findFriendsByUserSubscriptionIdTagv157,
      searchUsersByPartialNameOrIncludingSpaces: searchUsersByPartialNameOrIncludingSpaces,
      editTextfromUserBiography: editTextfromUserBiography,
      addDevice: addDevice,
      getDevices: getDevices,
      deleteDevice: deleteDevice,
      getPushNotificationsConfig: getPushNotificationsConfig,
      updatePushNotificationConfig: updatePushNotificationConfig,
      findNewUsers: findNewUsers,
      findFeatured: findFeatured,
      findLatestItemBelongingToAUserSubscription: findLatestItemBelongingToAUserSubscription,
      findLatestItemThumbBelongingToAUserSubscription: findLatestItemThumbBelongingToAUserSubscription,
      findLatestItemThumbBelongingToAUserSubscriptionByType: findLatestItemThumbBelongingToAUserSubscriptionByType,
      findFriendInstanceId: findFriendInstanceId,
      getFriend: getFriend,
      favorite: favorite,
      email: email,
      name: name,
      sendNewPasswordEmail: sendNewPasswordEmail,
      sendEmailToSupportLogin: sendEmailToSupportLogin,
      validateUserEmail: validateUserEmail,
      deleteUserComplete: deleteUserComplete,
      findUsersRandomWS: findUsersRandomWS
    };

  }
  ])


  //Servicio para realizar Sign up via Facebook
  .factory('SignUpService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      addUserSignUp: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/UserRepository/actions/addUserSignUp/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
            }
          });
      }
    };
  }])


  //Servicios para realizar Sign in via Facebook
  .factory('SignInService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      findByWebUserId: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/WebUserRepository/actions/findByWebUserId/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;suppress=true'}
            }
          });
      }
    };
  }])

  //Servicio para agregar suscripcion
  .factory('AddSubscriptionService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      addSubscription: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/addSubscription/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
            }
          });
      }
    };
  }])

  //Servicio para agregar sign up sin facebook
  .factory('AddUserService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      addUser: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/UserRepository/actions/addUser/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
            }
          }
        );
      },
      newUser: {}
    };
  }])
  //servicio para cambiar profile picture
  .factory('changeProfilePictureService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      changeProfPict: function (userSubscriptionInstanceId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/' + userSubscriptionInstanceId.userSubscriptionId + '/actions/changeProfilePictures/invoke', userSubscriptionInstanceId.userSubscriptionId,
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        );
      },
      changeProfPictv181: function (userSubscriptionInstanceId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.UserSubscription/' + userSubscriptionInstanceId.userSubscriptionId + '/actions/changeProfilePicturesv181/invoke', userSubscriptionInstanceId.userSubscriptionId,
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        );
      }
    };
  }])

  //servicio para buscar id subscription por webuserid
  .factory('FindUserSubscriptionbyWebUser', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      findUserSubscription: function () {
        return $resource(
          ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/findUserSubscriptionsByWebUser/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;suppress=true'}
            }
          });
      }
    };
  }])

  .factory('UserServiceFb', function () {
    var setUser = function (user_data) {
      window.localStorage.starter_facebook_user = JSON.stringify(user_data);
    };

    var getUser = function () {
      return JSON.parse(window.localStorage.starter_facebook_user || '{}');
    };

    return {
      getUser: getUser,
      setUser: setUser
    };
  })

  .factory('ionicService', ['$resource', 'ApiEndPoint', function ($resource, ApiEndPoint) {
    return {
      sendPushNotification: function () {
        return $resource(
          ApiEndPoint.ionic + '/notifications', {},
          {
            post: {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3YjE0MTY1Yi1jMWY2LTRhMTgtYWJkNi0yNmNhNDU0ZDQ0MDMifQ.gbaK9NiP2ycCrsC4Hl3zbTS4G7CnpMEI7_OqjZUWl2I"
              }
            }
          });
      }
    };
  }])


  .factory('reDirectService', function ($state) {

    function reDirectProfile(userSubscriptionInstanceId) {
      if (userSubscriptionInstanceId == window.localStorage.getItem("userSubscriptionInstanceId")) {
        $state.go('menu.myProfile', {}, {reload: true});
      }
      else {
        $state.go('friendProfile', {"instanceId": userSubscriptionInstanceId}, {reload: true});
      }
    }

    return {
      reDirectProfile: reDirectProfile
    };
  })
