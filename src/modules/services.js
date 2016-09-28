'use strict';

(function() {
  var app = angular.module('app.services', [ ])
  
  .service('backendUrl', ['BACKEND_CONFIG', function(BACKEND_CONFIG) {
    return function(url) {
      return BACKEND_CONFIG.baseUrl + url + BACKEND_CONFIG.extesion;
    };
  }]);


})();