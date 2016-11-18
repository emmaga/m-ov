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
  .factory('util',function(){
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
      }
      
      

    }
  })
})();