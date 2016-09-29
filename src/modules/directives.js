'use strict';

(function() {
  var app = angular.module('app.directive', [ ])

  .directive("travelDatePicker", function () {
    return {
      restrict: 'EA',
      templateUrl: 'pages/drt/travel-date-picker.html',
      replace: true,
      link: function(scope, element, attrs){
        scope.tdp.init(1474992000000, 1512854400000)
      }
    }
  })

  .controller('travelDatePickerController', 
    function() {
      var self = this;
      self.st, self.et;

      self.dates = [];

      // st: 开始日期, et: 结束日期; 均为时间戳
      self.init = function(st, et) {
        self.st = st;
        self.et = et;

        // 月份数量＝结束日期的所在月份总数－开始..＋1
        var mC = getMonCnt(et) - getMonCnt(st) + 1;
        var st = new Date(self.st);
        
        for(var i = 0; i < mC; i++) {

          // 设置年月，例如：2015年5月
          self.dates[i] = {};
          self.dates[i].month = st.getTime();

          // 设置日期，设置1个月的星期，位置要按星期日开始的来排
          self.dates[i].weeks = [];

          var last = new Date(st.getFullYear(), st.getMonth() + 1, 0); // 获取当前月最后一天时间    
          var y = last.getFullYear();    
          var m = last.getMonth() + 1;
          var wC = weekCnt(y, m);
          
          var d = new Date(st.getFullYear(), st.getMonth(), 1);
          var startNullCnt = d.getDay();

          for(var k = 0; k < wC; k++) {

            self.dates[i].weeks[k] = [];

            for(var j = 0; j < 7; j++) {

              // 1号之前的日期
              if(startNullCnt > 0) {
                self.dates[i].weeks[k][j] = null;
                startNullCnt --;
              }
              // 月底日期之后的日期
              else if(d > last) {
                self.dates[i].weeks[k][j] = null;
              }
              else {
                self.dates[i].weeks[k][j] = d.getTime();
                d.setTime(new Date(addDs(d.getTime(), 1)).getTime());
              } 
            }
          }
          

          // 递增一个月
          addMon(st);
        }

        /*self.dates = [
        {
          "month" : 1474813026000,
          "weeks" : [
            [null, null, 1472739426000, 1472825826000, 1472912226000, 1472998626000, 1473085026000],
            [1473171426000, 1473257826000, 1473344226000, 1473430626000, 1473517026000, 1473603426000, 1473689826000],
            [1473776226000, 1473862626000, 1473949026000, 1474035426000, 1474121826000, 1474208226000, 1474294626000], 
            [1474381026000, 1474467426000, 1474553826000, 1474640226000, 1474726626000, 1474813026000, 1474899426000], 
            [1474985826000, 1475072226000, 1475158626000, 1475245026000, null, null, null]
          ]
        }
      ]*/
      }

      // 如果d比今天早，就返回true，反之返回false
      // todo，超出有效日期范围的要返回true，同上
      self.dDisable = function(d) {
        var t = new Date().getTime();
        if( getDayStamp(t) > getDayStamp(d) || getDayStamp(d) < getDayStamp(self.st) || getDayStamp(d) > getDayStamp(self.et)) {
          return true;
        }
        else {
          return false;
        }
      }

      // 把时间戳去掉时分秒
      function getDayStamp(d) {
        var d = new Date(d);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return d.getTime();
      }
      
      // 获取一个月有几个星期
      // month_number is in the range 1..12
      function weekCnt(year, month_number) {
          var firstOfMonth = new Date(year, month_number-1, 1);
          var lastOfMonth = new Date(year, month_number, 0);
          var used = firstOfMonth.getDay() + lastOfMonth.getDate();
          return Math.ceil( used / 7);
      }

      // 返回＋n天的时间戳
        // d: 时间戳，例如：1475245026000
        function addDs(d, n) {
          var d1 = new Date(d);
          d1.setTime(d + n * 24 * 60 * 60 * 1000);
          return d1.getTime();
        }

      // 递增一个月
      function addMon(d) {
        switch(d.getMonth()+1) {
          // 如果下个月是2月
          case 1:
            // 如果是闰年，＋29天
            if(isLeapYear(d.getFullYear())) {
              d.setTime(addDs(d.getTime(), 29));
            }
            // 如果不是闰年，＋28天
            else {
              d.setTime(addDs(d.getTime(), 28));
            }
            break;  
          // 如果下个月是4，6，9，11，＋30天
          case 3:
          case 5:
          case 8:
          case 10:
            d.setTime(addDs(d.getTime(), 30));
            break;
          // 如果下个月是1，3，5，7，8，10，12，＋31天
          case 12:
          case 2:
          case 4:
          case 6:
          case 7:
          case 9:
          case 11:
            d.setTime(addDs(d.getTime(), 31));
            break;
          default:
            break;
        }
      }

      // 获取该月至1970年的月份总数
      // d: 时间戳，例如：1475245026000
      function getMonCnt(d) {
        d = new Date(d);
        var y = d.getFullYear();
        var m = d.getMonth()+1;
        return (y-1970) * 12 + m;
      }

      // 判断y是否为闰年
      function isLeapYear(y) {
        return (y % 4 == 0) && (y % 400 == 0 || y % 100 != 0);  
      }

  })

})();