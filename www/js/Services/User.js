"use strict";

appServices.factory('UserApp', ['$rootScope', 'UserDataProvider', 'AppAdminRolesService', 'Utils', function ($rootScope, UserDataProvider, AppAdminRolesService, Utils) {
  /**
   * @type {string[]}
   */
  var PERMISSIONS = get_USER_PERMISSIONS();

  function get_USER_ID() {
    return window.localStorage.getItem("userSubscriptionInstanceId")
  }

  function get_USER_INSTANCE_HREF() {
    return window.localStorage.getItem("userSubscriptionHref");
  }

  function get_USER_USERNAME() {
    return window.localStorage.getItem("userName");
  }

  function get_USER_NAME() {
    return window.localStorage.getItem("name");
  }

  function get_USER_BIO() {
    return window.localStorage.getItem("userBiography");
  }

  function get_USER_PHOTO() {
    return window.localStorage.getItem("photoProfileBlob");
  }

  function get_USER_EMAIL() {
    return window.localStorage.getItem("userEmail");
  }

  function get_USER_ROLE_ID() {
    return window.localStorage.getItem("userRoleId");
  }

  /**
   * @returns {string[]}
   */
  function get_USER_PERMISSIONS() {
    if(PERMISSIONS) return PERMISSIONS;

    var p = window.localStorage.getItem("userPermissions");
    return p ? JSON.parse(p) : [];
  }

  /**
   * @param permissions {string[]}
   * @param newDate {string?}
   */
  function set_USER_PERMISSIONS(permissions, newDate) {
    PERMISSIONS = permissions;
    window.localStorage.setItem("userPermissions", JSON.stringify(permissions));
    $rootScope.$broadcast("rolePermissions-changed", {newDate: newDate});
  }

  function USER_IS_SUPERADMIN() {
    return [1, '1'].indexOf(window.localStorage.getItem("userRoleId")) > -1;
  }

  /**
   * @returns {Promise}
   */
  function loginRegular(username, password) {
    return Utils.$q(function (resolve, reject) {
      setTimeout(function () {
        $rootScope.$broadcast('login.success');
      }, 1000);
    })
  }

  function loginFacebook() {

  }

  /**
   *
   * @param userId
   * @returns {Promise}
   */
  function enterWithStoredCredentials(userId) {
    return Utils.$q(function (resolve, reject) {
      UserDataProvider.getUserRoleIdAndStatus(userId).then(function (resp) {
        if(resp.ok){
          if(resp.status !== "Active")
            return reject(resp.status);

          //todo: change this to UserDataProvider
          AppAdminRolesService.getRolePermissions(resp.roleId).then(function (resources) {
            //console.log("Permissions",resources);

            if (resources.length && !resources[resources.length - 1].codeName)
              resources.splice(resources.length - 1, 1);

            /**@type {string[]}*/
            var PERMISSIONS = [];
            resources.forEach(function (permission) {
              PERMISSIONS.push(permission.codeName);
            });

            //console.log("PERMISSIONS",PERMISSIONS);
            set_USER_PERMISSIONS(PERMISSIONS);

            resolve({roleId:resp.roleId, status:resp.status})
          }, function (error) {
            console.error("getRolePermissions", error);
            reject("couldn't get role permissions")
          });
        }
        else
          reject(resp)
      }, function (error) {
        reject(error);
      })
    })
  }

  return{
    get_USER_ID:get_USER_ID,
    get_USER_INSTANCE_HREF:get_USER_INSTANCE_HREF,
    get_USER_USERNAME:get_USER_USERNAME,
    get_USER_NAME:get_USER_NAME,
    get_USER_BIO:get_USER_BIO,
    get_USER_PHOTO:get_USER_PHOTO,
    get_USER_EMAIL:get_USER_EMAIL,
    get_USER_ROLE_ID:get_USER_ROLE_ID,
    get_USER_PERMISSIONS:get_USER_PERMISSIONS,
    set_USER_PERMISSIONS:set_USER_PERMISSIONS,
    USER_IS_SUPERADMIN:USER_IS_SUPERADMIN,

    loginRegular: loginRegular,
    loginFacebook: loginFacebook,
    enterWithStoredCredentials:enterWithStoredCredentials
  }
}])
