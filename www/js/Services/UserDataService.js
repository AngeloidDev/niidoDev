"use strict";

appServices.factory('UserDataProvider', ['Utils', function (Utils) {

  /**
   * @param uderId {string}
   * @returns {Promise}
   */
  function getUserRoleIdAndStatus(uderId) {
    return Utils.$q(function (resolve, reject) {
      UserService.getUserSubscriptionByinstanceId(uderId).$promise.then(function (response) {
        try{
          if (response.members.accountStatus.value) {
            var RoleId = Utils.getLastUrlComponent(response.members.role.value.href);
            if (!RoleId) RoleId = 2;//<--default user

            resolve({
              ok:true,
              roleId:RoleId,
              status:response.members.accountStatus.value
            })
          }
          else
            reject("Couldn't get account status")
        }
        catch (e){
          reject(e)
        }
      }, function (error) {
        reject(error)
      })
    })
  }

  return {
    getUserRoleIdAndStatus: getUserRoleIdAndStatus
  }
}])
