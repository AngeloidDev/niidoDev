"use strict";

appControllers
//Partials controllers...
//Controller para alert, confirm, prompt
  .controller("DialogController", ["$scope", "$mdDialog", "displayOption",
    function ($scope, $mdDialog, displayOption) {
      $scope.displayOption = displayOption;

      $scope.cancel = function () {
        $mdDialog.cancel()
      };

      $scope.ok = function () {
        $mdDialog.hide()
      };
    }])

  .controller('ModalController', ["$scope", "$mdDialog", 'locals', function ($scope, $mdDialog, locals) {
    $scope.locals = locals;
    //console.log(locals);

    $scope.ok = function () {
      $mdDialog.hide($scope.locals);
    };

    $scope.cancel = function () {
      $mdDialog.cancel();
    };
  }])

  .controller('GroupListBottomSheetCtrl', ["$scope", "$mdBottomSheet", function ($scope, $mdBottomSheet) {
    $scope.listItemClick = function (btnId) {
      $mdBottomSheet.hide(btnId);
    };
  }])

  .controller('footerCtrl', ["$rootScope", "$scope", '$state', 'permissionValidationService', 'notificationsService', 'Utils', function ($rootScope, $scope, $state, permissionValidationService, notificationsService, Utils) {
    //console.log("footerCtrl created!");

    $scope.showButtonsArea = false;

    //when leaving this controller...
    $rootScope.$on('$stateChangeStart', function () {
      //console.log("Closing upload buttons area...")
      $scope.showButtonsArea = false;
    });

    $scope.totalNotifications =
      notificationsService.badges.unreadRegularNotifications +
      notificationsService.badges.unreadFollowersNotifications;

    $rootScope.$on("notifications.new", function (event, data) {
      $scope.totalNotifications = data.unreadRegularNotifications + data.unreadFollowersNotifications;
    });

    $rootScope.$on("chat_messages.unread", function (event, data) {
      $scope.totalUnreadMessages = data.numUnreadMessages;
    });

    $scope.scrollMainToTop = function () {
      Utils.$ionicScrollDelegate.$getByHandle('mainScroll').scrollTop();
    };

    //zone to show and quit button upload zone
    $scope.showButtonArea = function () {
      if ($scope.showButtonsArea) {
        $scope.showButtonsArea = false;
        return;
      }

      //You want to post in a group timeline
      if ($scope.isGroupTimeline) {
        if ($scope.groupData && $scope.groupData.imLocked) {
          //"You can't upload content in this group because you are temporarily locked from it"
          Utils.toast.warning(Utils.translate('GROUPS.TIMELINE_WRAPPER.DIALOG.UPLOAD_LOCKED_ERR'));
          return;
        }
        if (!permissionValidationService.canCreateCqnzInGroupTimeline()) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.GROUP_TLINE_CQNZ_CREATE'));
          return;
        }
      }//you want to post in general timeline
      else {
        if (!permissionValidationService.canCreateCqnzInGralTimeline()) {
          Utils.toast.warning(Utils.translate('PERMISSIONS.CANNOT.GRAL_TLINE_CQNZ_CREATE'));
          return;
        }
      }

      $scope.showButtonsArea = true;
    };

    $scope.closeButtonsArea = function () {
      $scope.showButtonsArea = false;
    };

    $scope.showInbox = function () {
      $state.go('menu.messagesInbox', {}, {reload: true});
    };
  }])

  .controller('tagsModalCtrl', ['$rootScope', '$scope', 'UserService', 'cqnzService', 'TagsService', 'Utils', 'locals', function ($rootScope, $scope, UserService, cqnzService, TagsService, Utils, locals) {
    var lastSearch,
      pendingSearch,
      cancelSearch = angular.noop;

    var TAG = "Tag";
    var HASH = "Hash";
    var NONE = "none";

    //search results go here
    $scope.tagList = [];
    $scope.hashList = [];

    var tagsSelected = [];
    var hashtagsSelected = [];

    $scope.form = {
      description: locals.description || '',
      searchTerm: '',
      savedHashes: locals.mentions || [],
      savedTags: locals.hash || []
    };

    var description = "";
    var previousText = "";
    var textForSearch = "";
    var taskDoing = NONE;
    var textLength = 0;
    var deleting = false;
    $scope.isIOS = Utils.platformName() === 'ios';


    var textArea;

    function focusTextArea() {
      setTimeout(function () {
        if (!textArea)
          textArea = document.querySelector('#main-textarea');

        if (textArea) {
          textArea.selectionStart = $scope.form.description.length;
          textArea.selectionEnd = $scope.form.description.length;
          textArea.focus();
        }
      }, 900);
    }

    focusTextArea();

    var searchInput;

    function focusSearchInput() {
      setTimeout(function () {
        if (!searchInput)
          searchInput = document.getElementsByClassName('mySearchableInput');

        if (searchInput) {
          searchInput = searchInput[searchInput.length - 1];
          searchInput.selectionStart = $scope.form.description.length;
          searchInput.selectionEnd = $scope.form.description.length;
          searchInput.focus();
        }
        else
          console.log("can't find search input")
      }, 900);
    }


    $scope.areaIsExpanded = false;
    $scope.expandSearchArea = function (expand) {
      $scope.areaIsExpanded = expand;

      if (expand)
        focusSearchInput();
      else
        focusTextArea();

    };

    $scope.fullLookUp = function () {
      if (taskDoing == TAG)
        searchTags($scope.form.searchTerm);
      else if (taskDoing == HASH)
        searchHashTags($scope.form.searchTerm);
    };


    $scope.lookUp = function () {
      description = $scope.form.description;

      deleting = description.length < previousText.length;

      previousText = description;

      /*if(deleting){
        console.log("deleting mode...")
        clearSearch();
        return;
      }*/

      textLength = description.length;

      if (!textLength) {
        console.log("No term to search for");
        clearSearch();
        return;
      }

      var lastChar = description.charAt(textLength - 1);
      //console.log("lastChar: " + lastChar);

      if (taskDoing == NONE) {
        if (lastChar === "@") {
          //make sure that @ symbol is preceded by a space
          if (textLength - 2 > -1 && description.charAt(textLength - 2) != ' ') {
            console.log("no space before @ found, noting to do");
            return;
          }

          taskDoing = TAG;

          //console.log("Tagging mode started, term: 'a'");
          searchTags('a');
        }
        else if (lastChar === "#") {
          taskDoing = HASH;

          //console.log("Hashtagging mode started, term: 'a'");

          searchHashTags('a');
        }
        return;
      }

      //At this point we are either in tagging or hashtagging mode

      if (lastChar == " ") {
        console.log("Space found, stopping search");
        clearSearch();
        return;
      }

      //verificamos que si el usuario esta borrando o escribiendo
      textForSearch = deleting ? textForSearch.slice(0, -1) : textForSearch + lastChar;

      if (taskDoing == TAG) {
        //console.log("Tagging mode, term: '" + textForSearch + "'");
        searchTags(textForSearch);
      }
      else if (taskDoing == HASH) {
        //console.log("Hashtagging mode, term: '" + textForSearch + "'");
        searchHashTags(textForSearch);
      }
    };

    function clearSearch() {
      taskDoing = NONE;
      textForSearch = "";
      $scope.tagList = [];
      $scope.hashList = [];
    }

    /**
     * Searches for users to @tag or topics to #hashtag
     * @param term {string} - term = search term without @ or # symbols
     */
    function searchTags(term) {
      if (!term) {
        console.log("No search term");
        return pendingSearch;
      }

      if (!pendingSearch || !debounceSearch()) {
        cancelSearch();

        return pendingSearch = Utils.$q(function (resolve, reject) {
          cancelSearch = reject;

          //when we're not searching from the search box but from main text-area
          //we need to pass this value to be shown in search input when the UI is expanded
          $scope.form.searchTerm = term;
          //console.log("searching for: " + term);

          UserService.searchUsersByPartialNameOrIncludingSpaces({
            term: term,
            start: 0,
            count: 25
          }).then(function (tagList) {
            $scope.tagList = tagList;
            resolve(true);
            refreshDebounce();
          }, function (error) {
            console.error("couldn't get user tag list", error);
            reject(error);
            refreshDebounce();
          });
        })
      }
      else {
        console.warn("Pending Search for '" + term + "' or debouncing search");
        return pendingSearch;
      }
    }

    //todo: Add spinner in UI while searching
    function searchHashTags(term) {
      if (!term || !debounceSearch()) return;

      //when we're not searching from the search box but from main text-area
      //we need to pass this value to be shown in search input when the UI is expanded
      $scope.form.searchTerm = term;
      //console.log("searching for: "+term);

      TagsService.searchHashtagsWS({
        term: term
      }).then(function (hashList) {
        $scope.hashList = hashList;
        refreshDebounce();
      }, function (error) {
        console.error("couldn't get hashtag list", error);
      });
    }


    $scope.toggleSelectTag = function (item, type) {

      if (!$scope.areaIsExpanded) {
        var symbolAt;

        if (type == TAG) {
          symbolAt = $scope.form.description.lastIndexOf('@');
          $scope.form.description = $scope.form.description.slice(0, symbolAt + 1) + item.name;

          if ($scope.form.savedTags.indexOf(item) == -1)
            $scope.form.savedTags.push(item);
          else
            console.log("The tag @" + item.name + " is alredy in list")
        }
        else if (type == HASH) {
          symbolAt = $scope.form.description.lastIndexOf('#');
          $scope.form.description = $scope.form.description.slice(0, symbolAt + 1) + item.hash;

          if ($scope.form.savedHashes.indexOf(item) == -1)
            $scope.form.savedHashes.push(item);
          else
            console.log("The hashtag #" + item.hash + " is alredy in list")
        }

        taskDoing = NONE;
        textForSearch = "";
        $scope.tagList = [];
        $scope.hashList = [];
        focusTextArea();
        return;
      }

      item.isSelected = !item.isSelected;

      var idx = -1;
      if (type == TAG) {
        idx = tagsSelected.indexOf(item);
        idx > -1 ? tagsSelected.splice(idx, 1) : tagsSelected.push(item);
      }
      else if (type == HASH) {
        idx = hashtagsSelected.indexOf(item);
        idx > -1 ? hashtagsSelected.splice(idx, 1) : hashtagsSelected.push(item);
      }
    };

    function unselectAllItems() {
      $scope.tagList.forEach(function (item) {
        item.isSelected = false;
      });

      $scope.hashList.forEach(function (item) {
        item.isSelected = false;
      });
    }


    function refreshDebounce() {
      lastSearch = 0;
      pendingSearch = null;
      cancelSearch = angular.noop;
    }

    /**
     * Debounce if querying faster than 300ms
     */
    function debounceSearch() {
      var now = new Date().getMilliseconds();
      lastSearch = lastSearch || now;
      return ((now - lastSearch) < 300);
    }


    $scope.okClicked = function () {
      if (!$scope.areaIsExpanded) {
        $scope.form.savedTags = TagsService.removeTagsNotFoundInText($scope.form.description, $scope.form.savedTags);
        //console.log("tagsModalCtrl: Sendig the form", $scope.form);
        locals.dialog.hide($scope.form);
      }
      else {
        if (!tagsSelected.length && !hashtagsSelected.length)
          return;

        $scope.form.savedTags = $scope.form.savedTags.concat(tagsSelected);
        $scope.form.savedHashes = $scope.form.savedHashes.concat(hashtagsSelected);

        tagsSelected.forEach(function (tag, index) {
          if (index === 0) {
            var symbolAt = $scope.form.description.lastIndexOf('@');
            $scope.form.description = $scope.form.description.slice(0, symbolAt + 1) + tag.name;
          }
          else
            $scope.form.description += ' @' + tag.name;
        });

        hashtagsSelected.forEach(function (tag, index) {
          if (index === 0) {
            var symbolAt = $scope.form.description.lastIndexOf('#');
            $scope.form.description = $scope.form.description.slice(0, symbolAt + 1) + tag.hash;
          }
          else
            $scope.form.description += ' #' + tag.hash;
        });


        if($scope.form.description.charAt($scope.form.description.length-1) !== ' ')
          $scope.form.description += ' ';

        tagsSelected = [];
        hashtagsSelected = [];
        $scope.tagList = [];
        $scope.hashList = [];

        $scope.expandSearchArea(false);
      }
    };

    $scope.cancelClicked = function () {
      if (!$scope.areaIsExpanded) {
        locals.dialog.cancel();
      }
      else {
        unselectAllItems();
        tagsSelected = [];
        hashtagsSelected = [];
        $scope.expandSearchArea(false);
      }
    };

    var deregisterHardBack = Utils.$ionicPlatform.registerBackButtonAction(
      $scope.cancelClicked, 101
    );

    // cancel custom back behaviour
    $scope.$on('$destroy', function () {
      //console.log("deregistering back button");
      deregisterHardBack();
    });
  }])

  .controller('onBoardingCtrl', ['$rootScope', '$scope', 'Utils', 'locals',
    function ($rootScope, $scope, Utils, locals) {
      //background-image: url(img/LogoHeader.png);
      //Utils.translate('GROUPS.TIMELINE_WRAPPER.DIALOG.UPLOAD_LOCKED_ERR')
      $scope.prepareImages = function () {
        var whatLang = Utils.translate('ONBOARDING.LANGUAJE');
        $scope.onBoardingList = [
          {"imageUrl": "img/1"+whatLang+".jpg", "position": 1},
          {"imageUrl": "img/2"+whatLang+".jpg", "position": 2},
          {"imageUrl": "img/3"+whatLang+".jpg", "position": 3},
          {"imageUrl": "img/4"+whatLang+".jpg", "position": 4},
          {"imageUrl": "img/5"+whatLang+".jpg", "position": 5},
          {"imageUrl": "img/6"+whatLang+".jpg", "position": 6},
          {"imageUrl": "img/7"+whatLang+".jpg", "position": 7}
        ];
      };
      $scope.prepareImages();


      $scope.closeModal = function () {
        window.localStorage.setItem("onboardingComplete", "yes");
        locals.dialog.cancel();
      }

      $scope.updateSlideStatus = function(panel) {
        console.log("it's", panel);
        if(panel==7){
          $scope.closeModal();
        } else {
          console.log("still onboard");
        }
      }

      /*$scope.doubleTapped = function(panel) {
        console.log("it's", panel);
      }*/

    }])

  .controller('adConfigEditionCtrl', ['$rootScope', '$scope', 'locals', 'TimeLineService', 'adsService', '$ionicPickerI18n', 'Utils',
    function ($rootScope, $scope, locals, TimeLineService, adsService, $ionicPickerI18n, Utils) {
      $scope.sequence = {
        advertisement: {
          header: {
            bgColor: locals.sequence.advertisement.header.bgColor,//<-- editable field
            color: locals.sequence.advertisement.header.color//<-- editable field
          }
        },
        content: {
          type: locals.sequence.content.type,
          templateId: locals.sequence.content.templateId,
          templateIdBackup: locals.sequence.content.templateIdBackup,
          items: locals.sequence.content.items
        },
        comments: {
          enabled: locals.sequence.comments.enabled//<-- editable field
        },
        description: {
          title: locals.sequence.description.title
        },
        metadata: {
          dateTime: locals.sequence.metadata.dateTime,
          finalDate: /*locals.sequence.metadata.finalDate || */new Date(locals.sequence.metadata.finalDate)//<-- editable field
        },
        share: {
          enabled: locals.sequence.share.enabled//<-- editable field
        },
        ownerMetadata: {
          avatar: locals.sequence.ownerMetadata.avatar,
          name: locals.sequence.ownerMetadata.name
        }
      };

      //console.log("sequence", $scope.sequence);

      $scope.customColors = adsService.customColors;

      $scope.dateTimePickerTitle = Utils.translate("UPLOAD.DATETIME_PICKER.TITLE");

      $ionicPickerI18n.weekdays = adsService.getWeekdaysLocalized();
      $ionicPickerI18n.months = adsService.getMonthsLocalized();

      $ionicPickerI18n.ok = Utils.translate("GLOBAL.OK");
      $ionicPickerI18n.cancel = Utils.translate("GLOBAL.CANCEL");

      $scope.okClicked = function () {
        locals.dialog.hide($scope.sequence);//the new values
        var promises = [];
        promises.push(updateHeaderBgColor());
        promises.push(updateHeaderFontColor());
        promises.push(updateExpirationDate());
        promises.push(updateCommentsEnabled());
        promises.push(updateShareability());

        Utils.loading.show();
        Utils.$q.all(promises).then(function (responses) {
          Utils.loading.hide();
          Utils.toast.success(Utils.translate('SEQUENCE.DIALOG.AD_SETTINGS_UPDATE_OK'));
          $rootScope.$broadcast('advertisement.settings.updated', {sequence: locals.sequence});
        }, function (errors) {
          Utils.loading.hide();
          Utils.toast.warning(Utils.translate('SEQUENCE.DIALOG.AD_SETTINGS_UPDATE_ERROR'));
          console.log("couldn't update ad settings", errors);
        })
      };

      $scope.cancelModal = function () {
        locals.dialog.cancel();
      };

      var deregisterHardBack = Utils.$ionicPlatform.registerBackButtonAction(
        $scope.cancelModal, 101
      );

      // cancel custom back behaviour
      $scope.$on('$destroy', function () {
        deregisterHardBack();
      });

      $scope.trustAsHtml = function (text) {
        return Utils.$sce.trustAsHtml(text);
      };

      //hack to get the picker on top
      var mdBackdrop, statementContainer;
      $scope.hideStatementFormAndBackdrop = function () {
        mdBackdrop = document.getElementsByTagName('md-backdrop');
        statementContainer = document.getElementsByClassName('md-dialog-container');
        if (mdBackdrop) mdBackdrop[0].style.opacity = 0;
        if (statementContainer && statementContainer[0]) statementContainer[0].style.display = 'none';

        setTimeout(function () {
          $ionicPickerI18n.popup.then(function () {
            restoreStatementVisibility();
          });
        }, 800)

      };

      function restoreStatementVisibility() {
        if (mdBackdrop) mdBackdrop[0].style.opacity = .48;
        if (statementContainer && statementContainer[0]) statementContainer[0].style.display = 'flex';
      }

      /**
       * @return Promise {boolean|*}
       */
      function updateHeaderBgColor() {
        return Utils.$q(function (resolve, reject) {
          if ($scope.sequence.advertisement.header.bgColor === locals.sequence.advertisement.header.bgColor)
            return resolve(false);

          adsService.changeHeaderBgColor(
            locals.sequence.metadata.instanceId,
            $scope.sequence.advertisement.header.bgColor
          ).$promise.then(function (resp) {
            locals.sequence.advertisement.header.bgColor = $scope.sequence.advertisement.header.bgColor;
            resolve(true);
          }, function (error) {
            reject(error);
          })
        })
      }

      /**
       * @return Promise {boolean|*}
       */
      function updateHeaderFontColor() {
        return Utils.$q(function (resolve, reject) {
          if ($scope.sequence.advertisement.header.color === locals.sequence.advertisement.header.color)
            return resolve(false);

          adsService.changeHeaderFontColor(
            locals.sequence.metadata.instanceId,
            $scope.sequence.advertisement.header.color
          ).$promise.then(function (resp) {
            locals.sequence.advertisement.header.color = $scope.sequence.advertisement.header.color;
            resolve(true);
          }, function (error) {
            reject(error);
          })
        })
      }

      /**
       * @return Promise {boolean|*}
       */
      function updateCommentsEnabled() {
        return Utils.$q(function (resolve, reject) {
          if ($scope.sequence.comments.enabled === locals.sequence.comments.enabled)
            return resolve(false);

          cqnzService.toggleEnableSequenceCommentsWS(
            locals.sequence.metadata.instanceId,
            $scope.sequence.comments.enabled
          ).then(function (resp) {
            locals.sequence.comments.enabled = $scope.sequence.comments.enabled;
            resolve(true);
          }, function (error) {
            reject(error);
          })
        })
      }

      /**
       * @return Promise {boolean|*}
       */
      function updateExpirationDate() {
        return Utils.$q(function (resolve, reject) {
          if ($scope.sequence.metadata.finalDate === locals.sequence.metadata.finalDate)
            return resolve(false);

          adsService.changeExpirationDate(
            locals.sequence.metadata.instanceId,
            $scope.sequence.metadata.finalDate
          ).$promise.then(function (resp) {
            locals.sequence.metadata.finalDate = $scope.sequence.metadata.finalDate;
            resolve(true);
          }, function (error) {
            reject(error);
          })
        })
      }

      /**
       * @return Promise {boolean|*}
       */
      function updateShareability() {
        return Utils.$q(function (resolve, reject) {
          if ($scope.sequence.share.enabled === locals.sequence.share.enabled)
            return resolve(false);
        })
      }
    }])
;
