"use strict";
appControllers
  .controller('SequenceCtrl', ['$rootScope', '$scope', '$state', '$ionicActionSheet', 'timelinesService', 'SequenceService', 'UserService', 'GroupsService', 'cqnzData', 'likeUsersData', 'cqnzService', 'TimeLineService', 'permissionValidationService', 's3', 'TagsService', 'adsService', 'notificationsService', 'Utils',
    function ($rootScope, $scope, $state, $ionicActionSheet, timelinesService, SequenceService, UserService, GroupsService, cqnzData, likeUsersData, cqnzService, TimeLineService, permissionValidationService, s3, TagsService, adsService, notificationsService, Utils) {
      //console.log("SequenceCtrl created!!!");
      var mySubscriptionHref = UserService.get_USER_INSTANCE_HREF();
      var myUserId = UserService.get_USER_ID();
      var ImAnAdmin = permissionValidationService.amISuperAdmin();

      //-------------------- HADER FUNCTIONS ---------------
      $scope.sendFriendProfile = function (userInstanceId) {
        if (!userInstanceId) return;

        if (userInstanceId == myUserId)
          $state.go('menu.myProfile', {}, {reload: true});
        else
          $state.go('friendProfile', {instanceId: userInstanceId}, {reload: true});
      };

      $scope.canShow3DotsSequenceMenu = function (isOwner) {
        return canSaveToLocker() || canUpdateCqnzTitle() || canUpdateCqnz() ||
          canTogglePinGeneralCqnz() || canTogglePinGroupCqnz() ||
          canEnableDisableCqnzComments(isOwner) || canReportCqnz() || canDeleteCqnz(isOwner);
      };

      $scope.canShow3DotsAdsSequenceMenu = function (isOwner) {
        return canUpdateCqnzTitle() || canUpdateCqnz() || canEnableDisableCqnzComments(isOwner) ||
          canReportCqnz() || canDeleteCqnz(isOwner)
      };

      /**
       * @param sequence {SequenceType}
       * @param listIndex {number}
       */
      $scope.open3DotsSequenceMenu = function (sequence, listIndex) {
        var buttons = [];
        var buttonsIds = [];

        if (canSaveToLocker()) {
          buttons.push({text: Utils.translate('SEQUENCE.SAVE_IN_LOCKER') + ' <i class="icon ion-pin"></i>'});
          buttonsIds.push('SAVE_IN_LOCKER');
        }
        if (canUpdateCqnzTitle()) {
          buttons.push({text: Utils.translate('PROFILE.EDIT')});
          buttonsIds.push("EDIT_TITLE");
        }
        if (canUpdateCqnz(sequence.content.type)) {//not available for  video nor statement, only photos
          buttons.push({text: Utils.translate('PROFILE.MODIFY')});
          buttonsIds.push("MODIFY_CQNZ");
        }
        if (canChangeAdConfig(sequence.metadata.belongsMe)) {
          buttons.push({text: Utils.translate('PROFILE.CHANGE_CONFIG')});
          buttonsIds.push("EDIT_CONFIG");
        }

        if (!sequence.metadata.isAdvertisement) {
          if (canTogglePinGeneralCqnz() || canTogglePinGroupCqnz()) {
            if (sequence.metadata.isPinned)
              buttons.push({text: Utils.translate('SEQUENCE.UNPIN_CQNZ_TXT') + '<i class="icon ion-pin"></i>'});
            else if ($scope._totalPinnedSequences < $scope._maxSequencesToPin)
              buttons.push({text: Utils.translate('SEQUENCE.PIN_CQNZ_TXT') + ' <i class="icon ion-pin"></i>'});

            buttonsIds.push('TOGGLE_PIN');
          }
        }
        if (canEnableDisableCqnzComments(sequence.metadata.belongsMe)) {
          buttons.push({text: Utils.translate('UPLOAD.' + (sequence.comments.enabled ? 'DIS' : 'EN') + 'ABLE_COMMENTS') + ' <i class="icon ion-quote"></i>'});
          buttonsIds.push('COMMENTS_TOGGLE_ENABLE');
        }
        if (canReportCqnz()) {
          buttons.push({text: Utils.translate('SEQUENCE.REPORT') + ' <i class="icon ion-alert-circled"></i>'});
          buttonsIds.push('REPORT');
        }


        Utils.$ionicActionSheet.show({
          buttons: buttons,
          titleText: Utils.translate('SEQUENCE.OPTIONS'),
          buttonClicked: function (buttonIndex) {
            switch (buttonsIds[buttonIndex]) {
              case 'SAVE_IN_LOCKER':
                saveCqnzInLocker(listIndex, sequence.metadata.instanceId);
                break;
              case "EDIT_TITLE":
                //this function must be implemented inside the father controller
                $scope.openComposerScreen(sequence.description.titleEditable).then(function (form) {
                  //First check if the new text is the same as the old one
                  if (form.description === sequence.description.titleBackup) return;

                  sequence.description.isUpdating = true;//for showing the spinner
                  sequence.updateMyTitle(form).then(function (newDescription) {
                    sequence.description = newDescription;//<-- here the spinner should hide
                    setTimeout(function () {
                      $scope.$apply()
                    }, 10)
                  }, function () {
                    /*the error is printed/shown inside the function*/
                  });
                });
                break;
              case 'EDIT_CONFIG':
                sequence.updateMyAdConfig(sequence).then(function (newSequenceData) {
                  //if(newSequenceData !== -1)//-1 == the modal was cancelled, nothing to do.
                  //do anything tyou want
                });
                break;
              case "MODIFY_CQNZ":
                $state.go('modifySequence', {sequenceInstanceId: sequence.metadata.instanceId}, {reload: true});
                break;
              case 'TOGGLE_PIN':
                var groupHrefId = $scope._controllerName === 'groupTimelineCtrl' ? $scope._groupHrefId : 0;
                sequence.togglePinMe(!sequence.metadata.isPinned, groupHrefId).then(function (isPinnedNow) {
                  if (isPinnedNow) {
                    $scope._totalPinnedSequences++;
                    sequence.metadata.isPinned = true;

                    var myPinnedSequence = $scope._sequenceList.slice(listIndex, listIndex + 1)[0];

                    $scope._sequenceList.unshift(myPinnedSequence);
                  }
                  else {
                    $scope._totalPinnedSequences--;
                    $scope._sequenceList.shift();

                    $scope._sequenceList.some(function (seq) {
                      if (seq.metadata.instanceId === sequence.metadata.instanceId) {
                        seq.metadata.isPinned = false;
                        return true;
                      }
                    });
                  }
                }, function () {
                  /*the error is printed/shown inside the function*/
                });
                break;
              case 'REPORT':
                //todo: add permissions validations???
                sequence.reportMe();
                break;
              case 'COMMENTS_TOGGLE_ENABLE':
                Utils.loading.show();
                sequence.toggleEnableMyComments(!sequence.comments.enabled).then(function (resp) {
                  //sequence.comments.enabled = resp;
                }, function (error) {
                  //the error is printed/shown inside the function
                }).finally(function () {
                  Utils.loading.hide();
                });
                break;
              default:
                Utils.toast.warning("Invalid option '" + buttonsIds[buttonIndex] + "'");
            }
            return true;
          },
          destructiveText: canDeleteCqnz(sequence.metadata.belongsMe) ? Utils.translate('SEQUENCE.DELETE') + ' <i class="icon ion-close-round"></i>' : null,
          destructiveButtonClicked: canDeleteCqnz(sequence.metadata.belongsMe) ? function () {
            confirmDeleteCqnz(sequence, listIndex);
            return true;
          } : null
        })
      };

      $scope.whatCliked = function (evt, sequence) {
        var realText = [];
        if (evt.target.id || evt.target.id != '') {
          if (evt.target.id == myUserId)
            $state.go('menu.myProfile', {}, {reload: true});
          else
            $state.go('friendProfile', {instanceId: evt.target.id}, {reload: true});
        }
        else {
          if (sequence.description.hashesList && sequence.description.hashesList.length) {
            realText = evt.target.innerText.split(' ');
            if (realText.length === 1) {
              $state.go('hashTimeLine', {"hashName": evt.target.innerText}, {reload: true});
            }
          }
        }
      };
      //---------------- END OF HADER FUNCTIONS ------------


      //---------------- CONTENT FUNCTIONS -----------------

      $scope.play = function ($inview, sequence) {
        if (!sequence.content)
          console.log("$scope.play", sequence);
        sequence.content.templateIdBackup = $inview || sequence.content.templateId.substr(0, 17) !== 'templateAutomate0' ? sequence.content.templateId : 'templateAutomate01';
      };

      //the call was set inside Utils.generateAnchors() function
      $scope.openInappBrowser = function (url) {
        window.open(url, '_blank', 'location=yes');
      };

      /*$scope.$on('$destroy', function (event) {
        console.log("$destroy SequenceCtrl");
      });*/

      //todo: send broadcast
      $scope.playVideoOwn = function (index, sequence, nameCtrl) {
        var videoElement = document.getElementById(nameCtrl + 'VideoArea' + index);
        videoElement.play();
        videoElement.controls = true;
        videoElement.addEventListener('ended', finished, false);
        videoElement.addEventListener('pause', finished, false);
        sequence.content.videoPlayedCounter++;
        var buttonPlay = document.getElementById(nameCtrl + 'ButtonPlay' + index);
        buttonPlay.hidden = true;
        TimeLineService.setPostVideoCount({
          objectId: index
        }).save({}, function (response) {
          console.log("ok");
        }, function (err) {
          console.log("error");
        });
      };

      function finished(e) {
        console.log(e);
        e.target.controls = false;
        var getID = e.target.id.split('VideoArea')[1];
        var getIDCtrl = e.target.id.split('VideoArea')[0];
        var buttonPlay = document.getElementById(getIDCtrl + 'ButtonPlay' + getID);
        buttonPlay.hidden = false;
      }

      //------------ END OF CONTENT FUNCTIONS --------------


      // ------------------ CQNZ BOTTOM strip FUNCTIONS ----------------------
      function happyon(sequenceId) {
        try {
          document.getElementById('happyNumberon' + sequenceId).style.display = 'block';
          document.getElementById('happyNumberoff' + sequenceId).style.display = 'none';
          document.getElementById('happyNumberoff' + sequenceId).className = "off1";
        } catch (e) {
          console.error("happyon", e)
        }
      }

      function happyoff(sequenceId) {
        try {
          document.getElementById('happyNumberon' + sequenceId).style.display = 'none';
          document.getElementById('happyNumberoff' + sequenceId).style.display = 'block';
          document.getElementById('happyNumberoff' + sequenceId).className = "on1";
        }
        catch (e) {
          console.error("happyoff", e)
        }
      }

      /**
       * @param sequence {SequenceType}
       * @param listIndex
       */
      $scope.setLikeToSequence = function (sequence, listIndex) {
        if (!ImAnAdmin && $scope.peviewTimeline) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.PERFORM_ACTION_ON_PREVIEW'));
          return;
        }
        if (!canLikeToSequence()) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.GRAL_TLINE_CQNZ_LIKE'));
          return;
        }
        //console.log(sequence);

        var newActiveLike = !sequence.like.active.result.value;

        //optimistic updates
        sequence.like.active.result.value = newActiveLike;
        newActiveLike ? sequence.like.counter++ : sequence.like.counter--;
        newActiveLike ? happyon(sequence.metadata.id) : happyoff(sequence.metadata.id);

        var animatedIcon = document.getElementById('animation' + listIndex);
        if (animatedIcon) animatedIcon.style.display = newActiveLike ? 'block' : 'none';

        sequence.likeMe().then(function (newValues) {

        }, function (responseError) {
          console.error("sequence.likeMe()", responseError);
          //rollback to previous state
          sequence.like.active.result.value = responseError.active;
          sequence.like.counter = responseError.counter;
          responseError.active ? happyon(sequence.metadata.id) : happyoff(sequence.metadata.id);
          //if (animatedIcon) animatedIcon.style.display = responseError.active ? 'block' : 'none';
        })
      };

      $scope.showUsersWhoLiked = function (sequence) {
        if (ImAnAdmin ||
          (sequence.metadata.belongsMe && sequence.like.counter && !$scope.peviewTimeline)) {
          likeUsersData.anadir(sequence.like.counter, sequence.metadata.instanceId);
          $state.go('listLikes', {}, {reload: true});
        }
      };

      $scope.redirectSendReaction = function (sequence) {
        if (!ImAnAdmin && $scope.peviewTimeline) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.PERFORM_ACTION_ON_PREVIEW'));
          return;
        }
        if (!$scope.canReactToSequence()) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.GRAL_TLINE_CQNZ_REACT'));
          return
        }

        $state.go('sendReaction', {sequence: sequence}, {reload: true});
      };

      /**
       * @param sequence {SequenceType}
       * @param listIndex
       */
      $scope.openSharingOptions = function (sequence, listIndex) {
        if (!ImAnAdmin && $scope.peviewTimeline) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.PERFORM_ACTION_ON_PREVIEW'));
          return;
        }

        var moreThan1Group = window.localStorage.getItem("totalGroups") > 1;

        if (!$scope.canOpenSharingOptions(sequence)) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.GRAL_TLINE_CQNZ_SHARE'));
          return;
        }

        var buttons = [], buttonsIds = [];

        if (canShareInGroupsTimeline(moreThan1Group)) {
          buttons.push({text: Utils.translate('SEQUENCE.SHARE_IN_GROUPS_TIMELINE') + ' <i class="icon myIcon-line-weight"></i>'});
          buttonsIds.push("IN_GROUPS");
        }
        if (canShareInUserTimeline()) {
          buttons.push({text: Utils.translate('SEQUENCE.SHARE_IN_TIMELINE') + ' <i class="icon myIcon-line-weight"></i>'});
          buttonsIds.push("IN_USER_TIMELINE");
        }
        if (canShareExternally(sequence.content.type)) {//not available for statements
          buttons.push({text: Utils.translate('SEQUENCE.SHARE_EXTERNALLY') + ' <i class="icon ion-android-share-alt"></i>'});
          buttonsIds.push("EXTERNALLY");
        }

        Utils.$ionicActionSheet.show({
          buttons: buttons,
          titleText: Utils.translate('TIMELINE.SHARE_UI.SHARE_CQNZ'),
          buttonClicked: function (buttonIndex) {
            switch (buttonsIds[buttonIndex]) {
              case 'IN_USER_TIMELINE':
                doShareInUserTimeline(sequence.metadata, listIndex);
                break;
              case "IN_GROUPS":
                showAllGroupsModal(sequence, listIndex);
                break;
              case "EXTERNALLY": {
                Utils.loading.show();
                try {
                  sequence.shareMe('imageBox' + sequence.content.templateId + listIndex).then(function () {
                    increaseSharesCount(sequence.metadata, listIndex);
                  }, function (error) {
                    //the errors are printed/shown in the function
                  }).finally(function () {
                    Utils.loading.hide();
                  });
                }
                catch (e) {
                  sequence.share.isSharing = false;
                  Utils.loading.hide();
                  console.error(e);
                  Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.SHARE_CQNZ_IN_TIMELINE_ERR'));
                }
                break;
              }
              default:
                Utils.toast.warning("Invalid option '" + buttonsIds[buttonIndex] + "'");
            }

            return true;
          }
        })
      };

      /*function shareScreen(sequence, part, listIndex) {
        var deeplink = 'http://niido.cloud';
        part += listIndex;

        Utils.loading.show();
        var s3Service = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: s3.bucket}
        });
        if (sequence.content.templateId == "templateVideo") {
          var text = Utils.translate('MENU.SETTINGS.SHARE_VIDEO.MESSAGE');
          window.plugins.socialsharing.share(
            text + '\n',
            null,
            null,
            sequence.content.items[0].url,
            function () {
              increaseSharesCount(sequence, listIndex)
            }
          );
          sequence.sharing = false;
          setTimeout(function () {
            Utils.loading.hide();
          }, 1500)
        } else {
          sequence.sharing = true;
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
            Utils.loading.hide();
            Utils.toast.error(Utils.translate("PLUGINS.BRANCH.PLUGIN_NOT_INSTALLED"));
            return;
          }

          window.Branch.createBranchUniversalObject(deepProperties).then(function (res) {
            branchShareCQNZ = res;
            branchShareCQNZ.generateShortUrl(analyticsDeepLink, propertiesDeepLink).then(function (res) {
              deeplink = res.url;
              var imageList = [];
              //for slideShow
              if (part.substr(0, 25) == 'imageBoxtemplateAutomate0') {
                var photoKey = //s3.prefix
                  'Gifs/' + Utils.md5.createHash(myUserId) + '/shared/' + Utils.md5.createHash(sequence.metadata.id.toString()) + '.gif';
                s3Service.headObject({Key: photoKey}, function (err, data) {
                  if (!err) {
                    sequence.sharing = false;
                    Utils.loading.hide();
                    return window.plugins.socialsharing.shareWithOptions({
                      url: "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey
                    }, function () {
                      increaseSharesCount(sequence, listIndex)
                    });
                  }
                  if (err.code !== 'NotFound') {
                    sequence.sharing = false;
                    Utils.loading.hide();
                    return console.error('There was an error creating the gif: ' + err);
                  }

                  //for slidehow
                  for (var i = 0; i < sequence.content.items.length; i++) {
                    imageList.push(sequence.content.items[i].url);
                  }

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
                      $scope.gifData = obj.image;
                      s3Service.upload({
                        Key: photoKey,
                        Body: image,
                        ACL: 'public-read',
                        ContentType: image.type
                      }, function (err, data) {
                        if (err) {
                          Utils.loading.hide();
                          sequence.sharing = false;
                          return console.error('There was an error uploading the gif: ', err);
                        }
                        //console.log('Successfully uploaded gif');
                        Utils.loading.hide();
                        window.plugins.socialsharing.shareWithOptions({
                          //data.Location send a link with amazon's url
                          //url: data.Location
                          url: "http://s3-us-west-2.amazonaws.com/" + s3.bucket + "/" + photoKey
                          //,files: [$scope.gifData]
                        }, function () {
                          increaseSharesCount(sequence, listIndex)
                        });
                        sequence.sharing = false;
                        Utils.loading.hide();
                      });
                    }
                  })
                })
              } else {
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
                      increaseSharesCount(sequence, listIndex)
                    });
                    sequence.sharing = false;
                  });
                });
              }
            }).catch(function (err) {
              sequence.sharing = false;
              Utils.loading.hide();
              console.error("Can't create link to App", err);
            });
          }).catch(function (err) {
            sequence.sharing = false;
            Utils.loading.hide();
            console.error("Can't create branch universal object");
          });
        }
      }*/

      /**
       * @param sequenceMetadata {SequenceMetadataType}
       * @param listIndex
       */
      function increaseSharesCount(sequenceMetadata, listIndex) {
        SequenceService.increaseSharesCount(sequenceMetadata.instanceId).then(function () {
          $scope._sequenceList[listIndex].share.counter++;
          $rootScope.$broadcast('sequence.counters.updated', {
            type: 'sequence.share',
            sequenceMetadata: sequenceMetadata,
            counter: $scope._sequenceList[listIndex].share.counter
          });
        }, function (error) {
          console.error("increaseSharesCount", error)
        });
      }

      $scope.reDirectCommentsPage = function (sequence, listIndex) {
        if (!ImAnAdmin && $scope.peviewTimeline) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.PERFORM_ACTION_ON_PREVIEW'));
          return;
        }
        if (!canGoToCommentsPage(sequence)) {
          if (!permissionValidationService.canCreateComment())
            Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.COMMENT_CREATE'));
          else
            Utils.toast.warning(Utils.translate('UPLOAD.COMMENTS_ARE_DISABLED'));
          return;
        }

        var dataToSend = {
          controllerName: $scope._controllerName,
          sequenceMetadata: sequence.metadata,
          sequenceOwnerMetadata: sequence.user || sequence.ownerMetadata,
          totalComments: sequence.comments.counter
        };

        $state.go('commentsCqnz', {data: dataToSend}, {reload: true});
      };
      // --------------- END OF CQNZ BOTTOM STRIP FUNCTIONS -------------------


      // ----------------- PERMISSIONS VALIDATION FUNCTIONS ------------------

      function canSaveToLocker() {
        return permissionValidationService.canSaveCqnzInLocker() && !$scope.peviewTimeline && false;
      }

      function canUpdateCqnzTitle() {
        return $scope._controllerName === 'myProfileTimelineCtrl' && (ImAnAdmin || (permissionValidationService.canUpdateCqnzTitleInGralTimeline() && !$scope.peviewTimeline));
      }

      function canUpdateCqnz(sequenceType) {//not available for  video nor statement, only photos
        return $scope._controllerName === 'myProfileTimelineCtrl' && sequenceType === 1 && (ImAnAdmin || permissionValidationService.canUpdateCqnzInGralTimeline() && !$scope.peviewTimeline);
      }

      function canChangeAdConfig(isOwner) {
        return isOwner && /*$scope._controllerName === 'myProfileTimelineCtrl' &&*/ UserService.USER_IS_ADVERTISER();
      }

      function canTogglePinGeneralCqnz() {
        return $scope._controllerName === 'TimeLineCtrl' && ImAnAdmin;
      }

      function canTogglePinGroupCqnz() {
        return $scope._controllerName === 'groupTimelineCtrl' &&
          (ImAnAdmin || (
            $scope.groupData.imAdministrator && permissionValidationService.canTogglePinCqnzInGroupTimeline() && !$scope.peviewTimeline
          ));
      }

      function canEnableDisableCqnzComments(isOwner) {
        return ImAnAdmin || (isOwner && !$scope.peviewTimeline && (permissionValidationService.canEnableDisableCommentsInGralTimeline() || permissionValidationService.canEnableDisableCommentsInGroupTimeline()));
      }

      function canReportCqnz() {
        return ImAnAdmin || (permissionValidationService.canReportCqnzInGralTimeline() && !$scope.peviewTimeline);
      }

      function canDeleteCqnz(isOwner) {
        /*console.log("canDeleteOthersCqnzFromGralTimeline: ", permissionValidationService.canDeleteOthersCqnzFromGralTimeline())
        console.log("canDeleteOthersCqnzFromGroupTimeline: ", permissionValidationService.canDeleteOthersCqnzFromGroupTimeline())
        console.log("canDeleteOwnCqnzFromGralTimeline: ", permissionValidationService.canDeleteOwnCqnzFromGralTimeline())
        console.log("canDeleteOwnCqnzFromGroupTimeline: ", permissionValidationService.canDeleteOwnCqnzFromGroupTimeline())
        console.log("isOwner: "+isOwner);*/
        return ImAnAdmin || (
          !$scope.peviewTimeline &&
          (
            permissionValidationService.canDeleteOthersCqnzFromGralTimeline() ||
            permissionValidationService.canDeleteOthersCqnzFromGroupTimeline()
          ) ||
          (isOwner &&
            (
              permissionValidationService.canDeleteOwnCqnzFromGralTimeline() || permissionValidationService.canDeleteOwnCqnzFromGroupTimeline()
            )
          )
        );
      }

      $scope.canUpdateComment = function () {
        return permissionValidationService.canUpdateComment();
      };

      function canLikeToSequence() {
        return permissionValidationService.canLikeCqnzInGralTimeline() || permissionValidationService.canLikeCqnzInGroupTimeline();
      }

      $scope.canReactToSequence = function () {
        return permissionValidationService.canReactCqnzInGralTimeline() || permissionValidationService.canReactCqnzInGroupTimeline();
      };

      $scope.canOpenSharingOptions = function (sequence) {
        if ($scope.iAmAdvertiser && sequence.isAdvertisement && sequence.metadata.belongsMe) {
          return true;
        }

        return sequence.share.enabled && (canShareInGroupsTimeline(window.localStorage.getItem("totalGroups") > 1) ||
          canShareInUserTimeline() || canShareExternally(sequence.content.type));
      };

      function canShareInGroupsTimeline(moreThan1Group) {
        return moreThan1Group && (permissionValidationService.canShareGralCqnzInGroupTimeline() || permissionValidationService.canShareGroupCqnzInGeneralTimeline());
      }

      function canShareInUserTimeline() {
        return $scope._controllerName === 'groupTimelineCtrl' && permissionValidationService.canShareGroupCqnzInGeneralTimeline();
      }

      function canShareExternally(sequenceType) {
        return sequenceType !== 2 && permissionValidationService.canShareGralCqnzInExternalNetworks();
      }

      function canGoToCommentsPage(sequence) {
        return ImAnAdmin ||
          (sequence.comments.enabled && permissionValidationService.canCreateComment());
      }

      // -------------- END OF PERMISSIONS VALIDATION FUNCTIONS ----------------


      //------------------ MISCELANEOUS FUNCTIONS SECTION ------------------------
      $scope.trustAsHtml = function (text) {
        return Utils.$sce.trustAsHtml(text);
      };

      //for autosizing editable inputs (bio, sequence descr, comments)
      $scope.autosize = function (event) {
        //console.log(event);
        event.target.style.cssText = 'height:' + event.target.scrollHeight + 'px; width: 100%';
      };

      var bannedGroupsList = [],
        lockedGroupsList = [];

      //todo: set current group as disabled
      /**
       * shares a sequence with a group's timeline
       * @param sequence {SequenceType}
       * @param listIndex {number}
       */
      function showAllGroupsModal(sequence, listIndex) {
        Utils.loading.show();

        if (UserService.USER_IS_ADVERTISER()) {
          getAllGroups().then(function (groupList) {
            Utils.loading.hide();
            //console.log(groupList)
            showGroupsListModal(groupList).then(function (selectedGroupList) {
              //console.log(sequenceId, selectedGroupList);
              doShareInGroups(sequence.metadata, selectedGroupList, listIndex);
            })
          }, function (error) {
            console.error("get all groups", error);
          });
        }
        else {
          getBannedAndLockedGroupsForUser().then(function (/*boolean*/) {
            getMyNotBannedGroups().then(function (groupList) {
              Utils.loading.hide();
              showGroupsListModal(groupList).then(function (selectedGroupList) {
                //console.log(selectedGroupList);
                doShareInGroups(sequence.metadata, selectedGroupList, listIndex);
              })
            }, function () {
              /*the error is printed out in the function*/
              Utils.loading.hide();
            })
          }, function () {
            /*the error is printed out in the function*/
            Utils.loading.hide();
          })
        }
      }

      /**
       * @returns {Promise}
       */
      function showGroupsListModal(groupList) {
        return Utils.modal.show({
          templateUrl: 'templates/Timelines/timeline-shareCqnz-modal.html',
          locals: {groupList: groupList},
          controller: function ($scope, $mdDialog, locals) {
            $scope.locals = locals;
            $scope.ok = function () {
              $mdDialog.hide($scope.selected)
            };
            $scope.cancel = function () {
              $mdDialog.cancel()
            };

            $scope.selected = [];//<- the selected groups

            $scope.isIndeterminate = function () {
              return (
                $scope.selected.length !== 0 &&
                $scope.selected.length !== $scope.locals.groupList.length
              );
            };
            $scope.exists = function (group) {
              return $scope.selected.indexOf(group) > -1;
            };
            $scope.toggle = function (group) {
              var idx = $scope.selected.indexOf(group);
              idx > -1 ? $scope.selected.splice(idx, 1) : $scope.selected.push(group);
            };
            $scope.toggleAll = function () {
              if ($scope.selected.length === $scope.locals.groupList.length) {
                $scope.selected = [];
              }
              else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
                $scope.selected = $scope.locals.groupList.slice(0);
              }
            };
          }
        })
      }

      /**
       * @param sequenceMetadata {SequenceMetadataType}
       * @param selectedGroupList {Object[]} - array of selected groups
       * @param listIndex
       */
      function doShareInGroups(sequenceMetadata, selectedGroupList, listIndex) {
        /**
         * @type {GroupWithErrors[]}
         */
        var groupsWithErrors = [];
        var numReqsFinished = 0;
        var totalGroups = selectedGroupList.length;

        Utils.loading.show();
        selectedGroupList.forEach(function (group) {
          if (!group.imLocked) {//<--because the list can contain banned groups
            TimeLineService.shareTimelineCqnzToGroup(sequenceMetadata.id, group.hrefId).then(function () {
              numReqsFinished++;
              if (numReqsFinished == totalGroups) {
                Utils.loading.hide();
                onShareCqnzFinished(groupsWithErrors);
              }
              increaseSharesCount(sequenceMetadata, listIndex);
            }, function (shareError) {
              console.error(shareError);

              numReqsFinished++;
              groupsWithErrors.push({
                groupName: group.name,
                error: {
                  status: shareError.status,
                  statusText: shareError.statusText,
                  message: shareError.data.causedBy.message
                }
              });

              if (numReqsFinished == totalGroups) {
                Utils.loading.hide();
                onShareCqnzFinished(groupsWithErrors);
              }
            });
          }
          else {
            numReqsFinished++;//<-- because of the banned groups
            if (numReqsFinished == totalGroups) {
              Utils.loading.hide();
              onShareCqnzFinished(groupsWithErrors);
            }
          }
        })
      }

      /**
       * @param sequence {SequenceMetadataType}
       * @param listIndex
       */
      function doShareInUserTimeline(sequence, listIndex) {
        Utils.loading.show();
        GroupsService.shareGroupCqnzToTimeline(sequence.instanceId, mySubscriptionHref).then(function () {
          Utils.loading.hide();
          Utils.toast.success(Utils.translate('GROUPS.TIMELINE_WRAPPER.DIALOG.SHARE_CQNZ_OK'));
          increaseSharesCount(sequence, listIndex);
        }, function (shareError) {
          Utils.loading.hide();
          Utils.toast.error(Utils.translate('SEQUENCE.DIALOG.SHARE_CQNZ_IN_TIMELINE_ERR'));
          console.error(shareError);
        })
      }

      /**
       * @description Verifies if errors occurred after sharing sequence and displays the group names and reasons
       * @param {GroupWithErrors[]} groupsWithErrorsList - group name and error object array
       */
      function onShareCqnzFinished(groupsWithErrorsList) {
        if (groupsWithErrorsList.length) {
          var shareErrorMsg = Utils.translate("GROUPS.TIMELINE_WRAPPER.DIALOG.SHARE_CQNZ_IN_GROUPS_ERR") + ":<br>";

          var nonDuplicatedCqnzs = 0;
          groupsWithErrorsList.forEach(
            /** @param {GroupWithErrors} groupErr*/
            function (groupErr) {
              if (groupErr.error.message.indexOf('duplicate key value') === -1) {
                shareErrorMsg += "<b>" + groupErr.groupName + "</b><br/>";
                nonDuplicatedCqnzs++;
              }
              /*shareErrorMsg += "<b>" + groupErr.groupName + "</b> " +
                (groupErr.error.message.indexOf('duplicate key value') > -1 ?
                  Utils.translate("GROUPS.TIMELINE_WRAPPER.DIALOG.DUPLICATE_CQNZ_ERR") :
                  groupErr.error.statusText) +
                "<br>";*/
            });
          //already existent sequences shouldn't mean a share error
          if (nonDuplicatedCqnzs)
            Utils.alert.show(shareErrorMsg);
        }
        else
          Utils.toast.success(Utils.translate("GROUPS.TIMELINE_WRAPPER.DIALOG.SHARE_CQNZ_OK"));
      }

      /**
       * @return Promise
       */
      function getAllGroups() {
        return Utils.$q(function (resolve, reject) {
          GroupsService.gelAllGroups().then(function (groups) {
            if (!groups[groups.length - 1].groupId)
              groups.splice(groups.length - 1, 1);

            var groupList = [];

            if (!groups.length) return resolve(groupList);

            //console.log(groups)

            groups.forEach(function (resource) {
              groupList.push({
                id: resource.groupId,
                //creationDate:resource.creationDate,
                //href: resource.group.href,
                //hrefId: Utils.getLastUrlComponent(resource.group.href),
                hrefId: resource.groupId,
                name: resource.groupName,
                description: resource.description,
                image: resource.url || 'img/photoFrame.svg',
                //privacy: resource.privacy,
                imAdministrator: false,
                imModerator: false,
                imLocked: false,
                imBanned: false
              })
            });

            resolve(groupList);
          }, function (error) {
            console.error("get all groups", error);
            reject(error);
          })
        })
      }

      /**
       * Gets and sets (the corresponding list) the groups where the user has been banned/locked from
       * @returns {Promise} boolean
       */
      function getBannedAndLockedGroupsForUser() {
        bannedGroupsList = [];
        lockedGroupsList = [];
        return Utils.$q(function (resolve, reject) {
          GroupsService.getBannedGroupsForUser(mySubscriptionHref).then(function (bannedList) {
            //console.log("bannedList", bannedList);
            bannedGroupsList = bannedList;
            GroupsService.getLockedGroupsForUser(mySubscriptionHref).then(function (lockedList) {
              //console.log("lockedList", lockedList);
              lockedGroupsList = lockedList;
              resolve(true);
            }, function (getLockedError) {
              Utils.alert.show(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_LOCKED_GROUPS_ERR'));
              console.error(getLockedError);
              reject(getLockedError);
            })
          }, function (getBannedError) {
            //Utils.alert.show(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_BANNED_GROUPS_ERR'));
            console.error(getBannedError);
            reject(getBannedError);
          });
        });
      }

      /**
       * Gets the user groups that are not marked as banned
       * @returns {Promise}
       */
      function getMyNotBannedGroups() {
        return Utils.$q(function (resolve, reject) {
          GroupsService.getUserGroups(mySubscriptionHref).then(function (groups) {
            var groupList = [];

            //remove the last item because it's normally a useless object
            if (!groups[groups.length - 1].groupId)
              groups.splice(groups.length - 1, 1);

            groups.forEach(function (resource) {
              var isBanned = GroupsService.checkIfIsBannedOrLockedGroup(bannedGroupsList, resource.group.href);

              //filter out the banned groups
              if (!isBanned)
                groupList.push({
                  id: resource.groupId,
                  //creationDate:resource.creationDate,
                  href: resource.group.href,
                  hrefId: Utils.getLastUrlComponent(resource.group.href),
                  name: resource.groupName,
                  description: resource.description,
                  image: resource.url || 'img/photoFrame.svg',
                  privacy: resource.privacy,
                  imAdministrator: resource.administrator,
                  imModerator: resource.moderator,
                  imLocked: GroupsService.checkIfIsBannedOrLockedGroup(lockedGroupsList, resource.group.href),
                  imBanned: isBanned
                })
            });

            resolve(groupList);
          }, function (getGroupsError) {
            Utils.toast.error(Utils.translate("GROUPS.TIMELINE_WRAPPER.DIALOG.GET_GROUPS_ERR"));
            console.error(getGroupsError);
            reject(getGroupsError);
          });
        })
      }

      /**
       * @param sequence {SequenceType}
       * @param listIndex
       */
      function confirmDeleteCqnz(sequence, listIndex) {
        //console.log('listIndex', listIndex)
        Utils.confirm.show(Utils.translate('SEQUENCE.DIALOG.DELETE_CQNZ_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          sequence.deleteMe().then(function () {
            Utils.loading.hide();
          }, function (error) {
            Utils.loading.hide();
          })
        })
      }

      function saveCqnzInLocker() {
        Utils.toast.info("We're implementing this feature");
      }

      $scope.increaseAdClicks = function (sequence) {
        if (sequence.metadata.belongsMe) return;

        adsService.increaseClicksCount(sequence.metadata.instanceId).then(function () {
          //console.log($scope._sequenceList[listIndex].clicksCount);
          /*sequence.advertisement.counters.clicks ?
            sequence.advertisement.counters.clicks.result.value++ :
            sequence.advertisement.counters.clicks = {result: {value: 1}};*/
          console.log("Ad clicks increased")
        }, function (error) {
          console.error("increaseClicksCount", error);
        });
      };

      //--------------- END OF MISCELANEOUS FUNCTIONS SECTION ----------------------


      //----------------------- LISTENERS SECTION -------------------------
      setTimeout(function () {
        if (timelinesService.eventsAttached) return;

        $rootScope.$on("sequence.created", function (event, data) {
          if (data.from === 'TimeLineCtrl') {
            timelinesService.defaultTimeline.events.timeline.refresh();
            if (UserService.USER_IS_ADVERTISER())
              showAllGroupsModal(data.sequenceId, 0/*the listIndex*/);
          }
          else if (data.from === 'groupTimelineCtrl') {
            timelinesService.groupTimeline.events.timeline.refresh();
          }
        });

        $rootScope.$on('sequence.deleted', function (event, data) {
          if (timelinesService.defaultTimeline.events.sequence.onDelete)
            timelinesService.defaultTimeline.events.sequence.onDelete(data);
          if (timelinesService.groupTimeline.events.sequence.onDelete)
            timelinesService.groupTimeline.events.sequence.onDelete(data);
        });

        $rootScope.$on('sequence.title.edited', function (event, data) {
          data.updaterFn = editeTitleByEvent;
          if (timelinesService.defaultTimeline.events.sequence.onTitleEdited)
            timelinesService.defaultTimeline.events.sequence.onTitleEdited(data);
          if (timelinesService.groupTimeline.events.sequence.onTitleEdited)
            timelinesService.groupTimeline.events.sequence.onTitleEdited(data);
        });

        $rootScope.$on('sequence.content.edited', function (event, data) {
          if (timelinesService.defaultTimeline.events.sequence.onContentEdited)
            timelinesService.defaultTimeline.events.sequence.onContentEdited(data);
          if (timelinesService.groupTimeline.events.sequence.onContentEdited)
            timelinesService.groupTimeline.events.sequence.onContentEdited(data);
        });

        $rootScope.$on('sequence.counters.updated', function (event, data) {
          //sequence.comment.like
          //sequence.like
          //sequence.share
          //sequence.react this doesn't return the counter

          data.updaterFn = updateCountersByEvent;

          if (timelinesService.defaultTimeline.events.sequence.onCountersUpdated)
            timelinesService.defaultTimeline.events.sequence.onCountersUpdated(data);
          if (timelinesService.groupTimeline.events.sequence.onCountersUpdated)
            timelinesService.groupTimeline.events.sequence.onCountersUpdated(data);
        });

        $rootScope.$on('sequence.comment.enabled.updated', function (event, data) {
          if (timelinesService.defaultTimeline.events.comment.onEnabledUpdated)
            timelinesService.defaultTimeline.events.comment.onEnabledUpdated(data);
          if (timelinesService.groupTimeline.events.comment.onEnabledUpdated)
            timelinesService.groupTimeline.events.comment.onEnabledUpdated(data);
        });

        $rootScope.$on('sequence.comment.created', function (event, data) {
          if (timelinesService.defaultTimeline.events.comment.onCreate)
            timelinesService.defaultTimeline.events.comment.onCreate(data);
          if (timelinesService.groupTimeline.events.comment.onCreate)
            timelinesService.groupTimeline.events.comment.onCreate(data);
        });

        $rootScope.$on('sequence.comment.edited', function (event, data) {
          if (timelinesService.defaultTimeline.events.comment.onUpdate)
            timelinesService.defaultTimeline.events.comment.onUpdate(data);
          if (timelinesService.groupTimeline.events.comment.onUpdate)
            timelinesService.groupTimeline.events.comment.onUpdate(data);
          if (timelinesService.hashTimeline.events.comment.onUpdate)
            timelinesService.hashTimeline.events.comment.onUpdate(data)
        });

        $rootScope.$on('sequence.comment.deleted', function (event, data) {
          if (timelinesService.defaultTimeline.events.comment.onDelete)
            timelinesService.defaultTimeline.events.comment.onDelete(data);
          if (timelinesService.groupTimeline.events.comment.onDelete)
            timelinesService.groupTimeline.events.comment.onDelete(data);
          if (timelinesService.hashTimeline.events.comment.onDelete)
            timelinesService.hashTimeline.events.comment.onDelete(data);
        });

        $rootScope.$on('sequence.comment.like.updated', function (event, data) {
          if (timelinesService.defaultTimeline.events.comment.onLikeUpdated)
            timelinesService.defaultTimeline.events.comment.onLikeUpdated(data);
          if (timelinesService.groupTimeline.events.comment.onLikeUpdated)
            timelinesService.groupTimeline.events.comment.onLikeUpdated(data);
          if (timelinesService.hashTimeline.events.comment.onLikeUpdated)
            timelinesService.hashTimeline.events.comment.onLikeUpdated(data);
        });

        $rootScope.$on('advertisement.settings.updated', function (event, data) {
          if (timelinesService.defaultTimeline.events.advertisement.onSettingsUpdated)
            timelinesService.defaultTimeline.events.advertisement.onSettingsUpdated(data);
        });

        timelinesService.eventsAttached = true;
      }, 1500);

      function editeTitleByEvent(sequence, data) {
        console.log("Updating sequence title in groups timeline");
        sequence.description = {};
        setTimeout(function () {
          sequence.description = data.description;

          setTimeout(function () {
            $scope.$apply()
          }, 10)
        }, 2000);
      }

      function updateCountersByEvent(sequence, data) {
        switch (data.type) {
          case 'sequence.like':
            sequence.like.active.result.value = data.active;
            sequence.like.counter = data.counter;
            break;
          case 'sequence.react':
            sequence.react.counter = data.counter;
            break;
          case 'sequence.share':
            sequence.share.counter = data.counter;
            break;
        }
      }
      //----------------------- END OF LISTENERS SECTION -------------------------
    }])

  .controller('CommentsCtrl', ['$rootScope', '$scope', '$state', 'UserService', 'SequenceService', 'cqnzService', 'permissionValidationService', 'notificationsService', 'Utils',
    function ($rootScope, $scope, $state, UserService, SequenceService, cqnzService, permissionValidationService, notificationsService, Utils) {
      var myUserId = UserService.get_USER_ID();
      var amISuperAdmin = permissionValidationService.amISuperAdmin();

      $scope.sendFriendProfile = function (userInstanceId) {
        if (!userInstanceId) return;

        if (userInstanceId == myUserId)
          $state.go('menu.myProfile', {}, {reload: true});
        else
          $state.go('friendProfile', {instanceId: userInstanceId}, {reload: true});
      };

      $scope.whatCliked = function (evt) {
        if (evt.target.id) {
          if (evt.target.id == myUserId)
            $state.go('menu.myProfile', {}, {reload: true});
          else
            $state.go('friendProfile', {instanceId: evt.target.id}, {reload: true});
        }
      };

      $scope.trustAsHtml = function (text) {
        return Utils.$sce.trustAsHtml(text);
      };

      /**
       * @param sequnceMetadata
       * @param comment {CommentStructureType}
       */
      $scope.openEditableComment = function (sequnceMetadata, comment) {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/partials/tags-modal.html',
          controller: 'tagsModalCtrl',
          fullscreen: true,
          locals: {description: comment.editableDescription, dialog: dialog},
          clickOutsideToClose: false
        }).then(function (form) {
          //console.log("form", form);
          //No description or is the same, nothing to update
          if (!form.description || form.description == comment.backupDescription) return;

          comment.editableDescription = form.description;
          comment.updateMe(form.savedTags).then(function (/*theNewCommentObject*/) {
            //nothing to do
          }, function (error) {
            //the messages/toasts are shown and printed inside updateMe
          });
        });
      };

      /**
       * @param comment {CommentStructureType}
       * @param listIndex
       */
      $scope.setLikeToComment = function (comment, listIndex) {
        if (!amISuperAdmin && $scope.peviewTimeline) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.PERFORM_ACTION_ON_PREVIEW'));
          return;
        }
        if (!canLikeToComment()) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.COMMENT_LIKE'));
          return;
        }

        comment.likeMe().then(function () {
          console.log("sequeceCtrl.setLikeToComment!!!")
        }, function (error) {
          console.error("sequeceCtrl.setLikeToComment!!!", error)
        })
      };

      function canLikeToComment() {
        return amISuperAdmin || permissionValidationService.canLikeComment();
      }
    }])
;
