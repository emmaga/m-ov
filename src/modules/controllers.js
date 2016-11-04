'use strict';

(function() {
    var app = angular.module('app.controllers', ['ngCookies'])

    .controller('RootController', ['$scope', '$window', '$http', '$filter', '$ionicPopup', '$ionicModal', '$translate', 'backendUrl',
        function($scope, $window, $http, $filter, $ionicPopup, $ionicModal, $translate, backendUrl) {
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

            * self.params.projectInfo
            {
              "projectName": "项目-酒店名字",
              "projectImgSrc": "api/img/doodle.html"
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

                self.searchProjectInfo();
                self.searchMemberInfo();
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
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: ($filter('translate')('serverError') + status)
                        });
                        // alert($filter('translate')('serverError') + status);
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
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: ($filter('translate')('serverError') + status)
                        });
                        // alert($filter('translate')('serverError') + status);
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
                        if (data.rescode == '200') {
                            wx.config({
                                debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                                appId: self.getParams('appid'), // 必填，公众号的唯一标识
                                timestamp: self.timestamp, // 必填，生成签名的时间戳
                                nonceStr: self.noncestr, // 必填，生成签名的随机串
                                signature: data.signature, // 必填，签名，见附录1
                                jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'chooseWXPay'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                            });
                        } else {
                            // todo use ionic alert style
                            $ionicPopup.alert({
                                // title: 'Don\'t eat that!',
                                template: ($filter('translate')('serverError') + status)
                            });
                        }
                    })
                    .error(function(data, status, headers, config) {
                        // todo use ionic alert style
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: ($filter('translate')('serverError') + status)
                        });
                    })
            }

            // 项目信息
            self.searchProjectInfo = function() {

                    var data = {
                        "action": "GetProjectInfo",
                        "appid": self.getParams('appid'),
                        "clear_session": "xxxx",
                        "openid": self.getParams('openid'),
                        "lang": $translate.proposedLanguage() || $translate.use()
                    };
                    data = JSON.stringify(data);

                    $http({
                        // method : 'POST',
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('project', 'projectInfo'),
                        data: data
                    }).then(function successCallback(data, status, headers, config) {
                        console.log(data)
                        self.projectInfo = data.data.data;
                        self.setParams('projectInfo', self.projectInfo);
                    }, function errorCallback(data, status, headers, config) {
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: status
                        });
                    });
                }
                // 会员信息
            self.searchMemberInfo = function() {
                var data = {
                    "action": "GetMemberInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('member', 'memberInfo'),
                    data: data

                }).then(function successCallback(data, status, headers, config) {
                    self.memberInfo = data.data.data.member;
                    self.setParams('memberInfo', self.memberInfo);
                }, function errorCallback(data, status, headers, config) {
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
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
        }
    ])

    .controller('bookHotelListController', ['$scope', '$filter', '$timeout', '$location', '$http', '$stateParams', '$ionicPopup', '$translate', 'loadingService', 'backendUrl', 'util',
        function($scope, $filter, $timeout, $location, $http, $stateParams, $ionicPopup, $translate, loadingService, backendUrl, util) {
            console.log('bookHotelListController');
            var self = this;
            console.log($scope.root.params);
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchCityListsBool = false;
                self.showLoadingBool.searchHotelListBool = false;
                loadingService(self.showLoadingBool);
                self.datePickerShow = false;
                self.hotels = {};
                self.checkin = new Date().getTime();
                self.checkout = self.checkin + 24 * 60 * 60 * 1000;

                // 酒店天数
                self.stayDays = util.countDay(self.checkin, self.checkout);

                self.cityInfo = { id: '0', name: '全部' };
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

                self.stayDays = util.countDay(self.checkin, self.checkout);
                // 延时半秒隐藏
                $timeout(function() { self.showDP(false); }, 500);
                self.searchHotelList();
                console.log('日期')
            };

            self.doAfterPickCity = function(cityId, cityName) {
                self.cityInfo = { id: cityId, name: cityName };
                self.showCP(false);
                self.searchHotelList();
                console.log('chengshi')
            };



            // 获取城市
            self.searchCityLists = function() {

                var data = {
                    "action": "GetCityLists",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('project', 'cityLists'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    self.cityLists = data.data.data.cityLists;
                    self.showLoadingBool.searchCityListsBool = true;
                    loadingService(self.showLoadingBool);
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchCityListsBool = true;
                    loadingService(self.showLoadingBool);
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
                });


            }

            self.searchHotelList = function() {
                // 每次 请求，都要添加loading
                self.showLoadingBool.searchHotelListBool = false;
                loadingService(self.showLoadingBool);
                var data = {
                    "action": "GetHotelList",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
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
                        self.hotels = data.data.data.hotelLists;
                        self.hotelNum = data.data.data.hotelNum;
                        self.showLoadingBool.searchHotelListBool = true;
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchHotelListBool = true;
                        loadingService(self.showLoadingBool);
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: status
                        });
                    });
                }, 500)
            }
        }
    ])

    .controller('bookRoomListController', ['$scope', '$http', '$filter', '$state', '$stateParams', '$timeout', '$ionicPopup', '$translate', 'loadingService', 'backendUrl', 'BACKEND_CONFIG', 'util',
        function($scope, $http, $filter, $state, $stateParams, $timeout, $ionicPopup, $translate, loadingService, backendUrl, BACKEND_CONFIG, util) {
            console.log('bookRoomListController')
            var self = this;
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

                self.stayDays = util.countDay(self.checkIn, self.checkOut);
                // 延时半秒隐藏
                $timeout(function() { self.showDP(false); }, 500);
            };
            // 可以预订 才跳转
            self.nextState = function(roomId, hotelId, checkIn, checkOut, roomRemain) {
                    if (!(roomRemain == 0)) {
                        $state.go('roomInfo', { roomId: roomId, hotelId: hotelId, checkIn: checkIn, checkOut: checkOut })
                    }

                }
                // 住酒店 天数
                // self.day
            self.searchHotelInfo = function() {

                var data = {
                    "action": "GetHotelInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
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
                        self.hotel = data.data.data.hotel;
                        self.showLoadingBool.searchHotelInfoBool = true;

                        // 酒店 地图 
                        self.locationHref = BACKEND_CONFIG.mapUrl + '?x=' + self.hotel.hotelLocation.X + '&y=' + self.hotel.hotelLocation.Y;
                        loadingService(self.showLoadingBool);
                        console.log("searchHotelInfoBool")
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchHotelInfoBool = true;
                        loadingService(self.showLoadingBool);
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: status
                        });
                    });
                }, 300)
            }

            self.searchRoomList = function() {

                var data = {
                    "action": "GetRoomList",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
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
                    self.showLoadingBool.searchRoomListBool = true;
                    loadingService(self.showLoadingBool);
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchHotelInfoBool = true;
                    loadingService(self.showLoadingBool);
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
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

    .controller('roomInfoController', ['$location', '$scope', '$http', '$filter', '$state', '$translate', '$stateParams', '$timeout', '$ionicPopup', 'loadingService', 'backendUrl', 'util',
        function($location, $scope, $http, $filter, $state, $translate, $stateParams, $timeout, $ionicPopup, loadingService, backendUrl, util) {
            console.log("roomInfoController")
            console.log($stateParams)
            console.log($scope.root.params)
            var self = this;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);

                self.checkIn = $stateParams.checkIn - 0;
                self.checkOut = $stateParams.checkOut - 0;
                self.roomId = $stateParams.roomId;
                self.hotelId = $stateParams.hotelId;

                self.stayDays = util.countDay(self.checkIn, self.checkOut);
                self.search();
                // //  验证码 倒计时
                // self.countSeconds = 30;
                // self.showTip = true;

                // params 会员信息
                self.memberInfo = $scope.root.params.memberInfo;
                self.memberInfo.mobile = self.memberInfo.mobile - 0;

                // 默认选中房间数为1
                self.roomNumber = 1;
            }


            self.search = function() {
                    var data = {
                        "action": "GetRoomInfo",
                        "appid": $scope.root.getParams('appid'),
                        "clear_session": "xxxx",
                        "openid": $scope.root.getParams('openid'),
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
                            self.room = data.data.data.room;
                            self.priceList = data.data.data.priceList;
                            self.showLoadingBool.searchBool = true;
                            // 单价
                            self.roomPriPerDay = self.roomBookPrcFun(self.priceList);
                            // 房间数 最多 可选
                            self.roomMax = Math.min(self.room.roomRemain, self.room.purchaseAbility)
                            loadingService(self.showLoadingBool);
                        }, function errorCallback(data, status, headers, config) {
                            self.showLoadingBool.searchBool = true;
                            loadingService(self.showLoadingBool);
                            $ionicPopup.alert({
                                // title: 'Don\'t eat that!',
                                template: status
                            });
                        });
                    }, 500)

                }
                // 计算客房总价
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
            //       alert(status)
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
                            // todo use ionic alert style
                            $ionicPopup.alert({
                                // title: 'Don\'t eat that!',
                                template: ($filter('translate')('serverError') + ' ' + data.rescode + ' ' + data.errInfo)
                            });
                            // alert($filter('translate')('serverError') + ' ' + data.rescode + ' ' + data.errInfo);
                        }
                    })
                    .error(function(data, status, headers, config) {
                        // todo use ionic alert style
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: ($filter('translate')('serverError') + status)
                        });
                        // alert($filter('translate')('serverError') + status);
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

    .controller('bookOrderInfoController', ['$scope', '$http', '$filter', '$stateParams', '$ionicPopup', '$translate', 'loadingService', 'backendUrl', 'util',
        function($scope, $http, $filter, $stateParams, $ionicPopup, $translate, loadingService, backendUrl, util) {
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
                var data = {
                    "action": "GetRoomOrderDetail",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use(),
                    "orderId": $stateParams.orderId
                };
                data = JSON.stringify(data);
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
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
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

    .controller('memberHomeController', ['$http', '$scope', '$filter', '$stateParams', '$translate', '$ionicPopup', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $translate, $ionicPopup, loadingService, backendUrl) {
            console.log("memberHomeController")

            var self = this;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool.searchBool)

                self.search();
            }
            self.search = function() {
                var data = {
                    "action": "GetMemberInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('member', 'memberInfo'),
                    data: data

                }).then(function successCallback(data, status, headers, config) {
                    self.member = data.data.data.member;
                    self.showLoadingBool.searchBool = true;
                    loadingService(self.showLoadingBool.searchBool)
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchBool = true;
                    loadingService(self.showLoadingBool.searchBool)
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
                });
            }
        }
    ])

    .controller('memberInfoEditController', ['$http', '$scope', '$filter', '$stateParams', '$timeout', '$ionicPopup', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $timeout, $ionicPopup, $translate, loadingService, backendUrl) {
            console.log("memberInfoEditController");
            var self = this;
            self.memberId = $stateParams.memberId;
            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool);

                self.search();
                // // 验证码 倒计时
                // self.countAbility = false;
                // self.countSeconds = 30;
                // self.showTip = true;
            }

            self.search = function() {
                var data = {
                    "action": "GetMemberInfo",
                    "appid": $scope.root.getParams('appid'),
                    "clear_session": "xxxx",
                    "openid": $scope.root.getParams('openid'),
                    "lang": $translate.proposedLanguage() || $translate.use()
                };
                data = JSON.stringify(data);

                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('member', 'memberInfo'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    console.log(data)
                    self.member = data.data.data.member;
                    console.log(self.member)
                    self.showLoadingBool.searchBool = true;
                    loadingService(self.showLoadingBool);
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchBool = true;
                    loadingService(self.showLoadingBool);
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
                });
            }
            self.updataMemberInfo = function() {
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

                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
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
            //       alert(status)
            //     });
            // }
        }
    ])

    .controller('memberOrderListController', ['$http', '$scope', '$filter', '$stateParams', '$timeout', '$ionicPopup', '$translate', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $timeout, $ionicPopup, $translate, loadingService, backendUrl) {
            console.log('memberOrderListController')
            var self = this;

            self.init = function() {

                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();

                // 遮罩层 bool
                self.showLoadingBool = {};
                self.showLoadingBool.searchBool = false;
                loadingService(self.showLoadingBool)
                self.search();
            }
            self.search = function() {
                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('member', 'orderList')
                }).then(function successCallback(data, status, headers, config) {
                    console.log(data)
                    self.orderLists = data.data.data.orderLists;
                    self.showLoadingBool.searchBool = true;
                    loadingService(self.showLoadingBool)
                }, function errorCallback(data, status, headers, config) {
                    self.showLoadingBool.searchBool = true;
                    loadingService(self.showLoadingBool)
                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
                });
            }
        }
    ])

    .controller('shopHomeController', ['$http', '$scope', '$filter', '$stateParams', '$ionicPopup', '$timeout', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $ionicPopup, $timeout, loadingService, backendUrl) {

            console.log('shopHomeController')
            var self = this;

            self.init = function() {
                self.showLoadingBool = {};
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
                self.searchCategory();
                // 默认不显示 loadingIcon
                self.showLoadingIcon = false;
                // 商品数组
                self.productList = [];
            }
            self.searchCategory = function() {
                $http({
                    method: $filter('ajaxMethod')(),
                    url: backendUrl('product', 'productCategory')
                }).then(function successCallback(data, status, headers, config) {
                    self.categoryList = data.data.data.categoryList;
                    // 默认加载第一个分类
                    self.searchProductList(self.categoryList["0"]["id"])
                }, function errorCallback(data, status, headers, config) {

                    $ionicPopup.alert({
                        // title: 'Don\'t eat that!',
                        template: status
                    });
                });
            }
            self.searchProductList = function(id) {
                    console.log(id);

                    $http({
                        method: $filter('ajaxMethod')(),
                        url: backendUrl('product', 'productList')
                    }).then(function successCallback(data, status, headers, config) {
                        self.productList = self.productList.concat(data.data.data.productList);
                        console.log(self.productList)
                        self.showLoadingIcon = false;
                    }, function errorCallback(data, status, headers, config) {
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: status
                        });
                    });
                }
                // 更多商品   loading 图标
            self.moreProduct = function() {

                self.showLoadingIcon = true;
                self.searchProductList();
            }
        }
    ])

    .controller('shopProductDetailController', ['$http', '$scope', '$filter', '$stateParams', '$ionicPopup', '$timeout', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $ionicPopup, $timeout, loadingService, backendUrl) {

            console.log('shopProductDetailController')
            var self = this;

            self.init = function() {
                self.showLoadingBool = {};

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
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: status
                        });
                    });
                }, 500)

            }
        }
    ])

    .controller('shopCartController', ['$http', '$scope', '$filter', 'backendUrl',
      function($http, $scope, $filter, backendUrl) {
        console.log('shopCartController')
        var self = this;
        
        self.init = function() {
          // 注册微信分享朋友和朋友圈
          $scope.root.wxShare();

          // 初始化
          self.loadingShopCartInfo = false;
          self.countTotalPrice();

          //获取 购物车信息
          self.loadShopCartInfo();
        }

        self.plusOne = function(index) {
          self.shopCartList[index].count += 1;
          self.countTotalPrice();
        }

        self.delete = function(index) {
          self.shopCartList.splice(index, 1);
          self.countTotalPrice();
        }

        self.minusOne = function(index) {
          if(self.shopCartList[index].count >= 2){
            self.shopCartList[index].count -= 1;
            self.countTotalPrice();
          }
        }

        self.countTotalPrice = function() {
          self.totalPrice = 0;
          if(self.shopCartList) {
            for (var i = 0; i < self.shopCartList.length; i++) {
              self.totalPrice += self.shopCartList[i].price * self.shopCartList[i].count;
            } 
          }
        }

        self.loadShopCartInfo = function() {
          self.loadingShopCartInfo = true;
          $http({
              method: $filter('ajaxMethod')(),
              url: backendUrl('shopCart','shopCartList')
            }).then(function successCallback(data, status, headers, config) {
                self.loadingShopCartInfo = false;
                self.shopCartList = data.data.data.list;
                self.countTotalPrice();
              }, function errorCallback(data, status, headers, config) {
                self.loadingShopCartInfo = false;
                $ionicPopup.alert({
                     // title: 'Don\'t eat that!',
                     template: ($filter('translate')('serverError') + status)
                });
              });
        }

        
      }
    ])
    
    .controller('shopOrderConfirmController', ['$http', '$scope', '$filter', '$stateParams', '$ionicPopup', '$timeout', 'loadingService', 'backendUrl',
        function($http, $scope, $filter, $stateParams, $ionicPopup, $timeout, loadingService, backendUrl) {
            console.log('shopOrderConfirmController')
            var self = this;

            self.init = function() {
                self.showLoadingBool = {};

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
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool);
                    }, function errorCallback(data, status, headers, config) {
                        self.showLoadingBool.searchBool = true;
                        loadingService(self.showLoadingBool)
                        $ionicPopup.alert({
                            // title: 'Don\'t eat that!',
                            template: status
                        });
                    });
                }, 500)

            }

        }
    ])

       
      

        
    .controller('shopOrderInfoController', ['$http', '$scope',
        function($http, $scope) {
            console.log('shopOrderInfoController')
            var self = this;

            self.init = function() {
                // 注册微信分享朋友和朋友圈
                $scope.root.wxShare();
            }
        }
    ])


})();
