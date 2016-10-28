'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies'])
  
  .controller('RootController', ['$scope', '$window', '$http', '$filter', '$ionicModal', '$translate', 'backendUrl', 
    function($scope, $window, $http, $filter, $ionicModal, $translate, backendUrl) {
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

        // wx share
        self.wxShare = function() {
          // 1秒后再获取link，不然还是上一个页面的link
          setTimeout(function() {
            // 分享给朋友
            wx.onMenuShareAppMessage({
              title: '', // 分享标题
              desc: '', // 分享描述
              link: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+
              self.getParams('appid')+'&redirect_uri='+ 
              encodeURIComponent(window.location.origin + window.location.pathname + window.location.hash)+
              '&response_type=code&scope=snsapi_userinfo&state=&component_appid=wx5bfdc86d4b702418#wechat_redirect', // 分享链接
              imgUrl: '', // 分享图标
              type: '', // 分享类型,music、video或link，不填默认为link
              dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
              success: function () { 
                  // 用户确认分享后执行的回调函数
              },
              cancel: function () { 
                  // 用户取消分享后执行的回调函数
              }
            });

            // 分享到朋友圈
            wx.onMenuShareTimeline({
              title: '', // 分享标题
              link: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid='+
              self.getParams('appid')+'&redirect_uri='+ 
              encodeURIComponent(window.location.origin + window.location.pathname + window.location.hash)+
              '&response_type=code&scope=snsapi_userinfo&state=&component_appid=wx5bfdc86d4b702418#wechat_redirect', // 分享链接
              imgUrl: '', // 分享图标
              success: function () { 
                  // 用户确认分享后执行的回调函数
              },
              cancel: function () { 
                  // 用户取消分享后执行的回调函数
              }
            });
          }, 1000);
        };

        self.searchProjectInfo();
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
        $http.post(backendUrl('buildsession', '', 'server'), data)
          .success(function(data, status, headers, config) {
            self.getWxUserInfo(data.access_token, data.openid);
          })
          .error(function(data, status, headers, config) {
            // todo use ionic alert style
            alert($filter('translate')('serverError') + status);
          })
      }

      self.getWxUserInfo = function(access_token, openid) {

        var lang = $translate.proposedLanguage() || $translate.use();
        lang = lang == 'zh-CN' ? 'zh_CN' : 'en';
        var data = {
          "access_token": access_token,
          "openid": openid,
          "lang": lang
        };
        data = JSON.stringify(data);
        $http.post(backendUrl('wxuserinfo', '', 'server'), data)
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

        $http.post(backendUrl('jssign', '', 'server'), data)
          .success(function(data, status, headers, config) {
            if(data.rescode == '200') {
              wx.config({
                debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: self.getParams('appid'), // 必填，公众号的唯一标识
                timestamp: self.timestamp, // 必填，生成签名的时间戳
                nonceStr: self.noncestr, // 必填，生成签名的随机串
                signature: data.signature,// 必填，签名，见附录1
                jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'chooseWXPay'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
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
      
      // 项目信息
      self.searchProjectInfo = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('project','projectInfo')
        }).then(function successCallback(data, status, headers, config) {
           console.log(data)
            self.projectInfo = data.data.data;
            self.setParams('projectInfo',self.projectInfo);
          }, function errorCallback(data, status, headers, config) {
            alert(status)
          });  
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

  .controller('bookHotelListController', ['$scope', '$filter', '$timeout', '$location', '$http', '$stateParams', 'loadingService', 'backendUrl', 'util',
    function($scope, $filter, $timeout, $location, $http, $stateParams, loadingService, backendUrl,util) {
      var self = this;

      self.init = function() {

        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();

        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchCityListsBool =false;
        self.showLoadingBool.searchHotelListBool =false;
        loadingService(self.showLoadingBool);
        self.datePickerShow = false;
        self.hotels = {};
        self.checkin = new Date().getTime();
        self.checkout = self.checkin + 24*60*60*1000;

        // 酒店天数
        self.stayDays = util.countDay(self.checkin,self.checkout);

        self.cityInfo = {id: '0', name: '全部'};
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

        self.stayDays = util.countDay(self.checkin,self.checkout);
        // 延时半秒隐藏
        $timeout(function() {self.showDP(false);}, 500);
      };

      self.doAfterPickCity = function(cityId, cityName) {
        self.cityInfo = {id: cityId, name: cityName};
        self.showCP(false);
      };

      console.log(backendUrl('project','projectInfo'))
      console.log(backendUrl('project','cityLists'))
     

      // 获取城市
      self.searchCityLists = function() {
        
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('project','cityLists')
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
          url: backendUrl('bookHotel','hotelList')
        }).then(function successCallback(data, status, headers, config) {
            self.hotels = data.data.data.hotelLists;
            self.hotelNum = data.data.data.hotelNum;
            self.showLoadingBool.searchHotelListBool =true;
            loadingService(self.showLoadingBool);
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchHotelListBool =true;
            loadingService(self.showLoadingBool);
            alert(status)
          });  
      }
  }])

  .controller('bookRoomListController', ['$scope', '$http', '$filter', '$stateParams', '$timeout', 'loadingService', 'backendUrl', 'BACKEND_CONFIG', 'util',
    function($scope,$http,$filter,$stateParams,$timeout,loadingService,backendUrl,BACKEND_CONFIG,util) {
      console.log('bookRoomListController')
      var self = this;
      console.log(util.countDay(1,2))
      self.init = function() {

        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();

        self.hotelId = $stateParams.hotelId ;
        self.checkIn = $stateParams.checkIn -0;
        self.checkOut = $stateParams.checkOut -0;

        // 酒店天数
        self.stayDays = util.countDay(self.checkIn,self.checkOut);

        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchHotelInfoBool =false; 
        self.showLoadingBool.searchRoomListBool = false;
        loadingService(self.showLoadingBool);

        self.searchHotelInfo();
        self.searchRoomList();
      }
      self.showDP = function(boo) {
        self.datePickerShow = boo ? boo : false;
      };
      self.doAfterPickDates = function(checkin, checkout) {
        self.checkIn = checkin;
        self.checkOut = checkout;

        self.stayDays = util.countDay(self.checkIn,self.checkOut);
        // 延时半秒隐藏
        $timeout(function() {self.showDP(false);}, 500);
      };
      // 住酒店 天数
      // self.day
      self.searchHotelInfo = function() {
        
        $timeout(function(){
          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('bookHotel','hotelInfo')
          }).then(function successCallback(data, status, headers, config) {
              self.hotel = data.data.data.hotel;
              self.showLoadingBool.searchHotelInfoBool =true; 

              // 酒店 地图 
              self.locationHref = BACKEND_CONFIG.mapUrl + '?x='+self.hotel.hotelLocation.X +'&y=' +self.hotel.hotelLocation.Y;
              loadingService(self.showLoadingBool);
              console.log("searchHotelInfoBool")
            }, function errorCallback(data, status, headers, config) {
              self.showLoadingBool.searchHotelInfoBool =true; 
              loadingService(self.showLoadingBool);
              alert(status)
            });  
        },300)
      }

      self.searchRoomList = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('bookHotel','roomList')
          
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

  .controller('hotelInfoController', ['$http', '$scope',
    function($http, $scope) {
      var self = this;
      
      self.init = function() {
        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();
      }
    }
  ])
  
  .controller('roomInfoController', ['$location', '$scope', '$http', '$filter', '$state', '$stateParams', '$timeout', 'loadingService', 'backendUrl', 'util',
    function($location,$scope,$http,$filter,$state,$stateParams,$timeout,loadingService,backendUrl,util) {
      console.log("roomInfoController")
      console.log($stateParams)
      var self = this;
      self.init = function() {

        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();

        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchBool =false; 
        loadingService(self.showLoadingBool);
        
        self.checkIn = $stateParams.checkIn - 0;
        self.checkOut = $stateParams.checkOut - 0;
        self.roomId = $stateParams.roomId;
        
        self.stayDays = util.countDay(self.checkIn,self.checkOut);
        self.search();
      }
      
     
      self.search = function() {
       $timeout(function(){
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('bookHotel','roomInfo'),
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.room = data.data.data.room;
            console.log(self.room)
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
      self.newOrder = function() {

        $state.go('orderInfo({orderId:1})')
        return;

        var data = {
          "wxappid"       : self.getParams('appid'),             // 公众ID
          "openid"        : self.getParams('wxUserInfo').openid,    
          "orderType"     : "Room",                              // Room/Shop
          "goodsID"       : self.roomId,                         // 商品ID
          
          // todo, self.params.projectName
          "goodsName"     : "清鹤酒店连锁",                        // 商品名称
          "goodsDetail"   : self.room.roomName,                  // 商品详情
          
          // todo
          "goodsExtraInfo": "钻石会员",                            // 商品额外信息
          
          // todo
          "goodsPrice"    : 1,                                   // 整型，单位分
          
          // todo
          "clientIP"      : "1.1.1.1"                            // 客户端ip
        };
        data = JSON.stringify(data);
        $http.post(backendUrl('neworder', 'server'), data)
          .success(function(data, status, headers, config) {
            if(data.rescode == '200') {
              self.wxPay(data.nonceStr, data.sign, data.prepay_id, data.orderID);
            }
            else {
              // todo use ionic alert style
              alert($filter('translate')('serverError') + ' ' + data.rescode + ' ' + data.errInfo);
            }
          })
          .error(function(data, status, headers, config) {
            // todo use ionic alert style
            alert($filter('translate')('serverError') + status);
          })
      }

      self.wxPay = function(nonceStr, paySign, prepay_id, orderId) {
        wx.chooseWXPay({
          timestamp: new Date.getTime(), // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
          nonceStr: nonceStr, // 支付签名随机串，不长于 32 位
          package: 'prepay_id='+prepay_id, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
          signType: 'MD5', // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
          paySign: paySign, // 支付签名
          success: function (res) {
              // 支付成功后的回调函数
              $location.path('/orderInfo/'+orderId);
          }
        });
      }
    }
  ])

  .controller('orderInfoController', ['$scope', '$http', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($scope,$http,$filter,$stateParams,loadingService,backendUrl) {
      console.log("bookInfoController")
      var self = this;
      
      self.init = function() {

        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();

        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchBool =false;
        loadingService(self.showLoadingBool);

        self.search();
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('order','orderInfo')
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
  }])
  
  .controller('bookRoomSoldOutController', ['$http', '$scope',
    function($http, $scope) {
      var self = this;
      
      self.init = function() {
        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();
      }
    }
  ])
  
  .controller('memberHomeController', ['$http', '$scope', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http, $scope, $filter,$stateParams,loadingService,backendUrl) {
      console.log("memberHomeController")

      var self = this;
      self.init = function() {

          // 注册微信分享朋友和朋友圈
          $scope.root.wxShare();

          // 遮罩层 bool
          self.showLoadingBool = {};
          self.showLoadingBool.searchBool =false; 
          loadingService(self.showLoadingBool.searchBool)

          self.search();
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('member','memberInfo')
          
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.member = data.data.data.member;
            console.log(self.member)
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool.searchBool)
          }, function errorCallback(data, status, headers, config) {
            self.showLoadingBool.searchBool =true; 
            loadingService(self.showLoadingBool.searchBool)
            alert(status)
          });
      }
    }
  ])

  .controller('memberInfoEditController', ['$http', '$scope', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http, $scope, $filter,$stateParams,loadingService,backendUrl) {
      console.log("memberInfoEditController");
      var self = this;
      self.memberId = $stateParams.memberId;
      self.init = function() {

          // 注册微信分享朋友和朋友圈
          $scope.root.wxShare();

          // 遮罩层 bool
          self.showLoadingBool = {};
          self.showLoadingBool.searchBool =false; 
          loadingService(self.showLoadingBool);

          self.search();
      }
      
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('member','memberInfo'),
          data:{
            hotelId:$stateParams.hotelId,
            roomId:$stateParams.roomId,
          }
        }).then(function successCallback(data, status, headers, config) {
            console.log(data)
            self.member = data.data.data.member;
            console.log(self.member)
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

  .controller('memberOrderListController', ['$http', '$scope', '$filter', '$stateParams', 'loadingService', 'backendUrl',
    function($http, $scope, $filter,$stateParams,loadingService,backendUrl) {
      console.log('memberOrderListController')
      var self = this;

      self.init = function() {
        
        // 注册微信分享朋友和朋友圈
        $scope.root.wxShare();

        // 遮罩层 bool
        self.showLoadingBool = {};
        self.showLoadingBool.searchBool =false; 
        loadingService(self.showLoadingBool)
        self.search();
      }
      self.search = function() {
        $http({
          method: $filter('ajaxMethod')(),
          url: backendUrl('member','orderList')
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