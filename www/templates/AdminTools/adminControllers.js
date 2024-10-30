"use strict";

appControllers
  .controller("adminToolsMainpageCtrl", ['$rootScope', "$scope", "UserService", 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, UserService, permissionValidationService, Utils) {
      //console.log("adminToolsMainpageCtrl created!");

      $scope.canManageAppMembers = function () {
        return permissionValidationService.canManageAppMembers();
      };

      $scope.canManageAppRoles = function () {
        return permissionValidationService.canManageAppRoles();
      };

      $scope.canManageAppPermissions = function () {
        return permissionValidationService.canManageAppPermissions();
      }
    }])

  .controller("adminMembersCtrl", ['$rootScope', "$scope", "$state", 'AsyncSearch', 'UserService', 'permissionValidationService', 'AppAdminRolesService', 'AppAdminMembersService', 'Utils',
    function ($rootScope, $scope, $state, AsyncSearch, UserService, permissionValidationService, AppAdminRolesService, AppAdminMembersService, Utils) {
      //console.log("adminMembersCtrl created!");

      $scope.formData = {searchedName: ""};

      $scope.asyncContacts = [];

      $scope.selectedContact = null;

      $scope.currentRole = null;

      $scope.loadingMembers = false;

      $scope.searchChanged = function () {
        //console.log("serach changed: "+$scope.formData.searchedName);
        $scope.asyncContacts = [];
        if (!$scope.formData.searchedName || $scope.formData.searchedName.length < 3) {
          return;
        }

        $scope.loadingMembers = true;

        AsyncSearch.findFriendUserSubscriptionsByUserNamev157({
          'userName': $scope.formData.searchedName,
          'withStart': 0,
          'withCount': 0
        }).then(function (userList) {
            //console.log(userList);

            //remove the last item because it's normally a useless object
            if (userList.length && !userList[userList.length - 1].userSubscription)
              userList.splice(userList.length - 1, 1);

            var rawContacts = [];
            userList.forEach(function (user) {
              if (rawContacts.indexOf(user) > -1) {
                console.log("duplicate detected (" + user.name + ")");
              }
              else {
                rawContacts.push({
                  avatar: Utils.getUserImgUrl(user),
                  userSubscription: user.userSubscription.href,
                  bio: user.userBio,
                  name: user.name.replace(/\s\s+/g, ' ').trim(),
                  roleHref: user.role ? user.role.href : null
                });
              }
            });
            $scope.asyncContacts = rawContacts;
          }, function (/*emptyArray*/) {
            $scope.asyncContacts = [];
          }
        ).finally(function () {
          $scope.loadingMembers = false;
        });
      };

      $scope.selectContact = function (member) {
        $scope.selectedContact = member;
        Utils.$ionicScrollDelegate.scrollTop();
        //$scope.selectedContact.name = $scope.selectedContact.name.replace(/\s\s+/g, ' ').trim();
      };

      $scope.unselectContact = function () {
        $scope.selectedContact = null;
      };

      /**
       * @returns {Promise} - {RoleSelectedType[]}
       */
      function getRolesAndActiveRole(userRoleHref) {
        return Utils.$q(function (resolve, reject) {
          AppAdminRolesService.getAllRoles().then(function (resources) {
            if (resources.length && !resources[resources.length - 1].roleId)
              resources.splice(resources.length - 1, 1);

            /**@type{RoleType[]}*/
            var roles = [];

            resources.forEach(
              /**@param {RoleRespType}role*/
              function (role) {
                var r = {
                  creationTime: role.creationTime,
                  description: role.description,
                  roleHref: role.role.href,
                  id: role.roleId
                };

                roles.push(r);

                if (userRoleHref && r.roleHref === userRoleHref) {
                  //console.log("the user role is: ", r);
                  $scope.currentRole = r;
                }
              });

            resolve(roles);
          }, function (error) {
            console.error(error);
            reject(error);
          });
        })
      }

      $scope.showUserRoleModal = function () {
        Utils.loading.show();
        getRolesAndActiveRole($scope.selectedContact.roleHref).then(function (rolesAndActiveRole) {
          Utils.modal.show({
            templateUrl: 'templates/AdminTools/admin-changeUserRole-modal.html',
            locals: {
              rolesAndActiveRole: rolesAndActiveRole,
              currentRole: $scope.currentRole,
              selectedRole: $scope.currentRole
            }
          }).then(function (newData) {
            //console.log(newData);
            changeUserRole(newData);
          })
        }, function (reason) {
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.LOAD_ROLES_ERROR'));
        }).finally(function () {
          Utils.loading.hide();
        })
      };

      /**
       * @param newData {Object}
       */
      function changeUserRole(newData) {
        if ($scope.selectedContact.userSubscription === UserService.get_USER_INSTANCE_HREF()) {
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.INVALID_ACTION'));
          return;
        }

        var userId = Utils.getLastUrlComponent($scope.selectedContact.userSubscription);

        Utils.loading.show();
        AppAdminMembersService.changeRole(userId, newData.selectedRole.roleHref).then(function (resp) {
          $scope.selectedContact.roleHref = newData.selectedRole.roleHref;
          AppAdminRolesService.updateLocalUserPermissions();

          if(Utils.getLastUrlComponent(newData.selectedRole.roleHref)==3){
            AppAdminMembersService.assignFollowers($scope.selectedContact.userSubscription).then(function (data) {
              console.log("----- All the users are following to this advertiser", data);
            }, function (error) {
              console.error("assign followers to advertiser", error);
              Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ASSINGN_FOLLOWERS_ERROR'));
            });
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ADD_UPDATE_ROLE_OK'));
          }
        }, function (error) {
          console.error(error);
          Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ADD_UPDATE_ROLE_ERROR'));
        }).finally(function () {
          Utils.loading.hide();
        })
      }

      $scope.confirmVerifyUser = function () {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.VERIFY_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.verifyUser(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.VERIFY_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.VERIFY_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.confirmUnverifyUser = function () {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.UNVERIFY_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.unverifyUser(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.UNVERIFY_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.UNVERIFY_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.confirmBanUser = function () {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.BAN_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.banUser(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.BAN_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.BAN_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.confirmLockUser = function () {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LOCK_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.lockUser(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LOCK_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LOCK_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.confirmDeleteUser = function () {
        Utils.confirm.show(
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_CONF') +
          "<br><b>" + Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_DISCOURAGE') + "</b>"
        ).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.deleteSubscription(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DELETE_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.confirmActivateAccount = function () {
        Utils.confirm.show(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ACTIVATE_ACCOUNT_CONF')).then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.activateAccount(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ACTIVATE_ACCOUNT_OK'))
          }, function (error) {
            if (error.status == 403)
              Utils.toast.info(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ACCOUNT_ALREADY_ACTIVATED_ERROR'));
            else {
              console.error(error);
              Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ACTIVATE_ACCOUNT_ERROR'))
            }
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.confirmDeactivateAccount = function () {
        Utils.confirm.show("Do you really want to deactivate this account?").then(function (boolResp) {
          if (!boolResp) return;

          Utils.loading.show();
          AppAdminMembersService.deactivateAccount(
            Utils.getLastUrlComponent($scope.selectedContact.userSubscription)
          ).then(function (value) {
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DEACTIVATE_ACCOUNT_OK'))
          }, function (error) {
            console.error(error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.DEACTIVATE_ACCOUNT_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          })
        })
      };

      $scope.showChangeUserPwrdPrompt = function () {
        $scope.prompt = {pass1: null, pass2: null};
        Utils.prompt.show({
          template:
          '<input type="password" ng-model="prompt.pass1" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.NEW_PASSWORD')
          + '" style="padding-left: 3px; margin-bottom: 8px">' +
          '<input type="password" ng-model="prompt.pass2" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.REPEAT_PASSWORD')
          + '" style="padding-left: 3px;">',
          title: Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ENTER_NEW_PASSWORD'),
          scope: $scope,
          buttons: [
            {text: Utils.$filter('translate')('GLOBAL.CANCEL')},
            {
              text: Utils.$filter('translate')('GLOBAL.OK'),
              type: "button-positive",
              onTap: function (ev) {
                if (!$scope.prompt.pass1 || !$scope.prompt.pass2) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.PASSWORD_FIELD_REQUIRED'));
                  ev.preventDefault();
                }
                else if ($scope.prompt.pass1 !== $scope.prompt.pass2) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.PASSWORD_MISMATCH'));
                  ev.preventDefault();
                }
                else
                  return $scope.prompt.pass1;
              }
            }
          ]
        }).then(function (newPassword) {
          if (newPassword) {
            Utils.loading.show();
            AppAdminMembersService.changePassword(
              Utils.getLastUrlComponent($scope.selectedContact.userSubscription),
              newPassword
            ).then(function (value) {
              Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.PASSWORD_UPDATED_OK'));
            }, function (error) {
              console.error(error);
              Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.PASSWORD_UPDATED_ERROR'));
            }).finally(function () {
              Utils.loading.hide()
            })
          }
        })
      };

      $scope.showChangeUserNamePrompt = function () {
        $scope.prompt = {name: "", middlename: "", lastname: "", lastname2: ""};
        Utils.prompt.show({
          template:
          '<input type="text" ng-model="prompt.name" placeholder="*' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.NAME')
          + '(s)" style="padding-left: 3px; margin-bottom: 8px">' +
          /*'<input type="text" ng-model="prompt.middlename" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.MIDDLENAME')
          + '" style="padding-left: 3px; margin-bottom: 8px">' +*/
          '<input type="text" ng-model="prompt.lastname" placeholder="*' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.MIDDLENAME')
          + '" style="padding-left: 3px; margin-bottom: 8px">' +
          '<input type="text" ng-model="prompt.lastname2" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.LASTNAME')
          + '" style="padding-left: 3px;">',
          title: Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ENTER_NEW_USERNAME'),
          scope: $scope,
          buttons: [
            {text: Utils.$filter('translate')('GLOBAL.CANCEL')},
            {
              text: Utils.$filter('translate')('GLOBAL.OK'),
              type: "button-positive",
              onTap: function (ev) {
                var newUserData = {};
                newUserData.name = $scope.prompt.name;
                newUserData.middlename = $scope.prompt.middlename;
                newUserData.lastname = $scope.prompt.lastname;
                newUserData.lastname2 = $scope.prompt.lastname2;

                var newName = (newUserData.name + " " + newUserData.middlename + " " + newUserData.lastname + " " + newUserData.lastname2).replace(/\s\s+/g, ' ').trim();

                if (!newUserData.name || !newUserData.lastname) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.NAME_FIELDS_REQUIRED'));
                  ev.preventDefault();
                }
                else if ($scope.selectedContact.name === newName) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.NAMES_ARE_EQUAL'));
                  ev.preventDefault();
                }
                else
                  return newUserData;
              }
            }
          ]
        }).then(function (newUserData) {
          if (newUserData) {
            //console.log("newUserData",newUserData);
            changeUsername(newUserData);
          }
        })
      };

      /**
       * @param newUserData {Object}
       */
      function changeUsername(newUserData) {
        Utils.loading.show();

        AppAdminMembersService.changeName(
          Utils.getLastUrlComponent($scope.selectedContact.userSubscription),
          {
            firstName: newUserData.name,
            middleName: newUserData.middlename,
            lastName: newUserData.lastname,
            lastName2: newUserData.lastname2
          }
        ).then(function (value) {
          $scope.selectedContact.name = (newUserData.name + (newUserData.middlename ? " " + newUserData.middlename + " " : " ") + newUserData.lastname + " " + newUserData.lastname2).trim();
          $scope.formData.searchedName = $scope.selectedContact.name;
          $scope.searchChanged();
          Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.USERNAME_UPDATED_OK'));
        }, function (error) {
          console.error(error);
          Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.USERNAME_UPDATED_ERROR'));
        }).finally(function () {
          Utils.loading.hide()
        })
      }

      $scope.showChangeUserEmailPrompt = function () {
        $scope.prompt = {email: ""};
        Utils.prompt.show({
          template:
          '<input type="text" ng-model="prompt.email" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.EMAIL_PLACEHOLDER')
          + '" style="padding-left: 3px;">',
          title: Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.ENTER_EMAIL_LABEL'),
          scope: $scope,
          buttons: [
            {text: Utils.$filter('translate')('GLOBAL.CANCEL')},
            {
              text: Utils.$filter('translate')('GLOBAL.OK'),
              type: "button-positive",
              onTap: function (ev) {
                //console.log("$scope.prompt", $scope.prompt);
                if (!$scope.prompt.email) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.EMAIL_FIELD_REQUIRED'));
                  ev.preventDefault();
                }
                else
                  return $scope.prompt.email.trim();
              }
            }
          ]
        }).then(function (newEmail) {
          if (newEmail) {
            //console.log("newEmail",newEmail);

            Utils.loading.show();
            AppAdminMembersService.changeEmail(
              Utils.getLastUrlComponent($scope.selectedContact.userSubscription),
              newEmail
            ).then(function (value) {
              Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.EMAIL_UPDATED_OK'));
            }, function (error) {
              console.error(error);
              Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_MEMBERS.DIALOG.EMAIL_UPDATED_ERROR'));
            }).finally(function () {
              Utils.loading.hide()
            })
          }
        })
      };

      $scope.goBack = function () {
        if($scope.selectedContact){
          $scope.unselectContact();
          Utils.$ionicScrollDelegate.scrollTop();
          setTimeout(function () {
            $scope.$apply();
          }, 10)
        }
        else
          $rootScope.$ionicGoBack();
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




      //------------- PERMISSIONS VALIDATION SECTION -----------------
      $scope.canSearchMembers = function () {
        return true;//permissionValidationService.canSearchAppUsers();
      };
      $scope.canChangeUserRole = function () {
        return permissionValidationService.canUpdateUserRole();
      };
      $scope.canChangeUserPassword = function () {
        return permissionValidationService.canUpdateUserPassword();
      };
      $scope.canChangeUserName = function () {
        return permissionValidationService.canUpdateUserName();
      };
      $scope.canChangeUserEmail = function () {
        return permissionValidationService.canUpdateUserEmail();
      };
      $scope.canVerifyAccount = function () {
        return permissionValidationService.canVerifyUserAccount();
      };
      $scope.canUnverifyAccount = function () {
        return permissionValidationService.canUnverifyUserAccount();
      };
      $scope.canActivateAccount = function () {
        return permissionValidationService.canActivateUserAccount();
      };
      $scope.canLockAccount = function () {
        return permissionValidationService.canLockUserAccount();
      };
      $scope.canDeactivateAccount = function () {
        return permissionValidationService.canDeactivateUserAccount();
      };
      $scope.canBanAccount = function () {
        return permissionValidationService.canBanUserAccount();
      };
      $scope.canDeleteAccount = function () {
        return permissionValidationService.canDeleteUserAccount();
      };
    }])

  .controller("adminRolesCtrl", ['$rootScope', "$scope", "$state", 'AppAdminRolesService', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, AppAdminRolesService, permissionValidationService, Utils) {
      //console.log("adminRolesCtrl created!");

      /**@type {RoleType[]}*/
      $scope.rolesList = [];

      var mustReloadRoles = false;

      function loadAllRoles() {
        Utils.loading.show();
        AppAdminRolesService.getAllRoles().then(
          /**@param {RoleRespType[]} resources*/
          function (resources) {
            //console.log(resources);

            if (resources.length && !resources[resources.length - 1].roleId)
              resources.splice(resources.length - 1, 1);

            resources.forEach(
              /**@param {RoleRespType}role*/
              function (role) {
                $scope.rolesList.push({
                  creationTime: role.creationTime,
                  description: role.description,
                  roleHref: role.role.href,
                  id: role.roleId
                })
              })
          }, function (error) {
            console.error("getAllRoles: ", error);
            Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.LOAD_ROLES_ERROR'));
          }).finally(function () {
          Utils.loading.hide();
          mustReloadRoles = false;
        });
      }

      loadAllRoles();

      $rootScope.$on("role-created", function () {
        mustReloadRoles = true;
      });

      $rootScope.$on("roleName-updated", function (event, data) {
        $scope.rolesList.some(function (role) {
          if (role.id === data.id) {
            role.description = data.newName;
            return true;
          }
        })
      });

      $scope.$on("$ionicView.enter", function () {
        if (mustReloadRoles) {
          $scope.rolesList = [];
          loadAllRoles();
        }
      });

      $scope.confirmDeleteRole = function (listIdx) {
        Utils.confirm.show(
          Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.DELETE_ROLE_CONF') + " <b>" + $scope.rolesList[listIdx].description + "</b>?"
        ).then(function (boolResp) {
          if (!boolResp)
            return;

          Utils.loading.show();
          AppAdminRolesService.deleteRole($scope.rolesList[listIdx].id).then(function () {
            $scope.rolesList.splice(listIdx, 1);
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_DELETED_OK'));
          }, function (error) {
            console.error("deleteRole", error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_DELETED_ERROR'));
          }).finally(function () {
            Utils.loading.hide()
          })
        })
      }


      //------------- ROLES VALIDATION SECTION -----------------
      $scope.canCreateAppRole = function () {
        return permissionValidationService.canCreateRole();
      };
      $scope.canEditAppRole = function () {
        return permissionValidationService.canUpdateRole();
      };
      $scope.canDeleteAppRole = function () {
        return permissionValidationService.canDeleteRole();
      };
    }])

  .controller("adminCreateEditRoleCtrl", ['$rootScope', "$scope", "$state", 'AppAdminRolesService', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, AppAdminRolesService, permissionValidationService, Utils) {
      //console.log("adminCreateEditRoleCtrl created!");

      /**@type {RoleType}*/
      $scope.role = $state.params.role;

      /**@type {{tag:string, permissions:PermissionSelectedType[]}[]}*/
      $scope.allRolePermissions = [];

      /**@type {RolePermissionRespType[]}*/
      $scope.currentRolePermissions = [];

      /**@type {{i:number, j:number}[]}*/
      $scope.permissionsToUpdate = [];

      $scope.originalRoleName = null;

      $scope.permsTags = [];

      $scope.listInitiallyOpen = true;

      //edit role
      if ($scope.role) {
        loadPermissionsToEdit();
      }
      else {
        $scope.role = {id: null, description: null};
        //console.log("You're creating the role")
        Utils.loading.show();
        getAllPermissions().then(function (permissionsList) {
          //console.log(permissionsList);
          $scope.allRolePermissions = permissionsList;
        }, function (error) {
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_ERROR'));
        }).finally(function () {
          Utils.loading.hide();
        });
      }

      function loadPermissionsToEdit() {
        //console.log("You're editing the role")
        $scope.originalRoleName = $scope.role.description;

        Utils.loading.show();
        getAllPermissions().then(function (allPermissionsList) {
          //console.log(allPermissionsList);
          $scope.allRolePermissions = allPermissionsList;

          AppAdminRolesService.getRolePermissions($scope.role.id).then(/**@param{RolePermissionRespType[]}currentRolePermissions */function (currentRolePermissions) {
            //console.log("getRolePermissions", currentRolePermissions);


            if (currentRolePermissions.length && !currentRolePermissions[currentRolePermissions.length - 1].permit)
              currentRolePermissions.splice(currentRolePermissions.length - 1, 1);

            $scope.currentRolePermissions = currentRolePermissions;
            setEffectiveRolePermissions(allPermissionsList, currentRolePermissions);
          }, function (error) {
            console.error("getRolePermissions", error);
            Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.LOAD_ROLE_PERMISSIONS_ERROR'))
          }).finally(function () {
            Utils.loading.hide();
          });
        }, function (error) {
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_ERROR'));
        });
      }

      /**
       * @param allPermissionsList {{tag:string, permissions:PermissionType[]}[]}
       * @param currentRolePermissions {RolePermissionRespType[]}
       */
      function setEffectiveRolePermissions(allPermissionsList, currentRolePermissions) {
        allPermissionsList.forEach(
          /**@param {{tag:string, permissions:PermissionSelectedType[]}} pGroup*/
          function (pGroup) {
            pGroup.permissions.forEach(function (permission) {
              currentRolePermissions.some(/**@param {RolePermissionRespType}rolePerm*/function (rolePerm) {
                if (permission.permitHref === rolePerm.permit.href) {
                  permission.wasSelected = true;
                  permission.isSelected = true;
                  permission.rolePermit = rolePerm.rolePermit;
                  return true;
                }
              });
            });
          })
      }

      $scope.checkForPermissionChanges = function (pGroup, permIdx) {
        if ($scope.allRolePermissions[pGroup].permissions[permIdx].wasSelected !== $scope.allRolePermissions[pGroup].permissions[permIdx].isSelected)
          $scope.permissionsToUpdate.push({i: pGroup, j: permIdx});//add item
        else {
          var id = -1;
          var found = $scope.permissionsToUpdate.some(function (obj, idx) {
            id = idx;
            return obj.i === pGroup && obj.j === permIdx;
          });
          id = found ? id : -1;

          if (id > -1)
            $scope.permissionsToUpdate.splice(id, 1);//remove item
        }
      };

      $scope.roleNameHasChanged = false;
      $scope.checkForNameChanges = function () {
        $scope.roleNameHasChanged = $scope.role && $scope.originalRoleName !== $scope.role.description && $scope.role.description.length && $scope.role.description.trim().length;
      };

      $scope.create = function (name) {
        name = name.trim();

        if (!name.length) {
          $scope.role.description = "";
          Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_NAME_REQUIRED'));
          return;
        }

        //console.log("Creating role", $scope.allRolePermissions);return;
        Utils.loading.show();
        AppAdminRolesService.createRole(name).then(function (resource) {
          //console.log(resource);
          var role = resource.result.members.role;

          var insertPermissionPromises = [];
          $scope.allRolePermissions.forEach(function (pGroup) {
            pGroup.permissions.forEach(function (permission) {
              if (permission.isSelected) {
                insertPermissionPromises.push(
                  AppAdminRolesService.addPermissionToRole(role.value.href, permission.permitHref)
                )
              }
            })
          });

          Utils.$q.all(insertPermissionPromises).then(function (responses) {
            $rootScope.$broadcast("role-created");
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_CREATEDTED_OK'));
            setTimeout(function () {
              Utils.loading.hide();
              $rootScope.$ionicGoBack();
            }, 200);
          }, function (errors) {
            console.error(errors);
            Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ADD_PERMISSIONS_ERROR'));
          });
        }, function (error) {
          Utils.loading.hide();
          console.error(error);
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_CREATEDTED_ERROR'));
        });
      };


      $scope.update = function (newName) {
        var updatePromises = [];

        Utils.loading.show();

        if ($scope.roleNameHasChanged) {
          newName = newName.trim();
          if (!newName.length) {
            Utils.loading.hide();
            $scope.role.description = $scope.originalRoleName;
            $scope.roleNameHasChanged = false;
            Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_NAME_REQUIRED'));
            return;
          }

          updatePromises.push(AppAdminRolesService.updateRoleName($scope.role.id, newName));
        }


        $scope.permissionsToUpdate.forEach(/**@type {{i:number, j:number}}*/function (listIdx) {
          if (!$scope.allRolePermissions[listIdx.i].permissions[listIdx.j].isSelected) {
            updatePromises.push(AppAdminRolesService.removePermissionFromRole(
              Utils.getLastUrlComponent($scope.allRolePermissions[listIdx.i].permissions[listIdx.j].rolePermit.href))
            );
          }
          else {
            updatePromises.push(
              AppAdminRolesService.addPermissionToRole(
                $scope.role.roleHref,
                $scope.allRolePermissions[listIdx.i].permissions[listIdx.j].permitHref
              )
            );
          }
        });

        Utils.$q.all(updatePromises).then(function (okResponses) {
          //console.log("okResponses", okResponses)
          if ($scope.roleNameHasChanged) {
            $scope.originalRoleName = $scope.role.description = newName;
            $rootScope.$broadcast("roleName-updated", {id: $scope.role.id, newName: newName});
          }

          $scope.permissionsToUpdate.forEach(/**@type {{i:number, j:number}}*/function (listIdx) {
            $scope.allRolePermissions[listIdx.i].permissions[listIdx.j].wasSelected = !$scope.allRolePermissions[listIdx.i].permissions[listIdx.j].wasSelected;
          });

          if (updatePromises.length !== 1 || !$scope.roleNameHasChanged) {
            AppAdminRolesService.updateLocalUserPermissions();
            loadPermissionsToEdit();
          }

          $scope.roleNameHasChanged = false;
          $scope.permissionsToUpdate = [];

          Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_UPDATED_OK'));
        }, function (errors) {
          console.error("Update role", errors);
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.ROLE_UPDATED_ERROR'));
        }).finally(function () {
          Utils.loading.hide();
        })
      };


      /**
       * gets all available permissions
       * @returns {Promise} - {{tag:string, permissions:PermissionType[]}[]}
       */
      function getAllPermissions() {
        return Utils.$q(function (resolve, reject) {
          AppAdminRolesService.getAllPermissions().then(
            /**@param {PermissionRespType[]} allPermissions*/
            function (allPermissions) {
              if (allPermissions.length && !allPermissions[allPermissions.length - 1].permitId)
                allPermissions.splice(allPermissions.length - 1, 1);

              if (!allPermissions.length) return resolve([]);

              /**@type {{tag:string, permissions:PermissionSelectedType[]}[]}*/
              var permissionsList = [];

              $scope.permsTags = [];

              var availablePerms = AppAdminRolesService.getAvailablePermissions();

              var tracker;
              allPermissions.forEach(function (permission) {
                if (availablePerms.indexOf(permission.codeName) > -1) {
                  /**@type {PermissionSelectedType}*/
                  var p = {
                    creationTime: permission.creationTime,
                    description: permission.description,
                    codeName: permission.codeName,
                    permitHref: permission.permit.href,
                    id: permission.permitId,
                    wasSelected: false,
                    isSelected: false,
                    rolePermit:null
                  };

                  var permTag = permission.codeName.substring(0, permission.codeName.indexOf('.'));
                  tracker = $scope.permsTags.indexOf(permTag);

                  if (tracker === -1) {
                    $scope.permsTags.push(permTag);
                    tracker = $scope.permsTags.length - 1;
                    permissionsList.push({tag: permTag, permissions: [p]});
                  }
                  else
                    permissionsList[tracker].permissions.push(p);
                }
              });

              permissionsList.forEach(function (perm) {
                perm.permissions.sort(function (a, b) {
                  return a.description == b.description ? 0 : +(a.description > b.description) || -1
                })
              });

              resolve(permissionsList);
            }, function (error) {
              console.error("getAllPermissions: ", error);
              reject(error);
            })
        })
      }

      $scope.toggleListVisibility = function (id1, id2) {
        var el1 = document.getElementById(id1);
        var el2 = document.getElementById(id2);

        if (el1) {
          el1.classList.toggle("ion-chevron-up");
          el1.classList.toggle("ion-chevron-down");
        }

        if (el2)
          el2.style.display = el2.style.display === 'none' ? 'block' : 'none';
      };


      //------------- ROLES VALIDATION SECTION -----------------
      $scope.canEditAppRoleName = function () {
        return permissionValidationService.canUpdateRoleName();
      };
      $scope.canEditRolePermissions = function () {
        return permissionValidationService.canUpdateRolePermissions();
      };

    }])

  .controller("adminViewRoleCtrl", ['$rootScope', "$scope", "$state", 'AppAdminRolesService', 'Utils',
    function ($rootScope, $scope, $state, AppAdminRolesService, Utils) {
      //console.log("adminViewRoleCtrl created!");

      /**@type {RoleType}*/
      $scope.role = $state.params.role;

      /** @type {{tag:string, permissions:PermissionType[]}[]}*/
      $scope.currentRolePermissions = [];

      $scope.permsTags = [];

      //view role info
      if ($scope.role) {
        Utils.loading.show();
        AppAdminRolesService.getRolePermissions($scope.role.id).then(/**@param{RolePermissionRespType[]}currentRolePermissions */function (currentRolePermissions) {
          //console.log("getRolePermissions", currentRolePermissions);

          if (currentRolePermissions.length && !currentRolePermissions[currentRolePermissions.length - 1].permit)
            currentRolePermissions.splice(currentRolePermissions.length - 1, 1);

          if (!currentRolePermissions.length) return;

          var tracker;
          currentRolePermissions.forEach(function (permission) {
            var permTag = permission.codeName.substring(0, permission.codeName.indexOf('.'));
            tracker = $scope.permsTags.indexOf(permTag);
            if (tracker === -1) {//<-is a new group of permissions
              $scope.permsTags.push(permTag);
              tracker = $scope.permsTags.length - 1;
              $scope.currentRolePermissions.push({tag: permTag, permissions: [permission]})
            }
            else
              $scope.currentRolePermissions[tracker].permissions.push(permission);
          });

          $scope.currentRolePermissions.forEach(function (perm) {
            perm.permissions.sort(function (a, b) {
              return a.permitDescription == b.permitDescription ? 0 : +(a.permitDescription > b.permitDescription) || -1
            })
          })

        }, function (error) {
          console.error("getRolePermissions", error);
          Utils.alert.show(Utils.translate('ADMIN_TOOLS.ADMIN_ROLES.DIALOG.LOAD_ROLE_PERMISSIONS_ERROR'))
        }).finally(function () {
          Utils.loading.hide();
        });
      }
      else {
        Utils.alert.show("No Role parameter was received");
      }

      $scope.toggleListVisibility = function (id1, id2) {
        var el1 = document.getElementById(id1);
        var el2 = document.getElementById(id2);

        if (el1) {
          el1.classList.toggle("ion-chevron-up");
          el1.classList.toggle("ion-chevron-down");
        }

        if (el2)
          el2.style.display = el2.style.display === 'none' ? 'block' : 'none';
      };

    }])

  .controller("adminPermissionsCtrl", ['$rootScope', "$scope", "$state", 'AppAdminRolesService', 'permissionValidationService', 'Utils',
    function ($rootScope, $scope, $state, AppAdminRolesService, permissionValidationService, Utils) {
      //console.log("adminPermissionsCtrl created!");

      /**@type {{tag:string, permissions:PermissionType[]}[]}*/
      $scope.permissionsList = [];

      $scope.permsTags = [];

      function loadAllPermissions() {
        Utils.loading.show();
        AppAdminRolesService.getAllPermissions().then(
          /**@param {PermissionRespType[]} resources*/
          function (resources) {
            //console.log(resources);
            if (resources.length && !resources[resources.length - 1].permitId)
              resources.splice(resources.length - 1, 1);

            $scope.permissionsList = [];
            $scope.permsTags = [];

            if (!resources.length) return;

            var availablePerms = AppAdminRolesService.getAvailablePermissions();

            var tracker;
            resources.forEach(/**@param {PermissionRespType} permission*/function (permission) {
              if (true || availablePerms.indexOf(permission.codeName) > -1) {
                /**@type PermissionType*/
                var p = {
                  creationTime: permission.creationTime,
                  description: permission.description,
                  codeName: permission.codeName,
                  permitHref: permission.permit.href,
                  id: permission.permitId
                };

                var permTag = permission.codeName.substring(0, permission.codeName.indexOf('.'));

                tracker = $scope.permsTags.indexOf(permTag);
                if (tracker === -1) {//<-is a new group of permissions
                  $scope.permsTags.push(permTag);
                  tracker = $scope.permsTags.length - 1;
                  $scope.permissionsList.push({tag: permTag, permissions: [p]});
                }
                else
                  $scope.permissionsList[tracker].permissions.push(p);
              }
            });

            $scope.permissionsList.forEach(function (perm) {
              perm.permissions.sort(function (a, b) {
                return a.description == b.description ? 0 : +(a.description > b.description) || -1
              })
            })


            //console.log($scope.permsTags);
          }, function (error) {
            console.error("getAllPermissions: ", error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.LOAD_PERMS_ERROR'))
          }).finally(function () {
          Utils.loading.hide();
          //mustReloadPermissions = false;
        });
      }

      loadAllPermissions();

      $scope.toggleListVisibility = function (id1, id2) {
        var el1 = document.getElementById(id1);
        var el2 = document.getElementById(id2);

        if (el1) {
          el1.classList.toggle("ion-chevron-up");
          el1.classList.toggle("ion-chevron-down");
        }

        if (el2)
          el2.style.display = el2.style.display === 'none' ? 'block' : 'none';
      };

      $scope.showCreatePrompt = function () {
        $scope.prompt = {name: "", code: ''};
        Utils.prompt.show({
          template:
          '<input type="text" ng-model="prompt.name" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.PERMISSION_NAME')
          + '" style="padding-left: 3px; margin-bottom: 8px">' +
          '<input type="text" ng-model="prompt.code" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.PERMISSION_CODENAME')
          + '" style="padding-left: 3px;">',
          title: Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.CREATE_PERMISSION'),
          scope: $scope,
          buttons: [
            {text: Utils.$filter('translate')('GLOBAL.CANCEL')},
            {
              text: Utils.$filter('translate')('GLOBAL.OK'),
              type: "button-positive",
              onTap: function (ev) {
                if (!$scope.prompt.name || !$scope.prompt.code) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.INPUT_FIELDS_REQUIRED'));
                  ev.preventDefault();
                }
                else
                  return $scope.prompt;
              }
            }
          ]
        }).then(function (form) {
          if (form.name) {
            //console.log("name",name);
            Utils.loading.show();
            AppAdminRolesService.createPermission(form.name.trim(), form.code.trim()).then(function () {
              loadAllPermissions();
              Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.PERM_CREATED_OK'));
            }, function (error) {
              console.error(error);
              Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.PERM_CREATED_ERROR'));
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        })
      };

      $scope.showEditPrompt = function (tagListIndex, permListIndex) {
        console.log("index:" + permListIndex);
        $scope.prompt = {name: $scope.permissionsList[tagListIndex].permissions[permListIndex].description};
        Utils.prompt.show({
          template:
          '<input type="text" ng-model="prompt.name" placeholder="' +
          Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.PERMISSION_NAME')
          + '" style="padding-left: 3px;">',
          title: Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.EDIT_PERMISSION_NAME'),
          scope: $scope,
          buttons: [
            {text: Utils.$filter('translate')('GLOBAL.CANCEL')},
            {
              text: Utils.$filter('translate')('GLOBAL.OK'),
              type: "button-positive",
              onTap: function (ev) {
                if (!$scope.prompt.name) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.NAME_REQUIRED'));
                  ev.preventDefault();
                }
                else if ($scope.permissionsList[tagListIndex].permissions[permListIndex].description === $scope.prompt.name) {
                  Utils.toast.warning(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.DIFFERENT_NAME_REQUIRED'));
                  ev.preventDefault();
                }
                else
                  return $scope.prompt.name;
              }
            }
          ]
        }).then(function (newName) {
          if (newName) {
            //console.log("newName",newName);
            Utils.loading.show();
            AppAdminRolesService.updatePermissionName(
              Utils.getLastUrlComponent($scope.permissionsList[tagListIndex].permissions[permListIndex].permitHref),
              newName
            ).then(function (value) {
              $scope.permissionsList[tagListIndex].permissions[permListIndex].description = newName;
              Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.PERM_UPDATED_OK'));
            }, function (error) {
              Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.PERM_UPDATED_ERROR'))
            }).finally(function () {
              Utils.loading.hide();
            })
          }
        })
      };

      $scope.confirmDeletePermission = function (tagListIndex, permListIndex) {
        Utils.confirm.show(
          Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.CONFIRM_DELETE_PERM') + " <b>" + $scope.permissionsList[tagListIndex].permissions[permListIndex].description + "</b>?"
        ).then(function (boolResp) {
          if (!boolResp)
            return;

          AppAdminRolesService.deletePermission(
            Utils.getLastUrlComponent($scope.permissionsList[tagListIndex].permissions[permListIndex].permitHref)
          ).then(function () {
            $scope.permissionsList[tagListIndex].permissions.splice(permListIndex, 1);
            Utils.toast.success(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.PERM_DELETED_OK'))
          }, function (error) {
            console.error("deletePermission", error);
            Utils.toast.error(Utils.translate('ADMIN_TOOLS.ADMIN_PERMISSIONS.DIALOG.PERM_DELETED_ERROR'))
          })
        })
      };


      //------------- ROLES VALIDATION SECTION -----------------
      $scope.canCreateAppPermission = function () {
        return permissionValidationService.canCreatePermission();
      };
      $scope.canEditAppPermission = function () {
        return permissionValidationService.canUpdatePermission();
      };
      $scope.canDeleteAppPermission = function () {
        return permissionValidationService.canDeletePermission();
      };
    }]);


// Type definitions for Roles
/**
 * This is the response format of a Role
 * @typedef {Object} RoleRespType
 * @property {string} creationTime
 * @property {string} description
 * @property {Object} role
 * @property {number} roleId
 */

/**
 * This is the object (format) that we'll actually use
 * @typedef {Object} RoleType
 * @property {string} creationTime
 * @property {string} description
 * @property {string} roleHref
 * @property {number} id
 */

/**
 * This is the object (format) that we'll actually use
 * @typedef {Object} RoleSelectedType
 * @property {string} creationTime
 * @property {string} description
 * @property {string} roleHref
 * @property {number} id
 * @property {boolean} selected
 */

// Type definitions for Permissions
/**
 * This is the response format of a permission
 * @typedef {Object} PermissionRespType
 * @property {string} creationTime
 * @property {string} description
 * @property {string} codeName
 * @property {Object} permit
 * @property {number} permitId
 */

/**
 * This is the object (format) that we'll actually use
 * @typedef {Object} PermissionType
 * @property {string} creationTime
 * @property {string} description
 * @property {string} codeName
 * @property {string} permitHref
 * @property {number} id
 */

/**
 * This is the object (format) that we'll actually use
 * @typedef {Object} PermissionSelectedType
 * @property {string} creationTime
 * @property {string} description
 * @property {string} codeName
 * @property {string} permitHref
 * @property {number} id
 * @property {boolean} wasSelected
 * @property {boolean} isSelected,
 * @property {Object} rolePermit
 */

//Type definitions for RolePermissions
/**
 * @typedef {Object} RolePermissionRespType
 * @property {Object} codeName
 * @property {Object} creationTime
 * @property {Object} permit - among others, contains href atribute
 * @property {string} permit.href
 * @property {Object} permitDescription
 * @property {Object} role
 * @property {Object} rolePermit
 */
