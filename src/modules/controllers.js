'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies'])
  
  .controller('RootController', ['$scope', '$window', '$http', '$filter', '$ionicModal', 'backendUrl', 
    function($scope, $window, $http, $filter, $ionicModal, backendUrl) {
      var self = this;
      
      // root全局变量：
      self.params = {};
      // self.params.appid
      /* self.params.wxUserInfo
      {    
       "openid":" OPENID",  
       " nickname": NICKNAME,   
       "sex":"1",   
       "province":"PROVINCE"   
       "city":"CITY",   
       "country":"COUNTRY",    
       "headimgurl":    "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ
      4eMsv84eavHiaiceqxibJxCfHe/46",  
      "privilege":[ "PRIVILEGE1" "PRIVILEGE2"     ],    
       "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL" 
      } 
      */


      self.init = function() {

        // 获取 code 和 appid
        var qString = $window.location.search.substring(1);
        var qParts = qString.parseQuerystring();
        var code = qParts.code;
        var appid = qParts.appid;

        // 将 appid 记在 root params 缓存里
        self.setParams('appid', appid);

        // 获取cleartoken（clear_session）和openid
        self.getUserID(code, appid);

        // wx注册
        self.wxConfigJSSDK();

      }

      self.setParams = function(name, val) {
        self.params[name] = val;
      }

      self.getParams = function(name) {
        return self.params[name];
      }

      self.getUserID = function(code, appid) {
        var data = {
          "appid": appid,
          "code": code
        };
        data = JSON.stringify(data);
        $http.post(backendUrl('buildsession', 'server'), data)
          .success(function(data, status, headers, config) {
            self.getWxUserInfo(data.access_token, data.openid);
          })
          .error(function(data, status, headers, config) {
            // todo use ionic alert style
            alert($filter('translate')('serverError') + status);
          })
      }

      self.getWxUserInfo = function(access_token, openid) {
        // todo lang
        var data = {
          "access_token": access_token,
          "openid": openid,
          "lang": "zh_CN"
        };
        
        $http.post(backendUrl('wxuserinfo', 'server'), data)
          .success(function(data, status, headers, config) {
            // 将 wxUserInfo 记在 root params 缓存里
            self.setParams('wxUserInfo', data);
          })
          .error(function(data, status, headers, config) {
            // todo use ionic alert style
            alert($filter('translate')('serverError') + status);
          })
      }

      self.wxConfigJSSDK = function() {

        // http://www.cnblogs.com/sunshq/p/4171490.html
        self.noncestr = Math.random().toString(36).substr(2);
        self.timestamp = new Date().getTime() + '';

        var data = {
          "appid": self.getParams('appid'),
          "noncestr": self.noncestr,
          "timestamp": self.timestamp,
          "url": window.location.origin + window.location.pathname + window.location.search
        };
        data = JSON.stringify(data);

        $http.post(backendUrl('jssign', 'server'), data)
          .success(function(data, status, headers, config) {
            if(data.rescode == '200') {
              wx.config({
                debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: self.getParams('appid'), // 必填，公众号的唯一标识
                timestamp: self.timestamp, // 必填，生成签名的时间戳
                nonceStr: self.noncestr, // 必填，生成签名的随机串
                signature: data.signature,// 必填，签名，见附录1
                jsApiList: ['getLocation'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
              });
            }
            else {
              // todo use ionic alert style
              alert($filter('translate')('serverError') + data.rescode);
            }
          })
          .error(function(data, status, headers, config) {
            // todo use ionic alert style
            alert($filter('translate')('serverError') + status);
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

  .controller('bookHotelListController', ['$scope', '$filter', '$location', '$http', '$stateParams', 'backendUrl',
    function($scope, $filter, $location, $http, $stateParams, backendUrl) {

      var self = this;
      console.log($stateParams.sDate + ', ' + $stateParams.eDate);

      self.init = function() {
        self.datePickerShow = false;
        self.hotels = {};
        self.checkin = new Date().getTime();
        self.checkout = new Date().getTime() + 24*60*60*1000;
        self.cityLists = [
          {
            "initials": "全部",
            "lists": [
              {
                "cityName": "全部",
                "cityId": "0"
              }
            ]
          },
          {
            "initials": "A",
            "lists": [
              {
                "cityName": "阿尔山",
                "cityId": "1"
              },
              {
                "cityName": "阿克苏",
                "cityId": "2"
              },
              {
                "cityName": "澳门",
                "cityId": "3"
              }
            ]
          },
          {
            "initials": "B",
            "lists": [
              {
                "cityName": "北京",
                "cityId": "4"
              }
            ]
          },
          {
            "initials": "H",
            "lists": [
              {
                "cityName": "海口",
                "cityId": "5"
              },
              {
                "cityName": "杭州",
                "cityId": "6"
              }
            ]
          },
          {
            "initials": "L",
            "lists": [
              {
                "cityName": "丽江",
                "cityId": "7"
              }
            ]
          },
          {
            "initials": "S",
            "lists": [
              {
                "cityName": "上海",
                "cityId": "8"
              },
              {
                "cityName": "三亚",
                "cityId": "9"
              },
              {
                "cityName": "沈阳",
                "cityId": "10"
              },
              {
                "cityName": "石家庄",
                "cityId": "11"
              },
              {
                "cityName": "苏州",
                "cityId": "12"
              }
            ]
          }
        ];
        self.cityInfo = {id: '0', name: '全部'};
        self.search();
      }

      // 显示／隐藏日期选择器
      self.showDP = function(boo) {
        self.datePickerShow = boo ? boo : false;
      };

      // 显示／隐藏城市选择器
      self.showCP = function(boo) {
        self.cityPickerShow = boo ? boo : false;
      };

      self.doAfterPickDates = function(checkin, checkout) {
        self.checkin = checkin;
        self.checkout = checkout;
        self.showDP(false);
      };

      self.doAfterPickCity = function(cityId, cityName) {
        self.cityInfo = {id: cityId, name: cityName};
        self.showCP(false);
      };

      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('bookHotelList')
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.hotels = data.data.lists;
            console.log(self.hotels)
          }, function errorCallback(data, status, headers, config) {
            alert(status)
          });  

      }
    }
  ])

  .controller('bookRoomListController', ['$http', '$filter',
    function($http,$filter) {
      var self = this;

      self.init = function() {
        
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('bookRoomList')
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.hotels = data.data.lists;
            console.log(self.hotels)
          }, function errorCallback(data, status, headers, config) {
            alert(status)
          });  

      }
    }
  ])

  .controller('hotelInfoController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('bookInfoController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('bookResultController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('bookRoomSoldOutController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])
  
  .controller('memberHomeController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('memberLoginController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('memberRegisterController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('memberInfoEditController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('memberResetPWController', ['$http', 
    function($http) {
      var self = this;
      
      self.init = function() {
        
      }
    }
  ])

  .controller('memberOrderListController', ['$scope',
    function($scope) {
      var self = this;

      self.init = function() {
      }
  }])

})();