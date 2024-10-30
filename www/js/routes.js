"use strict";
angular.module('app.routes', [])

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      })

      /* Redirect for comments inside cqnz
      .state('comments', {
        url: '/comments',
        templateUrl: 'templates/commentsH1.html',
        controller: 'PopupCtrl'
      })*/

      .state('acceptTerms', {
        url: '/acceptTerms',
        templateUrl: 'templates/acceptTerms.html'
      })

      .state('signup', {
        url: '/singup',
        templateUrl: 'templates/signup.html',
        controller: 'signupCtrl'
      })

      .state('signup2', {
        url: '/singup2',
        templateUrl: 'templates/signup2.html',
        controller: 'signup2Ctrl'
      })

      .state('menu', {
        url: '/side-menu21',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'menuCtrl'
      })

      .state('forgotPassword', {
        url: '/forgotPassword',
        templateUrl: 'templates/forgotPassword.html',
        controller: 'forgotPasswordCtrl'
      })

      .state('menu.search', {
        url: '/search',
        views: {
          'side-menu21': {
            templateUrl: 'templates/search.html',
            controller: 'searchCtrl'
          }
        }
      })

      .state('menu.discovery', {
        url: '/discovery',
        views: {
          'side-menu21': {
            templateUrl: 'templates/discovery.html',
            controller: 'discoveryCtrl'
          }
        }
      })

      .state('showNotification', {
        params:{sequenceBasicData:null},
        url: '/showNotification',
        templateUrl: 'templates/Notifications/showNotifications.html',
        controller: 'showNotificationCtrl'
      })

      .state('menu.myProfile', {
        cache: false,
        url: '/MyProfile',
        views: {
          'side-menu21': {
            templateUrl: 'templates/Profiles/myProfile.html',
            controller: 'MyProfileCtrl'
          }
        }
      })

      .state('menu.changeProfilePicture', {
        cache: false,
        url: '/changeProfilePicture',
        views: {
          'side-menu21': {
            templateUrl: 'templates/Profiles/changeProfilePicture.html',
            controller: 'MyProfileCtrl'
          }
        }
      })

      .state('sendReaction', {
        cache: false,
        params:{sequence:null},
        url: '/sendReaction',
        templateUrl: 'templates/sendReaction.html',
        controller: 'MyProfileCtrl'
      })

      .state('menu.timeline', {
        params: {groupIndex: null, newGroupId: null},
        cache: true,
        url: '/Timeline/:prepareStatement',
        views: {
          'side-menu21': {
            templateUrl: 'templates/Timelines/timelines-container.html',
            controller: 'TimelinesContainerCtrl'
          }
        }
      })

      .state('upload', {
        cache: false,
        params: {isGroupTimeline: null, groupData: null},
        url: '/Upload',
        templateUrl: 'templates/Uploads/upload.html',
        controller: 'uploadCtrl'
      })

      .state('uploadVideo', {
        cache: false,
        params: {isGroupTimeline: null, groupData: null},
        url: '/UploadVideo',
        templateUrl: 'templates/Uploads/uploadVideo.html',
        controller: 'uploadVideoCtrl'
      })

      .state('menu.updatePassword', {
        url: '/updatePassword',
        views: {
          'side-menu21': {
            templateUrl: 'templates/updatePassword.html',
            controller: 'UserCtrl'
          }
        }
      })

      .state('menu.configNotifications', {
        url: '/configNotifications',
        views: {
          'side-menu21': {
            templateUrl: 'templates/configNotifications.html',
            controller: 'configNotificationsCtrl'
          }
        }
      })

      .state('menu.sets', {
        url: '/sets',
        views: {
          'side-menu21': {
            templateUrl: 'templates/sets.html',
            controller: 'settingsPageCtrl'
          }
        }
      })

      .state('menu.friends', {
        url: '/friends',
        views: {
          'side-menu21': {
            templateUrl: 'templates/friends.html',
            controller: 'friendsCtrl'
          }
        }
      })

      .state('menu.msgSupport', {
        url: '/msgSupport',
        views: {
          'side-menu21': {
            templateUrl: 'templates/msgSupport.html',
            controller: 'msgSupportCtrl'
          }
        }
      })

      .state('menu.contacts', {
        url: '/contacts',
        views: {
          'side-menu21': {
            templateUrl: 'templates/contacts.html',
            controller: 'phoneContactsCtrl'
          }
        }
      })

      .state('menu.terms', {
        url: '/terms',
        views: {
          'side-menu21': {
            templateUrl: 'templates/terms.html',
            controller: 'policyCtrl'
          }
        }
      })

      .state('menu.policy', {
        url: '/policy',
        views: {
          'side-menu21': {
            templateUrl: 'templates/policy.html',
            controller: 'policyCtrl'
          }
        }
      })

      .state('signUpTerms', {
        url: '/signUpTerms',
        templateUrl: 'templates/signUpTerms.html'
      })

      .state('signUpPolicy', {
        url: '/signUpPolicy',
        templateUrl: 'templates/signUpPolicy.html'
      })

      .state('menu.about', {
        url: '/about',
        views: {
          'side-menu21': {
            templateUrl: 'templates/about.html',
            controller: 'aboutCtrl'
          }
        }
      })

      .state('friendProfile', {
        url: '/friendProfile/:instanceId',
        templateUrl: 'templates/Profiles/friendProfile.html',
        controller: 'friendProfileCtrl'
      })

      .state('menu.notificationTabs', {
        url: '/notifications',
        views: {
          'side-menu21': {
            templateUrl: 'templates/Notifications/notifications-tabs.html',
            controller: 'notificationsTabsCtrl'//'SequenceCtrl'
          }
        }
      })
      .state('menu.notificationTabs.regular', {
        url: '/regular',
        cache: true,
        views: {
          'regular-tab': {
            templateUrl: 'templates/Notifications/regularNotifications.html',
            controller: 'notificationsRegularCtrl'
          }
        }
      })
      .state('menu.notificationTabs.follwers', {
        url: '/followers',
        cache: true,
        views: {
          'followers-tab': {
            templateUrl: 'templates/Notifications/followersNotifications.html',
            controller: 'notificationsFollowersCtrl'
          }
        }
      })


      .state('commentsCqnz', {
        params: {data: null},//<--Them controller name where the comment must go
        url: '/commentsCqnz',
        templateUrl: 'templates/commentsSequence.html',
        controller: 'commentsCqnzCtrl'
      })

      .state('listFriends', {
        url: '/listFriends/:subscriptionInstanceId',
        templateUrl: 'templates/listFriends.html',
        controller: 'listFriendsCtrl'
      })

      .state('followers', {
        url: '/followers/:subscriptionInstanceId',
        templateUrl: 'templates/followers.html',
        controller: 'followersCtrl'
      })

      .state('listLikes', {
        url: '/listLikes',
        templateUrl: 'templates/listLikes.html',
        controller: 'listLikesCtrl'
      })

      .state('firstFBFriends', {
        url: '/friends',
        templateUrl: 'templates/firstFBFriends.html',
        controller: 'firstFBFriendsCtrl'
      })

      .state('menu.configureMyProfile', {
        cache: 'false',
        url: '/configureMyProfile',
        views: {
          'side-menu21': {
            templateUrl: 'templates/Profiles/configureMyProfile.html',
            controller: 'configureMyProfileCtrl'
          }
        }
      })

      .state('menu.listFavorites', {
        cache: 'false',
        url: '/listFavorites',
        views: {
          'side-menu21': {
            templateUrl: 'templates/listFavorites.html',
            controller: 'listFavoritesCtrl'
          }
        }
      })

      .state('modifySequence', {
        cache: false,
        url: '/modifySequence/:sequenceInstanceId',
        templateUrl: 'templates/modifySequence.html',
        controller: 'editMySequenceCtrl'
      })

      .state('hashTimeLine', {
        url: '/hashTimeLine/:hashName',
        templateUrl: 'templates/Timelines/hashTimeLine.html',
        controller: 'hashtagTimeLineCtrl'
      })


      .state('menu.groups', {
        cache: true,
        url: '/groups/landpage',
        views: {
          'side-menu21': {
            templateUrl: 'templates/groups/groups-mainpage.html',
            controller: 'groupMainpageCtrl'
          }
        }
      })
      .state('groupsCreateStep1', {
        cache: true,
        url: '/groups/create/step1',
        templateUrl: 'templates/groups/group-create-step1.html',
        controller: 'groupCreateStep1Ctrl'
      })
      .state('groupsCreateStep2', {
        cache: false,
        url: '/groups/create/step2',
        templateUrl: 'templates/groups/group-create-step2.html',
        controller: 'groupCreateStep2Ctrl'
      })
      .state('groupsManagement', {
        params: {rawGroupList: null},
        url: '/groups/management',
        templateUrl: 'templates/groups/groups-management.html',
        controller: 'groupsManagementCtrl'
      })
      .state('groupMembersManagement', {
        cache: false,
        params: {group: null},
        url: '/group/manageMembers',
        templateUrl: 'templates/groups/group-members-management.html',
        controller: 'groupMembersManagementCtrl'
      })
      .state('groupSettings', {
        cache: false,
        params: {group: null, groupIndex: null},
        url: '/group/settings',
        templateUrl: 'templates/groups/group-settings.html',
        controller: 'groupSettingsCtrl'
      })
      .state('groupTimelinePreview', {
        cache: false,
        params: {statementBtnAction: null, groupData: null},
        url: '/group/timelinePreview',
        templateUrl: 'templates/Timelines/group-timeline-preview.html',
        controller: function ($scope, $state) {
          $scope.groupData = $state.params.groupData;
        }
      })
      .state('groupSentRequests', {
        cache: false,
        url: '/group/requests/sent',
        templateUrl: 'templates/groups/group-sent-requests.html',
        controller: 'GroupSentRequests'
      })
      .state('groupReceivedRequests', {
        cache: false,
        url: '/group/requests/received',
        templateUrl: 'templates/groups/group-received-requests.html',
        controller: 'GroupReceivedRequests'
      })


      .state('menu.adminTools', {
        url: '/adminTools',
        views: {
          'side-menu21': {
            templateUrl: 'templates/AdminTools/adminTools-mainpage.html',
            controller: 'adminToolsMainpageCtrl'
          }
        }
      })
      .state('adminMembers', {
        url: '/adminTools/adminMembers',
        templateUrl: 'templates/AdminTools/admin-members.html',
        controller: 'adminMembersCtrl'
      })
      .state('adminRoles', {
        url: '/adminTools/adminRoles',
        templateUrl: 'templates/AdminTools/admin-roles.html',
        controller: 'adminRolesCtrl'
      })
      .state('adminCreateEditRole', {
        params: {role: null},
        url: '/adminTools/adminRole/create-edit',
        templateUrl: 'templates/AdminTools/admin-create-edit-role.html',
        controller: 'adminCreateEditRoleCtrl'
      })
      .state('adminViewRole', {
        params: {role: null},
        url: '/adminTools/adminRole/view',
        templateUrl: 'templates/AdminTools/admin-view-rolePermissions.html',
        controller: 'adminViewRoleCtrl'
      })
      .state('adminPermissions', {
        url: '/adminTools/adminPermissions',
        templateUrl: 'templates/AdminTools/admin-permissions.html',
        controller: 'adminPermissionsCtrl'
      })


      .state('menu.messagesInbox', {
        url: '/Messages/Inbox/:subscriptionInstanceId',
        views: {
          'side-menu21': {
            templateUrl: 'templates/Messages/messagesInbox.html',
            controller: 'messagesInboxCtrl'
            /*templateUrl: 'templates/Chats/chatInbox.html',
            controller: 'chatInboxCtrl'*/
          }
        }
      })

      .state('searchNewChats', {
        url: '/Messages/Search',
        templateUrl: 'templates/Messages/selectUsersforChat.html',
        controller: 'ChatSearchUsersCtrl'
      })

      .state('chatPage', {
        url: '/Messages/chat/:chatID/:chatName/:lastMsg/:mine/:dateMsg/:nameFriend/:friendID/:read/:inbox/:friendTitle',
        templateUrl: 'templates/Messages/chatPage.html',
        controller: 'chatPageCtrl'
      })

      .state('chatGroupalPage', {
        url: '/Messages/chat/:chatID/:chatName/:chatShowName/:lastMsg/:mine/:imOwner/:dateMsg/:nameFriend/:friendID/:read/:inbox/:friendTitle',
        templateUrl: 'templates/Messages/chatPage.html',
        controller: 'chatGroupalCtrl'
      })

    /*.state('blackList',{
      url: '/blackList',
      templateUrl: 'templates/blackList.html',
      controller: 'blackListCtrl'
    })*/
    ;
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
    //$urlRouterProvider.otherwise('/side-menu21/Timeline/1');
  });
