'use strict';

(function() {
  var app = angular.module('app.filters', [])

  .filter("xx", ['', function() {
    return function(xx) {
        return xx;
    };
  }]);

})();