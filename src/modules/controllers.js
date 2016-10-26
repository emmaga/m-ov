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

  .controller('bookHotelListController', ['$scope', '$filter', '$location', '$http', '$stateParams', 'loadingService', 'backendUrl',
    function($scope, $filter, $location, $http, $stateParams, loadingService, backendUrl) {
      var self = this;

      // console.log($stateParams.sDate + ', ' + $stateParams.eDate);
      self.init = function() {
        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchProjectInfoBool =false;
        self.showLoadingBool.searchCityListsBool =false;
        self.showLoadingBool.searchHotelListBool =false;
        loadingService(self.showLoadingBool);
        self.datePickerShow = false;
        self.hotels = {};
        self.checkin = new Date().getTime();
        self.checkout = new Date().getTime() + 24*60*60*1000;
        self.cityInfo = {id: '0', name: '全部'};
        self.searchProjectInfo();
        self.searchHotelList();
        self.searchCityLists();
       
        
      }
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
      // 项目信息
      self.searchProjectInfo = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('projectInfo')
        }).then(function successCallback(data, status, headers, config) {
            self.projectInfo = data.data.projectInfo;
            self.showLoadingBool.searchProjectInfoBool =true; 
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchProjectInfoBool =true; 
            loadingService(self.showLoadingBool);
            alert(status)
          });  
      }
      // 获取城市
      self.searchCityLists = function() {
        
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('cityLists')
        }).then(function successCallback(data, status, headers, config) {
            self.cityLists = data.data.data.cityLists;
            self.showLoadingBool.searchCityListsBool =true;
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchCityListsBool =true;
            loadingService(self.showLoadingBool);
            alert(status)
          });  
      }
      self.searchHotelList = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('hotelList')
        }).then(function successCallback(data, status, headers, config) {
            self.hotels = data.data.data.hotelLists;
            self.showLoadingBool.searchHotelListBool =true;
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchHotelListBool =true;
            loadingService(self.showLoadingBool);
            alert(status)
          });  
      }
    }
  
  ])

  .controller('bookRoomListController', ['$scope', '$http', '$filter', '$stateParams', '$timeout', 'loadingService', 'backendUrl',
    function($scope,$http,$filter,$stateParams,$timeout,loadingService,backendUrl) {
      console.log("bookRoomListController")
      var self = this;
      
      

      self.init = function() {
        self.hotelId = $stateParams.hotelId;
        self.checkIn = $stateParams.checkIn;
        self.checkOut = $stateParams.checkOut;

        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchHotelInfoBool =false; 
        self.showLoadingBool.searchRoomListBool = false;
        loadingService(self.showLoadingBool);

        self.searchHotelInfo();
        self.searchRoomList();
      }
      
      self.searchHotelInfo = function() {
        
        $timeout(function(){
          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('hotelInfo'),
            data:{
              hotelId:self.hotelId
            }
          }).then(function successCallback(data, status, headers, config) {
              self.hotel = data.data.data.hotel;
              self.showLoadingBool.searchHotelInfoBool =true; 
              loadingService(self.showLoadingBool);
              console.log("searchHotelInfoBool")
            }, function errorCallback(data, status, headers, config) {
              self.showLoadingBool.searchHotelInfoBool =true; 
              loadingService(self.showLoadingBool);
              alert(status)
            });  
        },500)
          
      }
      self.searchRoomList = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('roomList'),
          data:{
            hotelId:self.hotelId
          }
        }).then(function successCallback(data, status, headers, config) {
            self.rooms = data.data.data;
            self.showLoadingBool.searchRoomListBool = true;
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchHotelInfoBool =true; 
            loadingService(self.showLoadingBool);
            alert(status)
          });  
      }

    }
  ])

  .controller('roomInfoController', ['$http', '$filter', '$stateParams', '$timeout', 'loadingService', 'backendUrl',
    function($http,$filter,$stateParams,$timeout,loadingService,backendUrl) {
      console.log("roomInfoController")
      console.log($stateParams)
      var self = this;
      self.init = function() {
        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchBool =false; 
        loadingService(self.showLoadingBool);
        
        self.checkin = $stateParams.checkIn;
        self.checkout = $stateParams.checkOut;
        self.search();
      }
      
      self.showDP = function(boo) {
        self.datePickerShow = boo ? boo : false;
      };
      self.doAfterPickDates = function(checkin, checkout) {
        self.checkin = checkin;
        self.checkout = checkout;
        self.showDP(false);
      };
      self.search = function() {
       $timeout(function(){
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('roomInfo'),
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.room = data.data.data.room;
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool);
            alert(status)
          }); 
       },500)
         
      }
      self.getAuthCode = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('authCode')
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
          }, function errorCallback(data, status, headers, config) {
            alert(status)
          });  
      }
    }
  ])

  .controller('orderInfoController', ['$http', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http,$filter,$stateParams,loadingService,backendUrl) {
      console.log("bookInfoController")
      var self = this;
      
      self.init = function() {
        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchBool =false;
        loadingService(self.showLoadingBool);

        self.search();
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('orderInfo')
        }).then(function successCallback(data, status, headers, config) {
            self.room = data.data.data.room;
            self.hotel = data.data.data.hotel;
            self.roomOrder = data.data.data.roomOrder;
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool);
            alert(status)
          });  
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
  
  .controller('memberHomeController', ['$http', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http,$filter,$stateParams,loadingService,backendUrl) {
      console.log("memberHomeController")
      var self = this;
      self.init = function() {
          // 遮罩层 bool
          self.showLoadingBool = {};
          self.showLoadingBool.searchBool =false; 
          self.showLoading(self.showLoadingBool.searchBool)

          self.search();
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('memberInfo')
          
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.member = data.data.data.member;
            console.log(self.member)
            self.showLoadingBool.searchBool =true; 
            self.showLoading(self.showLoadingBool.searchBool)
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchBool =true; 
            self.showLoading(self.showLoadingBool.searchBool)
            alert(status)
          });  
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

  .controller('memberInfoEditController', ['$http', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http,$filter,$stateParams,loadingService,backendUrl) {
      console.log("memberInfoEditController")
      var self = this;
      self.memberId = $stateParams.memberId;
      self.init = function() {
          // 遮罩层 bool
          self.showLoadingBool = {};
          self.showLoadingBool.searchBool =false; 
          loadingService(self.showLoadingBool);

          self.search();
      }
      
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('memberInfo'),
          data:{
            hotelId:$stateParams.hotelId,
            roomId:$stateParams.roomId,
          }
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.member = data.data.data.member;
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool);
            alert(status)
          });  
      }

      self.getAuthCode = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('authCode')
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
          }, function errorCallback(data, status, headers, config) {
            alert(status)
          });  
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

  .controller('memberOrderListController', ['$http', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http,$filter,$stateParams,loadingService,backendUrl) {
      var self = this;

      self.init = function() {
        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchBool =false; 
        loadingService(self.showLoadingBool)
        self.search();
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('orderList')
        }).then(function successCallback(data, status, headers, config) {
           console.log(data)
            self.orderLists = data.data.data.orderLists;
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool)
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool)
            alert(status)
          });  
      }
  }])

})();