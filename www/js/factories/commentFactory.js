"use strict";
appServices
  .factory('CommentFactory', ['$rootScope', 'UserService', 'cqnzService', 'TagsService', 'permissionValidationService', 'notificationsService', 'Utils',
    function ($rootScope, UserService, cqnzService, TagsService, permissionValidationService, notificationsService, Utils) {

      /**
       * @param data {{
       *   comment:*,
       *   sequenceMetadata: SequenceMetadataType,
       *   sequenceOwnerMetadata: SequenceOwnerMetadataType
       * }}
       * @return {CommentStructureType}
       */
      function getCommentBasicStructure(data) {
        /**@type {CommentStructureType}*/
        var commentBasicStructure = {
          //Metadata de la secuencia a la que este comentario pertenece
          sequenceMetadata: data.sequenceMetadata,

          //Metadata del dueño de la secuencia
          sequenceOwnerMetadata: data.sequenceOwnerMetadata,


          belongsMe: UserService.get_USER_ID() == Utils.getLastUrlComponent(data.comment.sequenceComments.href),
          canModify: !!(data.comment.canModify || false),
          canEdit: !!(data.comment.canEdit || false),
          canDelete: !!(data.comment.canDelete || false),
          isUpdating: data.comment.isUpdating || false,

          /*todo: replacement for future releases
          description:{
            formated:"",
            editable:"",
            backup:""
          }*/
          description: (data.comment.comment || data.comment.editableDescription) + "",
          editableDescription: (data.comment.comment || data.comment.editableDescription) + "",
          backupDescription: (data.comment.comment || data.comment.backupDescription) + "",

          /*todo: replacement for future releases
          like:{
            isActive:null,
            counter:null
          }*/
          likeActive: !!(data.comment.likeActive || false),
          likeCounter: +(data.comment.likeCounter || data.comment.likeCount),

          tagsList: null,//need to be set by the invoker

          //Methods
          /**
           * @param newTagList {Array}
           * @return {Promise}
           */
          updateMe: function (newTagList) {
            return updateComment(this, newTagList);
          },
          /**
           * @return {Promise}
           */
          deleteMe: function () {
            return deleteComment(this);
          },//fixme: define function
          /**
           * @return {Promise}
           */
          likeMe: function () {
            return likeToComment(this)
          }
        };

        //Metadata del comentario
        if (data.comment.metadata)
          commentBasicStructure.metadata = data.comment.metadata;
        else
          commentBasicStructure.metadata = {
            id: +data.comment.commentId,
            instanceId: +Utils.getLastUrlComponent(data.comment.sequenceComments.href),
            href: data.comment.sequenceComments.href
          };

        //metadata del dueño del comentario
        if (data.comment.ownerMetadata)
          commentBasicStructure.ownerMetadata = data.comment.ownerMetadata;
        else
          commentBasicStructure.ownerMetadata = {
            id: +Utils.getLastUrlComponent(data.comment.userSubscription.href),
            name: data.comment.name,
            avatar: Utils.getUserImgUrl(data.comment)
          };

        return commentBasicStructure;
      }

      /**
       * @param data  {{
     *   comment:*,
     *   sequenceMetadata: SequenceMetadataType,
     *   sequenceOwnerMetadata: SequenceOwnerMetadataType
     * }}
       * @return {CommentStructureType}
       */
      function buildCommentObject(data) {
        //console.log("createCommentObject data",data);

        /**@type {CommentStructureType}*/
        var commentStruct = getCommentBasicStructure({
          comment: data.comment,
          sequenceMetadata: data.sequenceMetadata,
          sequenceOwnerMetadata: data.sequenceOwnerMetadata
        });

        var canDelete = false;
        if (commentStruct.sequenceMetadata.belongsMe)//is my sequence??
          canDelete = permissionValidationService.canDeleteComment();
        else
          canDelete = commentStruct.belongsMe && permissionValidationService.canDeleteComment();

        var canEdit = commentStruct.belongsMe && permissionValidationService.canUpdateComment();

        if (permissionValidationService.amISuperAdmin())
          canDelete = canEdit = true;


        commentStruct.canModify = canEdit || canDelete;
        commentStruct.canEdit = canEdit;
        commentStruct.canDelete = canDelete;

        cqnzService.getSmileysCountCommentsWS({
          userId: UserService.get_USER_ID(),
          commentId: commentStruct.metadata.instanceId
        }).then(function (chkLikeActive) {
          commentStruct.likeActive = chkLikeActive.result.value;
        }, function (error) {
          console.error("findSmileysCountCommentsWS", error);
        });

        //console.log("commentStruct",commentStruct)
        TagsService.getTagFromComments167WS({
          sequenceId: commentStruct.sequenceMetadata.id,
          commentId: commentStruct.metadata.id,
          notificationType: 8
        }).then(function (commentTagsList) {
          commentStruct.description = TagsService.getTextWithFormatedTags(
            commentStruct.description,
            commentTagsList
          );

          commentStruct.tagsList = [];
          commentTagsList.forEach(function (tag) {
            commentStruct.tagsList.push(tag)
          });
        }, function (error) {
          console.error("getTagFromComments167WS", error);
        });

        return commentStruct;
      }

      /**
       * @param params {{
       *   sequenceMetadata:SequenceMetadataType,
       *   sequenceOwnerMetadata:SequenceOwnerMetadataType,
       *   description:string,
       *   tagsList:Array
       * }}
       * @return Promise {CommentStructureType|*}
       */
      function createComment(params) {
        var deferred = Utils.$q.defer();

        cqnzService.addSequenceCommentv166WS({
          sequenceId: params.sequenceMetadata.instanceId,
          userId: UserService.get_USER_ID(),
          comment: params.description
        }).then(function (comment) {
          //console.log("new comment comment", comment);

          //this is not necesary anymore because they are removed in the composer screen
          //params.tagsList = TagsService.removeTagsNotFoundInText(params.description, params.tagsList);

          comment.userSubscription = comment.userId;
          comment.name = UserService.get_USER_NAME();

          /**
           * @type {CommentStructureType}
           */
          var commentStruct = getCommentBasicStructure({
            comment: comment,
            sequenceMetadata: params.sequenceMetadata,
            sequenceOwnerMetadata: params.sequenceOwnerMetadata
          });

          commentStruct.ownerMetadata.avatar = UserService.get_USER_PHOTO();

          var canDelete = permissionValidationService.canDeleteComment();

          var canEdit = permissionValidationService.canUpdateComment();

          if (permissionValidationService.amISuperAdmin()) {
            canDelete = canEdit = true;
          }

          commentStruct.canModify = canEdit || canDelete;
          commentStruct.canEdit = canEdit;
          commentStruct.canDelete = canDelete;

          commentStruct.tagsList = params.tagsList;


          var saveTagsPromises = {};
          params.tagsList.forEach(function (tag) {
            var userId = tag.id || Utils.getLastUrlComponent(tag.userSubscription.href);
            //console.log("saving user tagged: ", tag);
            saveTagsPromises[userId] = TagsService.saveTagForCommentV157WS({
              objectId: commentStruct.metadata.instanceId,
              userId: userId
            });
          });

          //After add tags to the sequence and make notification in App
          Utils.$q.all(saveTagsPromises).then(function (promiseTagData) {
            //console.log("saveTagsPromises", promiseTagData);
            //console.log("commentStruct.tagsList", commentStruct.tagsList);

            //maybe we need the saved id to delete the tag
            //(if user wants to update the comment right before reloading)
            Object.keys(promiseTagData).forEach(function (userId) {
              commentStruct.tagsList.some(function (tag) {
                if (tag.id == userId) {
                  tag.sequenceTag = promiseTagData[userId].result.members.sequenceTag.value;
                  return true;
                }
              })
            });

            commentStruct.description = TagsService.getTextWithFormatedTags(
              commentStruct.editableDescription,
              commentStruct.tagsList
            );

            //Send comment to timeline
            $rootScope.$broadcast('sequence.comment.created', {comment: commentStruct});

            var saveTagsCommentNotifsPromises = {};
            Object.keys(promiseTagData).forEach(function (userId) {
              saveTagsCommentNotifsPromises[userId] = TagsService.saveTagCommentNotificationWS({
                objectId: commentStruct.metadata.instanceId,
                userId: userId
              })
            });

            //notify to the tagged users in comment
            Utils.$q.all(saveTagsCommentNotifsPromises).then(function (promiseTagCommentNotifData) {
              //console.log("promiseTagCommentNotifData", promiseTagCommentNotifData);
              notificationsService.notifyTaggedUsersInComment(promiseTagCommentNotifData).then(function (totalUsers) {
                if (totalUsers) console.log("Notification was sent to " + totalUsers + " new tagged user");
              }, function (error) {
                console.error("Couldn't sent notification(s) to new tagged user", error);
              });
            }, function (error) {
              console.error("all: saveTagCommentNotificationWS", error)
            });

            deferred.resolve(commentStruct);
          }, function (error) {
            console.error('saveTagsPromises', error);
            deferred.reject(error)
          });

          //notify to the comment's owner
          cqnzService.sendCommentUserNotificationWS().get({
            objectId: params.sequenceMetadata.instanceId
          }).$promise.then(function (userNotify) {
            //if user wants to be notified...
            if (userNotify.result.value && params.sequenceOwnerMetadata.id != UserService.get_USER_ID()) {
              notificationsService.notifyNewCommentOnSequence(params.sequenceOwnerMetadata.id).then(function () {
                //console.log("Notification of new comment sent")
              }, function (error) {
                console.error("Notification of new comment couldn't be sent", error)
              });
            }
          }, function (error) {
            console.error("sendCommentUserNotificationWS", error);
          });
        }, function (error) {
          console.error("addSequenceComment", error);
          deferred.reject(error)
        });

        return deferred.promise;
      }

      /**
       * @param comment {CommentStructureType}
       * @param newTagsList {Array}
       * @return Promise {CommentStructureType|*}
       */
      function updateComment(comment, newTagsList) {
        var deferred = Utils.$q.defer();

        comment.isUpdating = true;
        cqnzService.updateCommentWS({
          commentId: comment.metadata.instanceId,
          comment: comment.editableDescription
        }).then(function (/*updateResponse*/) {
          comment.backupDescription = comment.editableDescription;

          var allTagsAreNew = !comment.tagsList.length;

          //Remove all the users previously tagged in the text
          var deleteUserTaggedPromises = {};
          comment.tagsList.forEach(function (tag) {
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
            //Remove unused tagged users from description
            comment.tagsList = TagsService.removeTagsNotFoundInText(
              comment.editableDescription,
              comment.tagsList
            );

            //join old tags with the new ones
            newTagsList.push.apply(newTagsList, comment.tagsList);

            //beautify the new text
            comment.description = TagsService.getTextWithFormatedTags(
              comment.editableDescription,
              newTagsList
            );

            //Add tags to the sequence
            var saveTagsPromises = {};
            newTagsList.forEach(function (tag) {
              var userId = tag.id || Utils.getLastUrlComponent(tag.userSubscription.href);
              saveTagsPromises[userId] = TagsService.saveTagForCommentV157WS({
                objectId: comment.metadata.instanceId,
                userId: userId
              });
            });


            Utils.$q.all(saveTagsPromises).then(function (promiseTagData) {
              //maybe we need the saved id for delete the tag (if user wants to update the comment before reloading)
              Object.keys(promiseTagData).forEach(function (userId) {
                newTagsList.some(function (tag) {
                  if ((tag.id || Utils.getLastUrlComponent(tag.userSubscription.href)) == userId) {
                    tag.sequenceTag = promiseTagData[userId].result.members.sequenceTag.value;
                    return true;
                  }
                })
              });

              comment.tagsList = newTagsList;

              comment.isUpdating = false;

              deferred.resolve(comment);

              $rootScope.$broadcast('sequence.comment.edited', {
                comment: comment
              });

              var notificationsSender = allTagsAreNew ?
                notificationsService.notifyTaggedUsersInComment :
                notificationsService.notifyTaggedUsersInUpdatedComment;

              var saveTagsCommentNotifsPromises = {};
              Object.keys(promiseTagData).forEach(function (userId) {
                saveTagsCommentNotifsPromises[userId] = TagsService.saveTagCommentNotificationWS({
                  objectId: comment.metadata.instanceId,
                  userId: userId
                })
              });

              Utils.$q.all(saveTagsCommentNotifsPromises).then(function (promiseTagCommentNotifData) {
                //console.log("promiseTagCommentNotifData", promiseTagCommentNotifData);
                notificationsSender(promiseTagCommentNotifData).then(function (totalUsers) {
                  if (totalUsers)
                    console.log("Notification sent to " + totalUsers + ' ' + (allTagsAreNew ? 'new ' : '') + "tagged user")
                }, function (error) {
                  console.error('notificationsSender', error);
                });
              }, function (error) {
                console.error("saveTagsCommentNotifsPromises", error);
              });
            }, function (error) {
              comment.isUpdating = false;
              console.error('saveTagsPromises', error);
              Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.EDIT_POST_COMMENT_ERROR'));
              deferred.reject(error);
            })
          }, function (error) {
            comment.isUpdating = false;
            console.error('deleteUserTaggedPromises', error);
            Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.EDIT_POST_COMMENT_ERROR'));
            deferred.reject(error);
          });
        }, function (updateError) {
          comment.isUpdating = false;
          console.error("changeCommentWS", updateError);
          Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.EDIT_POST_COMMENT_ERROR'));
          deferred.reject(updateError);
        });

        return deferred.promise;
      }

      /**
       * @param self {*}
       * @return Promise {*}
       */
      function deleteComment(self) {
        return Utils.$q(function (resolve, reject) {
          cqnzService.deleteCommentWS(self.metadata.instanceId).save(function (/*data*/) {
            resolve(true);
            $rootScope.$broadcast('sequence.comment.deleted', {
              comment: self
            });
          }, function (error) {
            console.log("deleteComment error", error);
            reject(error);
          });
        })
      }

      /**
       * @param comment {*}
       * @return Promise {CommentStructureType|*}
       */
      function likeToComment(comment) {
        return Utils.$q(function (resolve, reject) {
          var newActiveLike = !comment.likeActive;
          comment.likeCounter += newActiveLike ? 1 : -1;
          comment.likeActive = newActiveLike;

          cqnzService.setLikeToCommentWS({
            commentId: comment.metadata.instanceId,
            userId: UserService.get_USER_ID()
          }).then(function (/*response*/) {
            resolve(comment);

            //Send push notification
            if (comment.ownerMetadata.id != UserService.get_USER_ID())
              notificationsService.notifyCommentLiked(comment.ownerMetadata.id)
          }, function (error) {
            console.error("setLikeToSequence error:", error);
            //rollback 'like' to the original state...
            comment.likeCounter += newActiveLike ? -1 : 1;
            comment.likeActive = !newActiveLike;
            Utils.toast.warning(Utils.translate('SEQUENCE.DIALOG.LIKE_COMMENT_ERROR'));
            reject(error);
          });
        })
      }

      return {
        getCommentBasicStructure: getCommentBasicStructure,
        buildCommentObject: buildCommentObject,
        createComment: createComment
      }
    }]);

/**
 * @typedef {Object} CommentMetadataType
 * @property {number} id
 * @property {number} instanceId
 * @property {string} href
 */

/**
 * @typedef {Object} CommentOwnerMetadataType
 * @property {number} id
 * @property {string} name
 * @property {string} avatar
 */


/**
 * @typedef {Object} CommentStructureType
 * @property {SequenceMetadataType} sequenceMetadata
 * @property {SequenceOwnerMetadataType} sequenceOwnerMetadata
 * @property {boolean} belongsMe
 * @property {boolean} canModify
 * @property {boolean} canEdit
 * @property {boolean} canDelete
 * @property {boolean} isUpdating
 * @property {string} description
 * @property {string} editableDescription
 * @property {string} backupDescription
 * @property {boolean} likeActive
 * @property {number} likeCounter
 * @property {(null|Array)} tagsList
 * @property {(function(Array): Promise)} updateMe
 * @property {(function(*): Promise)} deleteMe
 * @property {(function(): Promise)} likeMe
 */
