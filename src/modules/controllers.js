'use strict';

(function() {
    var app = angular.module('app.controllers', ['ngCookies'])

    .controller('RootController', ['$scope', '$window', '$http', '$filter', '$ionicModal', '$translate', 'backendUrl', 'BACKEND_CONFIG', '$ionicLoading',
        function($scope, $window, $http, $filter, $ionicModal, $translate, backendUrl, BACKEND_CONFIG, $ionicLoading) {
            var self = this;

            self.init = function() {
                self.wxBrowserHack();
                
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
                // fix 商城页面，wx浏览器滚动时点击fix的div（分类）会点到下面一层（商品详情）
                /*$(document).on('touchmove',function(){
                    $('.card').css('pointer-events','none');
                    // alert('scroll');
                });
                $(document).on('scroll',function(){
                    $('.card').css('pointer-events','auto');
                });*/
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
                  url: backendUrl('project', 'projectInfo'),
                  data: data
                })
                .then(function successCallback(data, status, headers, config) {
                    self.projectInfo = data.data.data;
                    self.setParams('projectInfo', self.projectInfo);
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

    .controller('bookHotelListController', ['$scope', '$filter', '$timeout', '$location', '$http', '$stateParams', '$translate', '$ionicModal','loadingService', 'backendUrl', 'util',
        function($scope, $filter, $timeout, $location, $http, $stateParams, $translate, $ionicModal, loadingService, backendUrl, util) {
            console.log('bookHotelListController');
            var self = this;

            

            console.log($scope.root.params)

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
            };

            // 显示／隐藏城市选择器
            self.showCP = function(boo) {
                self.cityPickerShow = boo ? boo : false;
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
                $timeout(function(){
                  $http({
                      method: $filter('ajaxMethod')(),
                      url: backendUrl('project', 'cityLists'),
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
                },500)
            }

            self.searchHotelList = function() {
                // 请求之前 都要先清空
                self.hotels = {};
                // 每次 请求，都要添加loading
                self.loadingIcon = false;
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "bookCity": self.cityInfo.cityId, //0: all, 城市ID
                    "bookStartDate": self.checkin,
                    "bookEndDate": self.checkout
                };
                data = JSON.stringify(data);

                $timeout(function() {
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('bookHotel', 'hotelList'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.hotels = data.data.data;
                        self.hotelNum = self.hotels.length;
                        self.loadingIcon = true;
                    }, function errorCallback(data, status, headers, config) {
                        self.loadingIcon = true;
                    });
                }, 500)
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
            var self = this;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.hotelId = $stateParams.hotelId;
                self.checkIn = $stateParams.checkIn - 0;
                self.checkOut = $stateParams.checkOut - 0;
                console.log($stateParams.ID)
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
                    name: self.hotel.Name['zh-CN'], // 位置名
                    address: self.hotel.Address['zh-CN'], // 地址详情说明
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
            self.nextState = function(roomId, hotelId, checkIn, checkOut, roomRemain) {
                    if (!(roomRemain == 0)) {
                        $state.go('roomInfo', { roomId: roomId, hotelId: hotelId, checkIn: checkIn, checkOut: checkOut })
                    }

            };

            // 住酒店 天数
            // self.day
            self.searchHotelInfo = function() {
                self.showLoadingBool.searchHotelInfoBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session":$scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelId": self.hotelId
                };
                data = JSON.stringify(data);
                
                $timeout(function() {
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('bookHotel', 'hotelInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.hotel = data.data.data;
                        console.log(self.hotel)
                        self.showLoadingBool.searchHotelInfoBool = true;
                        
                        // 酒店 地图 
                        // self.locationHref = BACKEND_CONFIG.mapUrl + '?x=' + self.hotel.hotelLocation.X + '&y=' + self.hotel.hotelLocation.Y;
                        loadingService(self.showLoadingBool);
                        self.searchRoomList();
                        console.log("searchHotelInfoBool")
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchHotelInfoBool = true;
                        loadingService(self.showLoadingBool);
                    });
                }, 300)
            }

            self.searchRoomList = function() {
                self.showLoadingBool.searchRoomListBool = false;
                var data = {
                    "clear_session": $scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                     
                    "hotelId": self.hotelId,
                    "bookStartDate": self.checkIn,
                    "bookEndDate": self.checkOut
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('bookHotel', 'roomList'),
                    data: data

                }).then(function successCallback(data, status, headers, config) {
                    self.rooms = data.data.data;
                    console.log(self.rooms)
                    // ionic silder update
                    $ionicSlideBoxDelegate.update();

                    console.log(self.rooms)
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
                $timeout(function(){
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
                },500)
            }
        }
    ])

    .controller('roomInfoController', ['$location', '$scope', '$http', '$filter', '$state', '$translate', '$stateParams', '$timeout', '$ionicSlideBoxDelegate', 'loadingService', 'backendUrl', 'util', 'BACKEND_CONFIG',
        function($location, $scope, $http, $filter, $state, $translate, $stateParams, $timeout, $ionicSlideBoxDelegate, loadingService, backendUrl, util, BACKEND_CONFIG) {
            console.log("roomInfoController")
            BACKEND_CONFIG.test && console.log($stateParams);
            var self = this;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchRoomInfoBool = false;
                self.showLoadingBool.searchMemberInfoBool = false;
                self.showLoadingBool.searchHotelInfoBool = false;


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
                
                // self.memberInfo.mobile = self.memberInfo.mobile - 0;

              
            }


            self.searchRoomInfo = function() {
                    self.showLoadingBool.searchRoomInfoBool = false;
                    loadingService(self.showLoadingBool);
                    var data = {
                        "clear_session": $scope.root.getParams('clear_session'),
                        "lang": $translate.proposedLanguage() || $translate.use(),

                        "roomId": self.roomId,
                        "hotelId": self.hotelId,
                        "bookStartDate": self.checkIn,
                        "bookEndDate": self.checkOut
                    };
                    data = JSON.stringify(data);

                    $timeout(function() {
                        $http({
                            method: $filter('ajaxMethod')(),
                            url: backendUrl('bookHotel', 'roomInfo'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            self.searchHotelInfo();
                            console.log(data)
                            self.room = data.data.data;
                            // ionic silder update
                            $ionicSlideBoxDelegate.update();
                            
                            BACKEND_CONFIG.test && console.log(self.room);
                            // self.priceList = data.data.data.priceList;
                            //  // 单价
                            // self.roomPriPerDay = self.roomBookPrcFun(self.priceList);
                            // // 房间数 最多 可选
                            // self.roomMax = Math.min(self.room.roomRemain, self.room.purchaseAbility);
                            
                            self.showLoadingBool.searchRoomInfoBool = true;
                            loadingService(self.showLoadingBool);
                        }, function errorCallback(data, status, headers, config) {
                            self.showLoadingBool.searchRoomInfoBool = true;
                            loadingService(self.showLoadingBool);
                        });
                    }, 500)
                
            }
             
            self.searchHotelInfo = function() {
                self.showLoadingBool.searchHotelInfoBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session":$scope.root.getParams('clear_session'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "hotelId": self.hotelId
                };
                data = JSON.stringify(data);
                
                $timeout(function() {
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('bookHotel', 'hotelInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.hotel = data.data.data;
                        console.log(self.hotel)
                        self.showLoadingBool.searchHotelInfoBool = true;
                        
                        // 酒店 地图 
                        // self.locationHref = BACKEND_CONFIG.mapUrl + '?x=' + self.hotel.hotelLocation.X + '&y=' + self.hotel.hotelLocation.Y;
                        loadingService(self.showLoadingBool);
                        console.log("searchHotelInfoBool")
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchHotelInfoBool = true;
                        loadingService(self.showLoadingBool);
                    });
                }, 300)
            }

            // 
            self.searchMemberInfo = function() {
                self.showLoadingBool.searchMemberInfoBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);
                $timeout(function(){
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('member', 'memberInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.member = data.data.data;
                        console.log(self.member)
                        self.member.mobile -= 0;
                        self.showLoadingBool.searchMemberInfoBool = true;
                        loadingService(self.showLoadingBool);
                        self.searchRoomInfo();
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchMemberInfoBool = true;
                        loadingService(self.showLoadingBool)
                    });
                },500)
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
                var data = {
                    "wxappid": $scope.root.getParams('appid'), // 公众ID
                    "orderType": "Room", // Room/Shop
                    "goodsID": self.roomId, // 商品ID
                    // todo
                    "goodsName": "酒店名称", // 商品名称
                    "goodsDetail": self.room.roomName, // 商品详情
                    // todo
                    "goodsExtraInfo": "钻石会员", // 商品额外信息
                    // todo
                    "goodsPrice": 1, // 整型，单位分
                    // todo
                    "clientIP": "1.1.1.1", // 客户端ip
                    // todo
                    "userid": 1
                };
                data = JSON.stringify(data);
                $http.post(backendUrl('neworder', '', 'server'), data)
                    .success(function(data, status, headers, config) {
                        if (data.rescode == '200') {
                            self.wxPay(data.JS_Pay_API, data.orderNum);
                        } else {
                            alert($filter('translate')('serverError') + ' ' + data.rescode + ' ' + data.errInfo);
                        }
                    })
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
                        $state.go('orderInfo', { orderId: orderId })
                    },
                    cancel: function() {
                        $state.go('orderInfo', { orderId: orderId })
                    },
                    error: function(e) {
                        $state.go('orderInfo', { orderId: orderId })
                    }
                });
            }
        }
    ])

    .controller('bookOrderInfoController', ['$scope', '$http', '$timeout', '$filter', '$stateParams', '$translate', 'loadingService', 'backendUrl', 'util',
        function($scope, $http, $timeout, $filter, $stateParams, $translate, loadingService, backendUrl, util) {
            console.log("bookInfoController")
            var self = this;
            console.log($stateParams)
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);

                self.search();
            }
            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "GetRoomOrderDetail",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "orderId": $stateParams.orderId
                };
                data = JSON.stringify(data);
                $timeout(function(){
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('order', 'orderInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        self.room = data.data.data.room;
                        console.log(self.room)
                        self.hotel = data.data.data.hotel;
                        self.roomOrder = data.data.data.roomOrder;
                        self.showLoadingBool.searchBool = true;

                        // 酒店天数
                        self.stayDays = util.countDay(self.hotel.bookStartDate, self.hotel.bookEndDate);
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    });
                },500)
                
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
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);

                self.search();
            }
            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "GetMemberInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);
                $timeout(function(){
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('member', 'memberInfo'),
                        data: data

                    }).then(function successCallback(data, status, headers, config) {
                        self.member = data.data.data.member;
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                    });
                },500)
                
            }
        }
    ])

    .controller('memberInfoEditController', ['$http', '$scope', '$filter', '$stateParams', '$timeout', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $timeout, $translate, loadingService, backendUrl) {
            console.log("memberInfoEditController");
            var self = this;
            self.memberId = $stateParams.memberId;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;

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
                    "action": "GetMemberInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);
                $timeout(function(){
                   $http({
                       method: $filter('ajaxMethod')(),
                       url: backendUrl('member', 'memberInfo'),
                       data: data
                   }).then(function successCallback(data, status, headers, config) {
                       self.member = data.data.data.member;
                       self.member.mobile = data.data.data.member.mobile-0;
                       self.member.idCardNumber = data.data.data.member.idCardNumber-0;
                       console.log(self.member)
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool);
                   }, function errorCallback(data, status, headers, config) {
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool);
                   }); 
                },500)
                
            }
            self.updataMemberInfo = function() {
                console.log('updataMemberInfo')
                var data = {
                    "action": "modifyMemberInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
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
                    url: backendUrl('member', 'memberInfo'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {

                    loadingService(self.showLoadingBool);
                }, function errorCallback(data, status, headers, config) {

                });
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

    .controller('memberOrderListController', ['$http', '$scope', '$filter', '$stateParams', '$state', '$timeout', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $state, $timeout, $translate, loadingService, backendUrl) {
            console.log('memberOrderListController')
            var self = this;

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
                $timeout(function(){
                   $http({
                       method: $filter('ajaxMethod')(),
                       url: backendUrl('member', 'orderList')
                   }).then(function successCallback(data, status, headers, config) {
                       console.log(data)
                       self.orderLists = data.data.data.orderLists;
                       self.orderListNum = data.data.data.orderNum;
                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool)
                   }, function errorCallback(data, status, headers, config) {

                       self.showLoadingBool.searchBool = true;
                       loadingService(self.showLoadingBool);
                   }); 
                },500)
                
            }
            self.nextState = function(id,type){
                if (type == "Room") {
                     $state.go('bookOrderInfo')
                } else {
                     $state.go('shopOrderInfo')
                }
            }
        }
    ])

    .controller('shopHomeController', ['$http', '$scope', '$filter', '$timeout', '$stateParams', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $timeout, $stateParams, loadingService, backendUrl) {

            console.log('shopHomeController')
            var self = this;

            self.init = function() {
                self.showLoadingBool = {};
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.loadShopCartInfo();
                // 默认不显示 loadingIcon
                self.showLoadingIcon = false;
                // 商品数组
                self.productList = [];
                //
            }
            self.loadShopCartInfo = function() {
                // 获取购物车商品数量
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopCart', 'shopCartList')
                })
                .then(function successCallback(data, status, headers, config) {
                  var shopCartList = data.data.data.list;
                  self.shopCartItemCount = 0;
                  shopCartList.forEach(function(value) {self.shopCartItemCount += value.count});
                  // go on
                  self.searchCategory();
                  
                })
            }

            self.searchCategory = function() {
                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('product', 'productCategory')
                }).then(function successCallback(data, status, headers, config) {
                    self.categoryList = data.data.data.categoryList;
                    // 默认加载第一个分类
                    self.searchProductList(self.categoryList["0"]["id"],true)
                }, function errorCallback(data, status, headers, config) {

                });
            }
            self.searchProductList = function(id,bool) {
                    self.showLoadingIcon = true
                    console.log(id);
                    // 记录当前点击的商品分类的id
                    self.searchProductId = id;
                    self.showLoadingIcon = true;
                    // 点击“分类”时，清空productList数组
                    if (bool == true) {
                        self.productList = [];
                    }
                    $timeout(function(){
                        $http({
                            method: $filter('ajaxMethod')(),
                            url: backendUrl('product', 'productList'+id)
                        }).then(function successCallback(data, status, headers, config) {
                            self.productList = self.productList.concat(data.data.data.productList);
                            self.productList.length = self.productList.length;
                            self.productTotal = data.data.data.productTotal;
                            console.log(self.productList)
                            self.showLoadingIcon = false;
                        }, function errorCallback(data, status, headers, config) {
                            self.showLoadingIcon = false;
                        });
                    },500)
                    
                }

                // 更多商品   loading 图标
            self.moreProduct = function() {
                console.log('moreProduct')
                self.showLoadingIcon = true;
                // 加载更多商品时，productList不清空
                self.searchProductList(self.searchProductId,false);
            }
        }
    ])

    .controller('shopProductDetailController', ['$http', '$q', '$scope', '$filter', '$state', '$stateParams', '$timeout', '$ionicSlideBoxDelegate', 'loadingService', 'backendUrl',
        function($http, $q, $scope, $filter, $state, $stateParams, $timeout, $ionicSlideBoxDelegate, loadingService, backendUrl) {

            console.log('shopProductDetailController')
            var self = this;

            self.init = function() {
                self.showLoadingBool = {};
                self.buying = false;

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.search();
            }

            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                $timeout(function() {
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('product', 'productDetail')
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.product = data.data.data.product;
                        // ionic silder update
                        $ionicSlideBoxDelegate.update();

                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                        self.loadShopCartInfo();
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                        
                    });
                }, 500)

            }

            self.loadShopCartInfo = function() {
                // 获取购物车商品数量
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopCart', 'shopCartList')
                })
                .then(function successCallback(data, status, headers, config) {
                  var shopCartList = data.data.data.list;
                  self.shopCartItemCount = 0;
                  shopCartList.forEach(function(value) {self.shopCartItemCount += value.count});
                  
                })
            }

            self.addToCart = function(callBack) {
                $http({
                  method: $filter('ajaxMethod')(),
                  url: backendUrl('shopCart', 'shopCartList')
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
                    $state.go('shopCart');
                });

            }
        }
    ])

    .controller('shopCartController', ['$http', '$scope', '$filter', '$state', '$ionicLoading', 'backendUrl',
      function($http, $scope, $filter, $state, $ionicLoading, backendUrl) {
        console.log('shopCartController')
        var self = this;
        
        self.init = function() {
          // 注册微信分享朋友和朋友圈
          $scope.root.wxShare();

          // 初始化
          self.hasEx = false; //含快递货品
          self.postage = 1000; //邮费 todo

          //watch shopCartList
          $scope.$watch('shopCartList', function() { 
            self.judgeDist();
            self.countTotalPrice();
          }, true);

          // 获取购物车信息
          self.loadSCInfo();
        }

        self.judgeDist = function() {
            self.hasEx = $scope.shopCartList&&$scope.shopCartList.some(function(x){return x.dist==true?true:false});
        }

        self.plusOne = function(index) {
          var item = $scope.shopCartList[index];
          if(item.count < item.availableCount){
            item.count += 1;
          }
        }

        self.delete = function(index) {
          $scope.shopCartList.splice(index, 1);
        }

        self.minusOne = function(index) {
          if($scope.shopCartList[index].count >= 2){
            $scope.shopCartList[index].count -= 1;
          }
        }

        self.countTotalPrice = function() {
          self.totalPrice = 0;
          if($scope.shopCartList) {
            for (var i = 0; i < $scope.shopCartList.length; i++) {
              self.totalPrice += $scope.shopCartList[i].price * $scope.shopCartList[i].count;
            } 
          }
          if(self.hasEx) {
            self.totalPrice += self.postage;
          }
        }

        self.loadSCInfo = function() {
          $ionicLoading.show({
            template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
          });
          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('shopCart', 'shopCartList')
          })
          .then(function successCallback(data, status, headers, config) {
            $scope.shopCartList = data.data.data.list;
            // 默认true：快递，false：自提
            for (var i in $scope.shopCartList){$scope.shopCartList[i].dist = false;}
            self.loadExInfo();
          })
          .finally(function(value){
            $ionicLoading.hide();
          });
        }

        self.loadExInfo = function() {
            $ionicLoading.show({
            template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
          });
          $http({
            method: $filter('ajaxMethod')(),
            url: backendUrl('', 'memberAddress')
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

        self.submitOrder = function() {
            $state.go('shopOrderInfo');
        }
        
      }
    ])


    .controller('shopOrderInfoController', ['$http', '$scope', '$filter', '$stateParams', '$timeout', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $timeout, loadingService, backendUrl) {
            console.log('shopOrderInfoController')    
    
            var self = this;
             
            self.init = function() {
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                self.search();
            }


            self.search = function() {
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);
                $timeout(function() {
                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('product', 'shopOrderInfo')
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.detail = data.data.data.detail;
                        console.log(self.detail)
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                    });
                }, 500)

            }
        }
    ])
    

})();
