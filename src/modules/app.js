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
      var lang = navigator.language||'en';
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
        templateUrl: 'pages/bookHotelSearch.html'
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
  }])

  .constant('BACKEND_CONFIG', {
    baseUrl: '/m-ov/src/api/',
    extesion: '.json'
  })
})();