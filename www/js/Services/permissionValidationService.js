"use strict";

appServices.factory('permissionValidationService', ['$rootScope', 'UserService', 'Utils', function ($rootScope, UserService, Utils) {
  /**@returns {boolean}*/
  function amISuperAdmin() {
    return UserService.USER_IS_SUPERADMIN();
  }

  /**
   * Verifies whether the user has or not a permission (or a group of them)
   * when an array is passed, returns true only if the user has all permissions
   * @param permissions {string|string[]} - the permission(s) code(s)
   * @example
   * hasPermissions("GRAL_TIMELINE.CQNZ.CREATE") or
   * hasPermissions(["GRAL_TIMELINE.CQNZ.CREATE", 'GRAL_TIMELINE.CQNZ.UPDATE' [, more_codes]])
   * @returns boolean
   */
  function hasPermissions(permissions) {

    /**@type {string[]}*/
    var userPerms = UserService.get_USER_PERMISSIONS();

    if (typeof permissions === "string") {
      return amISuperAdmin() || userPerms.indexOf(permissions) > -1;
    }
    else if (permissions.constructor === Array) {
      return amISuperAdmin() || permissions.every(function (permission) {
        return userPerms.indexOf(permission) > -1;
      });
    }

    var msg = "Invalid argument type: '" + (typeof permissions) + "'";
    console.error(msg);
    Utils.toast.show(msg, 5000);

    return false;
  }


  //--------- SEQUENCE SECTION -------------
  function canSaveCqnzInLocker() {
    return hasPermissions('SEQUENCE.SAVE_IN.LOCKER');
  }

  //----- END OF SEQUENCE SECTION ----------


  //--------- GENERAL TIMELINE SECTION -------------
  function canCreateCqnzInGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.CREATE');
  }

  function canUpdateCqnzInGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.UPDATE');
  }

  function canUpdateCqnzTitleInGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.TITLE.UPDATE');
  }

  function canDeleteOwnCqnzFromGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.OWN.DELETE');
  }

  function canDeleteOthersCqnzFromGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.OTHERS.DELETE');
  }

  function canReportCqnzInGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.REPORT');
  }

  function canLikeCqnzInGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.LIKE');
  }

  function canReactCqnzInGralTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.REACT');
  }

  function canShareGralCqnzInGroupTimeline() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.SHARE_IN.GROUPS');
  }

  function canShareGralCqnzInExternalNetworks() {
    return hasPermissions('GRAL_TIMELINE.CQNZ.SHARE_IN.EXTERNAL');
  }

  //----- END OF GENERAL TIMELINE SECTION ----------


  //--------- GROUPS TIMELINE SECTION -------------
  function canCreateCqnzInGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.CREATE');
  }

  function canUpdateCqnzInGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.UPDATE');
  }

  function canDeleteOwnCqnzFromGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.OWN.DELETE');
  }

  function canDeleteOthersCqnzFromGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.OTHERS.DELETE');
  }

  function canReportCqnzInGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.REPORT');
  }

  function canTogglePinCqnzInGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.TOGGLE_PIN');
  }

  function canLikeCqnzInGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.LIKE');
  }

  function canReactCqnzInGroupTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.REACT');
  }

  function canShareGroupCqnzInGeneralTimeline() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.SHARE_IN.GRAL_TIMELINE');
  }

  function canShareGroupCqnzInExternalNetworks() {
    return hasPermissions('GROUP_TIMELINE.CQNZ.SHARE_IN.EXTERNAL');
  }

  //----- END OF GROUPS TIMELINE SECTION ----------


