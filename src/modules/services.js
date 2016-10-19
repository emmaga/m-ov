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
  }]);


})();