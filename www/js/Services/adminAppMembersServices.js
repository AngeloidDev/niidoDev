"use strict";
appServices
  .factory('AppAdminMembersService', ["$resource", "ApiEndPoint", function ($resource, ApiEndPoint) {


    /**
     * @param userId
     * @returns {Promise}
     */
    function getLastUpdateUserRole(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/banned/invoke', {objectId: userId},
        {
          get: {
            method: 'GET',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get().$promise;
    }

    function verifyUser(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/verifyUser/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save().$promise;
    }

    function unverifyUser(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/unVerifyUser/invoke', {objectId: userId},
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
     * @param userId {number|string}
     * @returns {Promise}
     */
    function banUser(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/banned/invoke', {objectId: userId},
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
     * @param userId {number|string}
     * @returns {Promise}
     */
    function lockUser(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/blocked/invoke', {objectId: userId},
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
     * @param userId {number|string}
     * @returns {Promise}
     */
    function activateAccount(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/activate/invoke', {objectId: userId},
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
     * @param userId {number|string}
     * @returns {Promise}
     */
    function suspendAccount(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/suspend/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save().$promise;
    }

    /**
     * @param userId {number|string}
     * @returns {Promise}
     */
    function deactivateAccount(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/cancel/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save().$promise;
    }

    /**
     * @param userId {number|string}
     * @returns {Promise}
     */
    function deleteUserAccount(userId) {
      return $resource(
        ApiEndPoint.url + '/restful/objects/simple.UserSubscription/:objectId/actions/deleteSubscription/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;'}
          }
        }
      ).save().$promise;
    }

    /**
     * @param userId {number|string}
     * @returns {Promise}
     */
    function deleteSubscription(userId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/deleteSubscription/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save().$promise;
    }

    /**
     * @param userId {number|string}
     * @param newPassword {string}
     * @returns {Promise}
     */
    function changePassword(userId, newPassword) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.User/:objectId/actions/changePassword/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        newPassword: {value: newPassword}
      }).$promise;
    }

    /**
     * @param userId {number|string}
     * @param newUserData {Object}
     * @param newUserData.firstName {string}
     * @param newUserData.middleName {string?}
     * @param newUserData.lastName {string}
     * @param newUserData.lastName2 {string?}
     * @returns {Promise}
     */
    function changeName(userId, newUserData) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.User/:objectId/actions/ChangeName/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        firstName: {value: newUserData.firstName},
        middleName: {value: newUserData.middleName},
        lastName: {value: newUserData.lastName},
        lastName2: {value: newUserData.lastName2}
      }).$promise;
    }

    /**
     * @param userId {number|string}
     * @param newEmail {string}
     * @returns {Promise}
     */
    function changeEmail(userId, newEmail) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.User/:objectId/actions/ChangeEmail/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        email: {value: newEmail}
      }).$promise;
    }

    /**
     *
     * @param userId {number|string}
     * @param roleHref {string}
     * @returns {Promise}
     */
    function changeRole(userId, roleHref) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserSubscription/:objectId/actions/changeRole/invoke', {objectId: userId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        role: {value: {href: roleHref}}
      }).$promise;
    }

    function assignFollowers(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserSubscriptionRepository/actions/followNewAdvertiser/invoke',
        {},
        {
          post: {
            method: 'GET',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({'x-isis-querystring': {userSubscription: {value: {href: userHref}}}}).$promise;
    }

    return {
      getLastUpdateUserRole: getLastUpdateUserRole,
      verifyUser: verifyUser,
      unverifyUser: unverifyUser,
      banUser: banUser,
      lockUser: lockUser,
      activateAccount: activateAccount,
      suspendAccount: suspendAccount,
      deactivateAccount: deactivateAccount,
      deleteSubscription: deleteSubscription,
      changePassword: changePassword,
      changeName: changeName,
      changeEmail: changeEmail,
      changeRole: changeRole,
      assignFollowers: assignFollowers
    }
  }]);
