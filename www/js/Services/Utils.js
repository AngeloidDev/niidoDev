"use strict";

appServices
  .factory('Utils', ['$ionicPlatform', "$ionicLoading", "$ionicPopup", "$ionicPopover", '$ionicModal', "$ionicActionSheet", "$q", "$filter", '$compile', "$ionicScrollDelegate", "$mdDialog", "$mdToast", "$mdBottomSheet", "$sce", 'md5', 'toastr', 'toastrConfig',
    function ($ionicPlatform, $ionicLoading, $ionicPopup, $ionicPopover, $ionicModal, $ionicActionSheet, $q, $filter, $compile, $ionicScrollDelegate, $mdDialog, $mdToast, $mdBottomSheet, $sce, md5, toastr, toastrConfig) {

      /**
       * Gets the platform name
       * @returns {string}
       */
      function platformName() {
        //console.log(ionic.Platform.platform().toLowerCase())
        return ionic.Platform.platform().toLowerCase();
      }

      /**
       * @returns {boolean}
       */
      function isAndroid() {
        return ionic.Platform.isAndroid();
      }

      /**
       * @returns {boolean}
       */
      function isIOS() {
        return ionic.Platform.isIOS()
      }

      var alert = {
        getCtrl: function () {
          return $mdDialog
        },
        /**
         * @param msg {string}
         * @param {Object?} config
         * @param {string} [config.title=WARNING],
         * @param {string} [config.okText=OK],
         * @param {string} [config.okClass=md-primary]
         * @returns {Promise}
         */
        show: function (msg, config) {
          var deferred = $q.defer();
          config = config || {};
          $mdDialog.show({
            multiple: true,
            controller: "DialogController",
            templateUrl: "templates/partials/dialogsPopupTpl.html",
            //targetEvent:e,
            locals: {
              displayOption: {
                title: config.title || $filter('translate')('GLOBAL.WARNING'),
                content: msg,
                ok: config.okText || $filter('translate')('GLOBAL.OK'),
                okClass: config.okClass || 'md-primary',
                cancel: ""
              }
            }
          }).then(function () {
            deferred.resolve(true)
          });
          return deferred.promise;
        }
      };

      var confirm = {
        getCtrl: function () {
          return $mdDialog
        },
        /**
         * @param msg {string}
         * @param config? {{
         *   title?:string,
         *   okText?:string,
         *   okClass?:string,
         *   cancelText?:string,
         *   cancelClass?:string,
         *   invertedButtons:boolean
         * }}
         * @returns {Promise}
         */
        show: function (msg, config) {
          var deferred = $q.defer();
          config = config || {};
          $mdDialog.show({
            multiple: true,
            controller: "DialogController",
            templateUrl: "templates/partials/dialogsPopupTpl.html",
            //targetEvent:e,
            locals: {
              displayOption: {
                title: config.title || $filter('translate')('GLOBAL.CONFIRM_ACTION'),
                content: msg,
                ok: config.okText || $filter('translate')('GLOBAL.OK'),
                okClass: config.okClass || (config.invertedButtons ? 'md-primary' : ''),
                cancel: config.cancelText || $filter('translate')('GLOBAL.CANCEL'),
                cancelClass: config.cancelClass || (config.invertedButtons ? '' : 'md-primary'),
                invertedButtons: config.invertedButtons | false
              }
            }
          }).then(function () {
            deferred.resolve(true)
          }, function () {
            deferred.resolve(false)
          });
          return deferred.promise;
        }
      };

      var prompt = {
        //getCtrl:{},
        /**
         * @type {Function|function}
         * @param opts {Object}
         * @param opts.template {string}
         * @param opts.title {string}
         * @param opts.subTitle {string?}
         * @param opts.scope {Object}
         * @param opts.buttons {Object[]}
         * @param opts.buttons.text {string}
         * @param opts.buttons.type {string?}
         * @param opts.buttons.onTap {Function|function}
         * @returns {Promise}
         */
        show:
          function xdd(opts) {
            return $ionicPopup.show({
              template: opts.template,
              title: opts.title,
              subTitle: opts.subTitle,
              scope: opts.scope,
              buttons: opts.buttons
            })
          }
      };

      var toast = {
        getCtrl: function () {
          return toastr
        },
        info: function (msg, delayOrPosition, position) {
          var delay = (typeof delayOrPosition === 'number' ? delayOrPosition : 3000);
          position = (typeof delayOrPosition === 'string' ? delayOrPosition : position);

          toastrConfig.positionClass = (position === 'top' ? 'toast-top-full-width' : 'toast-bottom-full-width');

          toastr.info(msg, translate('GLOBAL.INFORMATION'), {timeOut: delay});

        },
        success: function (msg, delayOrPosition, position) {
          var delay = (typeof delayOrPosition === 'number' ? delayOrPosition : 3000);
          position = (typeof delayOrPosition === 'string' ? delayOrPosition : position);

          toastrConfig.positionClass = (position === 'top' ? 'toast-top-full-width' : 'toast-bottom-full-width');

          toastr.success(msg, translate('GLOBAL.SUCCESS'), {timeOut: delay})
        },
        warning: function (msg, delayOrPosition, position) {
          var delay = (typeof delayOrPosition === 'number' ? delayOrPosition : 4000);
          position = (typeof delayOrPosition === 'string' ? delayOrPosition : position);

          toastrConfig.positionClass = (position === 'top' ? 'toast-top-full-width' : 'toast-bottom-full-width');

          toastr.warning(msg, translate('GLOBAL.WARNING'), {timeOut: delay})
        },
        error: function (msg, delayOrPosition, position) {
          var delay = (typeof delayOrPosition === 'number' ? delayOrPosition : 5000);
          position = (typeof delayOrPosition === 'string' ? delayOrPosition : position);

          toastrConfig.positionClass = (position === 'top' ? 'toast-top-full-width' : 'toast-bottom-full-width');

          toastr.error(msg, translate('GLOBAL.ERROR'), {timeOut: delay});
        },
        /**
         * @param {string} msg
         * @param {number|string|null} delay - default 3000 ms
         * @param {'top'|'bottom'|null} position - default 'bottom'
         */
        show: function (msg, delay, position) {
          if (delay)
            toast.error(msg, delay, position);
          else
            toast.success(msg, position)
        }
      };

      var modal = {
        getCtrl: function () {
          return $mdDialog
        },
        /**
         * controller: default 'ModalController'
         * parent: default document.body
         * clickOutsideToClose: default true
         * fullscreen: default true
         *
         * @param config {{
         * controller:string,
         * templateUrl:string,
         * template:string,
         * parent:string,
         * targetEvent:string,
         * locals:object,
         * clickOutsideToClose:boolean,
         * fullscreen: boolean,
         * multiple: boolean}}
         * @returns {Promise|promise}
         */
        show: function (config) {
          return $mdDialog.show({
            controller: config.controller || 'ModalController',
            templateUrl: config.templateUrl,
            template: config.template, //inline template
            parent: config.parent || angular.element(document.body),
            targetEvent: config.targetEvent,
            locals: config.locals,//local variables
            clickOutsideToClose: config.clickOutsideToClose || true,
            fullscreen: config.fullscreen || true, // Only for -xs, -sm breakpoints.
            multiple: config.multiple || false
          });
        }
      };

      var loading = {
        getCtrl: function () {
          return $ionicLoading
        },
        /**
         * @param content? {string|null}
         * @param tpl? {string|null}
         */
        show: function (content, tpl) {
          $ionicLoading.show({
            template: tpl,
            content: '<ion-spinner icon="lines" class="spinner-assertive"></ion-spinner><br/>' + (content || ''),
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
          });
        },
        hide: function () {
          $ionicLoading.hide()
        }
      };

      var mdListBottomSheet = {
        getCtrl: function () {
          return $mdBottomSheet
        },
        /**
         * @param config {{templateUrl:string,controller:string}}
         * @returns {promise}
         */
        show: function (config) {
          return $mdBottomSheet.show({
            templateUrl: config.templateUrl,
            controller: config.controller || "GroupListBottomSheetCtrl"
            //,targetEvent: config.targetEvent,
            //scope:config.scope//$scope.$new(!1)
          })
        },
        hide: function () {
          $mdBottomSheet.hide()
        }
      };

      /*
       * From ionic docs:
       * Popover is built on top of $ionicPopover
       * Be sure to call remove() when you are done with each popover to clean it up and avoid memory leaks.
       * options: {scope: {object=} The scope to be a child of. Default: creates a child of $rootScope.
       * focusFirstInput:{boolean=} Whether to autofocus the first input of the popover when shown. Default: false.
       * backdropClickToClose:{boolean=} Whether to close the popover on clicking the backdrop. Default: true.
       * hardwareBackButtonClose:{boolean=} Whether the popover can be closed using the hardware back button on Android and similar devices. Default: true.}}
       */
      var ionicPopover = {
        getCtrl: function () {
          return $ionicPopover;
        },
        /**
         * @param template {string} html template
         * @param options {
         *  {
         *   scope: object,
         *   focusFirstInput: boolean,
         *   backdropClickToClose: boolean,
         *   hardwareBackButtonClose:boolean
         *  }
         * }
         * @returns {Promise}
         */
        fromTemplate: function (template, options) {
          var deferred = $q.defer();

          $ionicPopover.fromTemplate(template, {
            scope: options.scope
          }).then(function (popover) {
            deferred.resolve(popover)
          }, function (error) {
            deferred.reject(error);
            console.error("Popover from TEMPLATE can't be created!", error);
            toast.warning("Popover from TEMPLATE can't be created!");
          });

          return deferred.promise;
        },
        /**
         * @param url {string} path of template
         * @param options {
         *  {
         *   scope: object,
         *   focusFirstInput: boolean,
         *   backdropClickToClose: boolean,
         *   hardwareBackButtonClose:boolean
         *  }
         * }
         * @returns {Promise}
         */
        fromTemplateUrl: function (url, options) {
          var deferred = $q.defer();

          $ionicPopover.fromTemplateUrl(url, {
            scope: options.scope
          }).then(function (popover) {
            deferred.resolve(popover)
          }, function (error) {
            deferred.reject(error);
            console.error("Popover from URL can't be created!", error);
            toast.warning("Popover from URL can't be created!");
          });

          return deferred.promise;
        }
      };

      var ionicActionSheet = {
        getCtrl: function () {
          return $ionicActionSheet
        },
        /**
         * Shows an actionSheet and returns a fnc that allows to close it
         * @param {Object} options
         * @param {Array} options.buttons
         * @param {string?} options.titleText,
         * @param options.cancelText:{string},
         * @param options.cancel: {Function|function},
         * @param options.buttonClicked:{Function|function},
         * @param options.destructiveText:{string|null},
         * @param {Function|function} options.destructiveButtonClicked
         *
         * @returns {Function|function}
         */
        show: function (options) {
          return $ionicActionSheet.show({
            buttons: options.buttons,
            titleText: options.titleText,
            cancelText: options.cancelText || $filter('translate')('GLOBAL.CANCEL'),
            cancel: options.cancel,//<-function
            buttonClicked: options.buttonClicked,//<-function
            destructiveText: options.destructiveText,
            destructiveButtonClicked: options.destructiveButtonClicked
          })
        }
      };

      function dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type: mime});
      }

      /**
       * gets the last component of a url string
       * i.e the value after the last slash
       * e.g. hello/world/123 will return '123'
       * @param url {string}
       * @returns {string}
       */
      function getLastUrlComponent(url) {
        return url.substring(url.lastIndexOf('/') + 1);
      }

      /**
       * @param user {{profilePictureUrl:string|null, profilePicture:string|null}}
       * @returns {string}
       */
      function getUserImgUrl(user) {
        if (user.profilePictureUrl)
          return user.profilePictureUrl + '?decache=' + Math.random();
        else
          return user.profilePicture ?
            "data:image/jpeg;base64," + user.profilePicture.split(':')[2] :
            "img/ProfilePhoto.svg";
      }

      /**
       * Returns the size in bytes of a variable or object
       * @param v {number|boolean|string|object}
       * @returns {number}
       */
      function sizeof(v) {
        var _2 = [v];
        var _3 = 0;
        for (var _4 = 0; _4 < _2.length; _4++) {
          switch (typeof _2[_4]) {
            case "boolean":
              _3 += 4;
              break;
            case "number":
              _3 += 8;
              break;
            case "string":
              _3 += 2 * _2[_4].length;
              break;
            case "object":
              var _5;
              if (Object.prototype.toString.call(_2[_4]) !== "[object Array]") {
                for (_5 in _2[_4]) {
                  _3 += 2 * _5.length;
                }
              }
              for (_5 in _2[_4]) {
                var _6 = false;
                for (var _7 = 0; _7 < _2.length; _7++) {
                  if (_2[_7] === _2[_4][_5]) {
                    _6 = true;
                    break;
                  }
                }
                if (!_6) {
                  _2.push(_2[_4][_5]);
                }
              }
          }
        }
        return _3;
      }

      /**
       * formats an amount of bytes that fits into: bytes|KiB|MiB|GiB
       * @param b {number} of bytes
       * @returns {string}
       */
      function formatByteSize(b) {
        return (b < 1024) ? (b + " bytes") :
          (b < 1048576) ? ((b / 1024).toFixed(3) + " KiB") :
            (b < 1073741824) ? ((b / 1048576).toFixed(3) + " MiB") :
              ((b / 1073741824).toFixed(3) + " GiB");
      }

      function convertHTMLEntity(text) {
        var span = document.createElement('span');

        return text.replace(/&[#A-Za-z0-9]+;/gi, function (entity) {
          span.innerHTML = entity;
          return span.innerText;
        });
      }

      /**
       * @param reference {string}
       * @returns {string}
       */
      function translate(reference) {
        return $filter('translate')(reference);
      }

      /**
       * Checks wheter the objectList is an array, if not is replaced by [] and ends here.
       * if so, checks wheter the last item in objectList has the ownProperty 'propertyToFind'
       * if not, the las item is removed from list, if so, nothing is done.
       * @param objectList {Object[]}
       * @param propertyToFind {string}
       */
      function removeLastItemIfHasNoAttribute(objectList, propertyToFind) {
        if (!(objectList instanceof Array)) {
          objectList = [];
          return;
        }

        if (objectList.length && !objectList[objectList.length - 1].hasOwnProperty(propertyToFind))
          objectList.pop();
      }


      /**
       * function to keep the keyboard open when hitting the htmlElement
       * @param htmlElement
       * @param callBack
       */
      function keepKeyboardOpenWhenHitting(htmlElement, callBack) {
        console.log("Adding event listeners");
        htmlElement.addEventListener("click", function (event) {
          stopBubble(event);
        });

        htmlElement.addEventListener("mousedown", function (event) {
          stopBubble(event);
        });

        htmlElement.addEventListener("touchdown", function (event) {
          stopBubble(event);
        });

        htmlElement.addEventListener("touchmove", function (event) {
          stopBubble(event);
        });

        htmlElement.addEventListener("touchend", function (event) {
          stopBubble(event);
          callBack()
        });

        htmlElement.addEventListener("mouseup", function (event) {
          callBack()
        });
      }

      function stopBubble(event) {
        event.preventDefault();
        event.stopPropagation();
      }

      /**
       * function to permit hidding the keyboard again
       * @param htmlElement
       */
      function doNotKeepKeyboardOpenWhenHitting(htmlElement) {
        console.log("Removing event listeners");
        htmlElement.removeEventListener("click", function () {
        });
        htmlElement.removeEventListener("mousedown", function () {
        });
        htmlElement.removeEventListener("touchdown", function () {
        });
        htmlElement.removeEventListener("touchmove", function () {
        });
        htmlElement.removeEventListener("touchend", function () {
        });
      }

      return {
        isIOS: isIOS,
        isAndroid: isAndroid,
        platformName: platformName,
        $ionicPlatform: $ionicPlatform,
        $ionicPopover: ionicPopover,
        $q: $q,
        $sce: $sce,
        $compile: $compile,
        $ionicScrollDelegate: $ionicScrollDelegate,
        $ionicActionSheet: ionicActionSheet,
        $ionicModal: $ionicModal,
        $filter: $filter,
        alert: alert,
        confirm: confirm,
        prompt: prompt,
        modal: modal,
        toast: toast,
        loading: loading,
        mdListBottomSheet: mdListBottomSheet,
        dataURLtoBlob: dataURLtoBlob,
        getLastUrlComponent: getLastUrlComponent,
        getUserImgUrl: getUserImgUrl,
        md5: md5,
        sizeof: sizeof,
        formatByteSize: formatByteSize,
        convertHTMLEntity: convertHTMLEntity,
        translate: translate,
        removeLastItemIfHasNoAttribute: removeLastItemIfHasNoAttribute,
        keepKeyboardOpenWhenHitting: keepKeyboardOpenWhenHitting,
        doNotKeepKeyboardOpenWhenHitting: doNotKeepKeyboardOpenWhenHitting
      };
    }])

;
