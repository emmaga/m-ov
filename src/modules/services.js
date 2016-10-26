'use strict';

(function() {
  var app = angular.module('app.services', [ ])
  
  .service('backendUrl', ['BACKEND_CONFIG', function(BACKEND_CONFIG) {

    /* 调用接口，本地和服务器的接口切换，方便调试
     * @url 接口名称
     * @testType 测试接口时，有些接口只有服务端有效，此时设置为：server，其他设置为local，默认为local
     */

    return function(url, testType) {
      if(BACKEND_CONFIG.test) {
        if(testType == 'server') {
          return BACKEND_CONFIG.serverUrl + url;
        }
        else {
          return BACKEND_CONFIG.testUrl + url + BACKEND_CONFIG.testExtesion;
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
               template: 'Loading...'
             })  
        }
    }
    
  }])
})();