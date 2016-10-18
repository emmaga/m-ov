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
      .state('bookHotelSearch', {
        url: '/bookHotelSearch',
        views: {
          '': {
            templateUrl: 'pages/bookHotelSearch.html'
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
      .state('userOrder', {
        url: '/userOrder',
        views: {
          '': {
            templateUrl: 'pages/userOrder.html'
          }
        }
      })
  }])

  .constant('BACKEND_CONFIG', {
    serverUrl     : 'http://openvod.cleartv.cn/backend_wx/v1/',
    testUrl       : 'src/api/',
    testExtesion  : '.json',
    test          : true
  })
})();