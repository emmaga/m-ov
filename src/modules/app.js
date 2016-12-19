'use strict';

(function() {
  var app = angular.module('m-ov', [
    'ionic',
    'ui.router',
    'app.filters',
    'app.controllers',
    'app.directive',
    'app.services',
    'ngCookies',
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


  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('myInterceptor');
  }])

  // 7000ms 超时
  .factory('myInterceptor', ['$q','$filter', function($q, $filter) {
    var interceptor = {
      'request' : function(config) {
        config.timeout = 7000;
        config.timeStamp = new Date().getTime();
        return config;
      },
      'responseError': function(err) {
        // console.log(new Date().getTime() - err.config.timeStamp)
        if(new Date().getTime() - err.config.timeStamp >= 7000) {
          alert($filter('translate')('serverTimeout') + err.status);
        }
        else {
          alert($filter('translate')('serverError') + err.status);
        }
        //阻止下一步
        return $q.reject(err);
      }
    }
    return interceptor;
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
      .state('roomOrderList', {
        url: '/roomOrderList',
        views: {
          '': {
            templateUrl: 'pages/roomOrderList.html'
          }
        }
      })
      .state('shopOrderList', {
        url: '/shopOrderList',
        views: {
          '': {
            templateUrl: 'pages/shopOrderList.html'
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
        url: '/shopProductDetail/?hotelId&productId&hotelName',
        views: {
          '': {
            templateUrl: 'pages/shopProductDetail.html'
          }
        }
      })
      .state('shopCart', {

        url: '/shopCart/?hotelId&hotelName',
        views: {
          '': {
            templateUrl: 'pages/shopCart.html'
          }
        }
      })
      .state('shopOrderInfo', {
        url: '/shopOrderInfo?orderId',
        views: {
          '': {
            templateUrl: 'pages/shopOrderInfo.html'
          }
        }
      })
  }])

  // 每次页面跳转完成时触发
  .run(['$rootScope', '$timeout', function($rootScope, $timeout) {
    
    $rootScope.$on("$locationChangeSuccess", function(){
      // 滚动到页面顶部
      document.body.scrollTop = 0;
      
      // 点透
      setTimeout(function(){
      document.getElementById('pageCover').style.display='none';
    },300)
    })
  }])

  // 每次页面开始跳转时触发
  .run(['$rootScope', '$timeout', function($rootScope) {
    $rootScope.$on("$viewContentLoading", function(){
      // 点透
      document.getElementById('pageCover').style.display='block';
    })
  }])


  .constant('BACKEND_CONFIG', {
    serverUrl     : 'http://openvod.cleartv.cn/backend_wx/v1/',
    testUrl       : 'api/',
    testExtesion  : '.json',
    test          : false//,
    //mapUrl        : "http://openvod.cleartv.cn/map/baidumap.html"
  })
})();