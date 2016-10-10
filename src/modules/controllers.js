'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies']);

  app

.controller('RootController', ['$scope', '$window', '$http', '$ionicModal', 'backendUrl',
    function($scope, $window, $http, $ionicModal, backendUrl) {
      var self = this;

      self.init = function() {
        var qString = $window.location.search.substring(1);
        var qParts = qString.parseQuerystring();
        var authCode = qParts.auth_code;
        self.getWxAccessToken(authCode);
      }

      self.getWxAccessToken = function(authCode) {

        var data = {"auth_code": authCode};
        console.log(data);
        data = JSON.stringify(data);
        console.log(data);

        $http.post('http://openvod.cleartv.cn/backend_wx/v1/page_token', data)
          .success(function(data, status, headers, config) {
             console.log(data)
          })
          .error(function(data, status, headers, config) {
             alert(status)
          })
      }

      // menu modal 弹出
      $ionicModal.fromTemplateUrl('pages/mainMenu.html', {
        scope: $scope,
        animation: 'slide-in-left'
      }).then(function(modal) {
        $scope.modal = modal;
      });
      self.showMainMenu = function() {
         $scope.modal.show();
      }
  }])

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
        self.checkin = 1475097892000;
        self.checkout = 1477756800000;
        self.search();
      }

      // 显示／隐藏日期选择器
      self.showDP = function(boo) {
        self.datePickerShow = boo ? boo : false;
      };

      self.doAfterPickerDates = function(checkin, checkout) {
        self.checkin = checkin;
        self.checkout = checkout;
        self.showDP(false);
      }

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
  ])

  .controller('userOrderController', ['$scope', '$ionicModal',
    function($scope, $ionicModal) {
      var self = this;

      self.init = function() {
      }
      // menu modal 弹出
      $ionicModal.fromTemplateUrl('pages/mainMenu.html', {
        scope: $scope,
        animation: 'slide-in-left'
      }).then(function(modal) {
        $scope.modal = modal;
      });
      self.showMainMenu = function() {
         $scope.modal.show();
      }
  }])
  

})();