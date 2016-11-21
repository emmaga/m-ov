'use strict';

(function() {
    var app = angular.module('app.controllers', ['ngCookies'])

    .controller('RootController', ['$scope', '$window', '$http', '$filter', '$ionicModal', '$translate', 'backendUrl', 'BACKEND_CONFIG', '$ionicLoading', '$ionicGesture', 'setTitle',
        function($scope, $window, $http, $filter, $ionicModal, $translate, backendUrl, BACKEND_CONFIG, $ionicLoading, $ionicGesture, setTitle) {
            var self = this;

            self.init = function() {
                self.wxBrowserHack();

                if(BACKEND_CONFIG.test == true) {
                    // 标志已经拿到clearsession和wx初始化
                    self._readystate = true;
                }

                // root全局变量：
                self.params = {};
                // self.params.appid
                // self.params.userid
                // self.params.clear_session
                // self.params.refresh_token
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

                * self.params.projectInfo
                {
                  "projectName": "项目-酒店名字",
                  "projectImgSrc": "api/img/doodle.html"
                }
                 self.params.memberInfo 

                 {
                   "member": {
                       "memberId": "123321123312",
                       "memberLevel": {
                         "name":"微信会员",
                         "class":"class1"
                       },
                       "score": "100",
                       "realName":"LiSi",
                       "mobile": "13783476981",
                       "idCardNumber": "410181999200000000",
                       "birthday": "100"
                    }
                 }
                */

                // 获取 code 和 appid
                var qString = $window.location.search.substring(1);
                var qParts = qString.parseQuerystring();
                var code = qParts.code;
                var appid = qParts.appid;

                // 将 appid 记在 root params 缓存里
                self.setParams('appid', appid);

                /* 获取cleartoken（clear_session）和openid
                 * wx注册
                 * 获取项目及会员信息 
                 */
                self.buildsession(code, appid);
            }

            self.wxBrowserHack = function() {
                document.addEventListener('touchmove', function(event) {
                    // event.preventDefault();
                    var l = document.getElementsByClassName('card');
                    for(var i=0; i< l.length; i++) {
                        l[i].style.pointerEvents= "none";
                    }
                })
                document.addEventListener('scroll', function(event) {
                    // event.preventDefault();
                    var l = document.getElementsByClassName('card');
                    for(var i=0; i< l.length; i++) {
                        l[i].style.pointerEvents= "auto";
                    }
                })
            }

            self.setParams = function(name, val) {
                self.params[name] = val;
            }

            self.getParams = function(name) {
                return self.params[name];
            }

            self.buildsession = function(code, appid) {
                BACKEND_CONFIG.test&&console.log('buildsession');
                $ionicLoading.show({
                  template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
                });

                var data = {
                    "appid": appid,
                    "code": code
                };
                data = JSON.stringify(data);

                $http({
                  method: 'POST',
                  url: backendUrl('buildsession', '', 'server'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                    self.setParams('userid', data.data.userid);
                    self.setParams('clear_session', data.data.clear_session);
                    self.setParams('refresh_token', data.data.refresh_token);
                    self.getWxUserInfo(data.data.access_token, data.data.openid);     
                }, function errorCallback(data, status, headers, config) {
                    $ionicLoading.hide();
                })
            }

            self.getWxUserInfo = function(access_token, openid) {
                BACKEND_CONFIG.test&&console.log('getWxUserInfo');
                var lang = $translate.proposedLanguage() || $translate.use();
                lang = lang == 'zh-CN' ? 'zh_CN' : 'en';
                var data = {
                    "appid": self.getParams('appid'),
                    "userid": self.getParams('userid'),
                    "access_token": access_token,
                    "lang": lang
                };
                data = JSON.stringify(data);
                $http({
                  method: 'POST',
                  url: backendUrl('wxuserinfo', '', 'server'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                    // 将 wxUserInfo 记在 root params 缓存里
                    self.setParams('wxUserInfo', data.data);
                    BACKEND_CONFIG.test&&console.log(JSON.stringify(data));
                    self.WXConfigJSSDK();
                }, function errorCallback(data, status, headers, config) {
                    $ionicLoading.hide();
                })
            }


            self.WXConfigJSSDK = function() {
                BACKEND_CONFIG.test&&console.log('jssign');
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
                $http({
                  method: 'POST',
                  url: backendUrl('jssign', '', 'server'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                        // 标志已经拿到clearsession和wx初始化
                        self._readystate = true;

                        self.loadProjectInfo();
                        wx.config({
                            debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                            appId: self.getParams('appid'), // 必填，公众号的唯一标识
                            timestamp: self.timestamp, // 必填，生成签名的时间戳
                            nonceStr: self.noncestr, // 必填，生成签名的随机串
                            signature: data.data.signature, // 必填，签名，见附录1
                            jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'chooseWXPay', 'openLocation'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                        });
                    } else {
                        alert($filter('translate')('serverError') + status);
                        $ionicLoading.hide();
                    }
                }, function errorCallback(data, status, headers, config) {
                    $ionicLoading.hide();
                })
            }
            self.loadProjectInfo = function() {
                BACKEND_CONFIG.test&&console.log('项目信息');
                var data = {
                    "clear_session": self.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('projectinfo', 'projectInfo'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                    self.projectInfo = data.data.data;
                    self.setParams('projectInfo', self.projectInfo);
                    setTitle('测试酒店名称')
                    // setTitle(self.params.projectInfo.projectName)
                }, function errorCallback(data, status, headers, config) {
                    $ionicLoading.hide();
                })
            }

            // wx share
            self.wxShare = function() {
                // 1秒后再获取link，不然还是上一个页面的link
                setTimeout(function() {
                    // 分享给朋友
                    wx.onMenuShareAppMessage({
                        title: '', // 分享标题
                        desc: '', // 分享描述
                        link: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
                            self.getParams('appid') + '&redirect_uri=' +
                            encodeURIComponent(window.location.origin + window.location.pathname + window.location.hash) +
                            '&response_type=code&scope=snsapi_userinfo&state=&component_appid=wx5bfdc86d4b702418#wechat_redirect', // 分享链接
                        imgUrl: '', // 分享图标
                        type: '', // 分享类型,music、video或link，不填默认为link
                        dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                        success: function() {
                            // 用户确认分享后执行的回调函数
                        },
                        cancel: function() {
                            // 用户取消分享后执行的回调函数
                        }
                    });

                    // 分享到朋友圈
                    wx.onMenuShareTimeline({
                        title: '', // 分享标题
                        link: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
                            self.getParams('appid') + '&redirect_uri=' +
                            encodeURIComponent(window.location.origin + window.location.pathname + window.location.hash) +
                            '&response_type=code&scope=snsapi_userinfo&state=&component_appid=wx5bfdc86d4b702418#wechat_redirect', // 分享链接
                        imgUrl: '', // 分享图标
                        success: function() {
                            // 用户确认分享后执行的回调函数
                        },
                        cancel: function() {
                            // 用户取消分享后执行的回调函数
                        }
                    });
                }, 1000);
            };

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
        }
    ])

    .controller('bookHotelListController', ['$scope', '$filter', '$timeout', '$location', '$http', '$state', '$stateParams', '$translate', '$ionicModal','loadingService', 'backendUrl', 'util',
        function($scope, $filter, $timeout, $location, $http, $state, $stateParams, $translate, $ionicModal, loadingService, backendUrl, util) {
            console.log('bookHotelListController');
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }

            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchCityListsBool = false;
                
                self.datePickerShow = false;
                self.hotels = {};
                self.checkin = new Date().getTime();
                self.checkout = self.checkin + 24 * 60 * 60 * 1000;

                // 酒店天数
                self.stayDays = util.countDay(self.checkin, self.checkout);

                self.cityInfo = { id: '0', name: '全部' };
                
                // 异步 回调
                self.searchCityLists();
            }
            self.showDP = function(boo) {
                self.datePickerShow = boo ? boo : false;
                if(boo == false){
                    // 点击穿透
                    // 将日期点击变成不可点的状态
                    $scope.tdp.touchHackEnable = true;
                }
            };

            // 显示／隐藏城市选择器
            self.showCP = function(boo) {
                self.cityPickerShow = boo ? boo : false;
                if(boo == false){
                    // 点击穿透
                    // 将日期点击变成不可点的状态
                    $scope.cp.touchHackEnable = true;
                }
            };
            
            self.doAfterPickDates = function(checkin, checkout) {
                self.checkin = checkin;
                self.checkout = checkout;

                self.stayDays = util.countDay(self.checkin, self.checkout);
                // 延时半秒隐藏
                $timeout(function() { self.showDP(false); }, 500);
                self.searchHotelList();
            };

            self.doAfterPickCity = function(cityId, cityName) {
                self.cityInfo = { id: cityId, name: cityName };
                self.showCP(false);
                self.searchHotelList();
            };



            // 获取城市
            self.searchCityLists = function() {
                self.showLoadingBool.searchCityListsBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);
                  $http({
                      method: $filter('ajaxMethod')(),
                      url: backendUrl('citylist', 'cityLists'),
                      data: data
                  }).then(function successCallback(data, status, headers, config) {
                      console.log(data)
                      self.cityListContent = data.data.data;
                      console.log(self.cityListContent)
                      self.showLoadingBool.searchCityListsBool = true;
                      loadingService(self.showLoadingBool);
                      self.searchHotelList();
                  }, function errorCallback(data, status, headers, config) {
                      self.showLoadingBool.searchCityListsBool = true;
                      loadingService(self.showLoadingBool);
                  });  
            }

            self.searchHotelList = function() {
                // 请求之前 都要先清空
                self.hotels = {};
                // 每次 请求，都要添加loading
                self.loadingIcon = false;
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "bookCity": self.cityInfo.id-0, //0: all, 城市ID
                    "bookStartDate": $filter('date')(self.checkin-0,'yyyy-MM-dd'),
                    "bookEndDate": $filter('date')(self.checkout-0,'yyyy-MM-dd')
                };
                data = JSON.stringify(data);

                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('hotellist', 'hotelList'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.hotels = data.data.data;
                        self.hotelNum = self.hotels.length;
                        self.loadingIcon = true;
                    }, function errorCallback(data, status, headers, config) {
                        self.loadingIcon = true;
                    });
            }

            // // 弹出框
            // // 城市选择器 弹出
            // $ionicModal.fromTemplateUrl('pages/cityPicker.html', {
            //     scope: $scope,
            //     animation: 'slide-in-left'
            // }).then(function(modal) {
            //     self.cityModal = modal;
            // });
            // self.showCityModal = function() {
            //     self.modal.show();
            //     $scope.cp.init();
                
            // }

            // // 日历选择 弹出
            // $ionicModal.fromTemplateUrl('pages/travelDatePicker.html', {
            //     scope: $scope,
            //     animation: 'slide-in-left'
            // }).then(function(modal) {
            //     self.dateModal = modal;
            // });
            // self.showDateModal = function() {
            //     self.dateModal.show();
            // }
        }
    ])

    .controller('bookRoomListController', ['$scope', '$http', '$filter', '$state', '$stateParams', '$timeout', '$ionicSlideBoxDelegate', '$translate', 'loadingService', 'backendUrl', 'BACKEND_CONFIG', 'util',
        function($scope, $http, $filter, $state, $stateParams, $timeout, $ionicSlideBoxDelegate, $translate, loadingService, backendUrl, BACKEND_CONFIG, util) {
            console.log('bookRoomListController')
            console.log($stateParams)
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {
                
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.hotelId = $stateParams.hotelId;
                self.checkIn = $stateParams.checkIn - 0;
                self.checkOut = $stateParams.checkOut - 0;
                // 酒店天数
                self.stayDays = util.countDay(self.checkIn, self.checkOut);

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchHotelInfoBool = false;
                self.showLoadingBool.searchRoomListBool = false;
                //  searchHotelInfo  searchRoomList
                self.searchHotelInfo();
                // 异步 调用
                // self.searchRoomList();
            };

            self.map = function() {
                wx.openLocation({
                    latitude: self.hotel.LocationX, // 纬度，浮点数，范围为90 ~ -90
                    longitude: self.hotel.LocationY, // 经度，浮点数，范围为180 ~ -180。
                    name: self.hotel.Name, // 位置名
                    address: self.hotel.Address, // 地址详情说明
                    scale: 20, // 地图缩放级别,整形值,范围从1~28。默认为最大
                    infoUrl: '' // 在查看位置界面底部显示的超链接,可点击跳转
                });
            }
            self.showDP = function(boo) {
                self.datePickerShow = boo ? boo : false;
            };
            self.doAfterPickDates = function(checkin, checkout) {
                self.checkIn = checkin;
                self.checkOut = checkout;

                self.stayDays = util.countDay(self.checkIn, self.checkOut);
                // 延时半秒隐藏
                $timeout(function() { self.showDP(false); }, 500);
            };
            // 可以预订 才跳转
            self.nextState = function(roomId, checkIn, checkOut, AvailableNumList) {
                    var flag = true;
                    AvailableNumList.forEach(function(value,index,array){
                        if(array[index]['availableNum'] <= 0){
                            flag = false;
                            return flag;
                        } 
                    })
                    flag && $state.go('roomInfo', { roomId: roomId, hotelId: self.hotelId, checkIn: checkIn, checkOut: checkOut })
            };

            // 住酒店 天数
            // self.day
            self.searchHotelInfo = function() {
                self.showLoadingBool.searchHotelInfoBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session":$scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    // 假数据
                    // "hotelId": self.hotelId -0
                    "hotelId": 1
                };
                data = JSON.stringify(data);
                
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('hotelinfo', 'hotelInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.hotel = data.data.data;
                        console.log(self.hotel)
                        self.showLoadingBool.searchHotelInfoBool = true;
                        
                        // 酒店 地图 
                        // self.locationHref = BACKEND_CONFIG.mapUrl + '?x=' + self.hotel.hotelLocation.X + '&y=' + self.hotel.hotelLocation.Y;
                        loadingService(self.showLoadingBool);
                        self.searchRoomList();
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchHotelInfoBool = true;
                        loadingService(self.showLoadingBool);
                    });
            }

            self.searchRoomList = function() {
                self.showLoadingBool.searchRoomListBool = false;
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                     
                    // "hotelId": self.hotelId -0,
                    // 假数据
                    "hotelId": 1,
                    "bookStartDate": $filter('date')(self.checkIn-0,'yyyy-MM-dd'),
                    "bookEndDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd') 
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('roomlist', 'roomList'),
                    data: data

                }).then(function successCallback(data, status, headers, config) {
                    console.log(data)
                    self.rooms = data.data.data;
                    // ionic silder update
                    $ionicSlideBoxDelegate.update();
                    self.showLoadingBool.searchRoomListBool = true;
                    loadingService(self.showLoadingBool);
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchHotelInfoBool = true;
                    loadingService(self.showLoadingBool);
                });
            }

        }
    ])
    
    .controller('hotelInfoController', ['$scope', '$http', '$filter', '$state', '$stateParams', '$timeout', '$translate', 'loadingService', 'backendUrl', 'BACKEND_CONFIG', 'util',
        function($scope, $http, $filter, $state, $stateParams, $timeout, $translate, loadingService, backendUrl, BACKEND_CONFIG, util) {
            console.log('hotelInfoController')
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {
                // 注册微信分享朋友和朋友圈
                // $scope.root.wxShare();
                self.showLoadingBool = {};
                self.hotelId = $stateParams.hotelId;
                self.search();
            }

            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),

                    "hotelId": self.hotelId
                    
                };
                data = JSON.stringify(data);
                  $http({
                      method: $filter('ajaxMethod')(),
                      url: backendUrl('bookHotel', 'hotelInfo'),
                      data: data
                  }).then(function successCallback(data, status, headers, config) {
                      console.log(data.data.data)
                      self.hotel = data.data.data;
                      self.showLoadingBool.searchBool = true;
                      loadingService(self.showLoadingBool);
                  }, function errorCallback(data, status, headers, config) {
                      self.showLoadingBool.searchBool = true;
                      loadingService(self.showLoadingBool);
                  });  
            }
        }
    ])

    .controller('roomInfoController', ['$location', '$scope', '$http', '$filter', '$state', '$translate', '$stateParams', '$timeout', '$ionicSlideBoxDelegate', 'loadingService', 'backendUrl', 'util', 'BACKEND_CONFIG',
        function($location, $scope, $http, $filter, $state, $translate, $stateParams, $timeout, $ionicSlideBoxDelegate, loadingService, backendUrl, util, BACKEND_CONFIG) {
            console.log("roomInfoController")
            console.log($stateParams);
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                // self.showLoadingBool.searchRoomInfoBool = false;
                // // self.showLoadingBool.searchMemberInfoBool = false;
                // self.showLoadingBool.searchHotelInfoBool = false;

                self.submitOrderBool = false;
                self.checkIn = $stateParams.checkIn - 0;
                self.checkOut = $stateParams.checkOut - 0;
                self.roomId = $stateParams.roomId;
                self.hotelId = $stateParams.hotelId;

                self.stayDays = util.countDay(self.checkIn, self.checkOut);
                self.searchMemberInfo();
                // //  验证码 倒计时
                // self.countSeconds = 30;
                // self.showTip = true;

                // 默认选中房间数为1
                self.roomNumber = 1;
                // params 会员信息
                

                // 防止点透
                // 将input点击变成可点的状态
                $timeout(function() {self.touchHackEnable = false;}, 1000);
              
            }


            self.searchRoomInfo = function() {
                    self.showLoadingBool.searchRoomInfoBool = false;
                    loadingService(self.showLoadingBool);
                    var data = {
                        "clear_session": $scope.root.getParams('clear_session'),
                        "lang": $translate.proposedLanguage() || $translate.use(),
                        "roomId": self.roomId-0,
                        "hotelId": self.hotelId - 0,
                        "bookStartDate": $filter('date')(self.checkIn-0,'yyyy-MM-dd'),
                        "bookEndDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd')
                    };
                    data = JSON.stringify(data);

                        $http({
                            method: $filter('ajaxMethod')(),
                            url: backendUrl('roominfo', 'roomInfo'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            console.log(data)
                            self.searchHotelInfo();
                            self.room = data.data.data;
                            
                            
                            self.priceList = self.room.PriceInfo.PriceList;
                             // 单价
                            self.roomPriPerDay = self.roomBookPrcFun(self.priceList);
                            // // 房间数 最多 可选
                            // self.roomMax = Math.min(self.room.roomRemain, self.room.purchaseAbility);
                            
                            self.showLoadingBool.searchRoomInfoBool = true;
                            loadingService(self.showLoadingBool);
                            // ionic silder update
                            $ionicSlideBoxDelegate.update();
                        }, function errorCallback(data, status, headers, config) {
                            self.showLoadingBool.searchRoomInfoBool = true;
                            loadingService(self.showLoadingBool);
                        });
                
            }
             
            self.searchHotelInfo = function() {
                self.showLoadingBool.searchHotelInfoBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session":$scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    // "hotelId": self.hotelId-0
                    // 假数据
                    "hotelId": 1
                };
                data = JSON.stringify(data);
                
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('hotelinfo', 'hotelInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.hotel = data.data.data;
                        console.log(self.hotel)
                        self.showLoadingBool.searchHotelInfoBool = true;
                        
                        // 酒店 地图 
                        // self.locationHref = BACKEND_CONFIG.mapUrl + '?x=' + self.hotel.hotelLocation.X + '&y=' + self.hotel.hotelLocation.Y;
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchHotelInfoBool = true;
                        loadingService(self.showLoadingBool);
                    });
            }

            // 
            self.searchMemberInfo = function() {
                self.showLoadingBool.searchMemberInfoBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "getMemberInfo",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                    // "clear_session": "openvod_userid_9_5v2elt5z",
                    // "lang": "zh-CN"
                };
                data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('shopmember', 'memberInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.member = data.data.data.member;
                        console.log(self.member)
                        self.member.mobile -= 0;
                        self.showLoadingBool.searchMemberInfoBool = true;
                        loadingService(self.showLoadingBool);
                        self.searchRoomInfo();
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchMemberInfoBool = true;
                        loadingService(self.showLoadingBool)
                    });
            }
            
                // 计算客房总
            self.roomBookPrcFun = function(array) {
                    var length = array.length,
                        totalPri = 0;
                    for (var i = 0; i < length; i++) {
                        totalPri += Number(array[i]["price"]);
                    }
                    return totalPri;
                }
                // 更改房间数
            self.modifyRoomNum = function(num) {
                    if (num < 0) {
                        if (self.roomNumber == 1) {
                            return;
                        } else {
                            self.roomNumber -= 1;
                        }
                    } else {
                        if (self.roomNumber == self.roomMax) {
                            return;
                        } else {
                            self.roomNumber += 1;
                        }
                    }


                    // if (self.roomNumber == 1) {
                    //   return;
                    // } else if(self.roomNumber == self.roomMax) {
                    //   return;
                    // } else {
                    //   self.roomNumber=self.roomNumber+num;
                    // }
                }

                // 验证码 倒计时
                // self.countSecond = function(){
                //    self.countAbility = true;
                //    self.countSeconds = 30;
                //    self.showTip = false;

            //    self.settime = function(){
            //     --self.countSeconds;
            //     $timeout(function() {
            //         if (self.countSeconds==0) {
            //            self.countAbility = false;
            //            self.countSeconds = 30;
            //            self.showTip = true;
            //         } else {
            //           self.settime()
            //         }
            //     }, 1000)

            //    }
            //    self.settime();
            // }

            // emma 要求，先去掉验证码，(T_T)
            // self.getAuthCode = function() {
            //   // self.countSecond();
            //   var data = {
            //     "action": "GetDxAuthCode",
            //     "appid": $scope.root.getParams('appid'),
            //     "clear_session": "xxxx",
            //     "openid": $scope.root.getParams('openid'),
            //     "lang": $translate.proposedLanguage() || $translate.use(),
            //     "mobile": "13783476666"
            //   };
            //   data = JSON.stringify(data);
            //   $http({
            //     method: $filter('ajaxMethod')(),
            //     url: backendUrl('dxAuthCode','authCode')
            //   }).then(function successCallback(data, status, headers, config) {
            //       console.log(data)
            //     }, function errorCallback(data, status, headers, config) {
            //       
            //     });
            // }
            self.newOrder = function() {
                self.submitOrderBool = true;
                var bookTotalPri = self.roomPriPerDay*self.roomNumber
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "action": "newOrder",
                    "goodsList":[
                        {
                            "roomID": self.roomId - 0,
                            "bookStartDate": $filter('date')(self.checkIn-0,'yyyy-MM-dd'),
                            "bookEndDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd'),
                            "totalPrice":bookTotalPri,
                            "priceList": self.priceList,
                            "bookCount":self.roomNumber
                        }
                    ],
                    "totalPrice":bookTotalPri,
                    "contactName": self.member.realName,
                    "Mobile": self.member.mobile + ''
                     
                };
                data = angular.toJson(data,true);
                    $http.post(backendUrl('roomorder', '', 'server'), data)
                        .success(function(data, status, headers, config) {
                            if (data.rescode == '200') {
                                var orderID = data.data.orderID;
                                var data = {
                                    "clear_session": $scope.root.getParams('clear_session'),
                                    "action": "weixinPay",
                                    "payType": "JSAPI",
                                    "orderID": orderID
                                };
                                data = angular.toJson(data,true);
                                $http.post(backendUrl('roomorder', '', 'server'), data)
                                .success(function(data, status, headers, config){
                                     if (data.rescode == '200') {
                                        self.wxPay(data.data.JS_Pay_API, data.data.orderNum);
                                     } else {
                                         alert($filter('translate')('serverError') + ' ' + data.rescode + ' ' + data.errInfo);
                                     }
                                })
                                .error(function(data, status, headers, config) {
                                    alert($filter('translate')('serverError') + status);
                                })
                        }})
                        .error(function(data, status, headers, config) {
                            alert($filter('translate')('serverError') + status);
                        })
               
            }

            self.wxPay = function(JS_Pay_API, orderId) {
                var orderId = orderId;
                console.log(JS_Pay_API.timeStamp + ', ' + JS_Pay_API.nonceStr + ', ' + JS_Pay_API.package + ', ' + JS_Pay_API.signType + ', ' + JS_Pay_API.paySign);
                wx.chooseWXPay({
                    timestamp: JS_Pay_API.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                    nonceStr: JS_Pay_API.nonceStr, // 支付签名随机串，不长于 32 位
                    package: JS_Pay_API.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                    signType: JS_Pay_API.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                    paySign: JS_Pay_API.paySign, // 支付签名
                    success: function(res) {
                        // 支付成功后的回调函数
                        $state.go('bookOrderInfo', { orderId: orderId })
                    },
                    cancel: function() {
                        $state.go('bookOrderInfo', { orderId: orderId })
                    },
                    error: function(e) {
                        $state.go('bookOrderInfo', { orderId: orderId })
                    }
                });
            }
        }
    ])

    .controller('bookOrderInfoController', ['$scope', '$http', '$timeout', '$filter', '$stateParams', '$translate', 'loadingService', 'backendUrl', 'util',
        function($scope, $http, $timeout, $filter, $stateParams, $translate, loadingService, backendUrl, util) {
            console.log("bookOrderInfoController")
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            console.log($stateParams)
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.orderId = $stateParams.orderId;
                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                
                self.search();
            }
            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "roomOrderDetail",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    // "orderID": self.orderId
                    // 假数据
                    "orderID": 187
                };
                data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('roomorder', 'roomOrderInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.roomOrder = data.data.data;
                        self.GoodsList =data.data.data.GoodsList;
                        console.log(self.roomOrder)
                        console.log(self.GoodsList)
                        self.showLoadingBool.searchBool = true;

                        // 酒店天数
                        // self.stayDays = util.countDay(self.hotel.bookStartDate, self.hotel.bookEndDate);
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    });
                
            }

            self.countDay = function(startDate,endDate){
                return util.countDays(startDate,endDate);
            }
            // 取消订单
            self.cancelOrder = function(status) {
               if (!(status=='WAITPAY' || status=='WAITAPPROVAL' || status=='ACCEPT')) {
                  return;
               }
               self.cancelOrderBool = true;
               self.roomOrder.Status = 'CANCEL_REFUNDING';
                var data = {
                    "action": "guestCancelOrder",
                    // "clear_session": $scope.root.getParams('clear_session'),
                    "clear_session": "openvod_userid_3_wyki7g6g",
                    // "orderID": self.orderId
                    // 假数据
                    "orderID": 187

                };
                data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('roomorder', 'orderInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.cancelOrderBool = false;
                        self.roomOrder.Status = 'CANCELED';
                        if (data.data.rescode==200) {
                            alert('取消成功')
                        }
                    }, function errorCallback(data, status, headers, config) {
                        bookOrderInfo.roomOrder.Status = status;
                        self.cancelOrderBool = false;
                        alert('取消订单失败，请稍后重试')
                    });
                
            }
        }
    ])

    .controller('bookRoomSoldOutController', ['$http', '$scope',
        function($http, $scope) {
            var self = this;

            self.init = function() {
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
            }
        }
    ])

    .controller('memberHomeController', ['$http', '$scope', '$timeout', '$filter', '$stateParams', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $timeout, $filter, $stateParams, $translate, loadingService, backendUrl) {
            console.log("memberHomeController")
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                
                self.search();
            }
            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "getMemberInfo",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                    // "clear_session": "openvod_userid_9_5v2elt5z",
                    // "lang": "zh-CN"
                };
                data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('shopmember', 'memberInfo'),
                        data: data

                    }).then(function successCallback(data, status, headers, config) {
                        self.member = data.data.data.member;
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                    });
                
            }
        }
    ])

    .controller('memberInfoEditController', ['$http', '$scope', '$state', '$filter', '$stateParams', '$timeout', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $state, $filter, $stateParams, $timeout, $translate, loadingService, backendUrl) {
            console.log("memberInfoEditController");
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.memberId = $stateParams.memberId;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                self.updataMemberInfoBool = false;
                self.search();
                // // 验证码 倒计时
                // self.countAbility = false;
                // self.countSeconds = 30;
                // self.showTip = true;
            }

            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "getMemberInfo",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                    // "clear_session": "openvod_userid_9_5v2elt5z",
                    // "lang": "zh-CN"
                };
                data = JSON.stringify(data);
                   $http({
                       method: $filter('ajaxMethod')(),
                       url: backendUrl('shopmember', 'memberInfo'),
                       data: data
                   }).then(function successCallback(data, status, headers, config) {
                       self.member = data.data.data.member;
                       self.member.mobile = data.data.data.member.mobile-0;
                       self.member.idCardNumber = data.data.data.member.idCardNumber-0;
                       console.log(self.member)
                       self.showLoadingBool.searchBool = true;
                   }, function errorCallback(data, status, headers, config) {
                       self.showLoadingBool.searchBool = true;
                   })
                   .finally(function(value){
                     loadingService(self.showLoadingBool);
                   })  ; 
                
            }
            self.updataMemberInfo = function() {
                self.updataMemberInfoBool = true
                console.log('updataMemberInfo')
                var data = {
                    "action": "modifyMemberInfo",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "memberInfo": {
                        "realName": self.member.realName,
                        "mobile": self.member.idCardNumber,
                        "idCardNumber": self.member.mobile
                    }
                };
                data = JSON.stringify(data);
                  $http({
                      method: $filter('ajaxMethod')(),
                      url: backendUrl('shopmember', 'memberInfo'),
                      data: data
                  }).then(function successCallback(data, status, headers, config) {
                      if(data.data.rescode != '200') {
                          alert('修改失败，请重试 ' +data.data.rescode +' '+ errInfo);
                      }else {
                          alert('修改成功');
                          $state.reload();
                      }
                      
                  }, function errorCallback(data, status, headers, config) {

                  })
                  .finally(function(value){
                    loadingService(self.showLoadingBool);
                    self.updataMemberInfoBool = false;
                  })  
                
            }


            // 验证码 倒计时
            // self.countSecond = function(){
            //    self.countAbility = true;
            //    self.showTip = false;

            //    self.settime = function(){
            //     --self.countSeconds;
            //     $timeout(function() {
            //         if (self.countSeconds==0) {
            //            self.countAbility = false;
            //            self.countSeconds = 30;
            //            self.showTip = true;
            //         } else {
            //           self.settime()
            //         }
            //     }, 1000)

            //    }
            //    self.settime();
            // }

            // self.getAuthCode = function() {
            //   self.countSecond();
            //   $http({
            //     method: $filter('ajaxMethod')(),
            //     url: backendUrl('dxAuthCode','authCode')
            //   }).then(function successCallback(data, status, headers, config) {
            //       console.log(data)
            //     }, function errorCallback(data, status, headers, config) {
            //       
            //     });
            // }
        }
    ])

    .controller('roomOrderListController', ['$http', '$scope', '$filter', '$stateParams', '$state', '$timeout', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $state, $timeout, $translate, loadingService, backendUrl) {
            console.log('roomOrderListController')
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                
                self.search();
            }
            self.search = function() {
                // 发送请求之前，遮罩层
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool)
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "action": "roomOrderList"
                };
                data = JSON.stringify(data);
                   $http({
                       method: $filter('ajaxMethod')(),
                       url: backendUrl('roomorder', 'roomOrderList')
                   }).then(function successCallback(data, status, headers, config) {
                       console.log(data)
                       self.orderLists = data.data.data;
                       self.orderListNum = data.data.data.orderNum;
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool)
                   }, function errorCallback(data, status, headers, config) {
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool);
                   }); 
                
            }

        }
    ])

    .controller('shopOrderListController', ['$http', '$scope', '$filter', '$stateParams', '$state', '$timeout', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $state, $timeout, $translate, loadingService, backendUrl) {
            console.log('shopOrderListController')
            var self = this;
            self.beforeInit = function() {
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                
                self.search();
            }
            self.search = function() {
                // 发送请求之前，遮罩层
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool)
                    var data = {
                        "action": "shopOrderList",
                        "clear_session": $scope.root.getParams('clear_session'),
                        "lang": $translate.proposedLanguage() || $translate.use(),
                    }

                    data = JSON.stringify(data);
                    $http({
                       method: $filter('ajaxMethod')(),
                       url: backendUrl('shoporder', 'shopOrderList'),
                       data: data
                    }).then(function successCallback(data, status, headers, config) {
                       self.orderLists = data.data.data;
                       console.log(data.data.data)
                       self.orderListNum = data.data.data.orderNum;
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool)
                    }, function errorCallback(data, status, headers, config) {
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool);
                    }); 
                
            }
            self.nextState = function(id){
                $state.go('shopOrderInfo', {orderId: id})
            }
        }
    ])

    .controller('shopHomeController', ['$http', '$scope', '$filter', '$timeout', '$stateParams', '$state', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $timeout, $stateParams, $state, $translate, loadingService, backendUrl) {

            console.log('shopHomeController')
            var self = this;
            
            self.beforeInit = function() {
                console.log('beforeInit')
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            
            self.init = function() {
                self.showLoadingBool = {};
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                console.log('getHotelLists')
                self.getHotelLists();
                // 默认不显示 loadingIcon
                self.showLoadingIcon = false;
                // 商品数组
                self.productList = [];
                // 一次加载数量
                self.perPageCount = 10;
                // 当前页数
                self.page = 0;
            }

            self.gotoShopDetail = function(productId) {
                console.log('productId' + productId)
                angular.element(window).off('scroll'); 
                $state.go('shopProductDetail', { hotelId: self.hotelId, productId:productId, hotelName:self.hotelName });
            }

            self.gotoShopCart = function() {
                // angular.element(window).off('scroll'); 
                $state.go('shopCart', {hotelId: self.hotelId, hotelName:self.hotelName});
            }

            self.loadShopCartInfo = function() {
                // 获取购物车商品数量
                var data = {
                    "action": "getShoppingCart",

                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelId": self.hotelId
                }
                data = JSON.stringify(data);
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopinfo', 'shopCartList'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  var shopCartList = data.data.data.list;
                  self.shopCartItemCount = 0;
                  shopCartList.forEach(function(value) {self.shopCartItemCount += value.count});
                })
            }

            self.getHotelLists = function() {
                var data = {
                    "action": "getAllShopByLocation",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use()
                }
                data = JSON.stringify(data);
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopinfo', 'hotelLists'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  self.hotelLists = data.data.data;
                  self.hotelId = self.hotelLists.hotelLists[0].hotels[0].id;
                  self.hotelName = self.hotelLists.hotelLists[0].hotels[0].name;
                  self.searchCategory();
                })
            }

            self.searchCategory = function() {
                var data = {
                    "action": "getProductCategory",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    // "hotelId": self.hotelId
                    "hotelId": 1
                };
                data = JSON.stringify(data);
                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('shopinfo', 'productCategory'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    //加载购物车内容
                    self.loadShopCartInfo();
                    self.categoryList = data.data.data.categoryList;
                    // 默认加载第一个分类
                    self.searchProductList(self.categoryList["0"]["id"],true);
                    
                }, function errorCallback(data, status, headers, config) {

                });
            }
            self.searchProductList = function(id,bool) {
                    self.showLoadingIcon = true
                    console.log(id);
                    // 记录当前点击的商品分类的id
                    self.searchCategoryId = id;
                    self.showLoadingIcon = true;
                    // 点击“分类”时，清空productList数组
                    if (bool == true) {
                        self.productList = [];
                        self.page = 0;
                    }
                        var data = {
                            "action": "getProductList",
                            "clear_session": $scope.root.getParams('clear_session'),
                            "appid": $scope.root.getParams('appid'),
                            "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                            "lang": $translate.proposedLanguage() || $translate.use(),
                            "hotelId": self.hotelId,
                            "categoryId":self.searchCategoryId,
                            "page":self.page+1,
                            "count":self.perPageCount
                        };
                        data = JSON.stringify(data);
                        $http({
                            method: $filter('ajaxMethod')(),
                            url: backendUrl('shopinfo', 'productList'+id),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            self.page++;
                            self.productList = self.productList.concat(data.data.data.productList);
                            self.productList.length = self.productList.length;
                            self.productTotal = data.data.data.productTotal;
                            console.log(self.productList + new Date().getTime())
                            self.showLoadingIcon = false;
                        }, function errorCallback(data, status, headers, config) {
                            self.showLoadingIcon = false;
                        });
                }

                // 更多商品   loading 图标
            self.moreProduct = function() {
                console.log('moreProduct')
                self.showLoadingIcon = true;
                // 加载更多商品时，productList不清空
                self.searchProductList(self.searchCategoryId,false);
            }

            // 显示／隐藏酒店选择器
            self.showHP = function(boo) {
                self.hotelPickerShow = boo ? boo : false;
                if(boo == false){
                    // 点击穿透
                    // 将点击变成不可点的状态
                    $scope.hp.touchHackEnable = true;
                }
            };
            
            self.doAfterPickHotel = function(hotelId, hotelName) {
                self.showHP(false);
                self.hotelId = hotelId;
                self.hotelName = hotelName;
                self.searchCategory();
            };
        }
    ])

    .controller('shopProductDetailController', ['$http', '$q', '$scope', '$filter', '$state', '$stateParams', '$timeout', '$translate', '$ionicSlideBoxDelegate', 'loadingService', 'backendUrl',
        function($http, $q, $scope, $filter, $state, $stateParams, $timeout, $translate, $ionicSlideBoxDelegate, loadingService, backendUrl) {

            console.log('shopProductDetailController')
            var self = this;
            self.beforeInit = function() {
                console.log('beforeInit')
                if($scope.root._readystate) {
                    self.init();
                }
                else {
                    $timeout(function() {
                        self.beforeInit();
                    }, 50);
                }
            }
            self.init = function() {
                self.hotelId = $stateParams.hotelId;
                self.hotelName = $stateParams.hotelName;
                self.productId = $stateParams.productId;
                self.showLoadingBool = {};
                self.buying = false;

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.search();
            }

            self.gotoShopCart = function() {
                $state.go('shopCart', {hotelId: self.hotelId, hotelName: self.hotelName});
            }

            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                    var data = {
                        "action": "getProductDetail",
                        "appid": $scope.root.getParams('appid'),
                        "clear_session": $scope.root.getParams('clear_session'),
                        "openid": $scope.root.getParams('openid'),
                        "lang": $translate.proposedLanguage() || $translate.use(),
                        "hotelId": self.hotelId,
                        "productId":self.productId
                    }
                    data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('shopinfo', 'productDetail'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        if(data.data.rescode == '200'){
                            self.product = data.data.data.product;
                            // ionic silder update
                            $ionicSlideBoxDelegate.update();

                            self.loadShopCartInfo();
                        }
                        else {
                            alert(data.data.rescode + data.data.errInfo);
                        }
                        
                    }).finally(function(value) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    });

            }

            self.loadShopCartInfo = function() {
                // 获取购物车商品数量
                var data = {
                    "action": "getShoppingCart",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelId": self.hotelId
                }
                data = JSON.stringify(data);
                $http({
                  method: $filter('ajaxMethod')(),

                  url: backendUrl('shopinfo', 'shopCartList'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  var shopCartList = data.data.data.list;
                  self.shopCartItemCount = 0;
                  shopCartList.forEach(function(value) {self.shopCartItemCount += value.count});
                  
                })
            }

            self.addToCart = function(callBack) {
                var data = {
                    "action": "addShoppingCart",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelId": self.hotelId,
                    "productId":self.productId
                }
                data = JSON.stringify(data);

                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopinfo', 'shopCartList'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  if(callBack){
                    // 购买
                    callBack();
                  }
                  else {
                    // 加载购物车数量
                    self.loadShopCartInfo();
                  }
                  
                })
            }

            self.buy = function() {
                self.buying = true;
                self.addToCart(function() {
                    self.gotoShopCart();
                });

            }
        }
    ])

    .controller('shopCartController', ['$http', '$scope', '$filter', '$state', '$stateParams', '$ionicLoading', '$translate', 'backendUrl',
      function($http, $scope, $filter, $state, $stateParams, $ionicLoading, $translate, backendUrl) {
        console.log('shopCartController')
        var self = this;
        self.beforeInit = function() {
            console.log('beforeInit')
            if($scope.root._readystate) {
                self.init();
            }
            else {
                $timeout(function() {
                    self.beforeInit();
                }, 50);
            }
        }
        self.init = function() {
          // 注册微信分享朋友和朋友圈
          $scope.root.wxShare();

          // 初始化
          self.hotelId = $stateParams.hotelId;
          self.hotelName = $stateParams.hotelName;
          // self.postage = 1000; //邮费 todo
          self.postage = 1;
          $scope.shopCartList = new Array();

          //watch shopCartList
          $scope.$watch('shopCartList', function() {
            self.judgeChecked();
            self.countTotalPrice();
          }, true);

          // watch shopCartList.hasEx
          $scope.$watch('shopCartList.hasEx', function() {
            self.countTotalPrice();
          }, true);

          // 获取购物车信息
          self.loadSCInfo();
        }

        self.selectAll = function() {
            var l = $scope.shopCartList;
            for (var i = 0; i < l.length; i++) {
                // 商品不下架，商品库存不缺
                l[i].checked = l[i].status&&(l[i].availableCount - l[i].count)>=0&&l[i].availableCount!=0;
            }
        }

        // 购物车是否有内容选取
        self.judgeChecked = function() {
            self.checked = $scope.shopCartList&&$scope.shopCartList.some(function(x){return x.checked==true?true:false});
        }

        self.plusOne = function(index) {
          var item = $scope.shopCartList[index];
          if(item.count < item.availableCount){
            item.count += 1;
            self.updateProductCount(index);
          }
        }

        self.minusOne = function(index) {
          if($scope.shopCartList[index].count >= 2){
            $scope.shopCartList[index].count -= 1;
            self.updateProductCount(index);
          }
        }

        self.updateProductCount = function(index) {
            var data = {
                "action": "updateShoppingCart",
                "clear_session": $scope.root.getParams('clear_session'),
                "appid": $scope.root.getParams('appid'),
                "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                "lang": $translate.proposedLanguage() || $translate.use(),
                "hotelId": self.hotelId,
                "shoppingCartItems":[
                    {
                        "shoppingCartID":$scope.shopCartList[index].shopCartItemID,
                        "count":$scope.shopCartList[index].count
                    }
                ]
            }
            data = JSON.stringify(data);

            $http({
              method: $filter('ajaxMethod')(),
              url: backendUrl('shopinfo', 'shopCartList'),
              data: data
            })
            .then(
              function successCallback(data, status, headers, config) {
                if(data.data.rescode != '200') {
                    alert(errInfo);
                }
              },
              function errorCallback(data, status, headers, config) {

              }
            )
        }

        self.delete = function(index) {
          var data = {
              "action": "deleteShoppingCart",
              "clear_session": $scope.root.getParams('clear_session'),
              "appid": $scope.root.getParams('appid'),
              "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
              "lang": $translate.proposedLanguage() || $translate.use(),
              "hotelId": self.hotelId,
              "shoppingCartIDs":[
                $scope.shopCartList[index].shopCartItemID
              ]
          }
          $scope.shopCartList.splice(index, 1);
          data = JSON.stringify(data);

          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('shopinfo', 'shopCartList'),
            data: data
          })
          .then(
            function successCallback(data, status, headers, config) {
                if(data.data.rescode != '200') {
                    alert(errInfo);
                }
            },
            function errorCallback(data, status, headers, config) {

            }
          )
        }

        self.countTotalPrice = function() {
          self.totalPrice = 0;
          if($scope.shopCartList) {
            for (var i = 0; i < $scope.shopCartList.length; i++) {
              if($scope.shopCartList[i].checked == true) {
                self.totalPrice += $scope.shopCartList[i].price * $scope.shopCartList[i].count;
              }
            } 
          }
          if($scope.shopCartList.hasEx) {
            self.totalPrice += self.postage;
          }
        }

        self.loadSCInfo = function() {
          $ionicLoading.show({
            template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
          });
          var data = {
            "action": "getShoppingCart",
            "clear_session": $scope.root.getParams('clear_session'),
            "appid": $scope.root.getParams('appid'),
            "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
            "lang": $translate.proposedLanguage() || $translate.use(),
            "hotelId": self.hotelId,
          }
          data = JSON.stringify(data);
          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('shopinfo', 'shopCartList'),
            data: data
          })
          .then(function successCallback(data, status, headers, config) {
            $scope.shopCartList = data.data.data.list;
            self.loadExInfo();
            $scope.shopCartList.hasEx = false; //含快递货品
            self.selectAll(); // 默认选上所有的物品
          })
          .finally(function(value){
            $ionicLoading.hide();
          });
        }

        self.loadExInfo = function() {
            $ionicLoading.show({
            template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
          });
          var data = {
            "action": "getMemberDeliveryInfo",
            "clear_session": $scope.root.getParams('clear_session'),
            "lang": $translate.proposedLanguage() || $translate.use()
          }
          data = JSON.stringify(data);
          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('shopmember', 'memberAddress'),
            data: data
          })
          .then(function successCallback(data, status, headers, config) {
            if(data.data.rescode == '200') {
              if(data.data.data.list.length > 0) {
                self.address = data.data.data.list[0]; 
              }
            }
            else {
                alert($filter('translate')('serverError') + data.data.rescode + data.data.errInfo);
            }
          })
          .finally(function(value){
            $ionicLoading.hide();
          });
        }

        // 提交订单
        self.submitOrder = function() {
            


            //开始生成订单
            $ionicLoading.show({
               template: '订单生成中...'
            });
            // 支付按钮变为不可点击，防止多次点击
            document.getElementById('payBtn').disabled = true;
            
            var goodsList = new Array();
            var goodsList_n = 0;
            var l = $scope.shopCartList;
            for (var i = 0; i < l.length; i++) {
                if (l[i].checked) {
                    goodsList[goodsList_n] = {};
                    goodsList[goodsList_n].shopCartItemID = l[i].shopCartItemID;
                    goodsList[goodsList_n].shopGoodsID = l[i].productID;
                    goodsList[goodsList_n].goodsCount = l[i].count;
                    goodsList_n++;
                }
            }
            var deliverWay = $scope.shopCartList.hasEx ? 'express' : 'bySelf';
            var data = {
                "action": "newShopOrder",
                "clear_session": $scope.root.getParams('clear_session'),
                "appid": $scope.root.getParams('appid'),
                "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                "lang": $translate.proposedLanguage() || $translate.use(),
                "hotelId": self.hotelId,
                "goodsList": goodsList,
                "delivery":{
                    "deliverWay": deliverWay,
                    "contactName": self.address.name,
                    "mobile": self.address.mobile,
                    "address": l.hasEX ? self.address.address : ''
                }
            }
            data= JSON.stringify(data);
            $http({
              method: $filter('ajaxMethod')(),
              url: backendUrl('shoporder', 'memberAddress'),
              data: data
            })
            .then(function successCallback(data, status, headers, config) {
              //订单生成成功
              if(data.data.rescode == '200') {
                // 支付
                self.pay(data.data.orderID);
              }
              //订单生成失败
              else {
                  alert('订单生成失败，' + data.data.rescode + data.data.errInfo);
              }
            })
            //订单生成结束
            .finally(function(value){
              $ionicLoading.hide();
              // 支付按钮变为可点击
              document.getElementById('payBtn').disabled = false;
            });
        }

        // 支付
        self.pay = function(orderId) {
            self.orderId = orderId;
            //获取支付参数
            $ionicLoading.show({
               template: '等待支付...'
            });
            // 支付按钮变为不可点击
            document.getElementById('payBtn').disabled = true;
            var data = {
                "clear_session": $scope.root.getParams('clear_session'),
                "appid": $scope.root.getParams('appid'),
                "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                "lang": $translate.proposedLanguage() || $translate.use(),
                "action": "weixinPay",
                "orderID": orderId,
                "payType": "JSAPI"
            }
            data = JSON.stringify(data);

            $http({
              method: $filter('ajaxMethod')(),
              url: backendUrl('shoporder', 'memberAddress'),
              data: data
            })
            .then(function successCallback(data, status, headers, config) {
              if(data.data.rescode == '200') {
                var wxP = data.data.data.JS_Pay_API;
                wx.chooseWXPay({
                    timestamp: wxP.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                    nonceStr: wxP.nonceStr, // 支付签名随机串，不长于 32 位
                    package: wxP.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                    signType: wxP.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                    paySign: wxP.paySign, // 支付签名
                    success: function(res) {
                        // 支付后跳转到订单详情页面
                        $state.go('shopOrderInfo', { orderId: self.orderId }); 
                    },
                    cancel: function() {
                        $state.go('shopOrderInfo', { orderId: self.orderId }); 
                    },
                    error: function(e) {
                        $state.go('shopOrderInfo', { orderId: self.orderId }); 
                    }
                });
              }
              else {
                  alert($filter('translate')('serverError') + data.data.rescode + data.data.errInfo);
              }
            })
            .finally(function(value){
              $ionicLoading.hide();
            });

            
        }
        
      }
    ])


    .controller('shopOrderInfoController', ['$http', '$scope', '$filter', '$state', '$stateParams', '$timeout', '$ionicLoading', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $state, $stateParams, $timeout, $ionicLoading, $translate, loadingService, backendUrl) {
            console.log('shopOrderInfoController')    
    
            var self = this;
             self.beforeInit = function() {
                 console.log('beforeInit')
                 if($scope.root._readystate) {
                     self.init();
                 }
                 else {
                     $timeout(function() {
                         self.beforeInit();
                     }, 50);
                 }
             }
            self.init = function() {
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                self.orderId = $stateParams.orderId;
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                self.showCancelBtn = false;
                self.showPayBtn = false;
                self.search();
            }

            

            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
   
                    var data = {

                        "action": "getOrderDetail",
                        "clear_session": $scope.root.getParams('clear_session'),
                        "lang": $translate.proposedLanguage() || $translate.use(),
                        "orderID": self.orderId - 0
                    }
                    data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('shoporder', 'shopOrderInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.detail = data.data.data.detail;
                        var s = self.detail.Status;
                        self.showPayBtn = (s == 'WAITPAY');
                        self.showCancelBtn = (s == 'WAITPAY' || s == 'WAITAPPROVAL' || s == 'ACCEPT');
                        console.log(self.detail)
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                    });

            }

            self.pay = function() {
                // 等待支付
                // 支付按钮变为不可点击，防止多次点击
                document.getElementById('payBtn').disabled = true;


                //获取支付参数
                $ionicLoading.show({
                   template: '等待支付...'
                });
                var data = {
                    "action": "weixinPay",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelId": self.hotelId,
                    "orderID": self.orderId-0,
                    "payType": "JSAPI"
                }
                data = JSON.stringify(data);

                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shoporder', 'memberAddress'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  if(data.data.rescode == '200') {
                    var wxP = data.data.data.JS_Pay_API;
                    wx&&wx.chooseWXPay({
                        timestamp: wxP.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                        nonceStr: wxP.nonceStr, // 支付签名随机串，不长于 32 位
                        package: wxP.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                        signType: wxP.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                        paySign: wxP.paySign, // 支付签名
                        success: function(res) {
                            // 支付后跳转到订单详情页面
                            $state.reload();
                        },
                        cancel: function() {
                            $state.reload();
                        },
                        error: function(e) {
                            $state.reload();
                        }
                    });
                  }
                  else {
                      alert($filter('translate')('serverError') + data.data.rescode + data.data.errInfo);
                  }
                })
                .finally(function(value){
                  $ionicLoading.hide();
                  document.getElementById('payBtn').disabled = false;
                });
            }

            self.canelOrder = function() {
                // 取消订单
                // 支付按钮变为不可点击，防止多次点击
                document.getElementById('cancelBtn').disabled = true;

                $ionicLoading.show({
                   template: '订单取消中...'
                });
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "action": "guestCancelOrder",
                    "orderID": self.orderId-0
                }
                data = JSON.stringify(data);

                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shoporder', 'memberAddress'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  if(data.data.rescode == '200') {
                    if(data.data.data.RefundRequestACK) {
                        alert('订单取消成功，预计款项将于24小时内退回，请注意查收');
                    }
                    else {
                        alert('订单取消成功');
                    }
                    $state.reload();
                  }
                  else {
                      alert($filter('translate')('serverError') + data.data.rescode + data.data.errInfo);
                  }
                })
                .finally(function(value){
                  $ionicLoading.hide();
                  document.getElementById('cancelBtn').disabled = false;
                });
            }
        }
    ])
    

})();
