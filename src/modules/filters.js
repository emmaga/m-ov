'use strict';

(function() {
  var app = angular.module('app.filters', [])

  .filter("ajaxMethod", ['BACKEND_CONFIG', function(BACKEND_CONFIG) {
    return function() {
        var method = BACKEND_CONFIG.test ? 'GET' : 'POST';
        return method;
    };
  }])

  .filter("fenToYuan", function() {
    return function(fen) {
        var s = fen + '';
        if(s.length == 1) { s = '00' + s; }
        else if(s.length == 2) { s = '0' + s; }
        var s1 = s.slice(0, -2);
        var s2 = s.slice(-2);
        return s1 + '.' + s2;
    };
  })

  .filter("orderStatus",['$filter', function($filter){
    return function(orderStatus){
      var flag;
      switch (orderStatus){
         case 'WAITPAY':
             flag = $filter('translate')('WAITPAY');
             break;
         case 'WAITAPPROVAL':
             flag = $filter('translate')('WAITAPPROVAL');
             break;

         case 'ACCEPT':
             flag = $filter('translate')('ACCEPT');
             break;
         case 'DELIVERING':
             flag = $filter('translate')('DELIVERING');
             break;
         case 'COMPLETED':
             flag = $filter('translate')('COMPLETED');
             break;
         // 字段名字 
         case 'REFUNDING':
             flag = $filter('translate')('CANCEL_REFUNDING');
             break;
         case 'SELLER_CANCEL_REFUNDING':
             flag = $filter('translate')('SELLER_CANCEL_REFUNDING');
             break;
         case 'CANCELED':
             flag = $filter('translate')('CANCELED');
             break;
      }
      return flag;
    }
  }])

  .filter("dateTimeToTimestamp", function() {
    return function(dateTime) {
      var d = new Date(dateTime);
      return d.getTime();
    }
  })

  .filter("deliverWay",['$filter', function($filter){
    return function(deliverWay){
      var flag;
      switch (deliverWay){
         case 'express':
             flag = $filter('translate')('express');
             break;
         case 'bySelf':
             flag = $filter('translate')('bySelf');
             break;
      }
      return flag;
    }
  }])


  // ng 的sec 策略
  .filter('trustSrc', ['$sce', function($sce) {
      return function(url) {
          return $sce.trustAsResourceUrl(url);
      };
  }])


})();