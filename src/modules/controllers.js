'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies']);

  app

  .controller('RootController', 
    function() {
      var self = this;

      self.init = function() {
        self.mainMenuShow = false;
        self.showMainMenu(false);
      }

      self.showMainMenu = function(boo) {
        self.mainMenuShow = boo ? boo : false;
      }

  })

  .controller('bookHotelSearchController', ['$scope', '$location', '$http', 
    function($scope, $location, $http) {

      var self = this;

      self.init = function() {
        // 显示／隐藏日期选择器参数初始化
        self.datePickerShow = false;
      };

      // 显示／隐藏日期选择器
      self.showDP = function(boo) {
        self.datePickerShow = boo ? boo : false;
      };

    }
  ])

  .controller('bookHotelListController', ['$scope', '$location', '$http', '$stateParams', 'backendUrl',
    function($scope, $location, $http, $stateParams, backendUrl) {

      var self = this;
      console.log($stateParams.sDate + ', ' + $stateParams.eDate);

      self.init = function() {
        self.datePickerShow = false;
        self.hotels = {};
        self.checkIn = 1475097892000;
        self.checkOut = 1475184292000;
        self.search();
      }

      // 显示／隐藏日期选择器
      self.showDP = function(boo) {
        self.datePickerShow = boo ? boo : false;
      };

      self.search = function() {
      $http.get(backendUrl('hotels'))
        .success(function(data, status, headers, config) {
           self.hotels = data;
        })
        .error(function(data, status, headers, config) {
           alert(status)
        });

      }
    }
  ]);

})();