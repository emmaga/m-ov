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
  
  .filter("orderStatusToChinese",function(){
    return function(orderStatus){
      var flag;
      switch (orderStatus){
         case 'WAITPAY':
             flag = '待付款';
             break;
         case 'WAITAPPROVAL':
             flag = '审核中';
             break;

         case 'ACCEPT':
             flag = '订单接收';
             break;
         case 'DELIVERING':
             flag = '订单配送';
             break;
         case 'COMPLETED':
             flag = '订单完成';
             break;
         case 'CANCEL_REFUNDING':
             flag = '订单取消退款中';
             break;
         case 'SELLER_CANCEL_REFUNDING':
             flag = '订单商家取消退款中';
             break;
         case 'CANCELED':
             flag = '订单取消';
             break;
      }
      return flag;
    }
  })

})();