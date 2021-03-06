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
        if(fen) {
          var s = fen + '';
          if(s.length == 1) { s = '00' + s; }
          else if(s.length == 2) { s = '0' + s; }
          var s1 = s.slice(0, -2);
          var s2 = s.slice(-2);
          return s1 + '.' + s2;
        }
        else {
          return '0.00';
        }

    };
  })

  .filter("timeToDHMS", function() {
    return function(t) {
      var day = Math.floor(t / 24 / 60 / 60 / 1000)
      var hour = Math.floor((t-day*24*3600*1000) /60/60/1000)
      var min = Math.floor((t-day*24*3600*1000-hour*3600*1000)/60/1000)
      var s = Math.floor((t-day*24*3600*1000-hour*3600*1000-min*60*1000)/1000)
      return ('<i>'+day+'</i>' + '天' + '<i>'+hour+'</i>' + '小时' +'<i>'+ min+'</i>' + '分' +'<i>'+ s+'</i>' + '秒')
    };
  })

  .filter("orderStatus",['$filter', function($filter){
    return function(orderStatus, deliverWay){
      console.log(deliverWay)
      var flag;
      switch (orderStatus){
         case 'WAITPAY':
             flag = $filter('translate')('WAITPAY');
             break;
         case 'WAITAPPROVAL':
             flag = $filter('translate')('WAITAPPROVAL');
             break;

         case 'ACCEPT':
             if(deliverWay === 'bySelf') {
                flag = "请前往酒店自提";
             }
             else {
                flag = $filter('translate')('ACCEPT');
             }
             break;
         case 'DELIVERING':
             if(deliverWay === 'bySelf') {
                flag = "请前往酒店自提";
             }
             else {
                flag = $filter('translate')('DELIVERING');
             }
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

  .filter("orderStatus2",['$filter', function($filter){
      return function(orderStatus){
          var flag;
          switch (orderStatus){
              case 'WAITPAY':
                  flag = '待支付';
                  break;
              case 'ACCEPT':
                  flag = '已支付';
                  break;
              case 'CANCELED':
                  flag = '已取消';
                  break;
              case 'DELIVERING':
                  flag = '已发货';
                  break;
              case 'COMPLETED':
                  flag = '已使用';
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
         case 'homeDelivery':
             flag = $filter('translate')('homeDelivery');
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

  .filter('unsafe', ['$sce', function($sce) {
      return $sce.trustAsHtml;
  }])
})();