'use strict';

(function() {
    var app = angular.module('app.controllers', ['ngCookies'])

    .controller('RootController', ['$scope', '$window', '$http', '$filter', '$timeout', '$ionicModal', '$translate', 'backendUrl', 'BACKEND_CONFIG', '$ionicLoading', '$ionicGesture', 'setTitle', 'util',
        function($scope, $window, $http, $filter, $timeout, $ionicModal, $translate, backendUrl, BACKEND_CONFIG, $ionicLoading, $ionicGesture, setTitle, util) {
            var self = this;

            self.init = function() {

                // 苹果手机去除滚动点停后进详情页的问题
                var u = navigator.userAgent;
                var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
                if(isiOS) {
                    // self.wxBrowserHack();
                }

                if(BACKEND_CONFIG.test == true) {
                    // 测试环境下，标志已经拿到clearsession和wx初始化
                    self._readystate = true;
                }

                // 获取 code 和 appid
                var qString = $window.location.search.substring(1);
                var qParts = qString.parseQuerystring();
                var code = qParts.code;
                var appid = qParts.appid;
                var state = qParts.state;

                // 判断是否是缓存同一个项目的clear_session, 如果不是：清空缓存中的clear_session
                if (self.getParams('appid') && (self.getParams('appid') != appid)) {
                    self.setParams('clear_session', '');
                }

                self.setParams('appid', appid);
                self.setParams('state', state);
                self.setParams('code', code);

                /* 获取cleartoken（clear_session）和openid
                 * wx注册
                 * 获取项目及会员信息 
                 * 如果本地存储中有用户信息不需要和服务器交互，不然则问服务器要数据
                 */
                if (self.getParams('clear_session')) {
                    self._readystate = false;
                    self.WXConfigJSSDK();
                }
                else{
                    self.buildsession(code, appid);
                }
            }

            self.wxBrowserHack = function() {
                document.addEventListener('touchmove', function(event) {
                    var l = document.getElementsByClassName('wx-touch-hack');
                    for(var i=0; i< l.length; i++) {
                        l[i].style.pointerEvents= "none";
                    }
                })
                document.addEventListener('scroll', function(event) {
                    var l = document.getElementsByClassName('wx-touch-hack');
                    for(var i=0; i< l.length; i++) {
                        l[i].style.pointerEvents= "auto";
                    }
                })
            }

            self.setParams = function(name, val) {
                // self.params[name] = val;
                util.setParams(name, val);
            }

            self.getParams = function(name) {
                // return self.params[name];
                return util.getParams(name);
            }

            self.buildsession = function(code, appid) {
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
                    self.setParams('access_token', data.data.access_token);
                    self.setParams('authorizer_access_token', data.data.authorizer_access_token);
                    self.getWxUserInfo(data.data.access_token, data.data.openid);     
                }, function errorCallback(data, status, headers, config) {
                    alert($filter('translate')('serverError'));
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
                    "clear_session": self.getParams('clear_session'),
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
                        self.loadProjectInfo();
                        wx.config({
                            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                            appId: self.getParams('appid'), // 必填，公众号的唯一标识
                            timestamp: self.timestamp, // 必填，生成签名的时间戳
                            nonceStr: self.noncestr, // 必填，生成签名的随机串
                            signature: data.data.signature, // 必填，签名，见附录1
                            jsApiList: ['hideMenuItems', 'chooseWXPay', 'openLocation', 'getLocation', 'addCard', 'chooseCard'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                        });
                        wx.ready(function(){
                            // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
                            // 禁用“分享给好友”，“分享到朋友圈”, "在Safari中打开", "邮件","复制链接","分享到QQ","分享到QQ空间"
                            self._wxreadystate = true;
                            wx.hideMenuItems({
                                menuList: [
                                    'menuItem:share:appMessage', 
                                    'menuItem:share:timeline', 
                                    'menuItem:openWithSafari',
                                    'menuItem:share:email', 
                                    'menuItem:copyUrl',
                                    'menuItem:share:qq',
                                    'menuItem:share:QZone'
                                ]
                            });
                        });
                        
                    } else if (data.data.rescode == '401') {
                        self.buildsession(self.getParams('code'), self.getParams('appid'));
                    } else {
                        alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
                        $ionicLoading.hide();
                        // 继续注册
                        $timeout(function(){self.WXConfigJSSDK;},50);
                    }
                }, function errorCallback(data, status, headers, config) {
                    alert($filter('translate')('serverError'));
                    $ionicLoading.hide();
                    // 继续注册
                    $timeout(function(){self.WXConfigJSSDK;},50);
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
                    // 标志已经拿到clearsession,wx开始注册,projectinfo已经拿到
                    self._readystate = true;
                    setTitle(data.data.data.projectName);
                    $ionicLoading.hide();
                }, function errorCallback(data, status, headers, config) {
                    $ionicLoading.hide();
                })
            }

            /*// menu modal 弹出
            $ionicModal.fromTemplateUrl('pages/mainMenu.html', {
                scope: $scope,
                animation: 'slide-in-left'
            }).then(function(modal) {
                $scope.modal = modal;
            });
            self.showMainMenu = function() {
                $scope.modal.show();
            }*/
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
                // 项目图片
                self.projectImg = $scope.root.getParams('projectInfo').ProjectLogo;
                if(!self.projectImg) {
                    self.hasNoProjectImg = true;
                }

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchCityListsBool = false;
                
                self.datePickerShow = false;
                self.hotels = {};
                self.checkin = new Date().getTime();
                self.checkout = self.checkin + 24 * 60 * 60 * 1000;

                // 酒店天数
                self.stayDays = util.countDay(self.checkin, self.checkout);

                self.cityInfo = { id: '0', name: 'all' };
                
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
                      self.cityListContent = data.data.data;
                      var allStr = $filter('translate')('all');
                      self.cityListContent.searchInitialList.unshift(allStr);
                      self.cityListContent.cityLists.unshift({
                        cities: [{cityID:0,cityName:allStr}],
                        searchInitial: allStr
                      });
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
                self.hotelId = $stateParams.hotelId ? $stateParams.hotelId : $scope.root.getParams('state');
                self.checkIn = $stateParams.checkIn ? $stateParams.checkIn - 0 : new Date().getTime();
                self.checkOut = $stateParams.checkOut ? $stateParams.checkOut - 0 : new Date().getTime() + 24 * 60 * 60 * 1000;
                
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
                    latitude: self.hotel.LocationX-0, // 纬度，浮点数，范围为90 ~ -90
                    longitude: self.hotel.LocationY-0, // 经度，浮点数，范围为180 ~ -180。
                    name: decodeURI(encodeURI(self.hotel.Name)), // 位置名
                    address: decodeURI(encodeURI(self.hotel.Address)), // 地址详情说明
                    //name: '上海浦东机场门店', // 位置名
                    //address: '上海 祖冲之路2277弄', // 地址详情说明
                    scale: 15, // 地图缩放级别,整形值,范围从1~28。默认为最大
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

                // 重新获取roomlist
                self.searchRoomList();
            };
            // 可以预订 才跳转
            self.nextState = function(roomId, checkIn, checkOut, AvailableNumList, addPriceId) {
                var flag = true;
                AvailableNumList.forEach(function(value,index,array){
                    if(array[index]['availableNum'] <= 0){
                        flag = false;
                        return flag;
                    } 
                })
                flag && $state.go('roomInfo', { roomId: roomId, hotelId: self.hotelId, checkIn: checkIn, checkOut: checkOut, addPriceId: addPriceId })
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
                    "hotelId": self.hotelId -0
                    // "hotelId": 1
                };
                data = JSON.stringify(data);
                
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('hotelinfo', 'hotelInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.hotel = data.data.data;
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

            self.openOrClose = function (n) {
                self.rooms[n].isOpen = !self.rooms[n].isOpen;
            }

            self.searchRoomList = function() {
                self.showLoadingBool.searchRoomListBool = false;
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                     
                    "hotelId": self.hotelId -0,
                    // 假数据
                    // "hotelId": 1,
                    "bookStartDate": $filter('date')(self.checkIn-0,'yyyy-MM-dd'),
                    "bookEndDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd') 
                };
                data = JSON.stringify(data);
                self.rooms = {};

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('roomlist', 'roomList'),
                    data: data

                }).then(function successCallback(data, status, headers, config) {
                    self.rooms = data.data.data;
                    //Description
                    for(var i = 0; i < self.rooms.length; i++) {
                        self.rooms[i].Description = util.cutStr(self.rooms[i].Description, 85);
                        // 是否展开
                        self.rooms[i].isOpen = false;
                    }
                    // ionic silder update
                    $ionicSlideBoxDelegate.update();
                    self.showLoadingBool.searchRoomListBool = true;
                    loadingService(self.showLoadingBool);
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchHotelInfoBool = true;
                    loadingService(self.showLoadingBool);
                    alert('连接服务器出错');
                });
            }
            // 检查是否有房间，有则返回true
            self.roomCheckAvail = function(arr, key) {
                var flag = true;
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i][key] == 0) {
                        flag = false;
                        return flag;
                    }
                }
                return flag;
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

                    "hotelId": self.hotelId -0
                    
                };
                data = JSON.stringify(data);
                  $http({
                      method: $filter('ajaxMethod')(),
                      url: backendUrl('hotelinfo', 'hotelInfo'),
                      data: data
                  }).then(function successCallback(data, status, headers, config) {
                      self.hotel = data.data.data;
                      self.hotel.Description = self.hotel.Description.split('\n');
                      for(var i = 0; i < self.hotel.Description.length; i++) {
                        self.hotel.Description[i] = self.hotel.Description[i].split('  ');
                      }
                      self.showLoadingBool.searchBool = true;
                      loadingService(self.showLoadingBool);
                  }, function errorCallback(data, status, headers, config) {
                      self.showLoadingBool.searchBool = true;
                      loadingService(self.showLoadingBool);
                  });  
            }
        }
    ])

    .controller('roomInfoController', ['$location', '$scope', '$http', '$filter', '$state', '$translate', '$stateParams', '$timeout', '$ionicSlideBoxDelegate', '$ionicLoading', 'loadingService', 'backendUrl', 'util', 'BACKEND_CONFIG', 'PARAM',
        function($location, $scope, $http, $filter, $state, $translate, $stateParams, $timeout, $ionicSlideBoxDelegate, $ionicLoading, loadingService, backendUrl, util, BACKEND_CONFIG, PARAM) {
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

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.selCardInfo = {};
                // self.showLoadingBool.searchRoomInfoBool = false;
                // // self.showLoadingBool.searchMemberInfoBool = false;
                // self.showLoadingBool.searchHotelInfoBool = false;

                self.mobileRe = /[0-9]{11,}/;

                self.submitOrderBool = false;
                self.checkIn = $stateParams.checkIn - 0;
                self.checkOut = $stateParams.checkOut - 0;
                self.roomId = $stateParams.roomId;
                self.hotelId = $stateParams.hotelId;
                self.addPriceId = $stateParams.addPriceId - 0;

                self.stayDays = util.countDay(self.checkIn, self.checkOut);
                self.searchMemberInfo();
                // 验证码 倒计时
                // self.countSeconds = 30;
                // self.showTip = true;

                // 默认选中房间数为1
                self.roomNumber = 1;
                // params 会员信息
                

                // 防止点透
                // 将input点击变成可点的状态
                $timeout(function() {self.touchHackEnable = false;}, 1000);
              
            }

            // 用户选取卡券
            self.selCard = function (card) {
                self.showUserCardList = false;
                self.selCardInfo = card;
            }

            // 获取微信自有卡券列表
            self.getUserCardList = function () {
                self.showUserCardList = true;
                self.loadingUserCardList = true;
                self.cardList = [];

                var data = JSON.stringify({
                    "clear_session": $scope.root.getParams('clear_session'),
                    "keyword": {"accept_category":[PARAM.cardAcceptCategoryKW_room]},
                    "action": "user",
                    "open_id": $scope.root.getParams('wxUserInfo').openid
                });

                $http({
                    method: 'POST',
                    url: backendUrl('card_batchget', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console && console.log(data);
                        self.cardList = data.card_list;
                    }
                    else {
                        console && console.log(data.rescode + ' ' + data.errInfo);
                        alert(data.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.loadingUserCardList = false;
                });

            }

            self.getTommPrice = function () {
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "roomId": self.roomId-0,
                    "hotelId": self.hotelId - 0,
                    "bookStartDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd'),
                    "bookEndDate": $filter('date')(self.checkOut-0+86400000,'yyyy-MM-dd'),
                    "RoomServiceID": self.addPriceId
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('roominfo', 'roominfo'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    var room = data.data.data;
                    var price = room.PriceInfo.PriceList;
                    // 单价
                    self.tommPrice = self.roomBookPrcFun(price)-0;
                }, function errorCallback(data, status, headers, config) {
                    alert('获取门票价格出错, 请刷新页面重试')
                });
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
                        "bookEndDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd'),
                        "RoomServiceID": self.addPriceId
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
                        // 如果含门票，获取第二天价格
                        if (self.room.RoomFlag == 1) {
                            self.getTommPrice();
                        }
                        
                        // 添加空格和换行
                        self.room.Description = self.room.Description.split('\n');
                        for(var i = 0; i < self.room.Description.length; i++) {
                          self.room.Description[i] = self.room.Description[i].split('  ');
                        }
                        
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
                    "hotelId": self.hotelId-0
                    // 假数据
                    // "hotelId": 1
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
                        if(self.member.mobile != "") {
                            self.member.mobile = Number(self.member.mobile);
                        }
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

            self.consume = function () {

                // 核销
                var data = JSON.stringify({
                    "code": self.selCardInfo.code,
                    "clear_session": $scope.root.getParams('clear_session')

                })
                self.consuming = true;
                
                $http({
                    method: 'POST',
                    url: backendUrl('codeconsumer', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console && console.log('核销成功');
                    }
                    else {
                        console && console.log('核销失败' + data.rescode + ' ' + data.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.consuming = false;
                });
            }

            self.newOrder = function() {

                self.showLoadingBool.waitPayBool = false;
                loadingService(self.showLoadingBool);

                var bookTotalPri = self.roomPriPerDay*self.roomNumber;

                if(self.room.RoomFlag == 1) {
                    if(self.visitDate) {
                        if(self.checkOut == self.visitDate) {
                            bookTotalPri = self.tommPrice;
                        }
                    }
                }

                if(self.selCardInfo.card_id) {
                    var p = bookTotalPri - self.selCardInfo.card_info.cash.reduce_cost;
                    // 如果价格比0.01低，就付0.01, 0元后台会报错
                    bookTotalPri = p > 1 ? p : 1;
                }


                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "action": "newOrder",
                    "cardinfo": self.selCardInfo.card_id ? [self.selCardInfo] : [],
                    "goodsList":[
                        {
                            "roomID": self.roomId - 0,
                            "RoomServiceID": self.addPriceId,
                            "bookStartDate": $filter('date')(self.checkIn-0,'yyyy-MM-dd'),
                            "bookEndDate": $filter('date')(self.checkOut-0,'yyyy-MM-dd'),
                            "totalPrice":bookTotalPri,
                            "priceList": self.priceList,
                            "bookCount":self.roomNumber
                        }
                    ],
                    "totalPrice":bookTotalPri,
                    "Comment": self.comment,
                    "contactName": self.member.realName,
                    "Mobile": self.member.mobile + '',
                    "IDCardNumber": self.IDCard ? self.IDCard : "",
                    "PlayDate": self.visitDate ? $filter('date')(self.visitDate-0,'yyyy-MM-dd') : ""
                     
                };
                data = angular.toJson(data,true);
                $http.post(backendUrl('roomorder', '', 'server'), data)
                    .success(function(data, status, headers, config) {
                        if (data.rescode == '200') {
                            var orderID = data.data.orderID;
                            // 订单id
                            self.bookOrderID = orderID;
                            var data = {
                                "clear_session": $scope.root.getParams('clear_session'),
                                "action": "weixinPay",
                                "payType": "JSAPI",
                                "orderID": orderID,
                                "cardInfo": self.selCardInfo
                            };
                            data = angular.toJson(data,true);
                            $http.post(backendUrl('roomorder', '', 'server'), data)
                            .success(function(data, status, headers, config){
                                 if (data.rescode == '200') {
                                    if(self.selCardInfo.card_id) {
                                       self.consume(); 
                                    }
                                    self.wxPay(data.data.JS_Pay_API, data.data.orderNum);
                                 } else {
                                     alert($filter('translate')('serverError') + ' ' + data.errInfo);
                                 }
                            })
                            .error(function(data, status, headers, config) {
                                alert($filter('translate')('serverError'));
                            })
                    }})
                    .error(function(data, status, headers, config) {
                        alert($filter('translate')('serverError'));
                    })
               
            }

            self.wxPay = function(JS_Pay_API, orderId) {
                var orderId = orderId;
                wx.chooseWXPay({
                    timestamp: JS_Pay_API.timeStamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
                    nonceStr: JS_Pay_API.nonceStr, // 支付签名随机串，不长于 32 位
                    package: JS_Pay_API.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=***）
                    signType: JS_Pay_API.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
                    paySign: JS_Pay_API.paySign, // 支付签名
                    success: function(res) {
                        // 支付成功后的回调函数
                        $state.go('bookOrderInfo', { orderId: self.bookOrderID });
                        self.showLoadingBool.waitPayBool = true;
                        loadingService(self.showLoadingBool);
                    },
                    cancel: function() {
                        $state.go('bookOrderInfo', { orderId: self.bookOrderID });
                        self.showLoadingBool.waitPayBool = true;
                        loadingService(self.showLoadingBool);
                    },
                    error: function(e) {
                        $state.go('bookOrderInfo', { orderId: self.bookOrderID });
                        self.showLoadingBool.waitPayBool = true;
                        loadingService(self.showLoadingBool);
                    }
                });
            }
        }
    ])

    .controller('bookOrderInfoController', ['$scope', '$http', '$timeout', '$filter', '$stateParams', '$translate', '$state', 'loadingService', 'backendUrl', 'util',
        function($scope, $http, $timeout, $filter, $stateParams, $translate, $state, loadingService, backendUrl, util) {
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
            
            self.init = function() {

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
                    "orderID": self.orderId - 0
                    // 假数据
                    // "orderID": 187
                };
                data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('roomorder', 'roomOrderInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.roomOrder = data.data.data;
                        self.GoodsList =data.data.data.GoodsList;
                        var s = self.roomOrder.Status;
                        self.showPayBtn = (s == 'WAITPAY');
                        // self.showCancelBtn = (s == 'WAITPAY' || s == 'WAITAPPROVAL' || s == 'ACCEPT');    
                        // 鹿安要求：预订成功后 不能取消订单
                        self.showCancelBtn = (s == 'WAITPAY' || s == 'WAITAPPROVAL');   
                        // 酒店天数
                        // self.stayDays = util.countDay(self.hotel.bookStartDate, self.hotel.bookEndDate);
                    }, function errorCallback(data, status, headers, config) {
                        
                    }).finally(function(value) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    });
            }

            self.countDay = function(startDate,endDate){
                return util.countDays(startDate,endDate);
            }
            // 取消订单
            self.cancelOrder = function(status) {

               self.cancelOrderBool = true;
               self.roomOrder.Status = 'CANCEL_REFUNDING';
                var data = {
                    "action": "guestCancelOrder",
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "clear_session": $scope.root.getParams('clear_session'),
                    // "clear_session": "openvod_userid_3_wyki7g6g",
                    "orderID": self.orderId - 0
                    // 假数据
                    // "orderID": 187

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
                        if(data.data.rescode == '200') {
                          if(data.data.data.RefundRequestACK) {
                              alert($filter('translate')('cancelSuccess'));
                          }
                          else {
                              alert($filter('translate')('cancelSuccess'));
                          }
                          $state.reload('bookOrderInfo',{orderId: self.orderId-0});
                        }
                        else {
                            alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
                        }
                    }, function errorCallback(data, status, headers, config) {
                        bookOrderInfo.roomOrder.Status = status;
                        self.cancelOrderBool = false;
                        alert($filter('translate')('cancelFailure'));
                    });
                
            }

            // 去支付
            self.payNow = function(status) {
               
               self.payNowBool = true;
                var data = {
                    "action": "weixinPay",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "payType": "JSAPI",
                    // 假数据
                    // "orderID": 187
                    "orderID": self.orderId - 0

                };
                data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('roomorder', 'orderInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        if (data.data.rescode == '200') {

                           self.wxPay(data.data.data.JS_Pay_API, data.data.data.orderNum);
                        } else {
                            alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
                        }
                    }, function errorCallback(data, status, headers, config) {
                        alert($filter('translate')('serverError'));
                    }).finally(function(){
                    });
                
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
                         // $state.reload()
                        $state.go($state.current, { orderId: self.orderId - 0 }, {reload: true, inherit: false});
                        // $state.reload('bookOrderInfo', { orderId: self.orderId - 0 })
                    },
                    cancel: function() {
                        $state.go($state.current, { orderId: self.orderId - 0 }, {reload: true, inherit: false});
                    },
                    error: function(e) {
                        $state.go($state.current, { orderId: self.orderId - 0 }, {reload: true, inherit: false});
                    }
                });
            }
        }
    ])

    .controller('memberHomeController', ['$http', '$scope', '$timeout', '$filter', '$q', '$stateParams', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $timeout, $filter, $q, $stateParams, $translate, loadingService, backendUrl) {
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

                // 遮罩层 bool
                self.showLoadingBool = {};
                
                self.search();
            }
            
            // 查看微信卡券
            self.openCard = function () {

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

            self.addCard = function () {
                self.getCardBatch().then(function (cardList) {
                    self.createCardLandingpage(cardList);
                })
            }

            self.createCardLandingpage = function (cardList) {
                var cardList = cardList;
                var card_list = [];
                for(var i = 0; i < cardList.length; i++) {
                    card_list[i].card_id = cardList[i].card_id;
                    card_list[i].thumb_url = "http://openvod.cleartv.cn/mgt/dist/imgs/icon-03.png"
                }
                var data = JSON.stringify({
                    clear_session: $scope.root.getParams('clear_session'),
                    banner: "http://openvod.cleartv.cn/mgt/dist/imgs/icon-03.png",
                    page_title: "hello",
                    can_share: false,
                    scene: "SCENE_QRCODE",
                    card_list: card_list
                })
                self.addingCards =  true;
                $http({
                    method: 'POST',
                    url: backendUrl('create_card_landingpage', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console && console.log(data);
                        var url = data.url;
                        window.location.href = url;
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.addingCards = false;
                });
            }

            self.getCardBatch = function () {
                var apiTicket = apiTicket;
                var deferred = $q.defer();
                var data = JSON.stringify({
                    clear_session: $scope.root.getParams('clear_session'),
                    keyword: {abstract : ["长期"]},
                    action: "businessman"
                })
                self.addingCards =  true;
                $http({
                    method: 'POST',
                    url: backendUrl('card_batchget', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console && console.log(data);
                        var cardList = data.card_list;
                        deferred.resolve(cardList);
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.addingCards = false;
                });
                return deferred.promise;
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
                // 至少11位
                self.mobileRe = /[0-9]{11,}/;
                
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
                   if(data.data.data.member.mobile - 0 != 0) {
                     self.member.mobile = data.data.data.member.mobile - 0;
                   }
                   self.member.idCardNumber = data.data.data.member.idCardNumber;
                   self.showLoadingBool.searchBool = true;
                }, function errorCallback(data, status, headers, config) {
                   self.showLoadingBool.searchBool = true;
                })
                .finally(function(value){
                    loadingService(self.showLoadingBool);
                });
                
            }
            self.updataMemberInfo = function() {
                self.updataMemberInfoBool = true
                var data = {
                    "action": "modifyMemberInfo",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "memberInfo": {
                        "realName": self.member.realName,
                        "mobile": self.member.mobile,
                        "idCardNumber": self.member.idCardNumber
                    }
                };
                data = JSON.stringify(data);
                  $http({
                      method: $filter('ajaxMethod')(),
                      url: backendUrl('shopmember', 'memberInfo'),
                      data: data
                  }).then(function successCallback(data, status, headers, config) {
                      if(data.data.rescode != '200') {
                          alert($filter('translate')('saveFailure'));
                      }else {
                          alert($filter('translate')('saveSuccess'));
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
                       url: backendUrl('roomorder', 'roomOrderList'),
                       data: data
                   }).then(function successCallback(data, status, headers, config) {
                       console.log(data)
                       self.orderLists = data.data.data;
                       self.orderListNum = data.data.data.length;
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
                       self.orderListNum = data.data.data.length;
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

    .controller('shopHomeController', ['$http', '$q', '$scope', '$filter', '$timeout', '$stateParams', '$state', '$translate', 'loadingService', 'backendUrl', 'util',
        function($http, $q, $scope, $filter, $timeout, $stateParams, $state, $translate, loadingService, backendUrl, util) {

            console.log('shopHomeController')
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
                // 查无结果，默认不显示
                self.noResults = false;
                // 默认不显示 loadingIcon
                self.showLoadingIcon = false;
                // 商品数组
                self.productList = [];
                // 一次加载数量
                self.perPageCount = 10;
                // 当前页数
                self.page = 0;

                // 如果缓存里有shopid和门店id和门店名称并且商店标识与上次一样,   获取门店，选中该门店，获取商店
                if(util.getParams('shopinfo') && (util.getParams('shopinfo').state == util.getParams('state'))) {

                    self.hotelId = util.getParams('shopinfo').hotelId;
                    self.hotelName = util.getParams('shopinfo').hotelName;
                    self.shopId = util.getParams('shopinfo').shopId;

                    // 获取门店，选中该门店
                    self.getHotelList()
                    .then(function() {
                        self.getShopName();
                    });

                    // 获取商店
                }
                // 否则：获取用户坐标
                else{
                    getLocation();
                    function getLocation() {
                        if($scope.root._wxreadystate) {
                            wx.getLocation({
                                type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
                                // 如果成功，用坐标去获取门店id
                                success: function (res) {
                                    var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
                                    var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
                                    // var speed = res.speed; // 速度，以米/每秒计
                                    // var accuracy = res.accuracy; // 位置精度
                                    self.getHotelIdByLocation(latitude, longitude);
                                },
                                cancel: function() {
                                    self.getHotelList()
                                    .then(function() {
                                        self.getShopIdByHotelId();
                                    });
                                },
                                error: function(e) {
                                    self.getHotelList()
                                    .then(function() {
                                        self.getShopIdByHotelId();
                                    });
                                }
                            });
                        }else{
                            $timeout(function() {getLocation()}, 50);
                        }
                    }
                }
            }

            self.getHotelIdByLocation = function(x, y) {
                var data = {
                    "action": "getNearestHotelID",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "LocationX": x,
                    "LocationY": y
                }
                data = JSON.stringify(data);
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopinfo', ''),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  if(data.data.rescode == '200') {
                    if(data.data.hotelID !== '') {
                        self.hotelId = data.data.hotelID;
                    }
                    self.getHotelList().then(function() {
                        self.getShopIdByHotelId();
                    });

                  } else {
                    alert($filter('translate')('serverError'));
                  }
                  if(!self.hotelId) {
                    self.hotelId = self.hotelLists.hotelLists[0].hotels[0].id;
                    self.hotelName = self.hotelLists.hotelLists[0].hotels[0].name;
                  }
                  
                },function errorCallback(data, status, headers, config) {
                    alert($filter('translate')('serverError'));
                })
            }

            self.getShopIdByHotelId = function() {
                self.productList = [];
                self.categoryList = [];
                var data = {
                    "action": "getShopIDByType",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelID": self.hotelId,
                    "shopType": util.getParams('state')
                }
                data = JSON.stringify(data);
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopinfo', 'hotelLists'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  if(data.data.rescode == '200') {
                    self.shopId = data.data.ShopID;
                    if(self.shopId) {
                        self.noShop = false;
                        // 记录该shopid和门店id和门店名称到本地缓存
                        var shopinfo = {
                            "hotelName": self.hotelName,
                            "hotelId": self.hotelId,
                            "shopId": self.shopId,
                            "state": util.getParams('state')
                        };
                        util.setParams('shopinfo', shopinfo);
                        self.getShopName();
                    } else {
                        self.noShop = true;
                        self.shopName = $filter('translate')('noShop');
                        self.productList = [];
                        self.categoryList = [];
                    }

                  }else {
                    self.noShop = true;
                    self.shopName = $filter('translate')('noShop');
                    self.productList = [];
                    self.categoryList = [];
                  }
                },function errorCallback(data, status, headers, config) {
                    alert($filter('translate')('serverError'));
                });
            }

            self.getHotelList = function() {
                var deferred = $q.defer();
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
                  if(!self.hotelId) {
                    self.hotelId = self.hotelLists.hotelLists[0].hotels[0].id;
                    self.hotelName = self.hotelLists.hotelLists[0].hotels[0].name;
                  }else{
                    var hlist = self.hotelLists.hotelLists;
                    for(var i = 0; i < hlist.length; i++) {
                        for(var j = 0; j < hlist[i].hotels.length; j++) {
                            var flag = false;
                            if (self.hotelId == hlist[i].hotels[j].id) {
                                self.hotelName = hlist[i].hotels[j].name;
                                flag = true;
                                break;
                            }
                            if(flag) {
                                break;
                            }
                        }
                    }
                  }
                  deferred.resolve();
                },function errorCallback(data, status, headers, config) {
                    alert($filter('translate')('serverError'));
                    deferred.reject();
                });
                return deferred.promise;
            }

            self.gotoShopDetail = function(productId) {
                angular.element(window).off('scroll'); 
                $state.go('shopProductDetail', { hotelId: self.hotelId, shopId: self.shopId, productId:productId, hotelName:self.hotelName });
            }

            self.gotoShopCart = function() {
                $state.go('shopCart', {shopId: self.shopId});
            }

            self.loadShopCartInfo = function() {
                // 获取购物车商品数量
                var data = {
                    "action": "getShoppingCart",

                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "shopID": util.getParams('shopinfo').shopId
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

            // 商城名字
            self.getShopName = function() {
                var data = {
                    "action": "getShopName",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "shopID": self.shopId
                    // "hotelId": 1
                };
                data = JSON.stringify(data);
                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('shopinfo', 'productCategory'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                       self.shopName = data.data.data.shopName;
                       self.searchCategory();
                    } else {
                        alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
                    }
                    
                   
                    
                }, function errorCallback(data, status, headers, config) {
                    alert($filter('translate')('serverError'));
                });
            }

            self.searchCategory = function() {
                var data = {
                    "action": "getProductCategory",
                    "clear_session": $scope.root.getParams('clear_session'),
                    "appid": $scope.root.getParams('appid'),
                    "openid": $scope.root.getParams('wxUserInfo')&&$scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "shopID": self.shopId
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
                    if (self.categoryList.length !=0) {
                        // 默认加载第一个分类
                        self.searchProductList(self.categoryList["0"]["id"],true);
                    }
                    else {
                        self.noResults = true;
                    }
                    
                    
                }, function errorCallback(data, status, headers, config) {

                });
            }
            self.searchProductList = function(id, bool) {
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
                    "openid": $scope.root.getParams('wxUserInfo') && $scope.root.getParams('wxUserInfo').openid,
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "categoryId": self.searchCategoryId,
                    "page": self.page + 1,
                    "count": self.perPageCount
                };
                data = JSON.stringify(data);
                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('shopinfo', 'productList' + id),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    self.page++;
                    self.productList = self.productList.concat(data.data.data.productList);
                    self.productList.length = self.productList.length;
                    self.productTotal = data.data.data.productTotal;
                    if(self.productTotal == 0) {
                        self.noResults = true;
                    }
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
                self.getShopIdByHotelId();
            };
        }
    ])

    .controller('shopProductDetailController', ['$http', '$q', '$scope', '$filter', '$state', '$stateParams', '$timeout', '$translate', '$ionicSlideBoxDelegate', 'loadingService', 'backendUrl', 'util',
        function($http, $q, $scope, $filter, $state, $stateParams, $timeout, $translate, $ionicSlideBoxDelegate, loadingService, backendUrl, util) {

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
                self.shopId = $stateParams.shopId;
                self.productId = $stateParams.productId;
                self.showLoadingBool = {};
                self.buying = false;

                
                
                self.search();
            }

            self.gotoShopCart = function() {
                $state.go('shopCart', {shopId: self.shopId});
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
                        "productId": self.productId - 0
                    }
                    data = JSON.stringify(data);
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('shopinfo', 'productDetail'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        if(data.data.rescode == '200'){
                            self.product = data.data.data.product;
                            // 添加空格和换行
                            self.product.intro = self.product.intro.split('\n');
                            for(var i = 0; i < self.product.intro.length; i++) {
                              self.product.intro[i] = self.product.intro[i].split('  ');
                            }

                            // ionic silder update
                            $ionicSlideBoxDelegate.update();

                            self.loadShopCartInfo();
                        }
                        else {
                            alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
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
                    "shopID": self.shopId
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
                    "shopID": self.shopId,
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

    .controller('shopCartController', ['$http', '$scope', '$timeout', '$filter', '$state', '$stateParams', '$ionicLoading', '$translate', 'backendUrl', 'util', 
      function($http, $scope, $timeout, $filter, $state, $stateParams, $ionicLoading, $translate, backendUrl, util) {
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
          
          // 至少11位
          self.mobileRe = /[0-9]{11,}/;

          // 初始化
          self.hotelId = util.getParams('shopinfo').hotelId;
          self.hotelName = util.getParams('shopinfo').hotelName;
          self.shopId = $stateParams.shopId;
          // self.postage = 1000; //邮费 todo
          self.postage = 0;
          $scope.shopCartList = new Array();
          self.totalPrice = 0;

          //watch shopCartList
          $scope.$watch('shopCartList', function() {
            self.judgeChecked();
            self.countTotalPrice();
          }, true);

          // watch shopCartList.hasEx
          $scope.$watch('shopCartList.hasEx', function() {
            self.changeDeliveryWay();
            self.countTotalPrice();
          }, true);

          // 获取购物车信息
          self.loadSCInfo();
        }

        /*
        ** 去除不支持该配送方式的已选商品
        */
        self.changeDeliveryWay = function () {
            var l = $scope.shopCartList;
            for (var i = 0; i < l.length; i++) {
                if(l[i].checked) {
                    l[i].checked = ($scope.shopCartList.hasEx && l[i].deliveryType.indexOf('express') !== -1) || 
                    (!$scope.shopCartList.hasEx && l[i].deliveryType.indexOf('bySelf') !== -1);
                }
            }
        }

        self.selectAll = function() {
            var l = $scope.shopCartList;
            for (var i = 0; i < l.length; i++) {
                // 商品不下架，商品库存不缺
                // 商品支持目前配送方式
                var _hasDeliveryWay = false;
                if($scope.shopCartList.hasEx) {
                    _hasDeliveryWay = (l[i].deliveryType.indexOf('express') !== -1) ? true : false;
                } else {
                    _hasDeliveryWay = (l[i].deliveryType.indexOf('bySelf') !== -1) ? true : false;
                }
                l[i].checked = l[i].status&&(l[i].availableCount - l[i].count)>=0&&l[i].availableCount!=0 && _hasDeliveryWay;
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
                    alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
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
                    alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
                }
            },
            function errorCallback(data, status, headers, config) {

            }
          )
        }

        self.countTotalPrice = function() {
          self.totalPrice = 0;
          self.totalScore = 0;
          if($scope.shopCartList) {
            for (var i = 0; i < $scope.shopCartList.length; i++) {
              if($scope.shopCartList[i].checked == true) {
                var _price = $scope.shopCartList[i].price;
                if(_price.money.Enable) {
                    self.totalPrice += (_price.money.price-0) * $scope.shopCartList[i].count;
                } else if (_price.point.Enable) {
                    self.totalScore += (_price.point.point-0) * $scope.shopCartList[i].count;
                }
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
            "shopID": self.shopId
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
                alert($filter('translate')('serverError') + data.data.errInfo);
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
               template: '...'
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
                    goodsList[goodsList_n].payType = l[i].price.money.Enable ? 'money' : 'point';
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
                "shopID": self.shopId,
                "goodsList": goodsList,
                "delivery":{
                    "deliverWay": deliverWay,
                    "contactName": self.address.name,
                    "mobile": self.address.mobile,
                    "address": $scope.shopCartList.hasEx ? self.address.address : ''
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
                  alert($filter('translate')('serverError') + ' ' + data.data.errInfo);
                  $ionicLoading.hide();
                  // 支付按钮变为可点击
                  document.getElementById('payBtn').disabled = false;
              }
            }, function errorCallback(data, status, headers, config) {
                alert('连接服务器出错');
                $ionicLoading.hide();
                // 支付按钮变为可点击
                document.getElementById('payBtn').disabled = false;
            })
            //订单生成结束
            .finally(function(value){
              // $ionicLoading.hide();
              // // 支付按钮变为可点击
              // document.getElementById('payBtn').disabled = false;
            });
        }

        // 支付
        self.pay = function(orderId) {
            self.orderId = orderId;
            // //获取支付参数
            // $ionicLoading.show({
            //    template: '...'
            // });
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
                // 如果支付为0元，只需支付积分，处理积分支付成功的情况
                if(data.data.data.completed) {
                    $state.go('shopOrderInfo', { orderId: self.orderId });
                    return;
                }

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
                  if(data.data.errInfo === 'get WX Member info failed.') {
                    alert('您还未领取会员卡，赶紧去领取吧！');
                  } 
                  else if(data.data.errInfo === 'get WX Member info failed.') {
                    alert('您的积分余额不足。');
                  } 
                  else {
                    alert($filter('translate')('serverError') + data.data.errInfo);
                  }
              }
            }, function errorCallback(data, status, headers, config) {
                alert('连接服务器出错');
            })
            .finally(function(value){
              $ionicLoading.hide();
              document.getElementById('payBtn').disabled = false;
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
                        self.showCancelBtn = (s == 'WAITPAY' || s == 'WAITAPPROVAL');
                        self.delivering = (s == 'DELIVERING');
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
                      alert($filter('translate')('serverError') + data.data.errInfo);
                  }
                })
                .finally(function(value){
                  $ionicLoading.hide();
                  document.getElementById('payBtn').disabled = false;
                });
            }

            /*
            ** 确认收货
            */
            self.confirmReceipt = function () {
                var confirmReceipt = confirm('确认收货？');
                if ( !confirmReceipt ) {
                    return;
                }

                document.getElementById('confirmReceiptBtn').disabled = true;        // 按钮变为不可点击，防止多次点击
                $ionicLoading.show({
                   template: '确认中...'
                });
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "action": "guestOrderCompleted",
                    "orderID": self.orderId-0
                }
                data = JSON.stringify(data);

                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shoporder', ''),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                  if(data.data.rescode == '200') {
                    $state.reload('shopOrderInfo',{orderId: self.orderId-0});
                  }
                  else {
                      alert($filter('translate')('serverError') + data.data.errInfo);
                  }
                }, function errorCallback(data, status, headers, config) {
                    alert('连接服务器出错');
                })
                .finally(function(value){
                  $ionicLoading.hide();
                  document.getElementById('confirmReceiptBtn').disabled = false;
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
                        alert($filter('translate')('cancelSuccess'));
                    }
                    else {
                        alert($filter('translate')('cancelSuccess'));
                    }
                    $state.reload('shopOrderInfo',{orderId: self.orderId-0});
                  }
                  else {
                      alert($filter('translate')('serverError') + data.data.errInfo);
                  }
                })
                .finally(function(value){
                  $ionicLoading.hide();
                  document.getElementById('cancelBtn').disabled = false;
                });
            }
        }
    ])
    
    // 测试 卡券 大礼包 测试页面
    .controller('cardGiftController', ['$http', '$scope', '$state', '$filter', '$stateParams', '$timeout', '$q', 'backendUrl', 'util', 'SHA1',
        function($http, $scope, $state, $filter, $stateParams, $timeout, $q, backendUrl, util, SHA1) {
            console.log('cardGiftController')    
    
            var self = this;
            self.addingCards = false;
            self.gettingCards = false;
            self.selCards = [];

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

            }

            // 核销
            self.consume = function () {
                if(self.selCards.length <= 0) {return;}
                
                var data = JSON.stringify({
                    "encrypt_code": self.selCards[0].encrypt_code,
                    "clear_session": $scope.root.getParams('clear_session')

                })
                self.consuming = true;
                
                $http({
                    method: 'POST',
                    url: backendUrl('codeencryptconsumer', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console.log(data);
                        alert('核销成功');
                        self.selCards = [];
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.consuming = false;
                });
            }

            self.chooseCards = function () {
                console.log('chooseCards');
                self.getApiTicket('chooseCards').then(function (apiTicket){
                    self.wxChooseCards(apiTicket);
                })
            }

            self.wxChooseCards = function (apiTicket) {
                // 1.将 api_ticket、appid、location_id、timestamp、nonce_str、card_id、card_type的value值进行字符串的字典序排序。
                // 2.将所有参数字符串拼接成一个字符串进行sha1加密，得到cardSign。
                var timestamp = parseInt(new Date().getTime()/1000);
                var nonceStr = util.randomString(32);
                var apiTicket = apiTicket;
                var appid = $scope.root.getParams('appid');

                var list = [timestamp, nonceStr, appid, apiTicket];
                list = list.sort().reduce(function(a,b){return  a + '' + b});
                var cardSign = SHA1(list);
                console.log('timestamp ' + timestamp + ', nonceStr ' + nonceStr + 
                                ', apiTicket ' + apiTicket + ', appid ' + appid);
                console.log('cardSign ' + cardSign);

                wx.chooseCard({
                    timestamp: timestamp, // 卡券签名时间戳
                    nonceStr: nonceStr, // 卡券签名随机串
                    signType: 'SHA1', // 签名方式，默认'SHA1'
                    cardSign: cardSign, // 卡券签名
                    success: function (res) {
                        self.addingCards = false;
                        var cardList = res.cardList; // 添加的卡券列表信息
                        console.log('user choose');
                        console.log(cardList);
                        $scope.$apply(function () {
                            self.selCards = JSON.parse(cardList);
                        });
                    },
                    cancel: function (res) {
                        console.log("选择卡券 cancel");
                        self.addingCards = false;
                    },
                    fail:function(res){
                        console.log("选择卡券 fail");
                        self.addingCards = false;
                    }
                });
            }

            self.addCards = function () {
                console.log('addCards');
                self.getApiTicket('addCards').then(function (apiTicket){
                    self.wxAddCard(apiTicket);
                })
            }

            self.getApiTicket = function (type) {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    "appid": $scope.root.getParams('appid')
                })

                if(type == 'chooseCards') {
                    self.choosingCards = true;
                }
                else if(type == 'addCards'){
                    self.addingCards = true;
                }
                
                $http({
                    method: 'POST',
                    url: backendUrl('apiticket', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console.log(data);
                        var apiTicket = data.ticket;
                        deferred.resolve(apiTicket);
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    if(type == 'chooseCards') {
                        self.choosingCards = false;
                    }
                    else if(type == 'addCards'){
                        self.addingCards = false;
                    }
                });
                return deferred.promise;
            }

            self.wxAddCard = function (apiTicket) {

                self.addingCards = true;

                var apiTicket = apiTicket;
                var cards = [{cardId: 'p3y-kwzWYkcYie4CUqHd8T7l3IZM'}, {cardId: 'p3y-kw47m4BRF9QToGsfKlSpb0Gg'}];
                for (var i = 0; i < cards.length; i++) {
                    var timestamp = parseInt(new Date().getTime()/1000);
                    var nonce_str = util.randomString(32);

                    // 生成签名
                    var list = [timestamp, nonce_str, cards[i].cardId, apiTicket];
                    list = list.sort().reduce(function(a,b){return  a + '' + b});
                    var signature = SHA1(list);

                    cards[i].cardExt = JSON.stringify({
                        timestamp: timestamp,
                        nonce_str: nonce_str,
                        signature: signature
                    });
                }

                wx.addCard({
                    cardList: cards, // 需要添加的卡券列表
                    success: function (res) {
                        var cardList = res.cardList; // 添加的卡券列表信息
                        console.log('user add');
                        console.log(cardList);
                        self.gotCard = true;
                        self.addingCards = false;
                    },
                    cancel: function (res) {
                        console.log("领取卡券 cancel");
                        self.addingCards = false;
                    },
                    fail:function(res){
                        console.log("领取卡券 fail");
                        self.addingCards = false;
                    }
                });
            }
        }
    ])

    // 卡券关注礼包
    .controller('cardAttentionGiftBagController', ['$http', '$scope', '$state', '$filter', '$stateParams', '$timeout', '$q', 'backendUrl', 'util', 'SHA1', 'PARAM',
        function($http, $scope, $state, $filter, $stateParams, $timeout, $q, backendUrl, util, SHA1, PARAM) {
            console.log('cardAttentionGiftBagController')    
    
            var self = this;
            self.addingCards = false;

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
                self.addCards();
                var project = $scope.root.getParams('projectInfo').project;
                console && console.log(PARAM.customize);
                self.roomPageURL = PARAM.customize[project].hotelsGuideUrl;
            }

            self.addCards = function () {
                console.log('addCards');
                self.addCardCancel = false;
                self.getApiTicket('addCards').then(function (apiTicket){
                    return self.getCardBatch(apiTicket);
                }).then(function (rtn) {
                    self.wxAddCard(rtn.apiTicket, rtn.cardList);
                })
            }

            self.getCardBatch = function (apiTicket) {
                var apiTicket = apiTicket;
                var deferred = $q.defer();
                var data = JSON.stringify({
                    clear_session: $scope.root.getParams('clear_session'),
                    keyword: {abstract : [PARAM.cardAttentionGiftKW]},
                    action: "businessman"
                })
                self.addingCards =  true;
                $http({
                    method: 'POST',
                    url: backendUrl('card_batchget', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console && console.log(data);
                        var cardList = data.card_list;
                        var rtn = {};
                        rtn.apiTicket = apiTicket;
                        rtn.cardList = cardList;
                        deferred.resolve(rtn);
                    }
                    else {
                        self.addCardFail = true;
                        self.addingCards = false;
                        console && console.log(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    self.addCardFail = true;
                    self.addingCards = false;
                    console && console.log('getCardBatch 连接服务器出错');
                }).finally(function(value) {
                    
                });
                return deferred.promise;
            }

            self.getApiTicket = function (type) {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    "appid": $scope.root.getParams('appid')
                })

                if(type == 'addCards'){
                    self.addingCards = true;
                }
                
                $http({
                    method: 'POST',
                    url: backendUrl('apiticket', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console.log(data);
                        var apiTicket = data.ticket;
                        deferred.resolve(apiTicket);
                    }
                    else {
                        self.addCardFail = true;
                        self.addingCards = false;
                        console && console.log(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    if(type == 'addCards'){
                        self.addingCards = false;
                    }
                    self.addCardFail = true;
                    console && console.log('获取api_ticket连接服务器出错');
                }).finally(function(value) {
                    
                });
                return deferred.promise;
            }

            self.wxAddCard = function (apiTicket, cardList) {

                self.addingCards = true;

                var apiTicket = apiTicket;
                var cards = [];
                for(var i = 0; i < cardList.length; i++) {
                    cards.push({cardId: cardList[i].card_id});
                }
                // var cards = [{cardId: 'p3y-kwzWYkcYie4CUqHd8T7l3IZM'}, {cardId: 'p3y-kw47m4BRF9QToGsfKlSpb0Gg'}];
                for (var i = 0; i < cards.length; i++) {
                    var timestamp = parseInt(new Date().getTime()/1000);
                    var nonce_str = util.randomString(32);

                    // 生成签名
                    var list = [timestamp, nonce_str, cards[i].cardId, apiTicket];
                    list = list.sort().reduce(function(a,b){return  a + '' + b});
                    var signature = SHA1(list);

                    cards[i].cardExt = JSON.stringify({
                        timestamp: timestamp,
                        nonce_str: nonce_str,
                        signature: signature
                    });
                }

                var cardList = [];


                wx.addCard({
                    cardList: cards, // 需要添加的卡券列表
                    success: function (res) {
                        var cardList = res.cardList; // 添加的卡券列表信息
                        console.log('user add cards');
                        console.log(cardList);
                        $scope.$apply(function () {
                            self.addingCards = false;
                            self.gotCard = true;
                        });
                    },
                    cancel: function (res) {
                        console.log("领取卡券 cancel");
                        $scope.$apply(function () {
                            self.addingCards = false;
                            self.addCardCancel = true;
                        })
                    },
                    fail:function(res){
                        console.log("领取卡券 fail");
                        $scope.$apply(function () {
                            self.addingCards = false;
                            self.addCardFail = true;
                        })
                    }
                });
            }
        }
    ])

    // 微信会员页
    .controller('wxMemberCardController', ['$http', '$scope', '$state', '$filter', '$stateParams', '$timeout', '$q', 'backendUrl', 'util', 'SHA1', 'PARAM',
        function($http, $scope, $state, $filter, $stateParams, $timeout, $q, backendUrl, util, SHA1, PARAM) {
            console.log('wxMemberCardController')    
    
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
                self.addCards();
            }

            self.addCards = function () {
                console.log('addCards');
                self.addCardCancel = false;
                self.getApiTicket('addCards').then(function (apiTicket){
                    return self.getCardBatch(apiTicket);
                }).then(function (rtn) {
                    self.wxAddCard(rtn.apiTicket, rtn.cardList);
                })
            }

            self.getCardBatch = function (apiTicket) {
                var apiTicket = apiTicket;
                var deferred = $q.defer();
                // var data = JSON.stringify({
                //     clear_session: $scope.root.getParams('clear_session'),
                //     keyword: {abstract : [PARAM.cardAttentionGiftKW]},
                //     action: "businessman"
                // })
                // self.addingCards =  true;
                // $http({
                //     method: 'POST',
                //     url: backendUrl('card_batchget', ''),
                //     data: data
                // }).then(function successCallback(response) {
                //     var data = response.data;
                //     if (data.rescode == '200') {
                //         console && console.log(data);
                //         var cardList = data.card_list;
                //         var rtn = {};
                //         rtn.apiTicket = apiTicket;
                //         rtn.cardList = cardList;
                //         deferred.resolve(rtn);
                //     }
                //     else {
                //         self.addCardFail = true;
                //         self.addingCards = false;
                //         console && console.log(data.rescode + ' ' + data.errInfo);
                //         deferred.reject();
                //     }
                // }, function errorCallback(response) {
                //     self.addCardFail = true;
                //     self.addingCards = false;
                //     console && console.log('getCardBatch 连接服务器出错');
                // }).finally(function(value) {
                    
                // });
                
                var rtn = {};
                rtn.apiTicket = apiTicket;
                rtn.cardList = [{card_id: 'pFHqYxJcSG2jRiYXbZ2pQA7eNPNA'}];
                deferred.resolve(rtn);
                return deferred.promise;
            }

            self.getApiTicket = function (type) {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    "appid": $scope.root.getParams('appid')
                })

                if(type == 'addCards'){
                    self.addingCards = true;
                }
                
                $http({
                    method: 'POST',
                    url: backendUrl('apiticket', ''),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        console.log(data);
                        var apiTicket = data.ticket;
                        deferred.resolve(apiTicket);
                    }
                    else {
                        self.addCardFail = true;
                        self.addingCards = false;
                        console && console.log(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    if(type == 'addCards'){
                        self.addingCards = false;
                    }
                    self.addCardFail = true;
                    console && console.log('获取api_ticket连接服务器出错');
                }).finally(function(value) {
                    
                });
                return deferred.promise;
            }

            self.wxAddCard = function (apiTicket, cardList) {

                self.addingCards = true;

                var apiTicket = apiTicket;
                var cards = [];
                for(var i = 0; i < cardList.length; i++) {
                    cards.push({cardId: cardList[i].card_id});
                }
                // var cards = [{cardId: 'p3y-kwzWYkcYie4CUqHd8T7l3IZM'}, {cardId: 'p3y-kw47m4BRF9QToGsfKlSpb0Gg'}];
                for (var i = 0; i < cards.length; i++) {
                    var timestamp = parseInt(new Date().getTime()/1000);
                    var nonce_str = util.randomString(32);

                    // 生成签名
                    var list = [timestamp, nonce_str, cards[i].cardId, apiTicket];
                    list = list.sort().reduce(function(a,b){return  a + '' + b});
                    var signature = SHA1(list);

                    cards[i].cardExt = JSON.stringify({
                        timestamp: timestamp,
                        nonce_str: nonce_str,
                        signature: signature
                    });
                }

                var cardList = [];
                console && console.log(cards);

                wx.addCard({
                    cardList: cards, // 需要添加的卡券列表
                    success: function (res) {
                        var cardList = res.cardList; // 添加的卡券列表信息
                        console.log('user add cards');
                        console.log(cardList);
                        $scope.$apply(function () {
                            self.addingCards = false;
                            self.gotCard = true;
                        });
                        alert('已添加会员卡');
                    },
                    cancel: function (res) {
                        WeixinJSBridge.call('closeWindow');
                        $scope.$apply(function () {
                            self.addingCards = false;
                            self.addCardCancel = true;
                        });
                    },
                    fail:function(res){
                        console.log("领取会员卡 fail");
                        $scope.$apply(function () {
                            self.addingCards = false;
                            self.addCardFail = true;
                        })
                    }
                });
            }
        }
    ])
    
})();
