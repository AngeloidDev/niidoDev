"use strict";
appServices
  .factory('AppAdminRolesService', ['$rootScope', "$resource", "ApiEndPoint", 'UserService', 'Utils', function ($rootScope, $resource, ApiEndPoint, UserService, Utils) {

      var availablePerms = [
        //--------- SEQUENCE SECTION -------------
        'SEQUENCE.SAVE_IN.LOCKER',
        //----- END OF SEQUENCE SECTION ----------


        //----- GENERAL TIMELINE MANAGEMENT SECTION ----------
        'GRAL_TIMELINE.CQNZ.CREATE',
        'GRAL_TIMELINE.CQNZ.UPDATE',
        'GRAL_TIMELINE.CQNZ.TITLE.UPDATE',
        'GRAL_TIMELINE.CQNZ.OWN.DELETE',
        'GRAL_TIMELINE.CQNZ.OTHERS.DELETE',
        'GRAL_TIMELINE.CQNZ.REPORT',
        'GRAL_TIMELINE.CQNZ.LIKE',
        'GRAL_TIMELINE.CQNZ.REACT',
        'GRAL_TIMELINE.CQNZ.SHARE_IN.GROUPS',
        'GRAL_TIMELINE.CQNZ.SHARE_IN.EXTERNAL',

        //----- GROUP TIMELINE MANAGEMENT SECTION ----------
        'GROUP_TIMELINE.CQNZ.CREATE',
        'GROUP_TIMELINE.CQNZ.OWN.DELETE',
        'GROUP_TIMELINE.CQNZ.OTHERS.DELETE',
        'GROUP_TIMELINE.CQNZ.REPORT',
        'GROUP_TIMELINE.CQNZ.TOGGLE_PIN',
        'GROUP_TIMELINE.CQNZ.LIKE',
        'GROUP_TIMELINE.CQNZ.REACT',
        'GROUP_TIMELINE.CQNZ.SHARE_IN.GRAL_TIMELINE',
        'GROUP_TIMELINE.CQNZ.SHARE_IN.EXTERNAL',


        //----- COMMENTS MANAGEMENT SECTION ----------
        'COMMENT.GRAL_TIMELINE.ENABLE_DISABLE',
        'COMMENT.GROUP_TIMELINE.ENABLE_DISABLE',
        'COMMENT.CREATE',
        'COMMENT.UPDATE',
        'COMMENT.DELETE',
        'COMMENT.LIKE',

        //----- USER MANAGEMENT SECTION ----------
        'USER.MANAGEMENT',
        'USER.SEARCH',
        'USER.ROLE.UPDATE',
        'USER.PASSWORD.UPDATE',
        'USER.NAME.UPDATE',
        'USER.EMAIL.UPDATE',
        'USER.ACCOUNT.VERIFY',
        'USER.ACCOUNT.UNVERIFY',
        'USER.ACCOUNT.ACTIVATE',
        'USER.ACCOUNT.DEACTIVATE',
        'USER.ACCOUNT.LOCK',
        'USER.ACCOUNT.BAN',
        'USER.ACCOUNT.DELETE',

        //----- ROLE MANAGEMENT SECTION ----------
        'ROLE.MANAGEMENT',
        'ROLE.CREATE',
        'ROLE.UPDATE',
        'ROLE.NAME.UPDATE',
        'ROLE.PERMISSION.UPDATE',
        'ROLE.DELETE',

        //----- PERMISSION MANAGEMENT SECTION ----------
        'PERMISSION.MANAGEMENT',
        'PERMISSION.CREATE',
        'PERMISSION.UPDATE',
        'PERMISSION.DELETE',



        //---------- GROUPS MANAGEMENT SECTION ---------
        'GROUP.CREATE',
        'GROUP.SEARCH',
        'GROUP.INFO.READ',
        'GROUP.JOIN_REQUEST.SEND',//for private groups
        'GROUP.PUBLIC.JOIN',//for public groups
        'GROUP.OWN.READ',
        'GROUP.OTHERS.READ',
        'GROUP.UPDATE',
        'GROUP.UPDATE.NAME',
        'GROUP.IMAGE.UPDATE',
        'GROUP.PRIVACY.UPDATE',
        'GROUP.OWN.LEAVE',
        'GROUP.OTHERS.LEAVE',
        'GROUP.OWN.REMOVE',
        'GROUP.OTHERS.REMOVE',
        'GROUP.MEMBERS.MANAGE',
        'GROUP.MEMBER.STATUS.UPDATE',
        'GROUP.MEMBER.AS_ADMIN.UPDATE',
        'GROUP.MEMBER.AS_MODERATOR.UPDATE',
        'GROUP.MEMBER.STATUS.LOCKED.UPDATE',
        'GROUP.MEMBER.STATUS.BANNED.UPDATE',
        'GROUP.MEMBER.ADD',
        'GROUP.MEMBER.DELETE',
        'GROUP.JOIN_REQUEST.SENT.CANCEL',
        'GROUP.JOIN_REQUESTS.SENT.READ',
        'GROUP.JOIN_REQUESTS_RECEIVED.READ',
        'GROUP.JOIN_REQUESTS.ACCEPT',
        'GROUP.JOIN_REQUESTS.REJECT',



        //************ OLD VERSION PERMISSSIONS **************
        'GRAL_TIMELINE.COMMENT.CREATE', //Create comment (deprected)
        'GRAL_TIMELINE.COMMENT.ENABLE_DISABLE',//Enable/disable comment (deprected)
        'GRAL_TIMELINE.COMMENT.OWN.UPDATE',//Update own comment (deprected)
        'GRAL_TIMELINE.COMMENT.OWN.DELETE',//Delete own comment (deprected)
        'GRAL_TIMELINE.COMMENT.OTHERS.DELETE',//Delete others comment (deprected)
        'GRAL_TIMELINE.COMMENT.LIKE',//Like to a comment (deprected)


        'GROUP_TIMELINE.COMMENT.CREATE', //Create comment (deprected)
        'GROUP_TIMELINE.COMMENT.ENABLE_DISABLE',//Enable/disable comment (deprected)
        'GROUP_TIMELINE.COMMENT.OWN.UPDATE',//Update own comment (deprected)
        'GROUP_TIMELINE.COMMENT.OWN.DELETE',//Delete own comment (deprected)
        'GROUP_TIMELINE.COMMENT.OTHERS.DELETE',//Delete others comment (deprected)
        'GROUP_TIMELINE.COMMENT.LIKE',//Like to a comment (deprected)

        'PERMISSION.ALL.READ', //Manage permissions (deprecated)

        'ROLE.ALL.READ',//Manage roles (deprecated)

        'USER.ROLE.READ' //View user role (deprecated)
        //******** END OF OLD VERSION PERMISSSIONS ***********
      ];

      /**
       * Gets the available APP Roles
       * @returns {Promise}
       */
      function getAllRoles() {
        return $resource(
          ApiEndPoint.url + 'restful/services/RoleRepository/actions/listAllRole/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).get().$promise;
      }

      /**
       *
       * @param roleId
       * @returns {Promise}
       */
      function getRoleById(roleId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/RoleRepository/actions/findRoleByRoleId/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).get({
          roleId: roleId
        }).$promise;
      }

      /**
       * regresa el rol del usuario y la fecha de modificacion del rol
       * @param userId {number}
       * @returns {Promise}
       */
      function getRoleByUserId(userId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/RoleRepository/actions/findRoleByUserSubscriptionId/invoke', {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).get({
          "x-isis-querystring": {
            userSubscriptionId: {value:userId}
          }
        }).$promise;
      }

      function getLastUpdateRolePermissions(roleId) {

      }

      /**
       *
       * @returns {Promise}
       */
      function getAllPermissions() {
        return $resource(
          ApiEndPoint.url + 'restful/services/PermitRepository/actions/listAllPermit/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).get().$promise;
      }

      /**
       * Gets the role's permissions
       * @param roleId {number}
       * @returns {Promise}
       */
      function getRolePermissions(roleId) {
        return $resource(
          ApiEndPoint.url + 'restful/services/RolePermitRepository/actions/findRolePermitByRoleId/invoke',
          {},
          {
            get: {
              method: 'GET',
              isArray: true,
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).get({
          roleId: roleId
        }).$promise;
      }

      /**
       *
       * @param description {string}
       * @returns {Promise}
       */
      function createRole(description) {
        return $resource(
          ApiEndPoint.url + 'restful/services/RoleRepository/actions/addRole/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({
          description: {value: description}
        }).$promise;
      }

      /**
       * @param description {string}
       * @param codename {string}
       * @returns {Promise}
       */
      function createPermission(description, codename) {
        return $resource(
          ApiEndPoint.url + 'restful/services/PermitRepository/actions/addPermit/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({
          description: {value: description},
          codeName: {value: codename}
        }).$promise;
      }

      /**
       * @param roleHref {string}
       * @param permissionHref {string}
       * @returns {Promise}
       */
      function addPermissionToRole(roleHref, permissionHref) {
        return $resource(
          ApiEndPoint.url + 'restful/services/RolePermitRepository/actions/addRolePermit/invoke', {},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({
          role: {value: {href: roleHref}},
          permit: {value: {href: permissionHref}}
        }).$promise;
      }

      /**
       * @param rolePermissionId {number|string}
       * @returns {Promise}
       */
      function removePermissionFromRole(rolePermissionId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.RolePermit/:objectId/actions/delete/invoke', {objectId: rolePermissionId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save().$promise;
      }

      /**
       * @param roleId {number|string}
       * @param newName {string}
       * @returns {Promise}
       */
      function updateRoleName(roleId, newName) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Role/:objectId/actions/changeDescription/invoke', {objectId: roleId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({description: {value: newName}}).$promise;
      }

      /**
       * @param roleId {number|string}
       * @returns {Promise}
       */
      function deleteRole(roleId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Role/:objectId/actions/delete/invoke', {objectId: roleId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save().$promise;
      }

      function getPermissionById() {

      }

      /**
       * @param permissionId {number|string}
       * @param newName {string}
       *  @returns {Promise}
       */
      function updatePermissionName(permissionId, newName) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Permit/:objectId/actions/changeDescription/invoke', {objectId: permissionId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save({description: {value: newName}}).$promise;

      }

      /**
       * @param permissionId {number|string}
       * @returns {Promise}
       */
      function deletePermission(permissionId) {
        return $resource(
          ApiEndPoint.url + 'restful/objects/simple.Permit/:objectId/actions/delete/invoke', {objectId: permissionId},
          {
            post: {
              method: 'POST',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).save().$promise;
      }

      /**
       *
       */
      function checkLastRolePermissionChangeDate() {
        var myRoleId = window.localStorage.getItem("userRoleId");
        $resource(
          ApiEndPoint.url + 'restful/objects/simple.Permit/:objectId/actions/delete/invoke', {objectId: myRoleId},
          {
            get: {
              method: 'GET',
              headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
            }
          }
        ).get().$promise.then(function (dateTime) {
          var lastUpdate = window.localStorage.getItem("lasRolePermission-change");
          if (lastUpdate && lastUpdate !== dateTime) {
            $rootScope.$broadcast("rolePermissions-changed", {newDate: dateTime});
          }
        }, function (error) {
          console.error("getLastRolePermissionChangeDate", error)
        });
      }


      function updateLocalUserPermissions() {
        if(!UserService.get_USER_USERNAME() || !UserService.get_USER_ID()) return;

        UserService.findUserSubscriptionByUserName().get({userName: UserService.get_USER_USERNAME()}, function (resources) {
          //console.log("findUserSubscriptionByUserName",resources);
          if (resources.length && !resources[resources.length - 1].role)
            resources.splice(resources.length - 1, 1);

          if (!resources.length) {//the user was logged in via facebook...
            //console.error("The user subscription for the username '" + UserService.get_USER_NAME() + "' couldn't be found");
            UserService.findUserSubscriptionById().get({
              "x-isis-querystring":{userSubscriptionId:{value:UserService.get_USER_ID().toString()}}
            }).$promise.then(function (resp) {
              //console.log("findUserSubscriptionById ",resp);
              continueUpdateLocalUserPermissions(resp[0].role.href);
            }, function (error2) {
              console.error("findUserSubscriptionById", error2);
            });

            return;
          }

          continueUpdateLocalUserPermissions(resources[0].role.href);

        }, function (error) {
          console.warn("findUserSubscriptionByUserName", error);
          UserService.findUserSubscriptionById().get({
            "x-isis-querystring":{userSubscriptionId:{value:UserService.get_USER_ID().toString()}}
          }).$promise.then(function (resp) {
            //console.log("findUserSubscriptionById ",resp);
            continueUpdateLocalUserPermissions(resp[0].role.href);
          }, function (error2) {
            console.error("findUserSubscriptionById", error2);
          });
        })
      }

      function continueUpdateLocalUserPermissions(roleHref) {
        //console.log("roleHref "+roleHref)
        /*var newRoleId = resources[0].role.href;
        if (!newRoleId) {
          return reject("no userRoleId found");
        }*/

        var newRoleId = Utils.getLastUrlComponent(roleHref);
        var currentRoleId = window.localStorage.getItem('userRoleId');

        if (currentRoleId !== newRoleId) {
          window.localStorage.setItem("userRoleId", newRoleId);
          //Utils.alert.show("(continueUpdateLocalUserPermissions) New role detected");
        }


        var currentPermissions = window.localStorage.getItem("userPermissions") || "[]";
        currentPermissions = JSON.parse(currentPermissions);

        getRolePermissions(+newRoleId).then(function (resources) {
          if (resources.length && !resources[resources.length - 1].codeName)
            resources.splice(resources.length - 1, 1);

          var userPermissions = [];

          //si ahora tiene mas o menos permisos...
          if (currentPermissions.length !== resources.length) {
            resources.forEach(function (p) {
              userPermissions.push(p.codeName);
            });
            UserService.set_USER_PERMISSIONS(userPermissions);
            //Utils.toast.show("New permissions detected");
          }
          else {
            //tiene el mismo numero de antes, veamos si son diferentes...
            var hasChanged = resources.some(function (permission) {
              return currentPermissions.indexOf(permission.codeName) === -1;
            });

            if (hasChanged) {
              resources.forEach(function (p) {
                userPermissions.push(p.codeName)
              });

              UserService.set_USER_PERMISSIONS(userPermissions);
              //Utils.toast.show("New permissions detected");
            }
          }
        }, function (error) {
          console.error("getRolePermissions", error);
        })
      }

      return {
        createRole: createRole,
        getAllRoles: getAllRoles,
        getRoleById: getRoleById,
        getRoleByUserId: getRoleByUserId,
        getLastUpdateRolePermissions: getLastUpdateRolePermissions,
        updateRoleName: updateRoleName,
        deleteRole: deleteRole,

        addPermissionToRole: addPermissionToRole,
        getRolePermissions: getRolePermissions,
        removePermissionFromRole: removePermissionFromRole,

        createPermission: createPermission,
        getAllPermissions: getAllPermissions,
        getAvailablePermissions: function () {
          return availablePerms
        },
        getPermissionById: getPermissionById,
        updatePermissionName: updatePermissionName,
        deletePermission: deletePermission,
        checkLastRolePermissionChangeDate: checkLastRolePermissionChangeDate,
        updateLocalUserPermissions: updateLocalUserPermissions
      }
    }])
