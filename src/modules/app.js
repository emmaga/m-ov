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
      // var lang = navigator.language.indexOf('zh') > -1 ? 'zh-CN' : 'en-US';
      var lang = 'zh-CN';
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
        templateUrl: 'pages/bookRoomList.html'
      })
      .state('hotelInfo', {
        url: '/hotelInfo/?hotelId',
        templateUrl: 'pages/hotelInfo.html'
      })
      .state('bookHotelList', {
        url: '/bookHotelList',
        templateUrl: 'pages/bookHotelList.html'
      })
      .state('roomInfo', {
        url: '/roomInfo/?roomId&hotelId&checkIn&checkOut',
        templateUrl: 'pages/roomInfo.html'
      })
      .state('bookOrderInfo', {
        url: '/bookOrderInfo/?orderId',
        templateUrl: 'pages/bookOrderInfo.html'
      })
      .state('memberHome', {
        url: '/memberHome',
        templateUrl: 'pages/memberHome.html'
      })
      .state('memberInfoEdit', {
        url: '/memberInfoEdit/?memberId',
        templateUrl: 'pages/memberInfoEdit.html'
      })
      .state('roomOrderList', {
        url: '/roomOrderList',
        templateUrl: 'pages/roomOrderList.html'
      })
      .state('shopOrderList', {
        url: '/shopOrderList',
        templateUrl: 'pages/shopOrderList.html'
      })
      .state('shopHome', {
        url: '/shopHome',
        templateUrl: 'pages/shopHome.html'
      })
      .state('shopProductDetail', {
        url: '/shopProductDetail/?hotelId&productId&hotelName',
        templateUrl: 'pages/shopProductDetail.html'
      })
      .state('shopCart', {

        url: '/shopCart',
        templateUrl: 'pages/shopCart.html'
      })
      .state('shopOrderInfo', {
        url: '/shopOrderInfo?orderId',
        templateUrl: 'pages/shopOrderInfo.html'
      })
  }])

  // 每次页面跳转完成时触发
  .run(['$rootScope', '$timeout', function($rootScope, $timeout) {
    
    $rootScope.$on("$locationChangeSuccess", function(){
      // 滚动到页面顶部
      document.body.scrollTop = 0;
      
      /*// 点透
      setTimeout(function(){
        document.getElementById('pageCover').style.display='none';
      },300)*/
    })
  }])

  /*// 每次页面开始跳转时触发
  .run(['$rootScope', '$timeout', function($rootScope) {
    $rootScope.$on("$viewContentLoading", function(){
      // 点透
      document.getElementById('pageCover').style.display='block';
    })
  }])*/


  .constant('BACKEND_CONFIG', {
    serverUrl     : 'http://openvod.cleartv.cn/backend_wx/v1/',
    testUrl       : 'api/',
    testExtesion  : '.json',
    test          : false//,
    //mapUrl        : "http://openvod.cleartv.cn/map/baidumap.html"
  })
})();