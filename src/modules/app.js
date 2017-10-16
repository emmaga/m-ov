'use strict';

(function () {
    var app = angular.module('m-ov', [
        'ionic',
        'ui.router',
        'app.filters',
        'app.controllers',
        'app.directive',
        'app.services',
        'ngCookies',
        'pascalprecht.translate'
    ])

        .config(['$translateProvider', function ($translateProvider) {
            // var lang = navigator.language.indexOf('zh') > -1 ? 'zh-CN' : 'en-US';
            var lang = 'zh-CN';
            $translateProvider.preferredLanguage(lang);
            $translateProvider.useStaticFilesLoader({
                prefix: 'i18n/',
                suffix: '.json'
            });
        }])

        .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/index');
            $stateProvider
                .state('index', {
                    url: '/index',
                    templateUrl: 'pages/bookRoomList.html'
                })
                .state('bookRoomList', {
                    url: '/bookRoomList/?hotelId&checkIn&checkOut&ticketCate',
                    templateUrl: 'pages/bookRoomList.html'
                })
                .state('hotelInfo', {
                    url: '/hotelInfo/?hotelId',
                    templateUrl: 'pages/hotelInfo.html'
                })
                .state('bookHotelList', {
                    url: '/bookHotelList',
                    templateUrl: 'pages/bookHotelList.html'
                })
                .state('roomInfo', {
                    url: '/roomInfo/?roomId&hotelId&checkIn&checkOut&addPriceId',
                    templateUrl: 'pages/roomInfo.html'
                })
                .state('bookOrderInfo', {
                    url: '/bookOrderInfo/?orderId',
                    templateUrl: 'pages/bookOrderInfo.html'
                })
                .state('memberHome', {
                    url: '/memberHome',
                    templateUrl: 'pages/memberHome.html'
                })
                .state('memberInfoEdit', {
                    url: '/memberInfoEdit/?memberId',
                    templateUrl: 'pages/memberInfoEdit.html'
                })
                .state('roomOrderList', {
                    url: '/roomOrderList',
                    templateUrl: 'pages/roomOrderList.html'
                })
                .state('shopOrderList', {
                    url: '/shopOrderList',
                    templateUrl: 'pages/shopOrderList.html'
                })
                .state('shopHome', {
                    url: '/shopHome',
                    templateUrl: 'pages/shopHome.html'
                })
                .state('shopHome2', {
                    url: '/shopHome/?shopId',
                    templateUrl: 'pages/shopHome.html'
                })
                .state('shopProductDetail', {
                    url: '/shopProductDetail/?hotelId&shopId&productId&hotelName',
                    templateUrl: 'pages/shopProductDetail.html'
                })
                .state('shopCart', {
                    url: '/shopCart/?shopId',
                    templateUrl: 'pages/shopCart.html'
                })
                .state('shopOrderInfo', {
                    url: '/shopOrderInfo?orderId',
                    templateUrl: 'pages/shopOrderInfo.html'
                })
                .state('cardAttentionGiftBag', {
                    url: '/cardAttentionGiftBag',
                    templateUrl: 'pages/cardAttentionGiftBag.html'
                })
                .state('cardGift', {
                    url: '/cardGift',
                    templateUrl: 'pages/cardGift.html'
                })
                .state('wxMemberCard', {
                    url: '/wxMemberCard',
                    templateUrl: 'pages/wxMemberCard.html'
                })
                .state('presell', {
                    url: '/presell',
                    templateUrl: 'pages/presell.html'
                })
                .state('advanceOrderList', {
                    url: '/advanceOrderList',
                    templateUrl: 'pages/advanceOrderList.html'
                })
                .state('advanceOrderInfo', {
                    url: '/advanceOrderInfo?orderId',
                    templateUrl: 'pages/advanceOrderInfo.html'
                })
                .state('presellgoods', {
                    url: '/presellgoods',
                    templateUrl: 'pages/presellGoods/presellGoods.html'
                })
                .state('presellOrderList', {
                    url: '/presellOrderList',
                    templateUrl: 'pages/presellGoods/advanceOrderList.html'
                })
                .state('presellOrderInfo', {
                    url: '/presellOrderInfo?orderId',
                    templateUrl: 'pages/presellGoods/advanceOrderInfo.html'
                })
                .state('ticketCategory', {
                    url: '/ticketCategory',
                    templateUrl: 'pages/ticketCategory.html'
                })
        }])

        // 每次页面跳转完成时触发
        .run(['$rootScope', '$timeout', function ($rootScope, $timeout) {

            $rootScope.$on("$locationChangeSuccess", function () {
                // 滚动到页面顶部
                document.body.scrollTop = 0;

                /*// 点透
                setTimeout(function(){
                  document.getElementById('pageCover').style.display='none';
                },300)*/
            })
        }])

        /*// 每次页面开始跳转时触发
        .run(['$rootScope', '$timeout', function($rootScope) {
          $rootScope.$on("$viewContentLoading", function(){
            // 点透
            document.getElementById('pageCover').style.display='block';
          })
        }])*/


        .constant('BACKEND_CONFIG', {
            serverUrl: 'http://openvoddev.cleartv.cn/backend_wx/v1/',
            // serverUrl     : 'http://openvod.cleartv.cn/backend_wx/v1/',
            testUrl: 'api/',
            testExtesion: '.json',
            test: false//,
            //mapUrl        : "http://openvod.cleartv.cn/map/baidumap.html"
        })

        .constant('PAY_CONFIG', {
            test: true,
            testConfig: {
                // jumpUrl: 'http://openvoddev.cleartv.cn/wx',
                jumpUrl: 'http://openvoddev.cleartv.cn/wx',
                compID: 'wxc6e8a3fab4f25a4f'
            },
            onlineConfig: {
                jumpUrl: 'http://openvod.cleartv.cn/wx',
                compID: 'wx5bfdc86d4b702418'
            }
        })

        .constant('PARAM', {
            cardAttentionGiftKW: '关注',
            cardAcceptCategoryKW_room: '订房',
            customize: {
                luan: {
                    hotelsGuideUrl: "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx6794da9bbcb25912&redirect_uri=http://openvod.cleartv.cn/wx/index.html&response_type=code&scope=snsapi_base&state=31&component_appid=wx5bfdc86d4b702418#wechat_redirect"
                },
                nanqinghuameida: {
                    hotelsGuideUrl: "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxa411409f3b573dfe&redirect_uri=http://openvod.cleartv.cn/wx/index.html&response_type=code&scope=snsapi_base&state=29&component_appid=wx5bfdc86d4b702418#wechat_redirect"
                }
            }
        })
})();