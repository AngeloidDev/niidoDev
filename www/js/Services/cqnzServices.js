"use strict";
appServices
  .factory('cqnzService', ['$rootScope', '$resource', "s3", "ApiEndPoint", 'UserService', 'notificationsService', 'permissionValidationService', 'Utils',
    function ($rootScope, $resource, s3, ApiEndPoint, UserService, notificationsService, permissionValidationService, Utils) {
      var s3Service = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {Bucket: s3.bucket}
      });

      /**
       * @param data {{sequenceId:number, userId:number, comment: string}}
       * @return {Promise}
       */
      function addSequenceCommentv166WS(data) {
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
      }

      /**
       * Gets the pinned sequence for the general Timeline
       * @return Promise
       */
      function getPinnedSequencesWS() {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/findSequencePinned/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get().$promise;
      }

      /**
       * Gets the pinned sequence of a group
       * @param groupHrefId {number}
       * @return Promise
       */
      function getGroupPinnedSequencesWS(groupHrefId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceGroupRepository/actions/findSequencePinnedByGroupId/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          "x-isis-querystring": {groupId: {value: groupHrefId}}
        }).$promise;
      }

      function getItemsToSequenceV165WS(sequenceId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceItemRepository/actions/findItemsBelongingToASequencev165/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          sequenceId: '"' + sequenceId + '"'
        });
      }

      /**
       * @param cqnzId {number| string}
       * @param enable {boolean}
       * @returns {Promise}
       */
      function toggleEnableSequenceCommentsWS(cqnzId, enable) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changeCommentEnable/invoke',
          {objectId: cqnzId},
          {
            post: {
              method: 'POST',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;"}
            }
          }
        ).save({
          commentEnable: {
            value: enable
          }
        }).$promise;
      }

      /**
       * @param data {{instanceId:number|string, userHref:string}}
       * @return Promise
       */
      function setLikeToSequenceWS(data) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/like/invoke',
          {objectId: data.instanceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save({
          userSubscription: {value: {href: data.userHref}}
        }).$promise
      }

      /**
       * @param data {{sequenceId:number, userHref:string}}
       * @return Promise
       */
      function setSequenceAsInapropiateWS(data) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/inapropriate/invoke',
          {objectId: data.sequenceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save({
          userSubscription: {
            value: {href: data.userHref}
          }
        }).$promise;
      }

      /**
       * @param data {{commentId:number, userId:number}}
       * @return {Promise}
       */
      function setLikeToCommentWS(data) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.SequenceComments/:objectId/actions/like/invoke',
          {objectId: data.commentId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save(
          {
            userSubscription: {
              value:
                {href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.userId}
            }
          }).$promise;
      }

      /**
       * @param data {{sequenceId:number|string, description:string}}
       * @return {*}
       */
      function updateSequenceTitle(data) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changeDescription/invoke',
          {objectId: data.sequenceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save({
          description: {value: data.description}
        });
      }

      function deleteCommentWS(instanceId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.SequenceComments/:objectId/actions/delete/invoke',
          {objectId: instanceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        );
      }

      /**
       * @param data {{userId: number, commentId: number}}
       * @return {Promise}
       */
      function getSmileysCountCommentsWS(data) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceCommentsRepository/actions/findSmileysCountComments/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Content-Type": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          "x-isis-querystring": {
            sequenceComment: {
              value: {
                href: ApiEndPoint.url + "restful/objects/simple.SequenceComments/" + data.commentId
              }
            },
            userSubs: {
              value: {
                href: ApiEndPoint.url + "restful/objects/simple.UserSubscription/" + data.userId
              }
            }
          }
        }).$promise;
      }

      /**
       * @param config {{id:number, type:number, objects: Object[]}}
       * @return Promise
       */
      function deleteSequenceAndS3Objects(config) {
        return Utils.$q(function (resolve, reject) {
          try {
            //console.log(config);
            var
              sequenceId = config.id,
              type = config.type,
              objects = config.objects;

            var userSubscriptionInstanceId = Utils.md5.createHash(UserService.get_USER_ID());
            var sequenceInstanceId = Utils.md5.createHash(sequenceId.toString());

            switch (type) {
              case 1: //sequence with photos
                deleteSequenceDBRecord(sequenceId).then(function (data) {
                  //console.log("sequence with photos deleteSequenceDBRecord", data);
                  var s3Promises = [];
                  objects.forEach(function (resource, idx) {
                    var keyDeleteImage = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/image/' + (idx + 1) + '.jpg';
                    var keyDeleteThumb = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/thumb/' + (idx + 1) + '.jpg';
                    s3Promises.push(
                      deleteS3Objects([{Key: keyDeleteImage}, {Key: keyDeleteThumb}])
                    );
                  });

                  Utils.$q.all(s3Promises).then(function (responses) {
                    resolve(responses);
                    $rootScope.$broadcast("sequence.deleted", {sequenceId: sequenceId});
                  }, function (errors) {
                    reject(errors);
                  });
                }, function (error) {
                  reject(error);
                });
                break;
              case 2: //statement
                deleteSequenceDBRecord(sequenceId).then(function (data) {
                  //console.log("statement deleteSequenceDBRecord", data);
                  resolve(data);
                  $rootScope.$broadcast("sequence.deleted", {sequenceId: sequenceId});
                }, function (error) {
                  reject(error);
                });
                break;
              case 3: //sequence with videos
                deleteSequenceDBRecord(sequenceId).then(function (data) {
                    //console.log("sequence with videos deleteSequenceDBRecord", data);
                    var keyDeleteVideo = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/video/001.mp4';
                    var keyDeleteThumb = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceInstanceId + '/video/Thumb001.png';

                    deleteS3Objects(
                      [{Key: keyDeleteVideo}, {Key: keyDeleteThumb}]
                    ).then(function (resp) {
                      resolve(resp);
                      $rootScope.$broadcast("sequence.deleted", {sequenceId: sequenceId});
                    }, function (error) {
                      console.error("deleteS3Objects", error);
                      reject(error)
                    })
                  }, function (error) {
                    console.error("deleteSequenceDBRecord", error);
                    reject(error)
                  }
                );
                break;
              default:
                var msg = "deleteSequence error: cqnz type '" + type + "' is not known";
                console.error(msg);
                reject(msg);
                break;
            }
          } catch (e) {
            reject(e);
          }
        })
      }


      /**
       * Deletes only the DB record
       * @param objectId {number}
       * @returns {Promise}
       */
      function deleteSequenceDBRecord(objectId) {
        return $resource(
          ApiEndPoint.url + '/restful/objects/simple.Sequence/:objectId/actions/delete/invoke',
          {objectId: objectId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }).save().$promise;
      }

      /**
       * @param objects {Object[]}
       * @returns {Promise}
       */
      function deleteS3Objects(objects) {
        return Utils.$q(function (resolve, reject) {
          s3Service.deleteObjects({
            Bucket: s3.bucket,
            Delete: {Objects: objects}
          }, function (err, data) {
            if (err) {
              console.error('deleteS3Objects', err);
              return reject(err);
            }

            resolve(data);
          });
        });
      }

      /**
       * @param data {{commentId:number|string, comment:string}}
       * @return {Promise}
       */
      function updateCommentWS(data) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.SequenceComments/:objectId/actions/changeComment/invoke',
          {objectId: data.commentId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save({
          comment: {value: data.comment}
        }).$promise;
      }

      /**
       * Pins/unpins a sequence in a group or default timeline
       * @param seqInstanceId {string|number}
       * @param pinned {boolean}
       * @param groupHrefId? {string|number} - if exists then is a group sequence
       * @returns {Promise}
       */
      function togglePinDefaultOrGroupSequenceWS(pinned, seqInstanceId, groupHrefId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changePinned/invoke',
          {objectId: seqInstanceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).post({
          pinned: {value: pinned},
          groupId: {value: groupHrefId.toString()}
        }).$promise;
      }

      /**
       * @param data {{
       *   sequenceInstanceId:number|string,
       *   senderInstanceId:number|string,
       *   bucketURL: string
       * }}
       * @return {*}
       */
      function reactToSequenceV181WS(data) {
        return $resource(ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/sendReactionv181/invoke',
          {objectId: data.sequenceInstanceId},
          {
            post:
              {
                method: 'POST',
                headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
              }
          }).save({
          userSubscription: {
            value: {
              href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.senderInstanceId
            }
          },
          string: {
            value: data.bucketURL
          }
        });
      }

      function sendCommentUserNotificationWS(objectId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/sendCommentUserNotification/invoke', objectId,
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          })
      }

      /**
       * @param templateName {string}
       * @return {number}
       */
      function getCqnzType(templateName) {
        switch (templateName) {
          case 'StatementTemplate':
            return 2;
          case 'templateVideo':
            return 3;
          default:
            return 1;
        }
      }

      /**
       * Detects whether the link starts from www, http, https, ftp, file and if so
       * then converts the text to Clickable HTML link (<a href="{text}">{text}</a>)
       * @param text {string}
       * @returns {string}
       */
      function getTextWithAnchors(text) {
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        var text1 = text.replace(exp, '<a onclick="angular.element(this).scope().openInappBrowser(\'$1\')">$1</a>');
        var exp2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        return text1.replace(exp2, '$1<a onclick="angular.element(this).scope().openInappBrowser(\'http://$2\')">$2</a>');
      }

      return {
        addSequenceCommentv166WS: addSequenceCommentv166WS,
        getPinnedSequencesWS: getPinnedSequencesWS,
        getGroupPinnedSequencesWS: getGroupPinnedSequencesWS,
        getItemsToSequenceV165WS: getItemsToSequenceV165WS,
        toggleEnableSequenceCommentsWS: toggleEnableSequenceCommentsWS,
        setLikeToSequenceWS: setLikeToSequenceWS,
        setSequenceAsInapropiateWS: setSequenceAsInapropiateWS,
        setLikeToCommentWS: setLikeToCommentWS,
        updateSequenceTitle: updateSequenceTitle,
        deleteCommentWS: deleteCommentWS,
        updateCommentWS: updateCommentWS,
        getSmileysCountCommentsWS: getSmileysCountCommentsWS,
        togglePinDefaultOrGroupSequenceWS: togglePinDefaultOrGroupSequenceWS,
        reactToSequenceV181WS: reactToSequenceV181WS,
        sendCommentUserNotificationWS:sendCommentUserNotificationWS,

        deleteSequenceAndS3Objects: deleteSequenceAndS3Objects,
        deleteSequenceDBRecord: deleteSequenceDBRecord,

        getCqnzType: getCqnzType,
        getTextWithAnchors: getTextWithAnchors
      }
    }
  ])
;


