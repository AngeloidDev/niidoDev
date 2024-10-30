"use strict";

appServices
  .service('TagsService', ['ApiEndPoint', '$resource', 'Utils', function (ApiEndPoint, $resource, Utils) {
    /**
     * @param data {{sequenceId:number,commentId:number,notificationType:number}}
     * @return {Promise}
     */
    function getTagFromComments167WS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/services/SequenceTagRepository/actions/findTagSequenceCommentv167/invoke',
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
        notificationType: '"' + data.notificationType + '"',
        commentId: '"' + data.commentId + '"'
      }).$promise;
    }

    /**
     * @param data {{objectId:number|string, userId:number|string}}
     */
    function saveTagForCommentWS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.SequenceComments/:objectId/actions/tagComment/invoke', {objectId: data.objectId},
        {
          post: {
            method: 'POST',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).save({
        "userSubscription": {
          "value": {
            "href": ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.userId
          }
        }
      });
    }

    /**
     * @param data {{objectId:number|string, userId:number|string}}
     * @return Promise
     */
    function saveTagForCommentV157WS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.SequenceComments/:objectId/actions/tagCommentv157/invoke',
        {objectId: data.objectId},
        {
          post: {
            method: 'POST',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).save({
        userSubscription: {
          value: {
            href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.userId
          }
        }
      }).$promise;
    }

    /**
     * @param data {{sequenceId:number|string, userId: number|string}}
     * @return {*}
     */
    function saveTagForDescriptionV157WS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/tagv157/invoke',
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
    }

    /**
     * @param data {{sequenceId:number|string, userId:number|string}}
     * @return Promise {*}
     */
    function saveTagDescriptionNotificationWS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/tagNotification/invoke',
        {objectId: data.sequenceId},
        {
          post: {
            method: 'POST',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).save({
        userSubscription: {
          value: {
            href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.userId
          }
        }
      }).$promise;
    }

    /**
     * @param data {{objectId:number|string, userId:number|string}}
     * @return Promise
     */
    function saveTagCommentNotificationWS(data) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.SequenceComments/:objectId/actions/tagCommentNotification/invoke',
        {objectId: data.objectId},
        {
          post: {
            method: 'POST',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).save({
        userSubscription: {
          value: {
            href: ApiEndPoint.url + "/restful/objects/simple.UserSubscription/" + data.userId
          }
        }
      }).$promise;
    }

    /**
     * @param userId {number|string}
     * @return Promise
     */
    function deleteTaggedUserWS(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.SequenceTag/:objectId/actions/delete/invoke',
        {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).save().$promise;
    }

    /**
     * @param data {{term:string}}
     * @return Promise {Array|*}
     */
    function searchHashtagsWS(data) {
      return Utils.$q(function (resolve, reject) {
        $resource(
          ApiEndPoint.url + 'restful/services/HashTagRepository/actions/findHashTagStart/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
            }
          }
        ).get({hashTag: data.term}).$promise.then(function (response) {
          Utils.removeLastItemIfHasNoAttribute(response, 'hashTag');
          var hashList = [];
          response.forEach(function (hash) {
            hashList.push({
              id: Utils.getLastUrlComponent(hash.hashTagObj.href),
              hash: hash.hashTag
            });
          });

          resolve(hashList);
        }, function (error) {
          console.error("searchHashtagsWS", error);
          reject(error)
        })
      })
    }

    /**
     * @param text {string}
     * @param tagsList {Array}
     * @return {Array}
     */
    function removeTagsNotFoundInText(text, tagsList) {
      var tagsKept = [];

      tagsList = tagsList || [];
      tagsList.forEach(function (tag) {
        var nameToCheck = "@" + tag.name.replace(/\s\s+/g, ' ').replace(/\s+$/g, '');
        if (text.indexOf(nameToCheck) > -1) tagsKept.push(tag);
      });

      return tagsKept;
    }

    function addHashNotFoundInText(text, hashList) {
      /*if(hashList.length>0){
        var parts = text.match(/\#{1}\S+/g);
        for(var i = 0; i < parts.length; i++){
          var hashClean = parts[i].split('#');
          var promiseHash;
          for (var j = 0; j < $scope.data.hashList.length; j++){

          }
        }
      }else{

      }*/

    }

    /**
     * @param text {string}
     * @param taggedUsers {Object[]}
     */
    function getTextWithFormatedTags(text, taggedUsers) {
      taggedUsers = taggedUsers || [];

      var positionTag = 0;
      var taggedUserId = 0;
      var fixedName;

      taggedUsers.forEach(function (tag) {
        /* probar si este codigo es equivalente (si lo es, eliminar el actualmente usado)
        * var fixedHtml = description.replace(/^\[{1}@{1}/g, '<span class="mentionTag">@');
        * fixedHtml = fixedHtml.replace(/(\s{1})\[{1}@{1}/g, ' <span class="mentionTag">@');
        * return fixedHtml.replace(/\]{1}/g, '</span>&nbsp;');
        * */

        fixedName = '@' + tag.name.replace(/\s\s+/g, ' ').replace(/\s+$/g, '');
        if (text.indexOf(fixedName) !== -1) {
          positionTag = text.indexOf(fixedName);
          taggedUserId = tag.id || Utils.getLastUrlComponent(tag.userSubscription.href);
          text = text.substr(0, positionTag) +
            '<span class="mentionTag" id="' + taggedUserId + '">' + fixedName +
            '</span>&nbsp;' + text.substr(positionTag + fixedName.length);
        }
      });

      return text.replace(/(^|\s{1})\[{1}/g, '').replace(/(\s{1})\]{1}/g, '');
    }

    /**
     * @param text {string}
     * @param hashList {Object[]}
     */
    function getTextWithFormatedHashes(text, hashList) {
      //console.log("getTextWithFormatedHashes", text, hashList);
      hashList = hashList || [];

      if (hashList.length && !hashList[hashList.length - 1].hash)
        hashList.splice(hashList.length - 1, 1);

      if (!hashList.length)
        return text;


      var newText = text;

      var pivotInsert = 0;
      var fixHash = "";
      var positionHashTag = 0;
      var calcEnd = 0;
      var fixedHashArray = [];


      for (var a = 0; a < hashList.length; a++) {
        fixedHashArray[a] = '#' + hashList[a].hash;
        //console.log("Hash found: " + fixedHashArray[a])
      }

      fixedHashArray.sort(function (a, b) {
        return b.length - a.length;
      });

      for (var b = 0; b < fixedHashArray.length; b++) {
        fixHash = fixedHashArray[b];
        if (newText.indexOf(fixHash) !== -1) {
          positionHashTag = newText.indexOf(fixHash, pivotInsert);
          if (positionHashTag === 0) {
            newText = newText.substr(0, positionHashTag) + '<span class="mentionTag" name="' + hashList[b].hash + '">' + fixHash + '</span>&nbsp;' + newText.substr(positionHashTag + fixHash.length);
            pivotInsert = pivotInsert + (positionHashTag - pivotInsert) + 31 + hashList[b].hash.length + 2 + fixHash.length + 13;
          }
          else {
            calcEnd = positionHashTag + fixHash.length;
            if (calcEnd === newText.length) {
              newText = newText.substr(0, positionHashTag) + '<span class="mentionTag" name="' + hashList[b].hash + '">' + fixHash + '</span>&nbsp;' + newText.substr(positionHashTag + fixHash.length);
              pivotInsert = 0;
            }
            else {
              positionHashTag = newText.indexOf(" " + fixHash + " ");
              if (positionHashTag === -1) {
                positionHashTag = newText.indexOf(" " + fixHash);
              }
              if (positionHashTag === -1) {
                positionHashTag = newText.indexOf(fixHash + " ");
                positionHashTag = positionHashTag - 1;
              }
              positionHashTag = positionHashTag + 1;
              newText = newText.substr(0, positionHashTag) + '<span class="mentionTag" name="' + hashList[b].hash + '">' + fixHash + '</span>&nbsp;' + newText.substr(positionHashTag + fixHash.length);
            }
          }
        }
      }

      return newText
    }

    return {
      getTagFromComments167WS: getTagFromComments167WS,
      saveTagForCommentWS: saveTagForCommentWS,
      saveTagForCommentV157WS: saveTagForCommentV157WS,
      saveTagForDescriptionV157WS: saveTagForDescriptionV157WS,
      saveTagDescriptionNotificationWS: saveTagDescriptionNotificationWS,
      saveTagCommentNotificationWS: saveTagCommentNotificationWS,
      deleteTaggedUserWS: deleteTaggedUserWS,
      searchHashtagsWS: searchHashtagsWS,
      removeTagsNotFoundInText: removeTagsNotFoundInText,
      getTextWithFormatedTags: getTextWithFormatedTags,
      getTextWithFormatedHashes: getTextWithFormatedHashes
    }
  }]);
