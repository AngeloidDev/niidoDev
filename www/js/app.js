// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
"use strict";

var
  appServices = angular.module('Services', []),
  appControllers = angular.module('Controllers', []);

angular.module('app', [
  'ionic',
  'app.controllers',
  'Controllers',
  'Services',
  'app.routes',
  'app.services',
  'app.filters',
  'app.directives',
  'ngOpenFB',
  'as.sortable',
  'ngCordova',
  'angular-svg-round-progressbar',
  'ab-base64',
  'ionic.cloud',
  'mentio',
  'mentio2',
  'mentio3',
  'mentio4',
  'mentio5',
  'ngSanitize',
  'angular-click-outside',
  'pascalprecht.translate',
  'angular-inview',
  'angular-md5',
  'ngMaterial',
  'ngMessages',
  'btford.socket-io',
  'toastr',
  'ngjsColorPicker',//source: http://prplv.me/ngjs-color-picker
  'ion-datetime-picker'//https://github.com/katemihalikova/ion-datetime-picker (NOTE: I modified the js to include callback to ok and cancel events)
])
//agregar
//constant for database use
  .value('userProfileData', {dataBaseUser: null})

  //NEW DEVELOPMENT NIIDO
  .constant('ApiEndPoint', {
    url: 'http://niidowebapp-des.us-west-2.elasticbeanstalk.com/',
    ionic: 'https://api.ionic.io/push/',
    ionicProfile: 'niido_dev'
  })
  .constant('s3', {
    prefix: '\x64',
    region: '\x75\x73\x2D\x77\x65\x73\x74\x2D\x32',
    bucket: '\x6d\x65\x64\x69\x61\x2e\x6e\x69\x69\x64\x6f\x64\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x2e\x63\x6c\x6f\x75\x64',
    accessKey: '\x41\x4b\x49\x41\x49\x49\x47\x4b\x36\x41\x5a\x32\x53\x47\x36\x54\x35\x49\x53\x51',
    secretKey: '\x51\x4c\x35\x78\x34\x50\x6e\x38\x39\x58\x66\x4f\x39\x62\x45\x32\x37\x68\x38\x53\x31\x2b\x4b\x53\x6b\x4e\x39\x6e\x6b\x45\x66\x52\x65\x64\x36\x42\x2b\x6e\x32\x77',
    platformARN_ANDROID: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x47\x43\x4d\x2f\x6e\x65\x77\x4e\x69\x69\x64\x6f\x5f\x41\x4e\x44\x52\x4f\x49\x44\x32\x30\x31\x38',
    platformARN_IOS: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x2f\x6e\x65\x77\x4e\x69\x69\x64\x6f\x5f\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x5f\x49\x4f\x53\x32\x30\x31\x38',
    platformARN_IOSDEV: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x5f\x53\x41\x4e\x44\x42\x4f\x58\x2f\x6e\x65\x77\x4e\x69\x69\x64\x6f\x5f\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x5f\x49\x4f\x53\x32\x30\x31\x38',
    topicARN: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x6e\x69\x69\x64\x6f\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x5f\x53\x4e\x53',
    topicARNProduction: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x6e\x69\x69\x64\x6f\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x5f\x53\x4e\x53'
  })

  //Production NIIDO
  /*.constant('ApiEndPoint', {
    url: 'http://niidowebapp-env-prod.us-west-2.elasticbeanstalk.com/',
    ionic: 'https://api.ionic.io/push/',
    ionicProfile: 'niido_prod'
  })
  .constant('s3', {
    prefix: '\x64',
    region: '\x75\x73\x2D\x77\x65\x73\x74\x2D\x32',
    bucket: '\x6d\x65\x64\x69\x61\x2e\x6e\x69\x69\x64\x6f\x70\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x2e\x63\x6c\x6f\x75\x64',
    accessKey: '\x41\x4b\x49\x41\x49\x49\x47\x4b\x36\x41\x5a\x32\x53\x47\x36\x54\x35\x49\x53\x51',
    secretKey: '\x51\x4c\x35\x78\x34\x50\x6e\x38\x39\x58\x66\x4f\x39\x62\x45\x32\x37\x68\x38\x53\x31\x2b\x4b\x53\x6b\x4e\x39\x6e\x6b\x45\x66\x52\x65\x64\x36\x42\x2b\x6e\x32\x77',
    platformARN_ANDROID: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x47\x43\x4d\x2f\x6e\x65\x77\x4e\x69\x69\x64\x6f\x5f\x41\x4e\x44\x52\x4f\x49\x44\x32\x30\x31\x38',
    platformARN_IOS: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x2f\x6e\x65\x77\x4e\x69\x69\x64\x6f\x5f\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x5f\x49\x4f\x53\x32\x30\x31\x38',
    platformARN_IOSDEV: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x5f\x53\x41\x4e\x44\x42\x4f\x58\x2f\x6e\x65\x77\x4e\x69\x69\x64\x6f\x5f\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x5f\x49\x4f\x53\x32\x30\x31\x38',
    topicARN: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x6e\x69\x69\x64\x6f\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x5f\x53\x4e\x53',
    topicARNProduction: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x6e\x69\x69\x64\x6f\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x5f\x53\x4e\x53'
  })*/
  //.constant('ApiEndPoint', {url: 'http://cqnzwebapp-prod.us-west-2.elasticbeanstalk.com/', ionic:'https://api.ionic.io/push/', ionicProfile : 'cqnz_prod' })
  //.constant('s3', {prefix:'\x70', region: '\x75\x73\x2D\x77\x65\x73\x74\x2D\x32', bucket: '\x6D\x65\x64\x69\x61\x2E\x6D\x79\x63\x71\x6E\x7A\x2E\x72\x6F\x63\x6B\x73', accessKey: '\x41\x4B\x49\x41\x4A\x51\x48\x33\x50\x57\x59\x55\x4F\x49\x4A\x55\x58\x48\x4B\x51', secretKey: '\x50\x78\x50\x6F\x58\x2B\x4B\x70\x38\x47\x55\x78\x74\x68\x66\x7A\x53\x41\x71\x6D\x37\x39\x4E\x30\x63\x33\x6D\x30\x57\x79\x53\x51\x6B\x72\x31\x4A\x31\x39\x36\x33'})
  //Athletic Bilbao temporal

  //TUZOS DEVELOPMENT
  /*.constant('ApiEndPoint', {
    url: 'http://tuzoswebapp-env.us-west-2.elasticbeanstalk.com/',
    ionic: 'https://api.ionic.io/push/',
    ionicProfile: 'tuzos_env'
  })
  .constant('s3', {
    prefix: '\x64',
    region: '\x75\x73\x2D\x77\x65\x73\x74\x2D\x32',
    bucket: '\x74\x75\x7a\x6f\x73\x2e\x6e\x69\x69\x64\x6f\x2e\x63\x6c\x6f\x75\x64',
    accessKey: '\x41\x4b\x49\x41\x49\x37\x34\x33\x4d\x36\x43\x48\x4a\x50\x43\x33\x49\x4a\x55\x51',
    secretKey: '\x4b\x35\x30\x61\x50\x42\x46\x6f\x6f\x67\x4a\x4a\x57\x5a\x4f\x4e\x6e\x75\x45\x61\x42\x61\x4b\x6c\x50\x49\x6b\x4a\x42\x32\x6d\x2f\x43\x32\x67\x30\x31\x79\x6c\x75',
    //falta agregar android
    platformARN_ANDROID: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x39\x32\x34\x34\x33\x30\x34\x33\x39\x33\x31\x34\x3a\x61\x70\x70\x2f\x47\x43\x4d\x2f\x6e\x69\x69\x64\x6f\x41\x70\x70',
    platformARN_IOS: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x2f\x6e\x69\x69\x64\x6f\x43\x6f\x6e\x73\x6f\x6c\x65\x31\x5f\x49\x4f\x53\x32\x30\x31\x38\x5f\x50\x55\x53\x48\x5f\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e',
    platformARN_IOSDEV: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x5f\x53\x41\x4e\x44\x42\x4f\x58\x2f\x6e\x69\x69\x64\x6f\x43\x6f\x6e\x73\x6f\x6c\x65\x31\x5f\x49\x4f\x53\x32\x30\x31\x38\x5f\x50\x55\x53\x48\x5f\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74',
    topicARN: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x34\x39\x31\x36\x37\x33\x34\x38\x33\x30\x36\x37\x3a\x6e\x69\x69\x64\x6f\x43\x6f\x6e\x73\x6f\x6c\x65\x31\x41\x70\x70\x5f\x53\x6e\x73'
  })*/

  //ATHLETIC DEVELOPMENT
  /*.constant('ApiEndPoint', {
      url: 'http://athleticwebapp-env-1.ecqewpsqwr.us-west-2.elasticbeanstalk.com/',
      ionic:'https://api.ionic.io/push/',
      ionicProfile : 'niido_dev'
  })
  .constant('s3', {
    prefix:'\x62\x69\x6c\x62\x61\x6f',
    region: '\x75\x73\x2D\x77\x65\x73\x74\x2D\x32',
    bucket: '\x6d\x65\x64\x69\x61\x2e\x6e\x69\x69\x64\x6f\x64\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x2e\x63\x6c\x6f\x75\x64\x2f\x62\x69\x6c\x62\x61\x6f',
    accessKey: '\x41\x4b\x49\x41\x49\x49\x47\x4b\x36\x41\x5a\x32\x53\x47\x36\x54\x35\x49\x53\x51',
    secretKey: '\x51\x4c\x35\x78\x34\x50\x6e\x38\x39\x58\x66\x4f\x39\x62\x45\x32\x37\x68\x38\x53\x31\x2b\x4b\x53\x6b\x4e\x39\x6e\x6b\x45\x66\x52\x65\x64\x36\x42\x2b\x6e\x32\x77'
  })*/

  //LADYMULTITASK DEVELOPMENT
  /*.constant('ApiEndPoint', {
    url: 'http://ladymultitask.us-west-2.elasticbeanstalk.com/',
    ionic: 'https://api.ionic.io/push/',
    ionicProfile: 'ladymultitask_dev'
  })
  .constant('s3', {
    prefix: '\x64',
    region: '\x75\x73\x2D\x77\x65\x73\x74\x2D\x32',
    bucket: '\x6d\x65\x64\x69\x61\x2e\x6c\x61\x64\x79\x6d\x75\x6c\x74\x69\x74\x61\x73\x6b\x64\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x2e\x63\x6c\x6f\x75\x64',
    accessKey: '\x41\x4b\x49\x41\x4a\x33\x57\x32\x48\x34\x45\x4a\x52\x5a\x37\x50\x57\x33\x46\x41',
    secretKey: '\x79\x34\x74\x6a\x41\x39\x4f\x62\x76\x45\x56\x67\x62\x47\x34\x69\x68\x61\x34\x48\x35\x59\x59\x4d\x78\x6d\x6f\x62\x74\x77\x2b\x68\x76\x6b\x38\x59\x48\x46\x54\x6c',
    platformARN_ANDROID: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x32\x30\x37\x33\x31\x38\x37\x36\x34\x35\x31\x30\x3a\x61\x70\x70\x2f\x47\x43\x4d\x2f\x6c\x61\x64\x79\x4d\x75\x6c\x74\x69\x74\x61\x73\x6b\x5f\x41\x6e\x64\x72\x6f\x69\x64\x5f\x32\x30\x31\x38',
    platformARN_IOS: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x32\x30\x37\x33\x31\x38\x37\x36\x34\x35\x31\x30\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x2f\x6c\x61\x64\x79\x4d\x75\x6c\x74\x69\x74\x61\x73\x6b\x5f\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x5f\x49\x4f\x53\x32\x30\x31\x38',
    platformARN_IOSDEV: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x32\x30\x37\x33\x31\x38\x37\x36\x34\x35\x31\x30\x3a\x61\x70\x70\x2f\x41\x50\x4e\x53\x5f\x53\x41\x4e\x44\x42\x4f\x58\x2f\x6c\x61\x64\x79\x4d\x75\x6c\x74\x69\x74\x61\x73\x6b\x5f\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x5f\x49\x4f\x53\x32\x30\x31\x38',
    topicARN: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x32\x30\x37\x33\x31\x38\x37\x36\x34\x35\x31\x30\x3a\x6c\x61\x64\x79\x4d\x75\x6c\x74\x69\x74\x61\x73\x6b\x44\x65\x76\x65\x6c\x6f\x70\x6d\x65\x6e\x74\x5f\x53\x4e\x53',
    topicARNProduction: '\x61\x72\x6e\x3a\x61\x77\x73\x3a\x73\x6e\x73\x3a\x75\x73\x2d\x77\x65\x73\x74\x2d\x32\x3a\x32\x30\x37\x33\x31\x38\x37\x36\x34\x35\x31\x30\x3a\x6c\x61\x64\x79\x4d\x75\x6c\x74\x69\x74\x61\x73\x6b\x50\x72\x6f\x64\x75\x63\x74\x69\x6f\x6e\x5f\x53\x4e\x53'
  })*/

  //NEXT APP

  //

  .config(function ($ionicCloudProvider, $translateProvider, s3) {
    $ionicCloudProvider.init({
      "core": {
        "app_id": "a3e5d115"
      },
      "push": {
        "sender_id": 612637551458,
        "pluginConfig": {
          "ios": {
            "alert": true,
            "badge": true,
            "clearBadge": true,
            "sound": true
          },
          "android": {
            "icon": "push",
            "iconColor": "#d93434",
            "clearBadge": true
          }
        }
      }
    });
    $translateProvider
      .useStaticFilesLoader({
        prefix: 'lang/locale-',
        suffix: '.json'
      })
      .registerAvailableLanguageKeys(['en', 'es'], {
        'en_*': 'en',
        'es_*': 'es'
      })
      .determinePreferredLanguage()
      .fallbackLanguage('en')
      .useSanitizeValueStrategy('escape');

    AWS.config.update({
      region: s3.region,
      accessKeyId: s3.accessKey,
      secretAccessKey: s3.secretKey
    });
  })

  //For preventing elements (buttons, links) fire twice by using ngMaterial
  .config(function ($mdGestureProvider) {
    $mdGestureProvider.skipClickHijack();
  })

  //For custom themes using ngMaterial
  .config(function ($mdThemingProvider) {

    $mdThemingProvider.definePalette('niidoPalette', {
      '50': 'e2f4f3',
      '100': 'b6e3e2',
      '200': '85d1ce',
      '300': '54bfba',
      '400': '2fb1ac',
      '500': '0aa39d',
      '600': '099b95',
      '700': '07918b',
      '800': '058881',
      '900': '03776f',
      'A100': 'a5fff8',
      'A200': '72fff4',
      'A400': '3ffff0',
      'A700': '25ffee',
      'contrastDefaultColor': 'light',
      'contrastDarkColors': [
        '50',
        '100',
        '200',
        '300',
        '400',
        'A100',
        'A200',
        'A400',
        'A700'
      ],
      'contrastLightColors': [
        '500',
        '600',
        '700',
        '800',
        '900'
      ]
    });

    $mdThemingProvider.theme('default')
      .primaryPalette('niidoPalette')
      .accentPalette('orange')

  })

  .config(function (toastrConfig) {
    //SOURCE: https://github.com/Foxandxss/angular-toastr#toastr-customization
    angular.extend(toastrConfig, {
      newestOnTop: true,
      positionClass: 'toast-bottom-center',
      preventDuplicates: false,
      preventOpenDuplicates: true,
      tapToDismiss: true
    });
  })
  /*.config(['$provide', function($provide) {
      $provide.decorator('mentioUtil', ['$delegate',
          function mentioUtilDecorator($delegate) {
              var popUnderMention = $delegate.popUnderMention;
              function aNewPopUnderMention(ctx, triggerCharSet, selectionEl, requireLeadingSpace) {
                  popUnderMention.apply($delegate, arguments);
                  var modal = angular.element(document.getElementsByClassName('modal-content'));
                  if (modal.length) {
                      if (selectionEl.css('display') === 'block') {
                          selectionEl.css({
                              position: 'fixed'
                          });
                      }
                  }
              }
              $delegate.popUnderMention = aNewPopUnderMention;
              return $delegate;
          }
      ]);
  }])*/

  .run(function ($ionicHistory, $ionicPlatform, $rootScope, ngFB, $state, $ionicPopup, $http, AuthService, $ionicPush, UserService, $translate, $cordovaSQLite, userProfileData, selectedSequenceData, adsService, AWSServices, DBServices, ChatFactory, ApiEndPoint, AppAdminRolesService, notificationsService, Utils) {
    //console.info("open App");

    $rootScope.HEADER_LOGO = '<div class="header-logo" align="center"><img class="title-image deviceMargin" src="img/LogoHeader.png" style="width: auto; height:37px; padding-top: 5px;" id="step2" /> </div>';
    $rootScope.PLATFORM_NAME = Utils.platformName();
    $rootScope.processMsg = false;

    $ionicPlatform.ready(function () {
      //console.info("App ready");

      initDatabase();

      configureFCM();

      branchInit();

      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(false);
      }
      /*console.log(navigator.globalization);
      navigator.globalization.getPreferredLanguage(function success(language){
          var lang = language.value.sbstr(0,2);
          if(lang != 'es'){
              lang = 'en'
          }
          $translate.use(lang);
      });*/
      cordova.getAppVersion(function (version) {
        //var appVersion = version;
        $http({
          method: 'GET',
          url: 'http://cqnz.rocks/version.json'
        }).then(function successCallback(response) {
          if (response.data.mandatory) {

            var UpdateToVersion = parseVersionNumber(response.data.version);
            var currentVersion = parseVersionNumber(version);

            if (currentVersion < UpdateToVersion) {
              $ionicPopup.alert({
                title: "Please update",
                template: "Your current CQNZ version is " + version + " update to " + response.data.version + " to live an enhanced experience of CQNZ",
                cssClass: "alertPopUp",
                okType: "button-assertive"
              }).then(function success() {
                var urlMarket;
                if (ionic.Platform.isIOS()) {
                  urlMarket = "itms-apps://itunes.apple.com/us/app/cqnz/id1118977006?ls=1&mt=8";
                } else if (ionic.Platform.isAndroid()) {
                  urlMarket = "market://details?id=com.ionicframework.CQNZ270963";
                }
                window.open(urlMarket, '_system', 'location=yes');
              });
            }
          }
        }, function errorCallback() {
          console.error("Unable to load version");
        });

      });

      $ionicPlatform.registerBackButtonAction(function () {
        if ($state.current.name == "menu.timeline" || $state.current.name == "login") {
          navigator.app.exitApp();
        } else if ($state.current.name == "menu.upload" || $state.current.name == "menu.discovery") {
          if (window.localStorage.getItem("openTutorial")) {
            var inTutorial = window.localStorage.getItem("openTutorial");
            if (inTutorial === "false") {
              window.history.go(-1);
            }
          }
        } else {
          window.history.go(-1);
        }
      }, 100);

      if (window.StatusBar) {
        StatusBar.styleDefault();
      }

      setTimeout(function () {
        if (UserService.get_USER_INSTANCE_HREF()) {
          //console.info("App ready, looking for new notifications", UserService.get_USER_INSTANCE_HREF());
          //I don't care for the Promise/number, just to broadcast it from inside the service
          notificationsService.countPendingRegularNotifications(UserService.get_USER_INSTANCE_HREF());
          notificationsService.countPendingFollowersNotifications(UserService.get_USER_INSTANCE_HREF());

          waitingMessages(1);
        }
      }, 3500);
    });

    var firstTime = true;
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
      //console.info("view has changed!");
      waitingMessages(1);


      if (UserService.get_USER_INSTANCE_HREF()) {
        if (!firstTime) {
          AppAdminRolesService.updateLocalUserPermissions();
          //avoid count new notifications before entering to notifications view
          if (toState.name.indexOf('menu.notificationTabs') === -1) {
            //console.info("view has changed, looking for new notifications...", UserService.get_USER_INSTANCE_HREF());
            //I don't care for the Promise/number, just to broadcast it from inside the service
            notificationsService.countPendingRegularNotifications(UserService.get_USER_INSTANCE_HREF()).then(function (value) {
            }, function (error) {
              firstTime = true
            });
            notificationsService.countPendingFollowersNotifications(UserService.get_USER_INSTANCE_HREF());
          }
        }
        else
          firstTime = false;


      }

      /*if (fromState.name === 'menu.timeline') {
        window.localStorage.setItem("scrollPosition", JSON.stringify(Utils.$ionicScrollDelegate.getScrollPosition()))
      }*/
    });

    $rootScope.$on('login.success', function () {
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
      AppAdminRolesService.updateLocalUserPermissions();
      adsService.configure();
    });

    $rootScope.$on('group-modified', function (event, group) {
      $ionicHistory.clearCache();
      $ionicHistory.clearHistory();
    });

    function configureFCM() {
      var isIOS = ionic.Platform.isIOS();
      if (typeof FCMPlugin == 'undefined') {
        Utils.toast.show(Utils.$filter('translate')('PLUGINS.FCM.PLUGIN_NOT_INSTALLED'), 5000);
        return;
      }

      if (isIOS === true) {
        if (window.ApnsToken) {
          ApnsToken.getToken(function (token) {
            window.localStorage.setItem('AWSToken', token);
          }, function (error) {
            console.log("can't get ios token");
          })
        }
      } else {
        FCMPlugin.getToken(function (token) {
          //alert("firebaseToken => " + token);
          //console.log("firebaseToken => " + token);
          window.localStorage.setItem('AWSToken', token);
        }, function (error) {
          //alert("Couldn't get FCM token because: " +JSON.stringify(error));
          console.error("Couldn't get FCM token because: ", error);
        });
      }

      FCMPlugin.onNotification(function (data) {
        //console.log("onNotification callback");
        if (data.wasTapped) {
          //Notification was received on device tray and tapped by the user.
          console.log("El usuario hizo tap en la notificación (la app estaba cerrada/segundo plano)", data);
        }
        else {
          //Notification was received in foreground. Maybe the user needs to be notified.
          if (data.typeData == 'Message') {
            //Zone to show notification about message
            var showMsg = data.name + Utils.$filter('translate')('PRIVATEMESSAGE.APPALERT_NEWMSG');
            Utils.toast.info(showMsg, 5000, "top");
            waitingMessages(1);
          }
          //console.log("El usuario recibió la notificación con la app abierta", data);
        }
      }, function (data) {
        //parece que no se activa esta función...
        //console.log("onNotification success: " + JSON.stringify(data))
      }, function (error) {
        //alert("On notification error" + JSON.stringify(error));
        console.log("On notification error")
      });

      FCMPlugin.onNotificationReceived(function (data) {
        //alert("Notificación recibida "+JSON.stringify(data));
        console.log("onNotificationReceived")
      });
    }

    function parseVersionNumber(version) {
      var versionArray = version.split('.');

      for (var i = 0; i < 3; i++) {
        versionArray[i] = addZeros(versionArray[i], 3);
      }

      return parseInt(versionArray.join(''));
    }

    function addZeros(str, max) {
      str = str.toString();
      return str.length < max ? addZeros("0" + str, max) : str;
    }

    // Branch
    /*$ionicPlatform.on('deviceready', function () {
      branchInit();
    });*/

    $ionicPlatform.on('resume', function () {
      branchInit();
      console.info("sleep to awake");
      waitingMessages(0);
    });

    function branchInit() {
      //debug use
      Branch.setDebug(true);
      // Branch initialization
      Branch.initSession(function (data) {
        //Cuando abre app revisar como llegó
        //console.log("Deep Link Data: " + JSON.stringify(data));
        if (data.reDirectSequenceId && data.reDirectSequenceInstanceId) {
          //$state.go('menu.notifications', {}, {reload: true});
          $state.go('menu.showNotification', {
            "notificationId": data.reDirectSequenceId,
            "notificationInstanceId": data.reDirectSequenceInstanceId
          }, {reload: true});
        }
      }).then(function (res) {
        //console.error("Response:" + JSON.stringify(res));
      }).catch(function (err) {
        //console.error("Error: " + JSON.stringify(err));
      });
    }

    if (window.localStorage.getItem > 3) {
      if (window.localStorage.getItem('AWSToken') && (window.localStorage.getItem('AWSToken') != '(null)')) {
        AWSServices.awsInit();
      } else {
        $ionicPlatform.ready(function () {
          var isIOS = ionic.Platform.isIOS();
          if (isIOS === true) {
            if (window.ApnsToken) {
              ApnsToken.getToken(function (token) {
                window.localStorage.setItem('AWSToken', token);
                if (typeof FCMPlugin != 'undefined') {
                  AWSServices.awsInit();
                }
              }, function (error) {
                console.log("can't get ios token");
              })
            }
          } else {
            if (typeof FCMPlugin != 'undefined') {
              FCMPlugin.getToken(function (token) {
                window.localStorage.setItem('AWSToken', token);
                AWSServices.awsInit();
              }, function error(response) {
                console.error("couldn't get FCM token because: ", response);
              })
            }
          }
        })
      }

      //Load push configuration if needed
      if (window.localStorage.getItem('pushNotificationsConfig') === null) {
        UserService.getPushNotificationsConfig(
          {
            objectId: window.localStorage.getItem('userSubscriptionInstanceId')
          }
        ).get({"x-ro-follow-links": "value"}).$promise.then(function success(response) {
          var config = [];
          for (var i = 0; i < response.result.value.length; i++) {
            config[config.length++] = {
              "instanceId": response.result.value[i].value.instanceId,
              "notificationType": response.result.value[i].value.members.notificationType.value,
              "sendNotification": response.result.value[i].value.members.sendNotification.value
            };
          }
          window.localStorage.setItem('pushNotificationsConfig', JSON.stringify(config));
        }, function error(response) {
          console.error("UserService.addDevice error: ", response);
        });
      }

      $state.go('menu.timeline', {}, {reload: true});
    }

    function initDatabase() {
      DBServices.init().then(function (dbInstance) {
        //fixme: kept for legacy code, replace 'userProfileData.dataBaseUser.transaction()' by 'DBServices.execute()'
        //userProfileData.dataBaseUser = dbInstance;

        var myUsername = window.localStorage.getItem("name");
        if (myUsername) {
          //when created or check if exits, check if have any data inside with the user stored in LS
          var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
          DBServices.execute(querySelect, [myUsername]).then(
            /**@param {dbResponseType} dbResponse*/
            function (dbResponse) {
              //send to get tutorial status
              if (dbResponse.rows.length > 0) {
                addLoginCount(dbResponse.rows.item(0).count, myUsername);
              } else {
                firstLogin();
              }
            }, function (error) {
              console.error("User login's count error:", error);
            });
        }
        else {
          console.log("No username found in LS");
          checkTutorialStatus();
        }
      }, function (error) {
        Utils.alert.show("Chat DB not loaded due to" + JSON.stringify(error));
        firstLogin();
      });

      /*userProfileData.dataBaseUser = window.sqlitePlugin.openDatabase({
        name: 'personalInfo.db',
        location: 'default',
        androidDatabaseImplementation: 2,
        androidLockWorkaround: 1
      }, function (db) {
        db.transaction(function (transactionLogins) {
          transactionLogins.executeSql('CREATE TABLE IF NOT EXISTS userLogCount (id integer primary key, name text, count integer)');
          //transactionLogins.executeSql('DROP TABLE IF EXISTS userLogCount');
        }, function (error) {
          console.log('table checked/created error: ' + error.message);
        }, function () {
          //console.log("table checked/created ok");
          if (window.localStorage.getItem("name")) {
            userProfileData.dataBaseUser.transaction(function (transaction) {
              //when created or check if exits, check if have any data inside with the user stored in LS
              var querySelect = "SELECT * FROM userLogCount WHERE name = ?";
              transaction.executeSql(querySelect, [window.localStorage.getItem("name")], function (tx, resultSet) {
                //console.log("tx:", tx);
                //console.log("User login's count:", resultSet);
                //send to get tutorial status
                if (resultSet.rows.length > 0) {
                  addLoginCount(resultSet.rows.item(0).count, window.localStorage.getItem("name"));
                } else {
                  firstLogin();
                }
              }, function (tx, error) {
                console.error("User login's count error:", error);
              });
            }, function (error) {
              console.error("Error in transaction:", error);
              firstLogin();
            });
          } else {
            checkTutorialStatus();
          }
        });
      }, function (error) {
        console.log('Open database ERROR: ' + JSON.stringify(error));
      });*/
      //console.log("here",userProfileData.dataBaseUser);
    }

    function addLoginCount(countLogs, nameUser) {
      countLogs++;

      var querySelect = "UPDATE userLogCount SET count = ? WHERE name = ?";
      DBServices.execute(querySelect, [countLogs, nameUser]).then(function (value) {
        checkTutorialStatus();
      }, function (error) {
        console.error("Update user login's count error:", error);
      })
      /*userProfileData.dataBaseUser.transaction(function (transaction) {
        var querySelect = "UPDATE userLogCount SET count = ? WHERE name = ?";
        transaction.executeSql(querySelect, [countLogs, nameUser], function (tx, resultSet) {
          //console.log("tx:", tx);
          //console.log("User login's count:", resultSet);
          checkTutorialStatus();
        }, function (tx, error) {
          console.error("Update user login's count error:", error);
        });
      }, function (error) {
        console.error("Error in transaction:", error.message);
      });*/
    }

    function firstLogin() {
      var querySelect = "INSERT INTO userLogCount (name, count) VALUES (?,?)";
      DBServices.execute(querySelect, [window.localStorage.getItem("name"), 1]).then(function (value) {
        checkTutorialStatus();
      }, function (error) {
        console.error("INSERT error: " + error);
      })
      /*userProfileData.dataBaseUser.transaction(function (transaction) {
        var querySelect = "INSERT INTO userLogCount (name, count) VALUES (?,?)";
        transaction.executeSql(querySelect, [window.localStorage.getItem("name"), 1], function (tx, res) {
          //console.log(name + " insertId: " + res.insertId);
          //console.log(name + " rowsAffected: " + res.rowsAffected);
          //send to get tutorial status
          checkTutorialStatus();
        }, function (tx, error) {
          console.error("INSERT error: " + error);
        });
      }, function (error) {
        console.error('transaction error: ' + error);
      });*/
    }

    function checkTutorialStatus() {
      var listOfTutorials = ["discovery", "upload", "timelineOrganize", "favorites"];
      if (window.localStorage.getItem("name")) {
        for (var x = 0; x < listOfTutorials.length; x++) {
          checkBaseData(listOfTutorials[x]);
        }
      }

      /*userProfileData.dataBaseUser.transaction(function (transaction) {
        var querySelect = "CREATE TABLE IF NOT EXISTS tutorials (id integer primary key, name text, visited text)";
        //var querySelect = "DROP TABLE IF EXISTS tutorials";
        transaction.executeSql(querySelect, [], function (tx, res) {
          //console.log("Tutorial status table checked/created ok");
          if (window.localStorage.getItem("name")) {
            for (var x = 0; x < listOfTutorials.length; x++) {
              checkBaseData(listOfTutorials[x]);
            }
          }
        }, function (tx, error) {
          console.error('SELECT error in: ' + error.message);
        });

      }, function (error) {
        console.error('SELECT error out: ' + error.message);
        //addBaseData(name);
      });*/
    }

    function checkBaseData(name) {
      var querySelect = "SELECT name, visited FROM tutorials WHERE name = ?";
      DBServices.execute(querySelect, [name]).then(function (resultSet) {
        var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
        if (resultSet.rows.length > 0) {
          //console.log("Tutorial "+resultSet.rows.item(0).name+" visto: "+ visitedJson);
        } else {
          addBaseData(name);
        }
      }, function (error) {
        console.error('SELECT error in: ' + error.message);
      })
      /*userProfileData.dataBaseUser.transaction(function (transaction) {
        var querySelect = "SELECT name, visited FROM tutorials WHERE name = ?";
        transaction.executeSql(querySelect, [name], function (tx, resultSet) {
          var visitedJson = JSON.parse(resultSet.rows.item(0).visited);
          if (resultSet.rows.length > 0) {
            //console.log("Tutorial "+resultSet.rows.item(0).name+" visto: "+ visitedJson);
          } else {
            addBaseData(name);
          }
        }, function (tx, error) {
          console.error('SELECT error in: ' + error.message);
        })
      }, function (error) {
        console.error('SELECT error out: ' + error.message);
        addBaseData(name);
      }, function () {
        //console.log('transaction ok');
      });*/
    }

    function addBaseData(name) {
      var statusJson = [];
      if (name === "timelineOrganize") {
        statusJson = {
          first: true
        }
      } else {
        statusJson = {
          first: true,
          second: true
        }
      }
      if (window.localStorage.getItem("firstTimeUser")) {
        var x = JSON.parse(window.localStorage.getItem("firstTimeUser"));
        if (name in x) {
          statusJson = x[name];
        }
      }

      var querySelect = "INSERT INTO tutorials (name, visited) VALUES (?,?)";
      DBServices.execute(querySelect, [name, JSON.stringify(statusJson)]).then(function (value) {

      }, function (error) {
        console.error("INSERT error: " + error.message);
      })

      /*userProfileData.dataBaseUser.transaction(function (transaction) {
        var querySelect = "INSERT INTO tutorials (name, visited) VALUES (?,?)";

        transaction.executeSql(querySelect, [name, JSON.stringify(statusJson)], function (tx, res) {
          //console.log(name + " insertId: " + res.insertId);
          //console.log(name + " rowsAffected: " + res.rowsAffected);
        }, function (tx, error) {
          console.error("INSERT error: " + error.message);
        });
      }, function (error) {
        console.error('transaction error: ' + error.message);
      }, function () {
        console.error('transaction ok');
      })*/
    }

    /**
     * Gets the pending messages from server, stores them in LS and deletes them from server
     * @param activeApp
     */
    function waitingMessages(activeApp) {

      //window.localStorage.setItem('pendingMessagesForUser', 0);
      if (activeApp != 1) return;

      if (UserService.get_USER_ID()) {
        ChatFactory.getAndSaveUnreadMessagesLocally(UserService.get_USER_ID());
        //window.localStorage.setItem('pendingMessagesForUser', $rootScope.cantityNewPendingMessages);
      }
      //if the app was active and only changes from view to view
    }
  });


//functions used to display the toggle of multishot/multiselfie
function toggle_visibility(id) {
  var e = document.getElementById(id);
  if (e.style.display == 'block')
    e.style.display = 'none';
  else
    e.style.display = 'block';
}

function toggle_background(id) {
  var e = document.getElementById(id);
  if (e.className == 'arrowDown')
    e.className = 'arrowUp';
  else
    e.className = 'arrowDown';
}
