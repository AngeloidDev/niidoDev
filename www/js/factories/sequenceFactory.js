"use strict";
appServices
  .factory('SequenceFactory', ['$rootScope', 'CommentFactory', 'cqnzService', 'UserService', 'permissionValidationService', 'notificationsService', 'TagsService', 's3', 'md5', 'Utils',
    function ($rootScope, CommentFactory, cqnzService, UserService, permissionValidationService, notificationsService, TagsService, s3, md5, Utils) {

      /**
       * @param data
       * @return {SequenceType}
       */
      function buildSequenceObject(data) {
        /**@type {SequenceMetadataType}*/
        var sequenceMetadata = {
          id: +data.basicData.sequenceId,
          instanceId: +Utils.getLastUrlComponent(data.basicData.sequence.href),
          href: data.basicData.sequence.href + "",
          dateTime: data.basicData.creationTime,
          finalDate: data.basicData.finalDate,
          lifetime: data.basicData.lifetime,
          isPinned: data.basicData.pinned,
          isAdvertisement: data.basicData.isAdvertisement,
          mustBeDeleted: !(!data.basicData.mustBeDeleted),
          belongsMe: (+UserService.get_USER_ID()) === (+data.sequenceOwnerId)
        };

        /**@type {SequenceOwnerMetadataType}*/
        var sequenceOwnerMetadata = {
          id: +data.sequenceOwnerId,
          //instanceId:pendiente...
          name: data.basicData.name + "",
          avatar: Utils.getUserImgUrl(data.basicData)
        };

        //console.log("configureSequence",data.comments)
        data.comments = data.comments || [];
        Utils.removeLastItemIfHasNoAttribute(data.comments, 'sequenceComments');

        /**@type {CommentStructureType[]}*/
        var commentsList = [];

        data.comments.forEach(function (comment) {
          commentsList.push(
            CommentFactory.buildCommentObject({
              comment: comment,
              sequenceMetadata: sequenceMetadata,
              sequenceOwnerMetadata: sequenceOwnerMetadata
            })
          )
        });

        var sequenceObj = {
          advertisement: {
            header: {
              color: data.basicData.headerFontColor + "",
              bgColor: data.basicData.headerBgColor + ""
            },
            counters: {
              views: data.viewsCounter,
              clicks: data.clicksCounter
            }
          },
          comments: {
            enabled: !!(data.basicData.commentEnable && permissionValidationService.canCreateComment()),
            counter: +data.basicData.sequenceCommentCount,
            items: commentsList
          },
          content: {
            type: +(data.basicData.sequenceType || cqnzService.getCqnzType(data.basicData.templateId)),
            templateId: data.basicData.templateId + "",
            templateIdBackup: data.basicData.templateId + "",
            items: data.sequenceItems,
            videoPlayedCounter: +data.basicData.playVideoCount
          },
          description: {
            title: cqnzService.getTextWithAnchors(
              TagsService.getTextWithFormatedHashes(
                TagsService.getTextWithFormatedTags(data.basicData.description, data.tagsList || []),
                data.hashesList || []
              )
            ),
            titleEditable: data.basicData.description + "",
            titleBackup: data.basicData.description + "",
            hashesList: data.hashesList || [],
            tagsList: data.tagsList || [],
            isUpdating: false
          },
          metadata: sequenceMetadata,
          ownerMetadata: sequenceOwnerMetadata,
          like: {//likes of the post
            active: data.likeActive,//fixme: change it for isActive
            //enabled: permissionValidationService.canLikeCqnzInGralTimeline() || permissionValidationService.canLikeCqnzInGroupTimeline(),
            counter: +data.basicData.likeCount
          },
          react: {
            counter: +data.basicData.reactCount,
            enabled: data.followEachOther
          },
          share: {
            isSharing: false,
            isShared: !(!data.basicData.isShared),
            enabled: !(!data.basicData.shareable),
            counter: +data.basicData.shareCount
          },

          reportMe: function () {
            setAsInaprropriated(this.metadata.instanceId)
          },

          togglePinMe: function (pin, groupHrefId) {
            return togglePinDefaultOrGroupSequence(this.metadata.instanceId, pin, groupHrefId);
          },

          toggleEnableMyComments: function (enable) {
            return toggleEnableMyComments(this, enable)
          },

          updateMyTitle: function (form) {
            return updateSequenceTitle(this, form)
          },

          //updateMyContent:updateSequenceContent,

          updateMyAdConfig: function () {
            return updateSequenceAdConfig(this);
          },

          deleteMe: function () {
            return deleteSequence(this)
          },

          likeMe: function () {
            return setLikeToSequence(this)
          },

          reactMe: function (reactionImage) {
            return reactToSequence(this, reactionImage);
          },

          shareMe: function (part) {
            return shareScreen(this, part)
          }
        };

        return sequenceObj;
      }

      /**
       * Pins a sequence on top of a Group timeline
       * @param seqInstanceId {number}
       * @param desiredPinState {boolean}
       * @param {number?} groupHrefId
       */
      function togglePinDefaultOrGroupSequence(seqInstanceId, desiredPinState, groupHrefId) {
        return Utils.$q(function (resolve, reject) {
          cqnzService.togglePinDefaultOrGroupSequenceWS(desiredPinState, seqInstanceId, groupHrefId).then(function () {
            if (desiredPinState)
              Utils.toast.success(Utils.translate('SEQUENCE.DIALOG.PIN_CQNZ_OK'));

            resolve(desiredPinState);
          }, function (pinError) {
            console.error("togglePinGroupCqnz", pinError);
            Utils.toast.error(
              Utils.translate('SEQUENCE.DIALOG.' + (desiredPinState ? 'PIN_CQNZ_ERR' : 'UNPIN_CQNZ_ERR'))
            );
            reject(pinError)
          });
        })
      }

      function setAsInaprropriated(sequenceInstanceId) {
        cqnzService.setSequenceAsInapropiateWS({
          sequenceId: sequenceInstanceId,
          userHref: UserService.get_USER_INSTANCE_HREF()
        }).then(function () {
          var text01 = Utils.translate("TIMELINE.SET_INAPPROPRIATE_01");
          var text02 = Utils.translate("TIMELINE.SET_INAPPROPRIATE_02");
          Utils.toast.info(
            text01 + '. ' + text02,
            6000,
            {allowHtml: true}
          );
        }, function (err) {
          Utils.toast.warning(Utils.translate("ERROR.UNKNOWN"));
          console.error("setSequenceasInapropiate error", err);
        });
      }

      /**
       * @param sequence {SequenceType}
       * @param desiredEnableState {boolean}
       * @return Promise {boolean|*}
       */
      function toggleEnableMyComments(sequence, desiredEnableState) {
        return Utils.$q(function (resolve, reject) {
          cqnzService.toggleEnableSequenceCommentsWS(sequence.metadata.instanceId, desiredEnableState).then(function (resp) {
            sequence.comments.enabled = desiredEnableState;
            Utils.toast.success(Utils.translate('UPLOAD.' + (desiredEnableState ? 'ENABLE_COMMENTS_OK' : 'DISABLE_COMMENTS_OK')));
            $rootScope.$broadcast('sequence.comment.enabled.updated', {
              sequenceMetadata: sequence.metadata,
              enabled: desiredEnableState
            });

            resolve(desiredEnableState);
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('UPLOAD.' + (desiredEnableState ? 'ENABLE_COMMENTS_ERROR' : 'DISABLE_COMMENTS_ERROR')))
            reject(error);
          })
        })
      }

      /**
       * the sequence values: like.active.result.value and like.counter need to be set by means of
       * OPTIMISTIC UPDATES (set them as if the query were success) inside the caller function so that the
       * returned/broadcasted values are consistent
       * @param sequence {SequenceType}
       * @return Promise
       */
      function setLikeToSequence(sequence) {
        return Utils.$q(function (resolve, reject) {
          //this is the new state because it was set previously (optimistic updates) on the caller
          var newActiveState = sequence.like.active.result.value;
          var newLikeCouter = sequence.like.counter;

          cqnzService.setLikeToSequenceWS({
            instanceId: sequence.metadata.instanceId,
            userHref: UserService.get_USER_INSTANCE_HREF()
          }).then(function (response) {
            $rootScope.$broadcast('sequence.counters.updated', {
              type: 'sequence.like',
              sequenceMetadata: sequence.metadata,
              //this is the new value because it was set previously (optimistic updates) on the caller
              counter: newLikeCouter,
              active: newActiveState
            });

            //Send push notification Like Timeline
            if (response.result.value && sequence.ownerMetadata.id != UserService.get_USER_ID()) {
              notificationsService.notifySequenceLiked(sequence.ownerMetadata.id)
            }

            resolve({counter: newLikeCouter, active: newActiveState})
          }, function (error) {
            console.error("setLikeToSequence error", error);

            Utils.toast.warning(Utils.translate('SEQUENCE.DIALOG.LIKE_CQNZ_ERROR'));

            //roll back to the original values
            //because they were set previously (optimistic updates) on the caller
            newLikeCouter = sequence.like.counter + (!newActiveState ? 1 : -1);
            reject({counter: newLikeCouter, active: !newActiveState, error: error})
          });
        })
      }

      /**
       * @param sequence {SequenceType}
       * @param reactionImage {*}
       * @return Promise {boolean|*}
       */
      function reactToSequence(sequence, reactionImage) {
        var deferred = Utils.$q.defer();

        //Steps to upload
        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });

        //encrypt subscriptioninstanceID and folder name
        var userSubscriptionInstanceId = md5.createHash(UserService.get_USER_ID().toString());
        var sequenceId = md5.createHash(sequence.metadata.instanceId.toString());
        var userId = md5.createHash(sequence.ownerMetadata.id.toString());

        //create key for each picture
        var photoKey = s3.prefix + '/' + userSubscriptionInstanceId + '/sequence/' + sequenceId + '/react/' + userId + "_" + Math.random() + '.jpg';

        //photo to blob
        var file = Utils.dataURLtoBlob(reactionImage);

        s3Service.upload({
          Key: photoKey,
          Body: file,
          ACL: 'public-read',
          ContentType: file.type
        }, function (err, data) {
          if (err) {
            console.log('There was an error uploading the small jpg:', err);
            Utils.toast.error(Utils.translate('REACTION.DIALOG.REACTION_SENT_ERROR'))
            return deferred.reject(err)
          }

          cqnzService.reactToSequenceV181WS({
            sequenceInstanceId: sequence.metadata.instanceId,
            senderInstanceId: UserService.get_USER_ID(),
            bucketURL: "https://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey
          }).$promise.then(function (response) {

            $rootScope.$broadcast('sequence.counters.updated', {
              type: 'sequence.react',
              sequenceMetadata: sequence.metadata,
              counter: sequence.react.counter + 1
            });

            //Send push notification React
            if (response.result.value && sequence.ownerMetadata.id != UserService.get_USER_ID())
              notificationsService.notifyReactToSequence(sequence.ownerMetadata.id);

            Utils.toast.success(Utils.translate('REACTION.DIALOG.REACTION_SENT_OK'));
            deferred.resolve(true)
          }, function (error) {
            console.log("sendReaction error:", error);
            Utils.toast.error(Utils.translate('REACTION.DIALOG.REACTION_SENT_ERROR'));
            deferred.reject(error)
          });
        });

        return deferred.promise;
      }

      /**
       * @param sequence  {SequenceType}
       * @return Promise {*}
       */
      function deleteSequence(sequence) {
        return Utils.$q(function (resolve, reject) {
          var conf = {
            id: sequence.metadata.instanceId,
            type: sequence.content.type,
            objects: sequence.content.items//the array of images (urls)
          };

          cqnzService.deleteSequenceAndS3Objects(conf).then(function (resp) {
            $rootScope.$broadcast("sequence.deleted", {
              sequenceMetadata: sequence.metadata
            });
            Utils.toast.success(Utils.translate('SEQUENCE.DIALOG.DELETE_CQNZ_OK'));
            resolve(true)
          }, function (error) {
            console.error("deleteSequenceAndS3Objects", error);
            Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.DELETE_CQNZ_ERROR'));
            reject(error)
          });
        })
      }

      /**
       * @param sequence  {SequenceType}
       * @param part {string} - id of content container
       * @return Promise {boolean|*}
       */
      function shareScreen(sequence, part) {
        var deferred = Utils.$q.defer();

        var deeplink = 'http://niido.cloud';

        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });

        sequence.share.isSharing = true;
        if (sequence.content.templateId == "templateVideo") {
          var text = Utils.translate('MENU.SETTINGS.SHARE_VIDEO.MESSAGE');
          window.plugins.socialsharing.share(
            text + '\n',
            null,
            null,
            sequence.content.items[0].url,
            function () {
              sequence.share.isSharing = false;
              Utils.loading.hide();
              deferred.resolve(popover);
            }, function (error) {
              sequence.share.isSharing = false;
              Utils.loading.hide();
              deferred.reject(error)
            }
          );
        }
        else {
          var isIOS = ionic.Platform.isIOS();
          var isAndroid = ionic.Platform.isAndroid();
          var node = document.getElementById(part);
          var nodeX = node.clientWidth;
          var nodeY = node.clientHeight;
          window.nodeY = nodeY;
          //Maximum size imageMaximum size image in IOS
          //https://discussions.apple.com/thread/4975106?tstart=0
          window.scale = isIOS && nodeX > 400 ? 3 : 5;

          var deepProperties = {
            canonicalIdentifier: 'myProfile'
          };
          var branchShareCQNZ = null;
          var analyticsDeepLink = {
            feature: "Share CQNZ",
            campaign: "none"
          };
          var propertiesDeepLink = {
            reDirectSequenceId: sequence.metadata.id,
            reDirectSequenceInstanceId: sequence.metadata.instanceId
          };


          if (!window.Branch) {
            sequence.share.isSharing = false;
            Utils.toast.error(Utils.translate("PLUGINS.BRANCH.PLUGIN_NOT_INSTALLED"));
            deferred.reject()
          }

          window.Branch.createBranchUniversalObject(deepProperties).then(function (res) {
            branchShareCQNZ = res;
            branchShareCQNZ.generateShortUrl(analyticsDeepLink, propertiesDeepLink).then(function (res) {
              deeplink = res.url;

              //for slideShow
              if (part.substr(0, 25) == 'imageBoxtemplateAutomate0') {
                var photoKey = /*s3.prefix*/'Gifs/' + Utils.md5.createHash(UserService.get_USER_ID()) + '/shared/' + Utils.md5.createHash(sequence.metadata.id.toString()) + '.gif';
                s3Service.headObject({Key: photoKey}, function (err, data) {
                  if (!err) {
                    return window.plugins.socialsharing.shareWithOptions({
                      url: "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey
                    }, function () {
                      sequence.share.isSharing = false;
                      deferred.resolve(popover);
                    }, function (error) {
                      sequence.share.isSharing = false;
                      deferred.reject(error)
                    });
                  }

                  if (err.code !== 'NotFound') {
                    sequence.share.isSharing = false;
                    return deferred.reject('There was an error creating the gif: ' + err);
                  }

                  //for slidehow
                  var imageList = [];
                  sequence.content.items.forEach(function (item) {
                    imageList.push(item.url);
                  });

                  gifshot.createGIF({
                    gifWidth: 333,
                    gitHeight: 333,
                    images: imageList,
                    interval: .9,
                    numFrames: 10,
                    frameDuration: 1,
                    sampleInterval: 10,
                    numWorkers: 2
                  }, function (obj) {
                    if (!obj.error) {
                      var image = Utils.dataURLtoBlob(obj.image);
                      //$scope.gifData = obj.image;
                      s3Service.upload({
                        Key: photoKey,
                        Body: image,
                        ACL: 'public-read',
                        ContentType: image.type
                      }, function (err, data) {
                        if (err) {
                          Utils.loading.hide();
                          sequence.share.isSharing = false;
                          return deferred.reject('There was an error uploading the gif: ', err);
                        }
                        //console.log('Successfully uploaded gif');
                        window.plugins.socialsharing.shareWithOptions({
                          //data.Location send a link with amazon's url
                          //url: data.Location
                          url: "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey/*,
                          files: [$scope.gifData]*/
                        }, function () {
                          Utils.loading.hide();
                          sequence.share.isSharing = false;
                          deferred.resolve(true)
                        }, function (error) {
                          Utils.loading.hide();
                          sequence.share.isSharing = false;
                          console.error('There was an unknown error creating the gif', error);
                          deferred.reject(error);
                        });
                      });
                    }
                    else {
                      Utils.loading.hide();
                      sequence.share.isSharing = false;
                      return deferred.reject('There was an unknown error creating the gif');
                    }
                  })
                })
              }
              else {
                html2canvas(node, {
                  taintTest: true,
                  width: nodeX * window.scale,
                  height: nodeY * window.scale,
                  useCORS: true,
                  allowTaint: true
                }).then(function (canvas) {

                  //console.log("canvas",canvas);
                  var context = canvas.getContext("2d");
                  var logo = new Image();
                  logo.src = 'img/LogoShare.png';
                  logo.onload = function () {
                    return Utils.$q(function (resolve) {
                      resolve();
                    });
                  };

                  logo.onload().then(function () {
                    //console.log(logo);
                    var x = canvas.width - 75 * window.scale;
                    var y = canvas.height - 55 * window.scale;
                    context.drawImage(logo, x, y, 70 * window.scale, 70 * window.scale);
                    var imgDataUrl = canvas.toDataURL();

                    var url = isAndroid === true ? deeplink : null;
                    Utils.loading.hide();
                    window.plugins.socialsharing.shareWithOptions({
                      files: [imgDataUrl],
                      url: url
                    }, function () {
                      Utils.loading.hide();
                      sequence.share.isSharing = false;
                      deferred.resolve(true)
                    }, function (error) {
                      sequence.share.isSharing = false;
                      Utils.loading.hide();
                      console.error('There was an error while sharing the sequence', error);
                      deferred.reject(error);
                    });
                  });
                }, function (errorCanvas) {
                  Utils.loading.hide();
                });
              }
            }).catch(function (err) {
              Utils.loading.hide();
              sequence.share.isSharing = false;
              console.error(err);
              console.error("Can't create link to App", err);
            });
          }).catch(function (err) {
            Utils.loading.hide();
            sequence.share.isSharing = false;
            console.error(err);
            console.error("Can't create branch universal object");
          });
        }

        return deferred.promise;
      }

      /**
       * @param sequence {SequenceType}
       * @param form {{description:string, savedTags:Array}}
       * @return Promise {*}
       */
      function updateSequenceTitle(sequence, form) {
        var deferred = Utils.$q.defer();

        //Save new title
        cqnzService.updateSequenceTitle({
          sequenceId: sequence.metadata.instanceId,
          description: form.description || " "
        }).$promise.then(function () {

          var newDescription = {
            title: sequence.description.titleBackup,//<-- New formated title will go here
            titleEditable: form.description,
            titleBackup: form.description,
            isUpdating: false,
            hashesList: sequence.description.hashesList || [],
            tagsList: []//<-- This will be set later on
          };

          //Remove all the users previously tagged in the sequence title
          var deleteUserTaggedPromises = {};
          sequence.description.tagsList.forEach(function (tag) {
            if (tag.sequenceTag) {
              var sequenceTagId = Utils.getLastUrlComponent(tag.sequenceTag.href);
              console.log("Deleting tag", tag);
              deleteUserTaggedPromises[sequenceTagId] = TagsService.deleteTaggedUserWS(sequenceTagId);
            }
            else
              console.log("can't delete tag", tag)
          });

          //after all the olds tags were deleted
          Utils.$q.all(deleteUserTaggedPromises).then(function () {
            //Remove unused previous tagged users from description
            sequence.description.tagsList = TagsService.removeTagsNotFoundInText(
              form.description,
              sequence.description.tagsList
            );

            //join old tags with the new ones
            form.savedTags.push.apply(form.savedTags, sequence.description.tagsList);

            //beautify the new title
            newDescription.title = cqnzService.getTextWithAnchors(
              TagsService.getTextWithFormatedHashes(
                TagsService.getTextWithFormatedTags(form.description, form.savedTags),
                newDescription.hashesList
              )
            );

            //Add tags to the sequence
            var saveTagsPromises = {};
            form.savedTags.forEach(function (tag) {
              var userId = tag.id || Utils.getLastUrlComponent(tag.userSubscription.href);
              console.log("saving user tagged to DB: ", tag);
              //saveTagsPromises[userId] = SequenceService.sendTagNotificationUpload({
              saveTagsPromises[userId] = TagsService.saveTagForDescriptionV157WS({
                sequenceId: sequence.metadata.instanceId,
                userId: userId
              }).$promise;
            });

            //After add tags to the sequence and make notification in App
            Utils.$q.all(saveTagsPromises).then(function (promiseTagData) {
              //maybe we need the saved id for delete the tag (if user wants to update the comment before reloading)
              Object.keys(promiseTagData).forEach(function (userId) {
                form.savedTags.some(function (tag) {
                  if ((tag.id || Utils.getLastUrlComponent(tag.userSubscription.href)) == userId) {
                    tag.sequenceTag = promiseTagData[userId].result.members.sequenceTag.value;
                    return true;
                  }
                })
              });

              //Add new tags to old list
              newDescription.tagsList = form.savedTags;

              $rootScope.$broadcast('sequence.title.edited', {
                sequenceId: sequence.metadata.id,
                description: newDescription
              });

              //finds if the users want to be notified
              var saveTagsCommentNotifsPromises = {};
              Object.keys(promiseTagData).forEach(function (userId) {
                saveTagsCommentNotifsPromises[userId] = TagsService.saveTagDescriptionNotificationWS({
                  sequenceId: sequence.metadata.instanceId,
                  userId: userId
                })
              });

              Utils.$q.all(saveTagsCommentNotifsPromises).then(function (promiseTagCommentNotifData) {
                //console.log("promiseTagCommentNotifData", promiseTagCommentNotifData);
                //notifies the users who want to be notified
                notificationsService.notifyUsersTaggedInSequence(promiseTagCommentNotifData).then(function (totalUsers) {
                  if (totalUsers) console.log("Notification was sent to " + totalUsers + " tagged user");
                }, function () {
                  console.error("Couldn't sent notification(s) to new tagged user", error);
                });
              }, function (error) {
                console.error("saveTagsCommentNotifsPromises", error)
              });

              deferred.resolve(newDescription);
            }, function (promiseAddTagError) {
              console.error("Can't add tags", promiseAddTagError);
              Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.EDIT_POST_TITLE_ERROR'));
              deferred.reject(promiseAddTagError);
            });
          }, function (promiseDeleteError) {
            console.error("Deleting tags", promiseDeleteError);
            Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.EDIT_POST_TITLE_ERROR'));
            deferred.reject(promiseDeleteError);
          });
        }, function (updateError) {
          console.error("changeDescription error", updateError);
          Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.EDIT_POST_TITLE_ERROR'));
          deferred.reject(updateError);
        });

        return deferred.promise;
      }

      /**
       * @param sequence {SequenceType}
       * @return Promise {*|-1}
       */
      function updateSequenceAdConfig(sequence) {
        return Utils.$q(function (resolve) {
          var dialog = Utils.alert.getCtrl();
          dialog.show({
            templateUrl: 'templates/partials/adsChangeSettingsModal.html',
            controller: 'adConfigEditionCtrl',
            fullscreen: true,
            locals: {sequence: sequence, dialog: dialog},
            clickOutsideToClose: false,
            multiple: true
          }).then(function (newSequenceData) {
            resolve(newSequenceData)
          }, function (error) {
            resolve(-1)
          });
        })
      }

      return {
        buildSequenceObject: buildSequenceObject
      }
    }]);