//--------------------- COMMENTS SECTION ------------------------
  function canEnableDisableCommentsInGralTimeline() {
    return hasPermissions('COMMENT.GRAL_TIMELINE.ENABLE_DISABLE');
  }

  function canEnableDisableCommentsInGroupTimeline() {
    return hasPermissions('COMMENT.GROUP_TIMELINE.ENABLE_DISABLE');
  }

  function canCreateComment() {
    return hasPermissions('COMMENT.CREATE');
  }

  function canUpdateComment() {
    return hasPermissions('COMMENT.UPDATE');
  }

  function canDeleteComment() {
    return hasPermissions('COMMENT.DELETE');
  }

  function canLikeComment() {
    return hasPermissions('COMMENT.LIKE');
  }

  //----------------- END OF COMMENTS SECTION -------------------


  //------------------- GROUPS MANAGEMENT SECTION ------------------
  function canCreateGroup() {
    return hasPermissions('GROUP.CREATE');
  }

  function canSearchGroup() {
    return hasPermissions('GROUP.SEARCH');
  }

  function canReadOwnGroups() {
    return hasPermissions('GROUP.OWN.READ');
  }

  function canReadOthersGroups() {
    return hasPermissions('GROUP.OTHERS.READ');
  }

  function canSeeGroupInfo() {
    return hasPermissions('GROUP.INFO.READ');
  }

  //para acceder a la interfaz completa de edicion de grupo
  function canUpdateGroup() {
    return hasPermissions('GROUP.UPDATE');
  }

  //para editar el campo nombre
  function canUpdateGroupName() {
    return hasPermissions('GROUP.UPDATE.NAME');
  }

  function canUpdateGroupImage() {
    return hasPermissions('GROUP.IMAGE.UPDATE');
  }

  function canUpdateGroupPrivacy() {
    return hasPermissions('GROUP.PRIVACY.UPDATE');
  }

  function canLeaveOwnGroup() {
    return hasPermissions('GROUP.OWN.LEAVE');
  }

  function canLeaveOthersGroup() {
    return hasPermissions('GROUP.OTHERS.LEAVE');
  }

  /*
  when the owner decides to leave the group, he/she must delegate
  the group's admin to one of its members (if any exists)
  */
  function canDelegateGroupAdmin() {
    return hasPermissions('GROUP.ADMIN.DELEGATE');
  }

  function canRemoveOwnGroup() {
    return hasPermissions('GROUP.OWN.REMOVE');
  }

  function canRemoveOthersGroup() {
    return hasPermissions('GROUP.OTHERS.REMOVE');
  }

  function canManageGroupMembers() {
    return hasPermissions('GROUP.MEMBERS.MANAGE');
  }

  //whether show or not the member menu (promote as admin..., delete from group)
  function canManageGroupMemberStatus() {
    return hasPermissions('GROUP.MEMBER.STATUS.UPDATE');
  }

  //promove/quitar como admin
  function canUpdateGroupMemberAsAdmin() {
    return hasPermissions('GROUP.MEMBER.AS_ADMIN.UPDATE');
  }

  function canUpdateGroupMemberAsModerator() {
    return hasPermissions('GROUP.MEMBER.AS_MODERATOR.UPDATE');
  }

  function canUpdateGroupMemberLockedStatus() {
    return hasPermissions('GROUP.MEMBER.STATUS.LOCKED.UPDATE');
  }

  function canUpdateGroupMemberBannedStatus() {
    return hasPermissions('GROUP.MEMBER.STATUS.BANNED.UPDATE');
  }

  function canAddGroupMember() {
    return hasPermissions('GROUP.MEMBER.ADD');
  }

  function canDeleteGroupMember() {
    return hasPermissions('GROUP.MEMBER.DELETE');
  }

  function canJoinToPublicGroup() {
    return hasPermissions('GROUP.PUBLIC.JOIN');
  }

  function canSendJoinRequest() {
    return hasPermissions('GROUP.JOIN_REQUEST.SEND');
  }

  function canCancelSentJoinRequest() {
    return hasPermissions('GROUP.JOIN_REQUEST.SENT.CANCEL');
  }

  function canReadSentJoinRequests() {
    return hasPermissions('GROUP.JOIN_REQUESTS.SENT.READ');
  }

  function canReadReceivedJoinRequests() {
    return hasPermissions('GROUP.JOIN_REQUESTS_RECEIVED.READ');
  }

  function canAcceptJoinRequests() {
    return hasPermissions('GROUP.JOIN_REQUESTS.ACCEPT');
  }

  function canRejectJoinRequests() {
    return hasPermissions('GROUP.JOIN_REQUESTS.REJECT');
  }

  //-------------- END OF GROUPS MANAGEMENT SECTION ----------------


  //---------- PERMISSIONS MANAGEMENT SECTION -------------------
  function canManageAppPermissions() {
    return amISuperAdmin() && hasPermissions('PERMISSION.MANAGEMENT');
  }

  function canCreatePermission() {
    return hasPermissions('PERMISSION.CREATE');
  }

  function canReadAllPermissions() {
    return hasPermissions('PERMISSION.ALL.READ');
  }

  function canUpdatePermission() {
    return hasPermissions('PERMISSION.UPDATE');
  }

  function canDeletePermission() {
    return hasPermissions('PERMISSION.DELETE');
  }

  //-------- END OF PERMISSIONS MANAGEMENT SECTION ---------------


  //---------------- ROLES MANAGEMENT SECTION --------------------
  function canManageAppRoles() {
    return amISuperAdmin() && hasPermissions('ROLE.MANAGEMENT');
  }

  function canCreateRole() {
    return hasPermissions('ROLE.CREATE');
  }

  function canReadAllRoles() {
    return hasPermissions('ROLE.ALL.READ');
  }

  function canUpdateRole() {
    return hasPermissions('ROLE.UPDATE');
  }

  function canUpdateRoleName() {
    return hasPermissions('ROLE.NAME.UPDATE');
  }

  function canDeleteRole() {
    return hasPermissions('ROLE.DELETE');
  }

  function canUpdateRolePermissions() {
    return hasPermissions('ROLE.PERMISSION.UPDATE');
  }

  //------------- END OF ROLES MANAGEMENT SECTION -----------------


  //------------- APP USERS MANAGEMENT SECTION ------------------
  function canManageAppMembers() {
    return amISuperAdmin() && hasPermissions('USER.MANAGEMENT');
  }

  function canSearchAppUsers() {
    return hasPermissions('USER.SEARCH');
  }

  function canReadUserRole() {
    return hasPermissions('USER.ROLE.READ');
  }

  function canUpdateUserRole() {
    return hasPermissions('USER.ROLE.UPDATE');
  }

  function canUpdateUserPassword() {
    return hasPermissions('USER.PASSWORD.UPDATE');
  }

  function canUpdateUserName() {
    return hasPermissions('USER.NAME.UPDATE');
  }

  function canUpdateUserEmail() {
    return hasPermissions('USER.EMAIL.UPDATE');
  }

  function canUpdateUserBio() {
    return hasPermissions('USER.BIO.UPDATE');
  }

  function canVerifyUserAccount() {
    return hasPermissions('USER.ACCOUNT.VERIFY');
  }

  function canUnverifyUserAccount() {
    return hasPermissions('USER.ACCOUNT.UNVERIFY');
  }

  function canBanUserAccount() {
    return hasPermissions('USER.ACCOUNT.BAN');
  }

  function canLockUserAccount() {
    return hasPermissions('USER.ACCOUNT.LOCK');
  }

  function canActivateUserAccount() {
    return hasPermissions('USER.ACCOUNT.ACTIVATE');
  }

  function canDeactivateUserAccount() {
    return hasPermissions('USER.ACCOUNT.DEACTIVATE');
  }

  function canDeleteUserAccount() {
    return hasPermissions('USER.ACCOUNT.DELETE');
  }

  //----------- END APP USERS MANAGEMENT SECTION ----------------


  //-------------- ADVERTISER SECTION -------------------
  function canPostAdvertisement() {
    return hasPermissions('ADVERTISER.POST.ADVERTISEMENT');
  }

  //----------- END OF ADVERTISER SECTION ---------------


  //---------------- MISCELANEOUS FUNCTIONS --------------


  return {
    amISuperAdmin: amISuperAdmin,

    //--------- GLOBAL SECTION -----------------------
    canSaveCqnzInLocker: canSaveCqnzInLocker,


    //--------- GENERAL TIMELINE SECTION -------------
    canCreateCqnzInGralTimeline: canCreateCqnzInGralTimeline,
    canUpdateCqnzInGralTimeline: canUpdateCqnzInGralTimeline,
    canUpdateCqnzTitleInGralTimeline: canUpdateCqnzTitleInGralTimeline,
    canDeleteOwnCqnzFromGralTimeline: canDeleteOwnCqnzFromGralTimeline,
    canDeleteOthersCqnzFromGralTimeline: canDeleteOthersCqnzFromGralTimeline,
    canReportCqnzInGralTimeline: canReportCqnzInGralTimeline,
    canLikeCqnzInGralTimeline: canLikeCqnzInGralTimeline,
    canReactCqnzInGralTimeline: canReactCqnzInGralTimeline,
    canShareGralCqnzInGroupTimeline: canShareGralCqnzInGroupTimeline,
    canShareGralCqnzInExternalNetworks: canShareGralCqnzInExternalNetworks,


    //--------- GROUPS TIMELINE SECTION -------------
    canCreateCqnzInGroupTimeline: canCreateCqnzInGroupTimeline,
    canUpdateCqnzInGroupTimeline: canUpdateCqnzInGroupTimeline,
    canDeleteOwnCqnzFromGroupTimeline: canDeleteOwnCqnzFromGroupTimeline,
    canDeleteOthersCqnzFromGroupTimeline: canDeleteOthersCqnzFromGroupTimeline,
    canReportCqnzInGroupTimeline: canReportCqnzInGroupTimeline,
    canTogglePinCqnzInGroupTimeline: canTogglePinCqnzInGroupTimeline,
    canLikeCqnzInGroupTimeline: canLikeCqnzInGroupTimeline,
    canReactCqnzInGroupTimeline: canReactCqnzInGroupTimeline,
    canShareGroupCqnzInGeneralTimeline: canShareGroupCqnzInGeneralTimeline,
    canShareGroupCqnzInExternalNetworks: canShareGroupCqnzInExternalNetworks,


    //--------- GROUPS MANAEGMENT SECTION -------------
    canCreateGroup: canCreateGroup,
    canSearchGroup: canSearchGroup,
    canSeeGroupInfo: canSeeGroupInfo,
    //canSeeHiddenGroups: canSeeHiddenGroups,
    canSendJoinRequest: canSendJoinRequest,//for private groups
    canJoinToPublicGroup: canJoinToPublicGroup,
    canReadOwnGroups: canReadOwnGroups,
    canReadOthersGroups: canReadOthersGroups,


    canUpdateGroup: canUpdateGroup,
    canUpdateGroupName: canUpdateGroupName,
    canUpdateGroupImage: canUpdateGroupImage,
    canUpdateGroupPrivacy: canUpdateGroupPrivacy,
    canLeaveOwnGroup: canLeaveOwnGroup,
    canLeaveOthersGroup: canLeaveOthersGroup,
    canDelegateGroupAdmin: canDelegateGroupAdmin,
    canRemoveOwnGroup: canRemoveOwnGroup,
    canRemoveOthersGroup: canRemoveOthersGroup,

    canManageGroupMembers: canManageGroupMembers,
    canManageGroupMemberStatus: canManageGroupMemberStatus,
    canUpdateGroupMemberAsAdmin: canUpdateGroupMemberAsAdmin,
    canUpdateGroupMemberAsModerator: canUpdateGroupMemberAsModerator,
    canUpdateGroupMemberLockedStatus: canUpdateGroupMemberLockedStatus,
    canUpdateGroupMemberBannedStatus: canUpdateGroupMemberBannedStatus,
    canAddGroupMember: canAddGroupMember,
    canDeleteGroupMember: canDeleteGroupMember,


    canCancelSentJoinRequest: canCancelSentJoinRequest,
    canReadSentJoinRequests: canReadSentJoinRequests,
    canReadReceivedJoinRequests: canReadReceivedJoinRequests,
    canAcceptJoinRequests: canAcceptJoinRequests,
    canRejectJoinRequests: canRejectJoinRequests,


    //-------------- COMMENTS MANAGEMENT SECTION ---------------
    canEnableDisableCommentsInGralTimeline: canEnableDisableCommentsInGralTimeline,
    canEnableDisableCommentsInGroupTimeline: canEnableDisableCommentsInGroupTimeline,
    canCreateComment: canCreateComment,
    canUpdateComment: canUpdateComment,
    canDeleteComment: canDeleteComment,
    canLikeComment: canLikeComment,


    //-------------- PERMISSIONS MANAGEMENT SECTION ---------------
    canManageAppPermissions: canManageAppPermissions,
    canCreatePermission: canCreatePermission,
    canReadAllPermissions: canReadAllPermissions,
    canUpdatePermission: canUpdatePermission,
    canDeletePermission: canDeletePermission,


    //--------------- ROLES MANAGEMENT SECTION --------------------
    canManageAppRoles: canManageAppRoles,
    canCreateRole: canCreateRole,
    canReadAllRoles: canReadAllRoles,
    canUpdateRole: canUpdateRole,
    canUpdateRoleName: canUpdateRoleName,
    canUpdateRolePermissions: canUpdateRolePermissions,
    canDeleteRole: canDeleteRole,


    //---------- APP USERS MANAGEMENT SECTION -------------------
    canManageAppMembers: canManageAppMembers,
    canSearchAppUsers: canSearchAppUsers,
    canReadUserRole: canReadUserRole,
    canUpdateUserRole: canUpdateUserRole,
    canUpdateUserPassword: canUpdateUserPassword,
    canUpdateUserName: canUpdateUserName,
    canUpdateUserEmail: canUpdateUserEmail,
    canUpdateUserBio: canUpdateUserBio,
    canVerifyUserAccount: canVerifyUserAccount,
    canUnverifyUserAccount: canUnverifyUserAccount,
    canBanUserAccount: canBanUserAccount,
    canLockUserAccount: canLockUserAccount,
    canActivateUserAccount: canActivateUserAccount,
    canDeactivateUserAccount: canDeactivateUserAccount,
    canDeleteUserAccount: canDeleteUserAccount,


    //-------------- ADVERTISER SECTION -------------------
    canPostAdvertisement: canPostAdvertisement
  }
}]);
