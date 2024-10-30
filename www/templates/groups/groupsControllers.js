"use strict";

appControllers
  .controller("groupMainpageCtrl", ['$rootScope', "$scope", "$state", "GroupsService", "UserService", 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, GroupsService, UserService, permissionValidationService, Utils) {

      /**
       * @type {string}
       */
      var mySubscription = UserService.get_USER_INSTANCE_HREF();

      $scope.totalMyGroups = 0;
      $scope.myGroupList = [];
      $scope.myPendingGroupList = [];
      $scope.searchTerm = "";

      var bannedGroupsList = [],
        lockedGroupsList = [];

      $rootScope.$on('groups.mine.reload', function () {
        loadMyGroups();
      });

      $rootScope.$on('sentRequest-cancelled', function () {
        loadOtherGroups();
      });

      function loadMyGroups() {
        bannedGroupsList = [];
        lockedGroupsList = [];
        $scope.isLoadingGroups = true;
        getBannedAndLockedGroupsForUser().then(function () {
          getUserGroups().then(function (groups) {
            $scope.myGroupList = groups;
            $scope.totalMyGroups = $scope.myGroupList.length;
            getGroupsWithPendingJoinRequests().then(function (pendingGroups) {
              //console.log(pendingGroups);
              $scope.myPendingGroupList = pendingGroups;
              //$scope.myGroupList = $scope.myGroupList.concat(pendingGroups);
              //console.log($scope.myGroupList);
            }, function (reason3) {
              console.error("getUserGroups", reason3);
              Utils.alert.show(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_USER_JOIN_REQS_ERR'));
            }).finally(function () {
              $scope.isLoadingGroups = false;
            })
          }, function (reason2) {
            console.error("getUserGroups", reason2);
            $scope.isLoadingGroups = false;
            Utils.alert.show(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_USER_GROUPS_ERR'));
          })
        }, function (reason) {
          console.error(reason);
          $scope.isLoadingGroups = false;
        })
      }

      loadMyGroups();

      //ZONE for querying user's groups


      /**
       * Gets and sets (the corresponding list) the groups where the user has been banned/locked from
       * @returns {Promise} - boolean
       */
      function getBannedAndLockedGroupsForUser() {
        return Utils.$q(function (resolve, reject) {
          GroupsService.getBannedGroupsForUser(mySubscription).then(function (bannedList) {
            //console.log("bannedList", bannedList);
            bannedGroupsList = bannedList;
            GroupsService.getLockedGroupsForUser(mySubscription).then(function (lockedList) {
              //console.log("lockedList", lockedList);
              lockedGroupsList = lockedList;
              resolve(true);
            }, function (getLockedError) {
              Utils.toast.error(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_LOCKED_GROUPS_ERR'));
              console.error(getLockedError);
              reject(getLockedError);
            })
          }, function (getBannedError) {
            Utils.toast.error(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_BANNED_GROUPS_ERR'));
            console.error(getBannedError);
            reject(getBannedError);
          });
        });
      }

      /**
       * Gets your groups including banned and locked ones
       * @returns {Promise} - Array{*}
       */
      function getUserGroups() {
        return Utils.$q(function (resolve, reject) {
          GroupsService.getUserGroups(mySubscription).then(function (getResponse) {
            //console.log("My Groups: ", getResponse);
            var groups = [];

            //remove the last item because it's normally a useless object
            if (!getResponse[getResponse.length - 1].group)
              getResponse.splice(getResponse.length - 1, 1);

            getResponse.forEach(function (resource) {
              if (GroupsService.checkIfIsBannedOrLockedGroup(bannedGroupsList, resource.group.href)) return;//<-- continue with nest item

              //console.log(GroupsService.getNumJoiningRequestsByGroup(resource.groupId))
              groups.push({
                id: resource.groupId,
                creationDate: resource.creationDate,
                href: resource.group.href,
                hrefId: Utils.getLastUrlComponent(resource.group.href),
                name: resource.groupName,
                description: resource.description,
                image: resource.url || 'img/photoFrame.svg',
                pendingJoinReqs: GroupsService.getNumJoiningRequestsByGroup(resource.groupId),
                privacy: resource.privacy,
                privacyTranslated: Utils.translate('GROUPS.MAIN_PAGE.' + resource.privacy.toUpperCase()),
                imAdministrator: resource.administrator,
                imModerator: resource.moderator,
                imBanned: GroupsService.checkIfIsBannedOrLockedGroup(bannedGroupsList, resource.group.href),
                imLocked: GroupsService.checkIfIsBannedOrLockedGroup(lockedGroupsList, resource.group.href),
                imMember: true
              });
            });
            resolve(groups);
          }, function (getError) {
            reject(getError);
            console.error(getError);
          });
        });
      }

      //END ZONE for querying user's groups


      $scope.activeTab = "myGroups";
      $scope.activateTab = function (tabName) {
        $scope.activeTab = tabName;
        $scope.searchTerm = "";

        if (tabName === "otherGroups") {
          Utils.$ionicScrollDelegate.scrollTop();
          loadOtherGroups();
        }
        else {
          loadMyGroups();
        }
      };

      $scope.totalOtherGroups = 0;
      $scope.otherGroupsList = [];

      /**
       * gets and returns a list of the groups in which the user has sent a joint request
       * @returns {Promise} - Array{*}
       */
      function getGroupsWithPendingJoinRequests() {
        return Utils.$q(function (resolve, reject) {
          GroupsService.getUserJoinRequests(mySubscription).then(function (joinResp) {
            //console.log(joinResp);
            var groupList = [];

            //remove the last item because it's normally a useless object
            if (!joinResp[joinResp.length - 1].groupId)
              joinResp.splice(joinResp.length - 1, 1);

            joinResp.forEach(function (resource) {
              groupList.push({
                id: resource.groupId,
                href: resource.group.href,
                hrefId: Utils.getLastUrlComponent(resource.group.href),
                groupMemberHrefId: Utils.getLastUrlComponent(resource.groupMember.href),
                name: resource.groupName,
                description: resource.description,
                image: resource.url || 'img/photoFrame.svg',
                privacy: resource.privacy,
                privacyTranslated: Utils.translate('GROUPS.MAIN_PAGE.' + resource.privacy.toUpperCase())
              });
            });
            resolve(groupList)
          }, function (joinError) {
            console.error(joinError);
            reject(joinError);
          })
        })
      }

      /**
       * gets the groups which the user has sent a join request then
       * gets all the public/private groups (where the user is not in)
       * by calling requestOtherGroups()
       * and with the 1st set of groups sets the join/pending to approve
       * title of the group's card button (send request or pending to approval)
       */
      function loadOtherGroups() {
        $scope.isLoadingGroups = true;
        GroupsService.getUserJoinRequests(mySubscription).then(function (joinResp) {
          //console.log(joinResp);
          var groupIdList = [];

          //remove the last item because it's normally a useless object
          if (!joinResp[joinResp.length - 1].groupId)
            joinResp.splice(joinResp.length - 1, 1);

          joinResp.forEach(function (resource) {
            groupIdList.push(resource.groupId);
          });
          requestOtherGroups(groupIdList)
        }, function (joinError) {
          console.error(joinError);
          Utils.toast.error(Utils.translate("GROUPS.MAIN_PAGE.DIALOG.GET_USER_JOIN_REQS_ERR"));
          requestOtherGroups([]);
        })
      }

      function requestOtherGroups(groupIdList) {
        GroupsService.getOtherGroups(mySubscription).then(function (otherGroups) {
          //console.log("Other groups",otherGroups);
          $scope.otherGroupsList = [];//clear current list

          //remove the last item because it's normally a useless object
          if (!otherGroups[otherGroups.length - 1].group)
            otherGroups.splice(otherGroups.length - 1, 1);

          otherGroups.forEach(function (resource) {
            $scope.otherGroupsList.push({
              id: resource.groupId,
              creationDate: resource.creationDate,
              hrefId: Utils.getLastUrlComponent(resource.group.href),
              name: resource.groupName,
              description: resource.description,
              image: resource.url || 'img/photoFrame.svg',
              privacy: resource.privacy,
              isPreview: true,
              imAdministrator: resource.administrator,
              imMember: false,
              requestSent: groupIdList.indexOf(resource.groupId) !== -1
            });
          });
          $scope.totalOtherGroups = $scope.otherGroupsList.length;
        }, function (getOtherGroupsError) {
          Utils.alert.show(Utils.translate("GROUPS.MAIN_PAGE.DIALOG.GET_OTHER_GROUPS_ERR"));
          console.error("getOtherGroupsError", getOtherGroupsError);
        }).finally(function () {
          $scope.isLoadingGroups = false;
        })
      }

      $scope.joinToPublicGroup = function (group) {
        Utils.loading.show();
        GroupsService.addMember(group.hrefId, mySubscription).then(function () {
          //console.log(joinResponse);
          GroupsService.getUserGroups(mySubscription).then(function (myGroups) {
            var foundIdx = -1;
            myGroups.some(function (resource, idx) {
              if (resource.group) {
                if (group.hrefId === Utils.getLastUrlComponent(resource.group.href)) {
                  foundIdx = idx;
                  return true;
                }
              }
            });

            Utils.loading.hide();
            loadMyGroups();
            $rootScope.$broadcast('group-modified');
            $state.go("menu.timeline", {prepareStatement: 0, groupIndex: foundIdx + 1})
          }, function (myGroupsError) {
            Utils.loading.hide();
            console.error(myGroupsError);
            //Utils.toast.error(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GET_USER_GROUPS_ERR'));

            //if couldn't get the new group id, send to general timeline
            $state.go("menu.timeline", {prepareStatement: 0})
          });
        }, function (joinError) {
          console.error(joinError);
          Utils.loading.hide();
          Utils.alert.show(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.JOIN_TO_THIS_ERR'));
        })
      };

      $scope.requestJoinToPrivateGroup = function (listIndex) {
        Utils.loading.show();
        GroupsService.addMember($scope.otherGroupsList[listIndex].hrefId, mySubscription).then(function () {
          Utils.toast.success(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.REQUEST_SENT_OK'));
          $scope.otherGroupsList[listIndex].requestSent = true;
        }, function (joinError) {
          Utils.alert.show(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.REQUEST_SENT_ERR'));
          console.error(joinError);
        }).finally(function () {
          Utils.loading.hide();
        })
      };

      $scope.showPublicTimelinePreview = function (otherGroup) {
        if (otherGroup.privacy === "Private") {
          Utils.toast.warning(Utils.translate('GROUPS.MAIN_PAGE.DIALOG.GROUP_IS_PRIVATE'));
          return
        }

        otherGroup.isPreview = true;
        $state.go("groupTimelinePreview", {groupData: otherGroup});
      };

      $scope.gotoCreateGroup = function () {
        $scope.popover.hide();
        setTimeout(function () {
          $state.go("groupsCreateStep1");
        }, 200)
      };

      $scope.gotoSentRequests = function () {
        $scope.popover.hide();
        setTimeout(function () {
          $state.go("groupSentRequests");
        }, 200)
      };

      $scope.gotoReceivedRequests = function () {
        $scope.popover.hide();
        setTimeout(function () {
          $state.go("groupReceivedRequests");
        }, 200)
      };

      $scope.confirmRejectRequest = function (listIndex) {
        Utils.confirm.show(
          Utils.translate("GROUPS.SENT_REQS.DIALOG.REJECT_REQ_CONF") +
          " <b>" + $scope.myPendingGroupList[listIndex].name + "</b>?"
        ).then(function (resp) {
          if (resp) {
            Utils.loading.show();
            GroupsService.removeMember($scope.myPendingGroupList[listIndex].groupMemberHrefId).then(function () {
              Utils.toast.success(Utils.translate("GROUPS.SENT_REQS.DIALOG.REJECT_REQ_OK"));
              $scope.myPendingGroupList.splice(listIndex, 1);
              //$rootScope.$broadcast('sentRequest-cancelled');
              //loadMyGroups();
            }, function (removeError) {
              console.error(removeError);
              Utils.toast.error(Utils.translate("GROUPS.SENT_REQS.DIALOG.REJECT_REQ_ERR"))
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        })
      };

      Utils.$ionicPopover.fromTemplateUrl(
        'groups-mainpage-popover.tpl.html', {
          scope: $scope
        }).then(function (popover) {
        $scope.popover = popover;
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
          $scope.popover.remove();
          //console.log('$destroy');
        });
      }, function (error) {
        console.error("Popover can't be created!", error)
      });

      // ------------------------- PERMISSIONS VALIDATION SECTION ---------------------------
      $scope.$_canCreateGroup = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canCreateGroup();
      };

      $scope.$_canSearchGroup = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canSearchGroup();
      };

      $scope.$_canReadOwnGroups = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canReadOwnGroups();
      };

      $scope.$_canReadOwnGroups = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canReadOwnGroups();
      };

      $scope.$_canReadOthersGroups = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canReadOthersGroups();
      };

      $scope.$_canReadReceivedJoinRequests = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canReadReceivedJoinRequests();
      };

      $scope.$_canReadSentJoinRequests = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canReadSentJoinRequests();
      };

      $scope.$_canManageGroupMembers = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canManageGroupMembers();
      };

      $scope.$_canUpdateGroup = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroup();
      };

      $scope.$_canCancelSentJoinRequest = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canCancelSentJoinRequest();
      };

      //for public groups
      $scope.$_canJoinToPublicGroup = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canJoinToPublicGroup();
      };

      //for private groups
      $scope.$_canSendJoinRequest = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canSendJoinRequest();
      };

      $scope.$_canSeeGroupInfo = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canSeeGroupInfo();
      };
    }])

  .controller("groupCreateStep1Ctrl", ["$rootScope", "$scope", "$state", 'AsyncSearch', "UserService", "GroupsService", 'Utils',
    function ($rootScope, $scope, $state, AsyncSearch, UserService, GroupsService, Utils) {
      $scope.$on("$ionicView.enter", function () {
        //the final selected members
        $scope.form = GroupsService.getGroupForm();
      });


      /**
       * the random users list
       * @type {{id:string, href:string, name:string, photo:string}[]}
       */
      $scope.randomUsersList = [];

      $scope.showNextForm = function () {
        $state.go("groupsCreateStep2")
      };

      $scope.isLoadingRandomUsers = false;
      (function getRandomUsers() {
        $scope.isLoadingRandomUsers = true;
        UserService.findUsersRandomWS({
          userInstanceId: UserService.get_USER_ID(),
          start: 0,
          count: 10
        }).$promise.then(
          /**
           * @param resp {{
           *   creationDate:string,
           *   name:string,
           *   profilePicture:string|null,
           *   profilePictureUrl:string|null,
           *   role:*,
           *   userBio:string,
           *   userSubscription:*
           * }|*}
           */
          function (resp) {
            $scope.isLoadingRandomUsers = false;
            Utils.removeLastItemIfHasNoAttribute(resp, 'userSubscription');
            //console.log(resp)

            resp.forEach(function (item) {
              resp.id = Utils.getLastUrlComponent(item.userSubscription.href);
              //item.name: <-- it's already in the resp obj
              item.href = item.userSubscription.href;
              item.avatar = Utils.getUserImgUrl(item);
              item.isSelected = false;
            });

            $scope.randomUsersList = resp;
          }, function (error) {
            console.log("getRandomUsers", error);
            $scope.isLoadingRandomUsers = false;
          })
      })();

      $scope.toggleSelectContact = function (user) {
        user.isSelected = !user.isSelected;

        var foundAt = null;

        //because the member could be created in different contexts, then their references could not be the same
        $scope.form.members.some(function (member, index) {
          if (member.href == user.href) return foundAt = index;
        });

        foundAt !== null ? $scope.form.members.splice(foundAt, 1) : $scope.form.members.push(user);
      };

      //Zone to open new page for add users
      $scope.openSearchModal = function () {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/groups/group-members-selection-modal.html',
          controller: 'GroupSearchUsersCtrl',
          locals: {
            previousUsers: $scope.form.members,//users previously selected in this modal
            dialog: dialog
          },
          clickOutsideToClose: false,
          fullscreen: true // Only for -xs, -sm breakpoints.
        }).then(
          /**
           * @param resp {[{
           *  id:string,
           *  href:string
           *  name:string,
           *  photo:string,
           * }] | []}
           */
          function (resp) {
            $scope.form.members = resp;

            //check if in modal some selected users were unselected and update their state
            $scope.randomUsersList.forEach(function (member) {
              member.isSelected = resp.some(function (user) {
                return user.href === member.href;
              })
            })
          });
      }
    }])

  .controller("groupCreateStep2Ctrl", ['$rootScope', '$scope', '$state', "ImageService", "FileService", "GroupsService", "s3", "UserService", 'Utils',
    function ($rootScope, $scope, $state, ImageService, FileService, GroupsService, s3, UserService, Utils) {
      $scope.form = GroupsService.getGroupForm();
      //console.log($scope.form);


      $scope.showListBottomSheet = function () {
        var hideSheet = Utils.$ionicActionSheet.show({
          buttons: [
            {text: Utils.translate('UPLOAD.TAKE') + ' <i class="icon ion-camera"></i>'},
            {text: Utils.translate('UPLOAD.FROM_GALLERY') + ' <i class="icon ion-images"></i>'}
          ],
          titleText: Utils.translate('UPLOAD.ADD'),
          cancelText: Utils.translate('GLOBAL.CANCEL'),
          buttonClicked: function (index) {
            hideSheet();
            FileService.cleanImages();

            switch (index) {
              case 0:
                ImageService.saveCameraMedia(index).then(function () {
                  $scope.form.image = FileService.images()[0];
                });
                break;
              case 1:
                ImageService.saveAlbumMedia({
                  width: 648,
                  height: 648,
                  quality: 100,
                  maximumImagesCount: 1
                }).then(function () {
                  $scope.form.image = FileService.images()[0];
                });
                break;
            }
          }
        });
      };


      /**
       * Creates a group (w/o photo),
       * Uploads and generates s3 image URL,
       * Updates the group's photo,
       * Adds members to the group
       */
      $scope.createGroup = function () {
        Utils.loading.show();

        registerGroup().then(function (createResponse) {
          //console.log("registerGroup", createResponse);
          var groupHrefIdHash = Utils.md5.createHash(
            Utils.getLastUrlComponent(createResponse.result.links["0"].href)
          );
          var photoKey = s3.prefix + '/grupo/' + groupHrefIdHash + '/portada/foto.jpg';

          uploadGroupImage(photoKey).then(function (uploadResponse) {
            //console.log("uploadGroupImage", uploadResponse);
            updateGroupImage(createResponse.result.instanceId, uploadResponse.Location).then(function () {
              //console.log("updateGroupImage", updateResponse);
              addMembers(createResponse.result.instanceId).then(function (addResponses) {
                //console.log("addMembers", addMembersResp);
                approveMembers(addResponses).then(function () {
                  GroupsService.resetGroupForm();
                  Utils.loading.hide();
                  $rootScope.$broadcast('group-modified');
                  $state.go("menu.timeline", {newGroupId: createResponse.result.instanceId});
                }, function (approveError) {
                  Utils.loading.hide();
                  Utils.alert.show(Utils.translate("GROUPS.CREATE_S2.DIALOG.APPROVE_MEMBERS_ERR"));
                  console.error("Can't approve user(s) because:", approveError);
                })
              }, function (addMembersErrors) {
                Utils.loading.hide();
                Utils.alert.show(Utils.translate('GROUPS.CREATE_S2.DIALOG.ADD_MEMBERS_ERR'));
                console.error("Can't add members because:", addMembersErrors);
              });
            }, function (updateGroupError) {
              Utils.loading.hide();
              //ToDo: delete s3 group image and DB group record???
              console.error("Can't update group image because: ", updateGroupError);
              Utils.alert.show(Utils.translate('GROUPS.CREATE_S2.DIALOG.SET_G_IMAGE_ERR'));
            })
          }, function (uploadS3Error) {
            Utils.loading.hide();
            //ToDo: delete DB group record???
            console.error("Can't upload group image because: ", uploadS3Error);
            Utils.alert.show(Utils.translate('GROUPS.CREATE_S2.DIALOG.ADD_G_IMAGE_ERR'));
          });
        }, function (createGroupError) {
          Utils.loading.hide();
          console.error("Can't create group because: ", createGroupError);
          Utils.alert.show(Utils.translate('GROUPS.CREATE_S2.DIALOG.CREATE_GROUP_ERR'));
        }).finally(function () {
          //console.log("createGroup().finally");
        });
      };

      /**
       * Creates a group w/o image (s3 url), it will be added afterwards
       * @returns {Promise}
       */
      function registerGroup() {
        return Utils.$q(function (resolve, reject) {
          var groupForm = GroupsService.getGroupForm();

          GroupsService.createGroup({
            userHref: UserService.get_USER_INSTANCE_HREF(),
            name: groupForm.name,
            privacy: groupForm.privacy,
            description: groupForm.description,
            url: ""
          }).then(function (createResponse) {
            resolve(createResponse);
          }, function (createGroupError) {
            console.error(createGroupError);
            reject(createGroupError);
          });
        });
      }

      /**
       * Uploads a file to s3
       * @param photoKey the s3 key (url)
       * @returns {Promise}
       */
      function uploadGroupImage(photoKey) {
        return Utils.$q(function (resolve, reject) {
          var s3Service = new AWS.S3({
            apiVersion: '2006-03-01',
            params: {Bucket: s3.bucket}
          });

          var file = Utils.dataURLtoBlob($scope.form.image);

          //time to upload the group's image...
          s3Service.upload({
            Key: photoKey,
            Body: file,
            ACL: 'public-read',
            ContentType: file.type
          }, function (uploadError, data) {
            if (uploadError)
              return reject(uploadError);

            resolve(data);
          });
        });
      }

      /**
       *
       * @param groupInstanceId
       * @param photoLocation
       * @returns {Promise}
       */
      function updateGroupImage(groupInstanceId, photoLocation) {
        return Utils.$q(function (resolve, reject) {
          GroupsService.updateGroupsPhoto(groupInstanceId, photoLocation).then(function (updateResponse) {
            if (updateResponse.result.value == true)
              resolve(updateResponse);
            else
              reject(updateResponse);
          }, function (updateError) {
            console.error("Can't update group's image url", updateError);
            reject(updateError);
          });
        });
      }

      /**
       * Adds members to a given group;
       * if there was at least 1 insert error: reject, otherwise: resolve
       * @param groupInstanceId
       * @returns {Promise} - [responses] || [errors]
       */
      function addMembers(groupInstanceId) {
        return Utils.$q(function (resolve, reject) {
          var promises = [];
          $scope.form.members.forEach(function (member, idx) {
            //console.log("GroupInstanceId: " + groupInstanceId);
            promises[idx] = GroupsService.addMember(groupInstanceId, member.href);
          });

          Utils.$q.all(promises).then(function (responses) {
            console.log(responses);
            resolve(responses);
          }, function (errors) {
            reject(errors);
          });
        });
      }

      /**
       * Only for those users that have been added to a private group
       * @param {Object[]} addResponses
       * @returns {Promise}
       */
      function approveMembers(addResponses) {
        return Utils.$q(function (resolve, reject) {
          var promises = [];

          addResponses.forEach(function (resource) {
            var groupHrefId = Utils.getLastUrlComponent(resource.result.members.groupMember.value.href);
            promises.push(GroupsService.approveJoinRequest(groupHrefId));
          });

          Utils.$q.all(promises).then(function (responses) {
            resolve(responses);
          }, function (errors) {
            reject(errors);
          });
        })
      }
    }])

  .controller("groupMembersManagementCtrl", ['$scope', '$state', 'AsyncSearch', 'UserService', 'GroupsService', 'permissionValidationService', 'Utils',
    function ($scope, $state, AsyncSearch, UserService, GroupsService, permissionValidationService, Utils) {
      //console.info("groupMembersManagementCtrl created!", $state.params);

      //Para validar si muestro o no el btn de remover user
      $scope.mySubscriptionHref = UserService.get_USER_INSTANCE_HREF();

      $scope.group = $state.params.group;
      $scope.imTheAdmin = false;

      $scope.membersList = [];

      // ZONE for searching, filtering  & adding contacts
      $scope.asyncContacts = [];
      //$scope.filterSelected = true;



      //ZONE for querying group's members
      var bannedList = [], lockedList = [];
      $scope.isLoadingMembers = true;
      GroupsService.getBannedUsersByGroup($scope.group.id).then(function (bannedListResp) {
        if (bannedListResp.length && !bannedListResp[bannedListResp.length - 1].group)
          bannedListResp.splice(bannedListResp.length - 1, 1);

        bannedList = bannedListResp;
        //console.log(bannedList)
        GroupsService.getLockedUsersByGroup($scope.group.id).then(function (lockedListResp) {
          lockedList = lockedListResp;
          //console.log(lockedList)
          loadMembers();
        }, function (lockedError) {
          Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.GET_LOCKED_USERS_ERR'));
          console.error(lockedError);
          $scope.isLoadingMembers = false;
        })
      }, function (bannedError) {
        Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.GET_BANNED_USERS_ERR'));
        console.error(bannedError);
        $scope.isLoadingMembers = false;
      });

      /**
       * User's States Chart
       * [0] = available state flag
       * [1] = current state flag
       * [-] = unavailable state flag (disabled/hidden)
       *
       *   8  |    4    |  2   |  1   |
       * ADMIN|MODERATOR|LOCKED|BANNED| State |Description
       *   0  |    0    |   0  |  0   | =  0  |Regular user
       *   -  |    -    |   -  |  1   | =  1  |Regular user banned *(don't show this user)
       *   -  |    -    |   1  |  -   | =  2  |Regular user locked
       *   -  |    1    |   -  |  -   | =  4  |Moderator user
       *   1  |    -    |   -  |  -   | =  8  |Admin user
       */
      function loadMembers() {
        $scope.membersList = [];
        GroupsService.getGroupMembers($scope.group.id).then(function (getResponse) {
          //remove the last item because it's normally a useless one
          if (!getResponse[getResponse.length - 1].userSubscription)
            getResponse.splice(getResponse.length - 1, 1);

          //console.log("Group Members", getResponse);

          getResponse.forEach(function (user) {
            if (user.userSubscription.href === $scope.mySubscriptionHref)
              $scope.imTheAdmin = user.administrator;

            user.isBanned = GroupsService.checkIfIsBannedOrLockedUser(bannedList, user.userSubscription.href);
            user.isLocked = GroupsService.checkIfIsBannedOrLockedUser(lockedList, user.userSubscription.href);

            if (!user.isBanned) {// || true) {//whether include or not the banned users
              $scope.membersList.push({
                avatar: Utils.getUserImgUrl(user),
                userSubscriptionHref: user.userSubscription.href,
                groupMemberHrefId: Utils.getLastUrlComponent(user.groupMember.href),
                bio: user.userBio,
                name: user.name,
                isAdmin: user.administrator,
                isModerator: user.moderator,
                isLocked: user.isLocked,
                isBanned: user.isBanned,
                idForUnlock: getUnlockedId(lockedList, user.userSubscription.href),
                roleFlag: calcUserRoleFlag(user)
              });
              //console.log(user.name + " state: ", calcUserRoleFlag(user));
            }

          });
          $scope.isLoadingMembers = false;
        }, function (getError) {
          Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.GET_MEMBERS_LIST_ERR'));
          console.error(getError);
          $scope.isLoadingMembers = false;
        })
      }


      /**
       *
       * @param userHref {string}
       * @returns {Promise}
       */
      function findUnlockIdForUser(userHref) {
        return Utils.$q(function (resolve, reject) {
          GroupsService.getLockedUsersByGroup($scope.group.id).then(function (lockedListResp) {
            resolve(getUnlockedId(lockedListResp, userHref));
          }, function (lockedError) {
            console.error(lockedError);
            reject(lockedError);
          })
        })
      }

      /**
       *
       * @param _lockedList {*}
       * @param userHref {string}
       * @returns {number|null}
       */
      function getUnlockedId(_lockedList, userHref) {
        //console.log(_lockedList, userHref);
        var id = null;
        _lockedList.some(function (res) {
          if (res.userSubscription && res.userSubscription.href === userHref) {
            id = Utils.getLastUrlComponent(res.userGroupLocked.href);
            return true;
          }
        });
        return id;
      }

      /**
       * Sets the user's role flag
       * @see User's State Chart
       * @param user
       * @returns {number}
       */
      function calcUserRoleFlag(user) {
        return ((user.administrator || user.isAdmin) || false) * 8 +
          ((user.moderator || user.isModerator) || false) * 4 +
          user.isLocked * 2 +
          user.isBanned;
      }


      //END ZONE for querying group's members


      //ZONE for adding members
      $scope.addMoreMembers = function () {
        Utils.loading.show();
        var addPromises = [];
        $scope.asyncContacts.forEach(function (member) {
          addPromises.push(
            GroupsService.addMember($scope.group.hrefId, member.href)
          );
        });

        Utils.$q.all(addPromises).then(function (allResponses) {
          //console.log("$q.all(addPromises): All members were added",allResponses);
          $scope.asyncContacts = [];

          var approvalPromises = [];
          allResponses.forEach(function (resource) {
            approvalPromises.push(GroupsService.approveJoinRequest(resource.result.instanceId));
          });

          Utils.$q.all(approvalPromises).then(function () {
            //console.log("$q.all(approvalPromises): All member's requests has been approved");
            Utils.toast.success(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.APPROVE_JOIN_OK'))
          }, function (error) {
            Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.APPROVE_JOIN_ERR'));
            console.error("$q.all(approvalPromises)", error);
          }).finally(function () {
            Utils.loading.hide();
            loadMembers();
          })
        }, function (allErrors) {
          Utils.loading.hide();
          loadMembers();
          Utils.alert.show(
            Utils.convertHTMLEntity(
              Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.ADD_MEMBERS_ERR')
            )
          ).then(function () {
            $state.go("groupReceivedRequests");
          });
          console.error("$q.all(addPromises): Can't add member to group (" + $scope.group.id + ") because: ", allErrors);
        });
      };
      //ZONE for adding members


      //verifies if the user already exists in the membersList
      /*$scope.$watch("asyncContacts.length", function (newLen, oldLen) {
        if ($scope.asyncContacts.length && GroupsService.checkIfIsBannedOrLockedUser(bannedList, $scope.asyncContacts[oldLen].userSubscriptionHref)) {
          $scope.asyncContacts.splice(oldLen, 1);
          Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.SELECT_BANNED_USER'));
        }
        else {
          $scope.membersList.some(function (contact) {
            if ($scope.asyncContacts[oldLen] && contact.userSubscriptionHref === $scope.asyncContacts[oldLen].userSubscriptionHref) {
              $scope.asyncContacts.splice(oldLen, 1);
              Utils.toast.warning(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.SELECT_EXISTING_USER'));
              return true;
            }
          });
        }
      });*/

      $scope.openMemberPopup = function ($mdMenu, ev) {
        $mdMenu.open(ev)
      };

      /*/Prompt-like dialog (with checkboxes)
      $scope.openMemberOptions = function (member) {
        setTimeout(function () {
          Utils.alert.getCtrl().show({
            templateUrl: "memberOptions.html",
            locals: {
              name: member.name,
              state: member.state,
              isAdmin: member.isAdmin,
              isModerator: member.isModerator,
              isBanned: member.isBanned,
              isLocked: member.isLocked,
              delete: false
            },
            controller: function ($scope, $mdDialog, locals) {
              $scope.locals = locals;
              $scope.stateChange = function () {
                if (locals.isAdmin)
                  locals.isModerator = true;

                locals.roleFlag=
                  locals.isAdmin * 8 +
                  locals.isModerator * 4 +
                  locals.isBanned * 2 +
                  locals.isLocked
              };
              $scope.ok = function () {
                $mdDialog.hide($scope.locals)
              };
              $scope.cancel = function () {
                $mdDialog.cancel()
              }
            }
          }).then(function (locals) {
            if (locals.delete)
              $scope.confirmRemoveMember(member);
            else
              applyNewState(member.state, locals);
          })
        }, 10);
      };

      function applyNewState(oldState, locals) {
        console.log(oldState + "=>" + locals.state)
      }*/

      /**
       * turns a given user into an admin
       * @param listIndex {number}
       */
      $scope.confirmToggleAdmin = function (listIndex) {
        var willBeAdmin = !$scope.membersList[listIndex].isAdmin;
        Utils.confirm.show(
          willBeAdmin ?
            Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.TURN_INTO_ADMIN_CONF') :
            Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.REVOKE_ADMIN_CONF'),
          {okClass: 'md-accent', cancelClass: 'md-primary'}
        ).then(function (resp_bool) {
          if (resp_bool) {
            Utils.loading.show();
            GroupsService.changeAdministrator($scope.membersList[listIndex].groupMemberHrefId, willBeAdmin).then(function () {
              $scope.membersList[listIndex].isAdmin = willBeAdmin;
              $scope.membersList[listIndex].roleFlag = calcUserRoleFlag($scope.membersList[listIndex]);
            }, function (turnAdminError) {
              Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.CHANGE_USER_ROL_ERR');
              console.error(turnAdminError)
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        });
      };

      /**
       *
       * @param listIndex {number}
       */
      $scope.confirmToggleModerator = function (listIndex) {
        var willBeModerator = !$scope.membersList[listIndex].isModerator;
        Utils.confirm.show(
          Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.TURN_INTO_' + (willBeModerator ? 'MODERATOR_CONF' : 'REGULAR_USER_CONF')),
          {okClass: 'md-accent', cancelClass: 'md-primary'}
        ).then(function (resp_bool) {
          if (resp_bool) {
            Utils.loading.show();
            GroupsService.changeModerator($scope.membersList[listIndex].groupMemberHrefId, willBeModerator).then(function () {
              $scope.membersList[listIndex].isModerator = willBeModerator;
              $scope.membersList[listIndex].roleFlag = calcUserRoleFlag($scope.membersList[listIndex]);
            }, function (turnModeratorError) {
              Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.CHANGE_USER_ROL_ERR');
              console.error(turnModeratorError)
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        });
      };

      $scope.confirmToggleLockUser = function (listIndex) {
        Utils.confirm.show(
          $scope.membersList[listIndex].isLocked ?
            Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.UNLOCK_USER_CONF') :
            Utils.convertHTMLEntity(
              Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.LOCK_USER_CONF')
            ),
          {okClass: 'md-accent', cancelClass: 'md-primary'}
        ).then(function (resp_bool) {
          if (resp_bool) {
            $scope.membersList[listIndex].isLocked ?
              checkBeforeUnlockUser(listIndex) : lockUser(listIndex, $scope.group.href);
          }
        });
      };

      function lockUser(listIndex, groupHref) {
        Utils.loading.show();
        GroupsService.lockUserFromGroup($scope.membersList[listIndex].userSubscriptionHref, groupHref).then(function () {
          $scope.membersList[listIndex].isLocked = true;
          $scope.membersList[listIndex].roleFlag = calcUserRoleFlag($scope.membersList[listIndex]);
        }, function (turnModeratorError) {
          Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.LOCK_USER_ERR'));
          console.error(turnModeratorError)
        }).finally(function () {
          Utils.loading.hide();
        })
      }

      function checkBeforeUnlockUser(listIndex) {
        if ($scope.membersList[listIndex].idForUnlock) {
          //console.log("1) unlocking the user with hrefid: "+$scope.membersList[listIndex].idForUnlock);
          doUnlockUser(listIndex, $scope.membersList[listIndex].idForUnlock);
        }
        else {
          Utils.loading.show();
          findUnlockIdForUser($scope.membersList[listIndex].userSubscriptionHref).then(function (id) {
            if (!id) {
              Utils.alert.show("Sorry, we don't know which user to unlock :(");
              return;
            }

            //console.log("2) unlocking the user with hrefid: "+id);
            doUnlockUser(listIndex, id);

          }, function (error) {
            Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.GET_LOCKED_USERS_ERR'));
            Utils.loading.hide();
          })
        }
      }

      function doUnlockUser(listIndex, idForUnlock) {
        Utils.loading.show();
        GroupsService.unlockUserFromGroup(idForUnlock).then(function () {
          $scope.membersList[listIndex].isLocked = false;
          $scope.membersList[listIndex].idForUnlock = null;
          $scope.membersList[listIndex].roleFlag = calcUserRoleFlag($scope.membersList[listIndex]);
          Utils.loading.hide();
        }, function (turnModeratorError) {
          Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.UNLOCK_USER_ERR'));
          console.error(turnModeratorError);
          Utils.loading.hide();
        });
      }

      $scope.confirmBanUser = function (listIndex, groupHref) {
        Utils.confirm.show(
          Utils.convertHTMLEntity(
            Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.BAN_USER_CONF')
          ),
          {okClass: 'md-accent', cancelClass: 'md-primary'}
        ).then(function (resp_bool) {
          if (resp_bool) {
            Utils.loading.show();
            GroupsService.banUserFromGroup($scope.membersList[listIndex].userSubscriptionHref, groupHref).then(function () {
              $scope.membersList[listIndex].isBanned = true;
              $scope.membersList[listIndex].roleFlag = calcUserRoleFlag($scope.membersList[listIndex]);

              //if user try to add it again, this list must have the banner item
              bannedList.push({
                userSubscription: {href: $scope.membersList[listIndex].userSubscriptionHref}
              });
            }, function (turnModeratorError) {
              Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.BAN_USER_ERR'));
              console.error(turnModeratorError)
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        });
      };


      //ZONE for removing members
      $scope.confirmRemoveMember = function (listIndex) {
        Utils.confirm.show(
          Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.DELETE_USER_CONF'),
          {okClass: 'md-accent', cancelClass: 'md-primary'}
        ).then(function (resp_bool) {
          if (resp_bool) {
            Utils.loading.show();
            GroupsService.removeMember($scope.membersList[listIndex].groupMemberHrefId).then(function () {
              $scope.membersList.splice(listIndex, 1);
              Utils.toast.success(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.DELETE_USER_OK'))
              //console.log("removeMember", removeResponse);
            }, function (removeError) {
              console.error("removeMember", removeError);
              Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.DELETE_USER_ERR') + " " + $scope.membersList[listIndex].name)
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        });
      }
      //END ZONE for removing members

      $scope.openSearchModal = function () {
        var dialog = Utils.alert.getCtrl();
        dialog.show({
          templateUrl: 'templates/groups/group-members-selection-modal.html',
          controller: 'GroupSearchUsersCtrl',
          locals: {
            previousUsers: $scope.asyncContacts,//users previously selected in this modal
            fixedUsers: $scope.membersList,//users that can't be unselected
            bannedList: bannedList,
            dialog: dialog
          },
          clickOutsideToClose: false,
          fullscreen: true // Only for -xs, -sm breakpoints.
        }).then(
          /**
           * @param resp {[{
           *  id:string,
           *  href:string
           *  name:string,
           *  photo:string,
           * }] | []}
           */
          function (resp) {
            console.log("resp", resp);
            $scope.asyncContacts = resp;
            $scope.addMoreMembers();
          });
      }


      // ------------------------- PERMISSIONS VALIDATION SECTION ---------------------------
      $scope.$_canManageGroupAdminMemberStatus = function (member) {
        return member.userSubscriptionHref != $scope.mySubscriptionHref && (
          UserService.USER_IS_SUPERADMIN() ||
          ($scope.imTheAdmin && permissionValidationService.canManageGroupMemberStatus())
        );
      };

      $scope.$_canManageGroupRegularMemberStatus = function (member) {
        return UserService.USER_IS_SUPERADMIN() || (
          $scope.imTheAdmin &&
          member.userSubscriptionHref != $scope.mySubscriptionHref &&
          permissionValidationService.canManageGroupMemberStatus()
        );
      };

      $scope.$_canUpdateGroupMemberAsAdmin = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroupMemberAsAdmin();
      };

      $scope.$_canUpdateGroupMemberAsModerator = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroupMemberAsModerator();
      };

      $scope.$_canUpdateGroupMemberLockedStatus = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroupMemberLockedStatus();
      };

      $scope.$_canUpdateGroupMemberBannedStatus = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroupMemberBannedStatus();
      };

      $scope.$_canAddGroupMember = function () {
        return UserService.USER_IS_SUPERADMIN() || $scope.imTheAdmin && permissionValidationService.canAddGroupMember();
      };

      $scope.$_canDeleteGroupMember = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canDeleteGroupMember();
      };
    }])

  .controller("groupSettingsCtrl", ["$rootScope", "$scope", '$state', '$ionicHistory', 's3', 'FileService', 'ImageService', 'GroupsService', 'UserService', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, $ionicHistory, s3, FileService, ImageService, GroupsService, UserService, permissionValidationService, Utils) {
      console.info("groupSettingsCtrl created!", $state.params);

      /**
       * {
       *  id:         number
       *  hrefId:     string
       *  name:       string
       *  description:string
       *  image:      string (url)
       * }
       */
      $scope.group = $state.params.group;

      var mySubscription = UserService.get_USER_INSTANCE_HREF();
      var myGroupSubscriptionHrefId = null;
      var groupHasBeenModified = false;
      var orgValues = {
        name: $scope.group.name,
        desc: $scope.group.description,
        priv: $scope.group.privacy
      };
      var tempImgLoaded = null;

      $scope.numOfUsersAvailablesForBecomingAdmin = 0;
      $scope.imTheAdmin = $scope.group.imAdministrator;
      $scope.imModertor = $scope.group.imModerator;
      $scope.imMember = $scope.group.imMember;
      $scope.hasValidChanges = false;

      var effectiveGroupMembers = [];
      var numOfOtherAdmins = 0;


      /* we must show the "Leave group" button when the group has more than 1 user (counting out the banned ones)*/
      $scope.totalUsers = 0;
      GroupsService.getGroupMembers($scope.group.id).then(function (resp) {
        //remove the last item because it's normally a useless object
        if (!resp[resp.length - 1].userSubscription)
          resp.splice(resp.length - 1, 1);

        getLockedAndBannedUsers().then(function () {
          resp.forEach(function (user) {
            if (user.userSubscription.href === mySubscription)
              myGroupSubscriptionHrefId = Utils.getLastUrlComponent(user.groupMember.href);
            else {
              user.isBanned = GroupsService.checkIfIsBannedOrLockedUser(bannedList, user.userSubscription.href);
              user.isLocked = GroupsService.checkIfIsBannedOrLockedUser(lockedList, user.userSubscription.href);

              if (!user.isBanned) {
                effectiveGroupMembers.push({
                  avatar: Utils.getUserImgUrl(user),
                  userSubscription: user.userSubscription.href,
                  groupMemberHrefId: Utils.getLastUrlComponent(user.groupMember.href),
                  bio: user.userBio,
                  name: user.name,
                  isAdmin: user.administrator,
                  isModerator: user.moderator,
                  isLocked: user.isLocked,
                  isBanned: user.isBanned
                });

                if (user.administrator)
                  numOfOtherAdmins++;
                else if (!user.isLocked)
                  $scope.numOfUsersAvailablesForBecomingAdmin++;
              }
            }
          });

          $scope.totalUsers = resp.length;
          //console.log("Members list: ", resp);
        }, function (error) {
          //Nothing to do, the errors are logged/printed out in the function
        });
      }, function (getAdminsError) {
        console.error(getAdminsError);
      });


      $scope.showListBottomSheet = function () {
        var hideSheet = Utils.$ionicActionSheet.show({
          buttons: [
            {text: Utils.translate('UPLOAD.TAKE') + ' <i class="icon ion-camera"></i>'},
            {text: Utils.translate('UPLOAD.FROM_GALLERY') + ' <i class="icon ion-images"></i>'}
          ],
          titleText: Utils.translate('UPLOAD.ADD'),
          cancelText: Utils.translate('GLOBAL.CANCEL'),
          buttonClicked: function (index) {
            hideSheet();

            FileService.cleanImages();

            switch (index) {
              case 0:
                ImageService.saveCameraMedia(index).then(function () {
                  //$scope.group.image = FileService.images()[0];
                  tempImgLoaded = FileService.images()[0];
                  if (tempImgLoaded)
                    updateImage();
                });
                break;
              case 1:
                ImageService.saveAlbumMedia({
                  width: 648,
                  height: 648,
                  quality: 100,
                  maximumImagesCount: 1
                }).then(function () {
                  //$scope.group.image = FileService.images()[0];
                  tempImgLoaded = FileService.images()[0];
                  if (tempImgLoaded)
                    updateImage();
                });
                break;
            }
          }
        });

        /*Utils.mdListBottomSheet.show({
          templateUrl: 'templates/partials/sheetBottomListTpl.html'
        }).then(function (index) {
          FileService.cleanImages();

          switch (index) {
            case 0:
              ImageService.saveCameraMedia(index).then(function () {
                //$scope.group.image = FileService.images()[0];
                tempImgLoaded = FileService.images()[0];
                updateImage();
              });
              break;
            case 1:
              ImageService.saveAlbumMedia({
                width: 648,
                height: 648,
                quality: 100,
                maximumImagesCount: 1
              }).then(function () {
                //$scope.group.image = FileService.images()[0];
                tempImgLoaded = FileService.images()[0];
                updateImage();
              });
              break;
          }
        }).catch(function (error) {
        //User clicked outside
        });*/
      };

      $scope.checkForChanges = function () {
        if (!$scope.group.name || !$scope.group.description)
          return $scope.hasValidChanges = false;


        return $scope.hasValidChanges = (
          $scope.group.name !== orgValues.name ||
          $scope.group.description !== orgValues.desc ||
          $scope.group.privacy !== orgValues.priv
        )
      };

      function updateImage() {
        console.log("Actualizando imagen...");
        Utils.loading.show();
        uploadGroupImage($scope.group.hrefId).then(function (uploadS3Response) {
          updateGroupImage($scope.group.hrefId, uploadS3Response.Location).then(function () {
            groupHasBeenModified = true;
            Utils.toast.success(Utils.translate('GROUPS.SETTINGS.DIALOG.UPDATE_IMAGE_OK'));
          }, function (updateDbError) {
            console.error(updateDbError);
            Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.UPDATE_IMAGE_ERR'))
          })
        }, function (uploadS3Error) {
          console.error(uploadS3Error);
          Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.UPLOAD_IMAGE_ERR'), {title: "Error"})
        }).finally(function () {
          Utils.loading.hide();
        });
      }

      /**
       *
       * @param groupHrefId {number|string}
       * @returns {Promise}
       */
      function uploadGroupImage(groupHrefId) {
        return Utils.$q(function (resolve, reject) {
          var s3Service = new AWS.S3({
            apiVersion: '2006-03-01',
            params: {Bucket: s3.bucket}
          });

          var photoKey = s3.prefix + '/grupo/' + Utils.md5.createHash(groupHrefId) + '/portada/foto.jpg';
          var file = Utils.dataURLtoBlob(tempImgLoaded);

          s3Service.upload({
            Key: photoKey,
            Body: file,
            ACL: 'public-read',
            ContentType: file.type
          }, function (uploadError, data) {
            if (uploadError) {
              console.log("Can't upload the image to S3: ", uploadError);
              return reject(uploadError);
            }

            $scope.group.image = tempImgLoaded;
            tempImgLoaded = null;
            resolve(data);
          });
        });
      }

      /**
       * Updates group image field on DB
       * @param groupHrefId {number}
       * @param imageUrl {string}
       * @returns {Promise}
       */
      function updateGroupImage(groupHrefId, imageUrl) {
        return Utils.$q(function (resolve, reject) {
          GroupsService.updateGroupsPhoto(groupHrefId, imageUrl).then(function (updateResponse) {
            if (updateResponse.result.value === true)
              resolve(updateResponse);
            else {
              reject(updateResponse);
            }
          }, function (updateError) {
            reject(updateError);
          });
        });
      }

      $scope.updateGroupFields = function () {
        //console.log($scope.group);
        Utils.loading.show();
        GroupsService.updateGroupFields({
          groupInstanceHrefId: $scope.group.hrefId,
          name: $scope.group.name,
          description: $scope.group.description,
          privacy: $scope.group.privacy
        }).then(function () {
          groupHasBeenModified = true;
          Utils.toast.success(Utils.translate('GROUPS.SETTINGS.DIALOG.UPDATE_DATA_OK'));
          $scope.hasValidChanges = false;
        }, function (updateError) {
          console.error("updateGroupFields", updateError);
          Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.UPDATE_DATA_ERR'));
        }).finally(function () {
          Utils.loading.hide();
        })
      };

      $scope.confirmLeave = function () {
        Utils.confirm.show(
          Utils.translate('GROUPS.SETTINGS.DIALOG.LEAVE_GROUP_CONF'),
          {okClass: 'md-accent', cancelClass: 'md-primary'}).then(function (resp_bool) {
          if (resp_bool) {

            if (!$scope.imTheAdmin || numOfOtherAdmins > 0)
              leaveGroup();
            else {
              showModalWithUsers();
            }
          }
        })
      };

      var bannedList = [], lockedList = [];

      /**
       * Gets and sets the locked and banned users lists
       * @returns {Promise}
       */
      function getLockedAndBannedUsers() {
        return Utils.$q(function (resolve, reject) {
          GroupsService.getBannedUsersByGroup($scope.group.id).then(function (bannedListResp) {
            bannedList = bannedListResp;
            //console.log(bannedList)
            GroupsService.getLockedUsersByGroup($scope.group.id).then(function (lockedListResp) {
              lockedList = lockedListResp;
              //console.log(lockedList)
              resolve(true);
            }, function (lockedError) {
              Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.GET_LOCKED_USERS_ERR'));
              console.error(lockedError);
              reject(lockedError);
            })
          }, function (bannedError) {
            Utils.alert.show(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.GET_BANNED_USERS_ERR'));
            console.error(bannedError);
            reject(bannedError);
          });
        });
      }

      //Execute this fnc when the user is not the group's admin
      function leaveGroup() {
        Utils.loading.show();
        GroupsService.removeMember(myGroupSubscriptionHrefId).then(function () {
          //console.log("removeMember", removeResponse);
          Utils.toast.success(Utils.translate('GROUPS.SETTINGS.DIALOG.LEAVE_GROUP_OK'));
          $rootScope.$broadcast('group-modified');
          window.localStorage.setItem('groupIndex', '0');
          $state.go('menu.groups', {}, {reload: true});
        }, function (removeError) {
          console.error("removeMember", removeError);
          Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.LEAVE_GROUP_ERR'))
        }).finally(function () {
          Utils.loading.hide();
        })
      }

      //Execute this fnc when the group has more than one user and the YOU are an admin
      function showModalWithUsers() {
        Utils.modal.show({
          templateUrl: 'templates/groups/group-delegate-admin-modal.html',
          locals: {
            membersList: effectiveGroupMembers,
            selectedUserHrefId: null
          }
        }).then(function (newData) {
          if (newData.selectedUserHrefId != null)
            changeAdminAndRemoveMe(newData.selectedUserHrefId);
        })
      }

      function changeAdminAndRemoveMe(groupMemberId) {

        Utils.loading.show();

        //make sure the group always has an admin
        GroupsService.changeAdministrator(groupMemberId/*number*/, true).then(function (/*updateResponse*/) {
          //console.log("changeAdministrator", updateResponse);
          Utils.loading.hide();

          //finally remove yor self...
          leaveGroup(); //because i'm not the admin anymore
        }, function (updateError) {
          Utils.loading.hide();
          Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.CHANGE_ADMIN_ERR'));
          console.error(updateError);
        })
      }

      $scope.confirmRemove = function () {
        Utils.confirm.show(
          Utils.translate('GROUPS.SETTINGS.DIALOG.REMOVE_GROUP_CONF'), {
            okClass: 'md-accent',
            cancelClass: 'md-primary'
          }).then(function (resp_bool) {
          if (resp_bool) {
            removeGroup($scope.group.hrefId)
          }
        })
      };

      /**
       * @param {string|number} groupHrefId
       */
      function removeGroup(groupHrefId) {
        Utils.loading.show();
        GroupsService.removeGroup(groupHrefId).then(function () {
          Utils.toast.success(Utils.translate('GROUPS.SETTINGS.DIALOG.REMOVE_GROUP_OK'));
          $rootScope.$broadcast('group-modified');
          window.localStorage.setItem('groupIndex', '0');
          $state.go("menu.groups", {}, {reload: true})
        }, function (removeError) {
          console.error(removeError);
          Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.REMOVE_GROUP_ERR'))
        }).finally(function () {
          Utils.loading.hide();
        })
      }

      /*
       * Not used for now...
       *
      function deletePendingRequests() {
        lookForPendingJoinReqs($scope.group.hrefId).then(function (requestList) {
          if(requestList.length){
            Utils.loading.hide();
            Utils.confirm.show(
              "There are some pending request to approve, do you wanto to..."
            ).then(function (boolResp) {
              if(boolResp){
                Utils.loading.show();
                removePendingRequests(requestList).then(function () {
                  removeGroup($scope.group.hrefId).then(function () {

                  }, function () {
                    Utils.alert.show(Utils.translate('GROUPS.SETTINGS.DIALOG.REMOVE_GROUP_ERR'))
                  });
                }, function (error) {
                  reject(error);
                  Utils.alert.show(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.REJECT_REQ_ERR"));
                })
              }
            })
          }
          else{resolve(true);}//<-- no pending requests
        }, function (requestsError) {
          reject(requestsError);
          Utils.alert.show(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.GET_RECEIVED_REQS_ERR"))
        });
      }

      /*
       * Verifies whether or not are requests for joining to a given group
       * @returns {Promise} - onSuccess(Group Join Requests Array), onError(error{*})
       *
      function lookForPendingJoinReqs(groupHrefId) {
        return Utils.$q(function (resolve, reject) {
          //This gets all the requests for all the user's groups
          GroupsService.getRequestsToAprove(UserService.getUserInfo().INSTANCE_URL).then(function (requestsList) {
            //console.log(requestsList);

            //remove the last item because it's normally a useless object
            if (!requestsList[requestsList.length - 1].userSubscription)
              requestsList.splice(requestsList.length - 1, 1);

            var groupReqs = [];
            requestsList.forEach(function (request) {
              //todo: el atributo: request.groupHrefId no existe, solicitar a adida lo agregue
              if(request.groupHrefId === groupHrefId){
                groupReqs.push({
                  group:{
                    hrefId:request.groupHrefId
                    //name:request.groupName,
                    //image: request.url
                  },
                  user:{
                    //avatar: Utils.getUserImgUrl(request),
                    userSubscriptionHref: request.userSubscription.href,
                    groupMemberHrefId: Utils.getLastUrlComponent(request.groupMember.href),
                    //bio: request.userBio,
                    //name: request.name
                  }
                });
              }
            });

            resolve(groupReqs);
          }, function (error) {
            console.error(error);
            reject(error);
          })
        })
      }

      /*
       * @param {Object[]} requestList
       * @returns {Promise} - onSuccess(true), onError(error)
       *
      function removePendingRequests(requestList) {
        return Utils.$q(function (resolve, reject) {
          var rmUserPromises = [];
          requestList.forEach(function (request) {
            rmUserPromises.push(
              GroupsService.removeMember(Utils.getLastUrlComponent(request.groupMember.href))
            );
          });

          Utils.$q.all(rmUserPromises).then(function () {
            resolve(true);
          }, function (rmUserErrors) {
            console.error(rmUserErrors);
            reject(rmUserErrors);
          })
        })
      }
      */

      $scope.goBack = function () {
        if (!$ionicHistory.backView().stateName) {
          if (groupHasBeenModified) $rootScope.$broadcast('group-modified');
          $ionicHistory.goBack();
          return;
        }

        var lastStateName = $ionicHistory.backView().stateName;
        if (groupHasBeenModified) {
          //console.log("Group has been modified, going to: " + lastStateName);

          //image/fields were modified
          $state.go(
            lastStateName,
            {
              group: $scope.group,
              groupIndex: $state.params.groupIndex ? $state.params.groupIndex + 1 : null
            }, {reload: true}
          );

          $rootScope.$broadcast('group-modified');
        }
        else {
          //console.log("Group has not been modified Going to " + lastStateName);
          $state.go(
            lastStateName,
            {
              group: $state.params.group,
              groupIndex: $state.params.groupIndex ? $state.params.groupIndex + 1 : null
            },
            {reload: false});
        }
      };

      // override hard back
      // registerBackButtonAction() returns a function which can be used to deregister it
      var deregisterHardBack = Utils.$ionicPlatform.registerBackButtonAction(
        $scope.goBack, 101
      );

      // cancel custom back behaviour
      $scope.$on('$destroy', function () {
        deregisterHardBack();
        //deregisterSoftBack();
      });


      // ------------------------- PERMISSIONS VALIDATION SECTION ---------------------------
      $scope.$_canUpdateGroupName = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroupName();
      };

      $scope.$_canUpdateGroupImage = function () {
        return UserService.USER_IS_SUPERADMIN() || ($scope.imTheAdmin && permissionValidationService.canUpdateGroupImage());
      };

      $scope.$_canUpdateGroupPrivacy = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canUpdateGroupPrivacy();
      };

      $scope.$_canLeaveGroup = function () {
        return $scope.imMember && (
          (!$scope.imTheAdmin && (UserService.USER_IS_SUPERADMIN() || permissionValidationService.canLeaveOthersGroup())) ||
          ($scope.numOfUsersAvailablesForBecomingAdmin > 0 && (UserService.USER_IS_SUPERADMIN() || permissionValidationService.canLeaveOwnGroup()))
        );
      };

      $scope.$_canRemoveGroup = function () {
        return UserService.USER_IS_SUPERADMIN() || (
          ($scope.imTheAdmin && permissionValidationService.canRemoveOwnGroup()) ||
          (permissionValidationService.canRemoveOthersGroup())
        );
      };
    }])

  .controller("GroupSentRequests", ['$rootScope', "$scope", "GroupsService", "UserService", "Utils",
    function ($rootScope, $scope, GroupsService, UserService, Utils) {

      $scope.loadingContent = true;
      $scope.groupsList = [];
      GroupsService.getUserJoinRequests(UserService.get_USER_INSTANCE_HREF()).then(function (requestsList) {
        //console.log(requestsList);

        //remove the last item because it's normally a useless object
        if (!requestsList[requestsList.length - 1].group)
          requestsList.splice(requestsList.length - 1, 1);

        requestsList.forEach(function (request) {
          $scope.groupsList.push({
            description: request.description,
            groupMemberHrefId: Utils.getLastUrlComponent(request.groupMember.href),
            href: request.group.href,
            id: request.groupId,
            image: request.url || 'img/photoFrame.svg',
            name: request.groupName,
            privacy: request.privacy
          })
        })
      }, function (requestsError) {
        console.error(requestsError);
        Utils.alert.show(Utils.translate("GROUPS.MAIN_PAGE.DIALOG.GET_USER_JOIN_REQS_ERR"));
      }).finally(function () {
        $scope.loadingContent = false;
      });

      $scope.confirmRejectRequest = function (listIndex) {
        Utils.confirm.show(
          Utils.translate("GROUPS.SENT_REQS.DIALOG.REJECT_REQ_CONF") +
          " <b>" + $scope.groupsList[listIndex].name + "</b>?"
        ).then(function (resp) {
          if (resp) {
            Utils.loading.show();
            GroupsService.removeMember($scope.groupsList[listIndex].groupMemberHrefId).then(function () {
              Utils.toast.success(Utils.translate("GROUPS.SENT_REQS.DIALOG.REJECT_REQ_OK"));
              $scope.groupsList.splice(listIndex, 1);
              $rootScope.$broadcast('sentRequest-cancelled');
            }, function (removeError) {
              console.error(removeError);
              Utils.toast.error(Utils.translate("GROUPS.SENT_REQS.DIALOG.REJECT_REQ_ERR"))
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        })
      }
    }])

  .controller("GroupReceivedRequests", ['$rootScope', "$scope", "GroupsService", "UserService", 'permissionValidationService', "Utils",
    function ($rootScope, $scope, GroupsService, UserService, permissionValidationService, Utils) {

      $scope.loadingContent = true;
      $scope.requestList = [];
      GroupsService.getRequestsToAprove(UserService.get_USER_INSTANCE_HREF()).then(function (requestsList) {
        //console.log(requestsList);

        //remove the last item because it's normally a useless object
        if (!requestsList[requestsList.length - 1].userSubscription)
          requestsList.splice(requestsList.length - 1, 1);

        requestsList.forEach(function (request) {
          $scope.requestList.push({
            group: {
              name: request.groupName,
              image: request.url
            },
            applicantMetadata: {
              avatar: Utils.getUserImgUrl(request),
              //userSubscriptionHref: request.userSubscription.href,
              groupMemberHrefId: Utils.getLastUrlComponent(request.groupMember.href),
              bio: request.userBio,
              name: request.name
            }
          })
        })
      }, function (requestsError) {
        console.error(requestsError);
        Utils.alert.show(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.GET_RECEIVED_REQS_ERR"))
      }).finally(function () {
        $scope.loadingContent = false;
      });

      $scope.confirmRejectRequest = function (listIndex) {
        Utils.confirm.show(
          Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.REJECT_REQ_CONF") +
          " <b>" + $scope.requestList[listIndex].applicantMetadata.name + "</b>?"
        ).then(function (resp) {
          if (!resp) return;

          Utils.loading.show();
          rejectOneRequest($scope.requestList[listIndex].applicantMetadata.groupMemberHrefId).then(function () {
            Utils.toast.success(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.REJECT_REQ_OK"));
            $scope.requestList.splice(listIndex, 1);
            $rootScope.$broadcast('groups.mine.reload');
          }, function (removeError) {
            console.error(removeError);
            Utils.toast.error(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.REJECT_REQ_ERR"))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.approveRequest = function (listIndex) {
        Utils.loading.show();
        acceptOneRequest($scope.requestList[listIndex].applicantMetadata.groupMemberHrefId).then(function (value) {
          Utils.toast.success(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.APPROVE_REQ_OK"));
          $scope.requestList.splice(listIndex, 1);
          $rootScope.$broadcast('groups.mine.reload');
        }, function (approveRequestError) {
          console.error("approveRequestError", approveRequestError);
          Utils.toast.error(Utils.translate("GROUPS.RECEIVED_REQS.DIALOG.APPROVE_REQ_ERR"))
        }).finally(function () {
          Utils.loading.hide();
        })
      };

      /**
       * @param groupMemberHrefId
       * @return Promise
       */
      function acceptOneRequest(groupMemberHrefId) {
        return GroupsService.approveJoinRequest(groupMemberHrefId)
      }

      function acceptAllRequests() {
        Utils.loading.show();

        var resolvedPromises = [];
        $scope.requestList.forEach(function (request) {
          resolvedPromises.push(acceptOneRequest(request.applicantMetadata.groupMemberHrefId))
        });

        Utils.$q.all(resolvedPromises).then(function (responses) {
          $scope.requestList = [];
          $rootScope.$broadcast('groups.mine.reload');
          Utils.toast.success(Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.APPROVE_ALL_REQ_OK'));
          Utils.loading.hide();
        }, function (errors) {
          Utils.loading.hide();
          console.error("acceptAllRequests", errors);
          Utils.toast.error(Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.REJECT_ALL_REQ_ERR'));
        })
      }

      /**
       * @param groupMemberHrefId
       * @return {Promise}
       */
      function rejectOneRequest(groupMemberHrefId) {
        return GroupsService.removeMember(groupMemberHrefId)
      }

      function rejectAllRequests() {
        Utils.loading.show();

        var resolvedPromises = [];
        $scope.requestList.forEach(function (request) {
          resolvedPromises.push(rejectOneRequest(request.applicantMetadata.groupMemberHrefId))
        });

        Utils.$q.all(resolvedPromises).then(function (responses) {
          $scope.requestList = [];
          $rootScope.$broadcast('groups.mine.reload');
          Utils.toast.success(Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.REJECT_ALL_REQ_OK'));
          Utils.loading.hide();
        }, function (errors) {
          Utils.loading.hide();
          console.error("rejectAllRequests", errors);
          Utils.toast.error(Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.REJECT_ALL_REQ_ERR'));
        })
      }

      $scope.$_canAcceptJoinRequests = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canAcceptJoinRequests();
      };

      $scope.$_canRejectJoinRequests = function () {
        return UserService.USER_IS_SUPERADMIN() || permissionValidationService.canRejectJoinRequests();
      };

      $scope.openBottomSheet = function () {
        Utils.$ionicActionSheet.show({
          buttons: [
            {text: Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.RECEIVED_ACCEPT_ALL') + ' <i class="icon myIcon-line-weight"></i>'}
          ],
          titleText: Utils.translate('SEQUENCE.OPTIONS'),
          buttonClicked: function (buttonIndex) {
            switch (buttonIndex) {
              case 0:
                Utils.confirm.show(
                  Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.ACCEPT_ALL_REQ_CONF')
                ).then(function (boolResp) {
                  if (!boolResp) return;
                  acceptAllRequests();
                });
                break;
              default:
                Utils.toast.warning("invalid option");
            }
            return true;
          },
          destructiveText: $scope.$_canAcceptJoinRequests() ? Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.RECEIVED_REJECT_ALL') + ' <i class="icon ion-close-round"></i>' : null,
          destructiveButtonClicked: $scope.$_canAcceptJoinRequests() ? function () {
            Utils.confirm.show(
              Utils.translate('GROUPS.RECEIVED_REQS.DIALOG.REJECT_ALL_REQ_CONF')
            ).then(function (boolResp) {
              if (!boolResp) return;
              rejectAllRequests()
            });
            return true;
          } : null
        })
      }
    }])

  .controller("GroupSearchUsersCtrl", ["$scope", 'locals', 'UserService', 'GroupsService', 'TagsService', 'Utils',
    function ($scope, locals, UserService, GroupsService, TagsService, Utils) {
      var lastSearch, pendingSearch;

      var myUserHref = UserService.get_USER_INSTANCE_HREF();

      //makes sure that is an array instance
      locals.previousUsers = locals.previousUsers || [];
      locals.fixedUsers = locals.fixedUsers || [];
      locals.bannedList = locals.bannedList || [];
      console.log("locals.bannedList", locals.bannedList);

      /**
       * @type {[{
       *  id:string,
       *  href:string
       *  name:string,
       *  photo:string
       * }]}
       */
      $scope.usersFound = [];

      $scope.data = {
        userName: "",
        selectedUsers: [],
        showSelectedContactsList: false
      };

      //because the previous list is passed by reference and if users are removed
      //and click on cancel the modal, the original selected users list would be
      //modified as well
      locals.previousUsers.forEach(function (user) {
        $scope.data.selectedUsers.push(user);
      });

      $scope.isSearching = false;

      var pagination = {
        start: 0,
        count: 25
      };

      $scope.searchUsers = function () {
        $scope.usersFound = [];

        if (!$scope.data.userName || !debounceSearch()) return;

        $scope.isSearching = true;


        //console.log("Searching for " + $scope.data.userName);
        UserService.searchUsersByPartialNameOrIncludingSpaces({
          term: $scope.data.userName,
          start: pagination.start,
          count: pagination.count
        }).then(
          /**
           * @param UserResults {[{
             *  id:string,
             *  href:string
             *  name:string,
             *  photo:string,
             * }] | []}
           */
          function (UserResults) {
            //console.log("UserResults", UserResults);
            $scope.usersFound = UserResults;
            $scope.data.showSelectedContactsList = false;
            refreshDebounce();
          }, function (error) {
            console.error("couldn't get user list", error);
            $scope.errorLoading = true;
          }).finally(function () {
          $scope.isSearching = false;
        });
      };

      /**
       * @param user {{
       *  id:string,
       *  href:string
       *  name:string,
       *  photo:string
       * }}
       * @param listIndex
       */
      $scope.selectUser = function (user, listIndex) {
        var itsMe = user.href === myUserHref;

        //only non existing users will be added
        var isInList = $scope.data.selectedUsers.some(function (prevUser) {
          return prevUser.href === user.href;
        });

        var isInGroup = locals.fixedUsers.some(function (fixedUser) {
          return fixedUser.userSubscriptionHref === user.href;
        });

        var isBannedFromGroup = GroupsService.checkIfIsBannedOrLockedUser(locals.bannedList, user.href);

        if (!itsMe && !isInList && !isInGroup && !isBannedFromGroup) {
          $scope.data.selectedUsers = $scope.data.selectedUsers.concat(user);
          $scope.usersFound.splice(listIndex, 1);
        }
        else if (itsMe)
          Utils.toast.info(Utils.translate("GROUPS.MEMBERS_MGMT.DIALOG.YOULL_BE_THE_ADMIN"));
        else if (isInList)
          Utils.toast.info(Utils.translate("GROUPS.MEMBERS_MGMT.DIALOG.USER_ALREADY_IN_LIST"));
        else if (isBannedFromGroup)
          Utils.toast.warning(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.USER_BANNED_FROM_GROUP'));
        else if (isInGroup)
          Utils.toast.info(Utils.translate('GROUPS.MEMBERS_MGMT.DIALOG.USER_ALREADY_IN_GROUP'));

        if (!$scope.usersFound.length) {
          $scope.data.userName = "";
          focusSearchInput();
        }
      };

      $scope.unselectUser = function (user, listIndex) {
        $scope.data.selectedUsers.splice(listIndex, 1);

        if (!$scope.data.selectedUsers.length)
          $scope.hideSelectedUsersList();

      };

      $scope.isInListOrGroup = function (userHref) {
        var isInList = $scope.data.selectedUsers.some(function (user) {
          return userHref === user.href;
        }) || userHref === myUserHref;

        var isInGroup = locals.fixedUsers.some(function (user) {
          return userHref === user.userSubscriptionHref;
        });

        return isInList || isInGroup;
      };

      $scope.isUserBlocked = function (userHref) {
        return GroupsService.checkIfIsBannedOrLockedUser(locals.bannedList, userHref);
      };

      $scope.showSelectedUsersList = function () {
        $scope.data.showSelectedContactsList = $scope.data.selectedUsers.length > 0;
      };

      $scope.hideSelectedUsersList = function () {
        $scope.data.showSelectedContactsList = false;
        focusSearchInput();
      };

      $scope.okClicked = function () {
        locals.dialog.hide($scope.data.selectedUsers);
      };

      $scope.cancelClicked = function () {
        if ($scope.data.showSelectedContactsList)
          $scope.hideSelectedUsersList();
        else
          locals.dialog.cancel();
      };

      function debounceSearch() {
        var now = new Date().getMilliseconds();
        lastSearch = lastSearch || now;
        return ((now - lastSearch) < 300);
      }

      function refreshDebounce() {
        lastSearch = 0;
        pendingSearch = null;
        //cancelSearch  = angular.noop;
      }

      var searchInput;

      function focusSearchInput() {
        setTimeout(function () {
          if (!searchInput)
            searchInput = document.getElementById('search-input');

          if (searchInput) {
            //searchInput = searchInput[searchInput.length - 1];
            searchInput.selectionStart = $scope.data.userName.length;
            searchInput.selectionEnd = $scope.data.userName.length;
            searchInput.focus();
          }
          else
            console.log("can't find search input")
        }, 900);
      }

      focusSearchInput();

      var deregisterHardBack = Utils.$ionicPlatform.registerBackButtonAction(
        $scope.cancelClicked, 101
      );

      // cancel custom back behaviour
      $scope.$on('$destroy', function () {
        deregisterHardBack();
      });
    }])
;