/**
 * @typedef {Object} SequenceMetadataType
 * @property {number} id
 * @property {number} instanceId
 * @property {string} href
 * @property {*} dateTime
 * @property {(string|finalDate|{value}|Date|*)} finalDate
 * @property {(boolean|string)} lifetime
 * @property {(pinned|{value})} isPinned
 * @property {(boolean|isAdvertisement|{value})} isAdvertisement
 * @property {boolean} mustBeDeleted
 * @property {boolean} belongsMe
 */

/**
 * @typedef {Object} SequenceOwnerMetadataType
 * @property {number} id
 * @property {string} name
 * @property {string} avatar
 */

/**
 * @typedef {Object} SequenceType
 * @property {{header: {color: string, bgColor: string}, counters: {views: *, clicks: *}}} advertisement
 * @property {{enabled: boolean, counter: number, items: CommentStructureType[]}} comments,
 * @property {{
 *   type: number,
 *   templateId: string,
 *   templateIdBackup: string,
 *   items: *,
 *   videoPlayedCounter: number
 * }} content
 * @property {{
 *   title: string,
 *   titleEditable: string,
 *   titleBackup: string,
 *   hashesList: Array,
 *   tagsList: Array,
 *   isUpdating: boolean
 * }} description
 * @property {SequenceMetadataType} metadata
 * @property {{active: *, counter: number}} like
 * @property {{counter: number, enabled: *}} react
 * @property {{isSharing: boolean, isShared: boolean, enabled: boolean, counter: number}} share
 * @property {SequenceOwnerMetadataType} ownerMetadata
 * @property {function(boolean, number?):Promise} togglePinMe
 * @property {function} reportMe
 * @property {function(boolean):Promise} toggleEnableMyComments
 * @property {function():Promise} likeMe
 * @property {(function():Promise)} deleteMe
 * @property {(function(string):Promise)} reactMe
 * @property {function(*=): Promise} shareMe
 * @property {function(*): Promise} updateMyTitle
 * @property {function(): Promise} updateMyAdConfig
 */
