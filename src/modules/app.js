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
      var lang = navigator.language.indexOf('zh') > -1 ? 'zh-CN' : 'en-US';
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
      .state('hotelInfo', {
        url: '/hotelInfo/?hotelId',
        views: {
          '': {
            templateUrl: 'pages/hotelInfo.html'
          }
        }
      })
      .state('bookHotelList', {
        url: '/bookHotelList',
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
        url: '/orderInfo/?orderId',
        views: {
          '': {
            templateUrl: 'pages/orderInfo.html'
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
      .state('memberInfoEdit', {
        url: '/memberInfoEdit/?memberId',
        views: {
          '': {
            templateUrl: 'pages/memberInfoEdit.html'
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
    test          : true,
    mapUrl        : "http://openvod.cleartv.cn/map/baidumap.html"
  })
})();