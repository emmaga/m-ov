'use strict';

(function() {
  var app = angular.module('app.directive', [ ])

  .directive("cityPicker", function () {
    return {
      restrict: 'EA',
      templateUrl: 'pages/drt/city-picker.html',
      replace: true
    }
  })

  .controller('cityPickerController', ['$scope', '$ionicScrollDelegate', 
    function($scope, $ionicScrollDelegate) {
      console.log('cityPickerController')
      var self = this;

      self.init = function(cityListContent, callback) {
        self.callback = callback;
        self.cityListContent = cityListContent;
      }

      self.scrollTo = function(pos) {
        var offset = document.getElementById(pos).offsetTop;
        /*console.log(offset);
        document.getElementById('cp-city-list').scrollTop = offset;*/
        $ionicScrollDelegate.$getByHandle('cityInitial').scrollTo(0, offset, true);
      }

  }])

  // ===============================================================

  .directive("travelDatePicker", function () {
    return {
      restrict: 'EA',
      templateUrl: 'pages/drt/travel-date-picker.html',
      replace: true
    }
  })

  .controller('travelDatePickerController', ['$scope', '$filter',
    function($scope, $filter) {
      console.log('travelDatePickerController')
      var self = this;
      // st: 开始日期, et: 结束日期; 均为时间戳
      self.init = function(checkin, checkout, st, et, callback) {

        // 入住，离店 多语言设置
        var s = document.createElement('style');
        s.innerText =  '.tdp-d-checkin:after{content:\''+$filter('translate')('checkIn')+'\'}';
        s.innerText += '.tdp-d-checkout:after{content:\''+$filter('translate')('checkOut')+'\'}';
        document.body.appendChild(s);

        self.st = st ? st : new Date().getTime();
        //可选日期结束日期默认:今天后的半年
        self.et = et ? et: self.st + (30*3+31*3)*24*60*60*1000;
        self.checkin = checkin;
        self.checkout = checkout;
        self.dates = [];
        self.callback = callback;
        
        self.setDateData();

        //set msg
        self.msgShow = true;
        self.msg = $filter('translate')('plsSelACheckInDate');
      }

      self.setDateData = function() {

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

        // 月份数量＝结束日期的所在月份总数－开始..＋1
        var mC = getMonCnt(self.et) - getMonCnt(self.st) + 1;
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
      };

      // 日期点击
      self.clickDate = function(date) {
        /*// 如果当前点击的日期为不可点击的日期 || 当前点击的和当前已选中的所有日期为同一个日期: 不理睬
        if(self.dDisable(date) || sameDay(date, self.checkin) || sameDay(date, self.checkout)) {return false;}*/
        // 如果当前点击的日期为不可点击的日期 不理睬
        if(self.dDisable(date)) {return false;}
        // 如果checkin和checkout都不为空
        if(self.checkin && self.checkout) {
          // 将当前点击的日期设为checkin（把checkout清空）
          self.checkin = date;
          self.checkout = null;

          //set msg
          self.msgShow = true;
          self.msg = $filter('translate')('plsSelACheckOutDate');
        }
        // 如果checkin不为空 && checkout为空
        else if(self.checkin && !self.checkout) {
          // 如果当前点击的日期 等于 checkin 不理睬
          if(sameDay(date, self.checkin)) {
            return;
          }
          // 如果当前点击的日期 早于 checkin
          else if(date < self.checkin) {
            // 把当前点击的日期 覆盖掉 现有checkin
            self.checkin = date;
          }
          // 否则
          else {
            // 把当前点击的日期设为checkout
            self.checkout = date;

            //set msg
            self.msgShow = false;
            self.msg = '';

            // 返回选中的2个日期，关闭日期选择器
            self.callback(self.checkin, self.checkout);
          }
        }
        // 如果checkin和checkout都为空，暂时用不到 
        else{
          self.checkin = date;
        }
      }

      // 如果d比今天早，就返回true，反之返回false
      // 超出有效日期范围的要返回true，同上
      self.dDisable = function(d) {
        var t = new Date().getTime();
        if (getDayStamp(t) > getDayStamp(d) || getDayStamp(d) < getDayStamp(self.st) || getDayStamp(d) > getDayStamp(self.et)) {
          return true;
        }
        else {
          return false;
        }
      }

      // 返回是否是checkin和checkout之间的日期
      self.isDuring = function(d) {
        var ret = false;
        if(self.checkin && self.checkout) {
          if (d > self.checkin && d < self.checkout) {
            ret = true;
          }
        }
        return ret;
      }

      // 返回是否是checkin day
      self.isCheckin = function(d) {
        if(self.checkin && sameDay(self.checkin, d)){
          return true;
        }
        else {
          return false;
        }
      }

      // 返回是否是checkout day
      self.isCheckout = function(d) {
        if(self.checkout && sameDay(self.checkout, d)){
          return true;
        }
        else {
          return false;
        }
      }

      // 判断是否为同一天
      // a,b 时间戳
      function sameDay(a, b) {
        var x = new Date(a);
        var y = new Date(b);
        if(x.getFullYear() === y.getFullYear() && x.getMonth() == y.getMonth() && x.getDate() == y.getDate()) {
          return true;
        }
        else{
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

  }])

  // 商品页面滚动
  // 太他娘的打击了
  .directive('scrolly', ['$document', function ($document,$window) {
      return {
          restrict: 'EA',
          link: function (scope, element, attrs) {
              var raw = element[0];
              console.log(raw)
              console.log('loading directive');
              // $document.bind('scroll', function () {
              //     console.log(raw)
              //     console.log('in scroll');
              //     // console.log(document.body.scrollTop)
              //     // console.log(document.body.clientHeight)
              //     // console.log(document.body.scrollHeight)
              //     console.log(raw.scrollTop)
              //     console.log(raw.offsetHeight)
              //     console.log(raw.scrollHeight)
                  
              //     // console.log(raw.scrollTop + raw.offsetHeight);
              //     // console.log(raw.scrollHeight);
              //     if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) { //at the bottom
              //         // scope.$apply(attrs.scrolly);
              //         console.log('test');
              //     }
              // })
              
              // angular.element(window).bind('scroll', function () {
              //           console.log((window.innerHeight + window.scrollY) >= document.body.offsetHeight)
              //         if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
              //             scope.$apply(attrs.scrolly);
              //         }
              // });
          }
      }
  }])
})();