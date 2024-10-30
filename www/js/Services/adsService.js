"use strict";
appServices
  .factory('adsService', ['$resource', 'ApiEndPoint', 'SequenceService', 'cqnzService', 'SequenceFactory', 'permissionValidationService', 'Utils',
    function ($resource, ApiEndPoint, SequenceService, cqnzService, SequenceFactory, permissionValidationService, Utils) {
      var customColors = [
        '#000',
        '#fff',
        '#9E9E9E',
        '#607D8B',
        '#795548',
        '#FF9800',
        '#FFEB3B',
        '#4CAF50',
        '#03A9F4',
        '#3F51B5',
        '#9C27B0',
        '#F44336'
      ];

      function getWeekdaysLocalized() {
        return [
          Utils.translate("UPLOAD.DATETIME_PICKER.SUNDAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.MONDAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.TUESDAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.WEDNESDAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.THURSDAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.FRIDAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.SATURDAY")
        ]
      }

      function getMonthsLocalized() {
        return [
          Utils.translate("UPLOAD.DATETIME_PICKER.JANUARY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.FEBRUARY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.MARCH"),
          Utils.translate("UPLOAD.DATETIME_PICKER.APRIL"),
          Utils.translate("UPLOAD.DATETIME_PICKER.MAY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.JUN"),
          Utils.translate("UPLOAD.DATETIME_PICKER.JULY"),
          Utils.translate("UPLOAD.DATETIME_PICKER.AUGUST"),
          Utils.translate("UPLOAD.DATETIME_PICKER.SEPTEMBER"),
          Utils.translate("UPLOAD.DATETIME_PICKER.OCTOBER"),
          Utils.translate("UPLOAD.DATETIME_PICKER.NOVEMBER"),
          Utils.translate("UPLOAD.DATETIME_PICKER.DECEMBER")
        ]
      }

      /**
       * @type {{firstAt: number|null, step: number}}
       */
      var config = {
        firstAt: null,
        step: 10//default value
      };

      /**
       * @param sequenceId
       * @param finalDateTime
       */
      function changeExpirationDate(sequenceId, finalDateTime) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changeAdFinalDate/invoke',
          {objectId: sequenceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save({
          finalDate: {value: finalDateTime}
        })
      }

      /**
       * @param sequenceId
       * @param colorCode
       */
      function changeHeaderBgColor(sequenceId, colorCode) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changeHeaderBgColor/invoke',
          {objectId: sequenceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save({
          headerBgColor: {value: colorCode}
        })
      }

      /**
       * @param sequenceId
       * @param colorCode
       */
      function changeHeaderFontColor(sequenceId, colorCode) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/changeHeaderFontColor/invoke',
          {objectId: sequenceId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save({
          headerFontColor: {value: colorCode}
        })
      }

      /**
       * @param userHref {string}
       * @param {number?} groupId
       * @return {Promise}
       */
      function getAdvertisement(userHref, groupId) {
        var url = "restful/services/";
        var query = {userSubscription: {value: {href: userHref}}};

        if (!groupId)
          url += "PendingLogRepository/actions/getAdvertisement/invoke";
        else {
          url += "SequenceGroupRepository/actions/getAdvertisementGroup/invoke";
          query.groupId = {value: groupId.toString()};
        }

        return Utils.$q(function (resolve, reject) {
          $resource(
            ApiEndPoint.url + url,
            {}, {
              get: {
                method: 'GET',
                isArray: true,
                headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1;suppress=true"}
              }
            }
          ).get({
            "x-isis-querystring": query
          }).$promise.then(function (data) {
            //console.log("getAdvertisement", data);
            if (!data || !data.length) return resolve(null);

            var myUserId = Utils.getLastUrlComponent(userHref);

            data = data[0];

            var comments = SequenceService.findTheCommentsOfASequencev157({
              sequenceId: data.sequenceId,
              start: 0,
              count: 2
            });

            var tagsList = SequenceService.obtainTagwithIdandType({
              sequenceId: data.sequenceId,
              notificationType: 7
            });

            var hashesList = SequenceService.getHashFromSequence(data.sequenceId);

            Utils.$q.all({
              basicData: data,
              comments: comments,
              tagsList: tagsList,
              hashesList: hashesList
            }).then(function (adCqnz) {
              //console.log("adCqnz.basicData",adCqnz.basicData);
              adCqnz.sequenceOwnerId = Utils.getLastUrlComponent(adCqnz.basicData.userSubscriptionId.href);
              adCqnz.sequenceItems = cqnzService.getItemsToSequenceV165WS(adCqnz.basicData.sequenceId);
              adCqnz.likeActive = SequenceService.findSmileysCount({
                sequenceId: Utils.getLastUrlComponent(adCqnz.basicData.sequence.href),
                userId: myUserId
              });
              adCqnz.followEachOther = myUserId == adCqnz.sequenceOwnerId ? {result: {value: true}} : SequenceService.followEachOther({
                userId: myUserId,
                friendId: adCqnz.sequenceOwnerId
              });
              adCqnz.viewsCounter = getViewsCount(adCqnz.basicData.sequenceId);
              adCqnz.clicksCounter = getClicksCount(adCqnz.basicData.sequenceId);

              /*var x = cqnzService.configureSequence(adCqnz);
              console.log(x);
              resolve(x);*/
              //resolve(cqnzService.configureSequence(adCqnz));
              resolve(SequenceFactory.buildSequenceObject(adCqnz));
            }, function (error) {
              reject(error);
            });
          }, function (error) {
            reject(error);
          })
        })
      }

      /**
       * @param adId {number}
       */
      function getViewsCount(adId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/getAdvertisementViews/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          sequenceId: '"' + adId + '"'
        });
      }

      /**
       * @param adId {number|string}
       * @return Promise{{*}}
       */
      function increaseViewsCount(adId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/adTimesShownCount/invoke',
          {objectId: adId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save().$promise
      }

      /**
       * @param adId {number}
       */
      function getClicksCount(adId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/SequenceRepository/actions/getAdvertisementClicks/invoke',
          {},
          {
            get: {
              method: 'GET',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({
          sequenceId: '"' + adId + '"'
        });
      }

      /**
       * @param adId {number}
       * @return Promise{{*}}
       */
      function increaseClicksCount(adId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Sequence/:objectId/actions/adTimesClicksCount/invoke',
          {objectId: adId},
          {
            post: {
              method: 'POST',
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).save().$promise
      }

      /**
       * Gets the settings for knowing when to show an advertisement
       * internally it sets:
       *   config.firstAt: controls where to insert the very first ad
       *   config.step: controls where the subsequent ads will be inserted
       * example: {config.firstAt: 4, config.step: 10}
       *   the ads will be inserted at positions: 4, 14, 24, ... etc
       */
      function configure() {
        $resource(
          ApiEndPoint.url + 'restful/services/GeneralParametersRepository/actions/findAdvertisementConfig/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
            }
          }
        ).get({}).$promise.then(function (data) {
          //console.log("Advertisement configure", data);
          config.firstAt = data[0].stepAt;
          config.step = data[0].step;
        }, function (error) {
          console.error("configure advertisements", error)
        })
      }

      function getFirstAt(count) {
        return config.firstAt || (count - 1 > -1 ? count - 1 : 0)
      }

      function getStep() {
        return config.step
      }

      /**
       * @param timelineLen {number}
       * @param count {number}
       * @return {boolean}
       */
      function canInsertAd(timelineLen, count) {
        var dif = timelineLen - getFirstAt(count);

        return (timelineLen === getFirstAt(count) ||
          (dif >= 0 && (timelineLen - getFirstAt(count) + 1) % 10 === 0)
        )
      }

      return {
        configure: configure,
        getFirstAt: getFirstAt,
        getStep: getStep,
        customColors: customColors,
        getWeekdaysLocalized: getWeekdaysLocalized,
        getMonthsLocalized: getMonthsLocalized,
        changeExpirationDate: changeExpirationDate,
        changeHeaderBgColor: changeHeaderBgColor,
        changeHeaderFontColor: changeHeaderFontColor,
        canInsertAd: canInsertAd,
        getAdvertisement: getAdvertisement,
        getViewsCount: getViewsCount,
        increaseViewsCount: increaseViewsCount,
        getClicksCount: getClicksCount,
        increaseClicksCount: increaseClicksCount
      }
    }]);
