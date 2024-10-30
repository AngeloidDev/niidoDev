"use strict";
appServices
  .factory('GroupsService', ["$resource", "ApiEndPoint", function ($resource, ApiEndPoint) {

    /**
     * @type {{name: string, privacy: string, members: Array, image: string, phrase: string}}
     */
    var groupForm = newGroupForm();

    function resetGroupForm() {
      groupForm = newGroupForm();
    }

    /**
     *
     * @returns {{name: string, privacy: string, members: Array, image: string, phrase: string}}
     */
    function newGroupForm() {
      return {
        name: "",
        privacy: "Public",
        members: [],
        image: "",
        phrase: ""
      }
    }


    /**
     * Creates a new group for this user
     * @param groupForm {{
     * userHref:string,
     * name:string,
     * privacy:string,
     * description:string,
     * url:string|null}}
     * @returns {Promise}
     */
    function createGroup(groupForm) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupRepository/actions/addGroup/invoke', {},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        userSubscription: {value: {href: groupForm.userHref}},
        groupName: {value: groupForm.name},
        privacy: {value: groupForm.privacy},
        description: {value: groupForm.description},
        url: {value: groupForm.url}
      }).$promise;
    }

    /**
     * Updates the group's name, description and visibility
     * @param groupForm {{
     * groupInstanceHrefId:string,
     * name:string,
     * description:string,
     * privacy:string
     * }}
     * @returns {Promise}
     */
    function updateGroupFields(groupForm) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Group/:objectId/actions/changes/invoke',
        {objectId: groupForm.groupInstanceHrefId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1;'}
          }
        }
      ).save({
        groupName: {value: groupForm.name},
        description: {value: groupForm.description},
        privacy: {value: groupForm.privacy}
      }).$promise;
    }

    /**
     * Updates the group's photo
     * @param groupInstanceId {string}
     * @param photoLocation {string}
     * @returns {Promise}
     */
    function updateGroupsImage(groupInstanceId, photoLocation) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Group/:objectId/actions/changeUrl/invoke',
        {objectId: groupInstanceId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        url: {value: photoLocation}
      }).$promise;
    }

    /**
     * Removes a group owned by this user
     * @param groupId {string}
     * @returns {Promise}
     */
    function removeGroup(groupId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Group/:objectId/actions/delete/invoke',
        {objectId: groupId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save().$promise;
    }

    /**
     * Adds a member to a given group
     * @param groupId {string}
     * @param userHref {string} the subscription href (url)
     * @returns {Promise}
     */
    function addMember(groupId, userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.Group/:objectId/actions/addGroupMember/invoke',
        {objectId: groupId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).save({
        userSubscription: {
          value: {href: userHref}
        }
      }).$promise;
    }

    /**
     * Gets a list of the members of a group (active, banned, blocked, etc)
     * @param groupId {number|string}
     * @returns {Promise}
     */
    function getGroupMembers(groupId) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupMemberRepository/actions/findMembersByGroupId/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {groupId: {value: (typeof groupId === 'string' ? groupId : groupId.toString())}}
      }).$promise;
    }

    /**
     * Gets the user's requests (pending) to join to private groups
     * @param userHref {string} the user href string subscription
     * @returns {Promise}
     */
    function getUserJoinRequests(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupMemberRepository/actions/findPendingRequestByUserSubscription/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
      }).$promise;
    }

    /**
     * Gets the requests (pending to approve) for joining to the user's groups
     * @param userHref {string}
     * @returns {Promise}
     */
    function getRequestsToAprove(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupMemberRepository/actions/findPendingRequestByAdministrator/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
      }).$promise;
    }

    /**
     * Approves a join request for a user group
     * @param groupMermberId {number|string}
     * @returns {Promise}
     */
    function approveJoinRequest(groupMermberId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.GroupMember/:objectId/actions/approved/invoke',
        {objectId: groupMermberId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).post().$promise;
    }

    /**
     * Gets the number or joining request for a given group
     * @param groupId {number|string}
     * @returns {Resource}
     */
    function getNumJoiningRequestsByGroup(groupId) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupMemberRepository/actions/findCountPendingRequestByGroupId/invoke',
        {},
        {
          get: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        groupId: {value: groupId.toString()}
      });
    }

    /**
     * Removes a user from a group
     * @param groupHrefId {string}
     * @returns {Promise}
     */
    function removeMember(groupHrefId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.GroupMember/:objectId/actions/delete/invoke',
        {objectId: groupHrefId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).post().$promise
    }

    /**
     * Updates 'administrator' field (true|false) in GroupUser class
     * @param userHrefId {string}
     * @param willBeAdmin {boolean}
     * @returns {Promise}
     */
    function changeAdministrator(userHrefId, willBeAdmin) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.GroupMember/:objectId/actions/changeAdministrator/invoke',
        {objectId: userHrefId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).post({
        administrator: {value: willBeAdmin}
      }).$promise;
    }

    /**
     * Updates 'moderator' field (true|false) in GroupUser class
     * @param userHrefId {string}
     * @param willBeModerator {boolean}
     * @returns {Promise}
     */
    function changeModerator(userHrefId, willBeModerator) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.GroupMember/:objectId/actions/changeModerator/invoke',
        {objectId: userHrefId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).post({
        moderator: {value: willBeModerator}
      }).$promise;
    }

    /**
     *
     * @param userHref {string}
     * @param groupHref {string}
     * @returns {Promise}
     */
    function banUserFromGroup(userHref, groupHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserGroupBannedRepository/actions/addUserGroupBanned/invoke',
        {},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).post({
        userSubscription: {value: {href: userHref}},
        group: {value: {href: groupHref}}
      }).$promise;
    }

    /**
     *
     * @param groupId {number|string}
     * @returns {Promise}
     */
    function getBannedUsersByGroup(groupId) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserGroupBannedRepository/actions/findUserGroupBannedByGroupId/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).get({
        "x-isis-querystring": {groupId: {value: (typeof groupId === 'string' ? groupId : groupId.toString())}}
      }).$promise;
    }

    /**
     * Gets the groups which a user has been banned from
     * @param userHref {string}
     * @returns {Promise}
     */
    function getBannedGroupsForUser(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserGroupBannedRepository/actions/findUserGroupBannedByUserSubscription/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
      }).$promise;
    }

    /**
     *
     * @param userHref {string}
     * @param groupHref {string}
     * @returns {Promise}
     */
    function lockUserFromGroup(userHref, groupHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserGroupLockedRepository/actions/addUserGroupLocked/invoke',
        {},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).post({
        userSubscription: {value: {href: userHref}},
        group: {value: {href: groupHref}}
      }).$promise;
    }

    /**
     * Unlocks a user given its subsription to the locked bucket
     * @param userGroupLockedHrefId {string}
     * @returns {Promise}
     */
    function unlockUserFromGroup(userGroupLockedHrefId) {
      return $resource(
        ApiEndPoint.url + 'restful/objects/simple.UserGroupLocked/:objectId/actions/delete/invoke',
        {objectId: userGroupLockedHrefId},
        {
          post: {
            method: 'POST',
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).post().$promise;
    }

    /**
     *
     * @param groupId {number|string}
     * @returns {Promise}
     */
    function getLockedUsersByGroup(groupId) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserGroupLockedRepository/actions/findUserGroupLockedByGroupId/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }).get({
        "x-isis-querystring": {groupId: {value: (typeof groupId === 'string' ? groupId : groupId.toString())}}
      }).$promise;
    }

    /**
     * Gets the groups which a user has been banned from
     * @param userHref {string}
     * @returns {Promise}
     */
    function getLockedGroupsForUser(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/UserGroupLockedRepository/actions/findUserGroupLockedByUserSubscription/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
      }).$promise;
    }

    function gelAllGroups() {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupRepository/actions/findAllGroups/invoke',
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
     * gets a list of a user groups
     * @param userHref {number|string}
     * @returns {Promise}
     */
    function getUserGroups(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupMemberRepository/actions/findGroupByUserSubscription/invoke',
        {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {'Accept': 'application/json;profile=urn:org.apache.isis/v1'}
          }
        }
      ).get({
        "x-isis-querystring": {
          userSubscription: {value: {href: userHref}}
        }
      }).$promise;
    }

    /**
     * Gets a list of the latest sequences of a group
     * @param groupId:number,
     * @param pagination {{start:number, count:number}}
     * @returns {Promise}
     */
    function getGroupSequences(groupId, pagination) {
      return $resource(
        ApiEndPoint.url + 'restful/services/SequenceGroupRepository/actions/findLatestSequencesBelongingToAGroupId/invoke', {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).get({
        groupId: '"' + groupId + '"',
        withStart: '"' + pagination.start + '"',
        withCount: '"' + pagination.count + '"'
      }).$promise;
    }

    /**
     * Gets the plublic and private groups where the user is not subscribed to
     * @param userHref {string}
     * @returns {Promise}
     */
    function getOtherGroups(userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/GroupRepository/actions/findAllPublicAndPrivateGroupsByUserSubscription/invoke', {},
        {
          get: {
            method: 'GET',
            isArray: true,
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).get({
        "x-isis-querystring": {userSubscription: {value: {href: userHref}}}
      }).$promise;
    }

    /**
     * Shares a group timeline cqnz to the user's default timeline
     * @param cqnzId {string|number}
     * @param userHref {string|number}
     * @returns {Promise}
     */
    function shareGroupCqnzToTimeline(cqnzId, userHref) {
      return $resource(
        ApiEndPoint.url + 'restful/services/SequenceRepository/actions/shareGroupToTimeLine/invoke',
        {},
        {
          get: {
            method: 'GET',
            headers: {"Accept": "application/json;profile=urn:org.apache.isis/v1"}
          }
        }
      ).get({
        "x-isis-querystring": {
          sequenceId: {value: cqnzId.toString()},
          userSubscription: {value: {href: userHref}}
        }
      }).$promise;
    }


    /**
     * Verifies whether a group is in the given black list or not
     * @param blackList {Array}
     * @param groupHref {string}
     * @returns {boolean}
     */
    function checkIfIsBannedOrLockedGroup(blackList, groupHref) {
      var found = false;

      blackList.some(function (resource) {
        if (resource.group && resource.group.href === groupHref)
          return found = true;
      });

      return found;
    }

    /**
     * Verifies whether a user is in the given black list or not
     * @param blackList {Array}
     * @param userHref {string}
     * @returns {boolean}
     */
    function checkIfIsBannedOrLockedUser(blackList, userHref) {
      return blackList.some(function (user) {
          return user.userSubscription && user.userSubscription.href === userHref;
      });
    }

    return {
      getGroupForm: function () {
        return groupForm
      },
      resetGroupForm: resetGroupForm,
      createGroup: createGroup,
      updateGroupFields: updateGroupFields,
      updateGroupsPhoto: updateGroupsImage,
      removeGroup: removeGroup,
      addMember: addMember,
      getNumJoiningRequestsByGroup: getNumJoiningRequestsByGroup,
      removeMember: removeMember, //used for leaving the group too
      getGroupMembers: getGroupMembers,
      getUserJoinRequests: getUserJoinRequests,
      getRequestsToAprove: getRequestsToAprove,
      approveJoinRequest: approveJoinRequest,
      //findAdministrators: findAdministrators,
      changeAdministrator: changeAdministrator,
      changeModerator: changeModerator,
      banUserFromGroup: banUserFromGroup,
      getBannedUsersByGroup: getBannedUsersByGroup,
      getBannedGroupsForUser: getBannedGroupsForUser,
      getLockedGroupsForUser: getLockedGroupsForUser,
      lockUserFromGroup: lockUserFromGroup,
      unlockUserFromGroup: unlockUserFromGroup,
      getLockedUsersByGroup: getLockedUsersByGroup,
      gelAllGroups: gelAllGroups,
      getUserGroups: getUserGroups,
      getOtherGroups: getOtherGroups,
      getGroupSequences: getGroupSequences,
      shareGroupCqnzToTimeline: shareGroupCqnzToTimeline,
      checkIfIsBannedOrLockedGroup: checkIfIsBannedOrLockedGroup,
      checkIfIsBannedOrLockedUser: checkIfIsBannedOrLockedUser
    }
  }])
