'use strict';

(function() {
  var app = angular.module('app.services', [ ])
  
  .service('backendUrl', ['BACKEND_CONFIG', function(BACKEND_CONFIG) {

    /* 调用接口，本地和服务器的接口切换，方便调试
     * @url 接口名称
     * @testType 测试接口时，有些接口只有服务端有效，此时设置为：server，其他设置为local，默认为local
     */

    return function(url, testUrl, testType) {
      if(BACKEND_CONFIG.test) {
        if(testType == 'server') {
          return BACKEND_CONFIG.serverUrl + url;
        }
        else {
          return BACKEND_CONFIG.testUrl + testUrl + BACKEND_CONFIG.testExtesion;
        }
      }
      else {
        return BACKEND_CONFIG.serverUrl + url;
      }
    };
  }])
  // 页面加载数据时 遮罩层
  .service('loadingService',['$ionicLoading',function($ionicLoading){
    return function(obj){
        var flag = 0, num = 0;
        for (var key in obj) {
          ++flag;
          if (obj[key] == true){
          ++num;
          }
        }
        if (flag == num) {
          $ionicLoading.hide();
        } else {
          $ionicLoading.show({
               template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
             })  
        }
    }
    
  }])
  .factory('util',['$cookies', function($cookies){
    // 时间戳 去掉 时分秒
    function getDayStamp(d) {
         // 时间戳字符串字符串的先转化为数字
        var d = d-0;
        var d = new Date(d);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return d.getTime();
      }
    // "2016-11-22" 去掉 时分秒
    function getDayStamps(d) {
        var d = new Date(d);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return d.getTime();
      }  
    return{
      // 住酒店天数
      'countDay': function(ms1,ms2){
        return (getDayStamp(ms2)-getDayStamp(ms1))/(24*60*60*1000)
      },

      'countDays': function(ms1,ms2){
        return (getDayStamps(ms2)-getDayStamps(ms1))/(24*60*60*1000)
      },
      /**
       * 设置变量
       */
      'setParams': function (paramsName, value) {
          $cookies.put(paramsName, JSON.stringify(value))
      },
      /**
       * 获取变量
       * @param paramsName
       * @returns {*}
       */
      'getParams': function (paramsName) {
          if($cookies.get(paramsName)) {
              return JSON.parse($cookies.get(paramsName));
          }
          else {
              return false;
          }
      }
      // 变量：
      // shopinfo
      // {
      //   "hotelName": "xx",
      //   "hotelId": "xx",
      //   "shopId": "xx",
      // }
      // appid
      // userid
      // clear_session
      // refresh_token
      /* wxUserInfo
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

      * projectInfo
      {
        "projectName": "项目-酒店名字",
        "projectImgSrc": "api/img/doodle.html"
      }
       memberInfo 

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
      
      

    }
  }])
  
  // 设置微信title
  .factory('setTitle',function(){
    return function(title){
        var body = document.body;
        document.title = title; 
        var $iframe = document.createElement('iframe');
        $iframe.src = '/favicon.ico';

        $iframe.style.display = 'none';
        $iframe.onload = function(){
          setTimeout(function(){
            $iframe.onload = null;
            body.removeChild($iframe);
          }, 0);
        };

        body.appendChild($iframe);
    }
  })

})();