'use strict';

(function() {
  var app = angular.module('app.filters', [])

  .filter("ajaxMethod", ['BACKEND_CONFIG', function(BACKEND_CONFIG) {
    return function() {
        var method = BACKEND_CONFIG.test ? 'GET' : 'POST';
        return method;
    };
  }])
  .filter("dayNumbers", function() {
    return function(seconds) {
       return seconds/(24*60*60*1000)
    };
  })

})();