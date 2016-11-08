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
  
  // .config(function ($httpProvider) {
  //     $httpProvider.interceptors.push(function ($rootScope, $q, $filter) {
  //         return {
  //             request: function (config) {
  //                 config.timeout = 10000;
  //                 return config;
  //             }
  //             // ,responseError: function(err){
  //             //       // alert($filter('translate')('serverError') + err.status);
  //             //       if(-1 === err.status) {
  //             //         // 远程服务器无响应
  //             //       } else if(500 === err.status) {
  //             //         // 处理各类自定义错误
  //             //       } else if(501 === err.status) {
  //             //         // ...
  //             //       }
  //             //       return $q.reject(err);
  //             //     }
              
  //         }
  //     })
  // })

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
      .state('bookOrderInfo', {
        url: '/bookOrderInfo/?orderId',
        views: {
          '': {
            templateUrl: 'pages/bookOrderInfo.html'
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
      .state('shopHome', {
        url: '/shopHome',
        views: {
          '': {
            templateUrl: 'pages/shopHome.html'
          }
        }
      })
      .state('shopProductDetail', {
        url: '/shopProductDetail',
        views: {
          '': {
            templateUrl: 'pages/shopProductDetail.html'
          }
        }
      })
      .state('shopCart', {
        url: '/shopCart',
        views: {
          '': {
            templateUrl: 'pages/shopCart.html'
          }
        }
      })
      .state('shopOrderConfirm', {
        url: '/shopOrderConfirm',
        views: {
          '': {
            templateUrl: 'pages/shopOrderConfirm.html'
          }
        }
      })
      .state('shopOrderInfo', {
        url: '/shopOrderInfo',
        views: {
          '': {
            templateUrl: 'pages/shopOrderInfo.html'
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