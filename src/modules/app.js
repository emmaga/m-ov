'use strict';

(function() {
  var app = angular.module('m-ov', [
    'ionic',
    'ui.router',
    'app.filters',
    'app.controllers',
    'app.directive',
    'app.services',
    'pascalprecht.translate'
  ])

  .config(['$translateProvider',function($translateProvider){
      var lang = navigator.language == 'zh-CN' ? navigator.language : 'en-US';
      $translateProvider.preferredLanguage(lang);
      $translateProvider.useStaticFilesLoader({
          prefix: 'i18n/',
          suffix: '.json'
      });
  }])

  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/index');
    $stateProvider
      .state('index', {
        url: '/index',
        templateUrl: 'pages/bookHotelList.html'
      })
      .state('bookRoomList', {
        url: '/bookRoomList/?hotelId&checkIn&checkOut',
        views: {
          '': {
            templateUrl: 'pages/bookRoomList.html'
          }
        }
      })
      .state('bookHotelList', {
        url: '/bookHotelList:?sDate&eDate',
        views: {
          '': {
            templateUrl: 'pages/bookHotelList.html'
          }
        }
      })
      .state('roomInfo', {
        url: '/roomInfo/?roomId&hotelId&checkIn&checkOut',
        views: {
          '': {
            templateUrl: 'pages/roomInfo.html'
          }
        }
      })
      .state('orderInfo', {
        url: '/orderInfo',
        views: {
          '': {
            templateUrl: 'pages/orderInfo.html'
          }
        }
      })
      .state('bookResult', {
        url: '/bookResult',
        views: {
          '': {
            templateUrl: 'pages/bookResult.html'
          }
        }
      })
      .state('bookRoomSoldOut', {
        url: '/bookRoomSoldOut',
        views: {
          '': {
            templateUrl: 'pages/bookRoomSoldOut.html'
          }
        }
      })
      .state('memberHome', {
        url: '/memberHome',
        views: {
          '': {
            templateUrl: 'pages/memberHome.html'
          }
        }
      })
      .state('memberLogin', {
        url: '/memberLogin',
        views: {
          '': {
            templateUrl: 'pages/memberLogin.html'
          }
        }
      })
      .state('memberRegister', {
        url: '/memberRegister',
        views: {
          '': {
            templateUrl: 'pages/memberRegister.html'
          }
        }
      })
      .state('memberInfoEdit', {
        url: '/memberInfoEdit/?memberId',
        views: {
          '': {
            templateUrl: 'pages/memberInfoEdit.html'
          }
        }
      })
      .state('memberResetPW', {
        url: '/memberResetPW',
        views: {
          '': {
            templateUrl: 'pages/memberResetPW.html'
          }
        }
      })
      .state('memberOrderList', {
        url: '/memberOrderList',
        views: {
          '': {
            templateUrl: 'pages/memberOrderList.html'
          }
        }
      })
  }])

  .constant('BACKEND_CONFIG', {
    serverUrl     : 'http://openvod.cleartv.cn/backend_wx/v1/',
    testUrl       : 'api/',
    testExtesion  : '.json',
    test          : true
  })
})();