'use strict';

(function() {
  var app = angular.module('app.services', [ ])
  
  .service('backendUrl', ['BACKEND_CONFIG', function(BACKEND_CONFIG) {

    /* 调用接口，本地和服务器的接口切换，方便调试
     * @url 接口名称
     * @testType 测试接口时，有些接口只有服务端有效，此时设置为：server，其他设置为local，默认为local
     */

    return function(url, testUrl, testType) {
      if(BACKEND_CONFIG.test) {
        if(testType == 'server') {
          return BACKEND_CONFIG.serverUrl + url;
        }
        else {
          return BACKEND_CONFIG.testUrl + testUrl + BACKEND_CONFIG.testExtesion;
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
               template: '<ion-spinner icon="dots" class="mod-spinner-page"></ion-spinner>'
             })  
        }
    }
    
  }])
  .factory('util',['$cookies', function($cookies){
    // 时间戳 去掉 时分秒
    function getDayStamp(d) {
         // 时间戳字符串字符串的先转化为数字
        var d = d-0;
        var d = new Date(d);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return d.getTime();
      }
    // "2016-11-22" 去掉 时分秒
    function getDayStamps(d) {
        var d = new Date(d);
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return d.getTime();
      }  

    return{
      // 住酒店天数
      'countDay': function(ms1,ms2){
        return (getDayStamp(ms2)-getDayStamp(ms1))/(24*60*60*1000)
      },

      'countDays': function(ms1,ms2){
        return (getDayStamps(ms2)-getDayStamps(ms1))/(24*60*60*1000)
      },
      /**
       * 根据len截取str，超出部分...,否则返回原值，支持中英文
       */
      'cutStr': function (str, len) {  
          var str_length = 0;  
          var str_len = 0;  
          var str_cut = new String();  
          str_len = str.length;  
          for (var i = 0; i < str_len; i++) {  
              var a = str.charAt(i);  
              str_length++;  
              if (escape(a).length > 4) {  
                  //中文字符的长度经编码之后大于4
                  str_length++;  
              }  
              str_cut = str_cut.concat(a);  
              if (str_length >= len) {  
                  str_cut = str_cut.concat("...");  
                  return str_cut;  
              }  
          }  
          //如果给定字符串小于指定长度，则返回源字符串；
          if (str_length < len) {  
              return str;  
          }  
      },
      /**
       * 设置变量
       */
      'setParams': function (paramsName, value) {
          $cookies.put(paramsName, JSON.stringify(value))
      },
      /**
       * 获取随机数
       */
      'randomString': function (len) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var maxPos = $chars.length;
        var pwd = '';
        for (var i = 0; i < len; i++) {
          pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
      },
      /**
       * 获取变量
       * @param paramsName
       * @returns {*}
       */
      'getParams': function (paramsName) {
          if($cookies.get(paramsName)) {
              return JSON.parse($cookies.get(paramsName));
          }
          else {
              return false;
          }
      }
      // 变量：
      // shopinfo
      // {
      //   "hotelName": "xx",
      //   "hotelId": "xx",
      //   "shopId": "xx",
      // }
      // state
      // appid
      // userid
      // clear_session
      // refresh_token
      // access_token
      /* wxUserInfo
      {    
       "openid":" OPENID",  
       "nickname": NICKNAME,   
       "sex":"1",   
       "province":"PROVINCE"   
       "city":"CITY",   
       "country":"COUNTRY",    
       "headimgurl":    "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ
      4eMsv84eavHiaiceqxibJxCfHe/46",  
      "privilege":[ "PRIVILEGE1" "PRIVILEGE2"     ],    
       "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL" 
      } 

      * projectInfo
      {
        "projectName": "项目-酒店名字",
        "projectImgSrc": "api/img/doodle.html"
      }
       memberInfo 

       {
         "member": {
             "memberId": "123321123312",
             "memberLevel": {
               "name":"微信会员",
               "class":"class1"
             },
             "score": "100",
             "realName":"LiSi",
             "mobile": "13783476981",
             "idCardNumber": "410181999200000000",
             "birthday": "100"
          }
       }
      */
    }
  }])
  
  // 设置微信title
  .factory('setTitle',function(){
    return function(title){
        var body = document.body;
        document.title = title; 
        var $iframe = document.createElement('iframe');
        $iframe.src = '/favicon.ico';

        $iframe.style.display = 'none';
        $iframe.onload = function(){
          setTimeout(function(){
            $iframe.onload = null;
            body.removeChild($iframe);
          }, 0);
        };

        body.appendChild($iframe);
    }
  })

  // SHA1 加密
  .factory('SHA1', function () {
    /**
    *
    * Secure Hash Algorithm (SHA1)
    * http://www.webtoolkit.info/
    *
    **/
    return function (msg) {
      function rotate_left(n,s) {
        var t4 = ( n<<s ) | (n>>>(32-s));
        return t4;
      };
      function lsb_hex(val) {
        var str="";
        var i;
        var vh;
        var vl;
        for( i=0; i<=6; i+=2 ) {
          vh = (val>>>(i*4+4))&0x0f;
          vl = (val>>>(i*4))&0x0f;
          str += vh.toString(16) + vl.toString(16);
        }
        return str;
      };
      function cvt_hex(val) {
        var str="";
        var i;
        var v;
        for( i=7; i>=0; i-- ) {
          v = (val>>>(i*4))&0x0f;
          str += v.toString(16);
        }
        return str;
      };
      function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
          var c = string.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          }
          else if((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
          }
        }
        return utftext;
      };
      var blockstart;
      var i, j;
      var W = new Array(80);
      var H0 = 0x67452301;
      var H1 = 0xEFCDAB89;
      var H2 = 0x98BADCFE;
      var H3 = 0x10325476;
      var H4 = 0xC3D2E1F0;
      var A, B, C, D, E;
      var temp;
      msg = Utf8Encode(msg);
      var msg_len = msg.length;
      var word_array = new Array();
      for( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
      }
      switch( msg_len % 4 ) {
        case 0:
          i = 0x080000000;
        break;
        case 1:
          i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
        break;
        case 2:
          i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
        break;
        case 3:
          i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8  | 0x80;
        break;
      }
      word_array.push( i );
      while( (word_array.length % 16) != 14 ) word_array.push( 0 );
      word_array.push( msg_len>>>29 );
      word_array.push( (msg_len<<3)&0x0ffffffff );
      for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;
        for( i= 0; i<=19; i++ ) {
          temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }
        for( i=20; i<=39; i++ ) {
          temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }
        for( i=40; i<=59; i++ ) {
          temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }
        for( i=60; i<=79; i++ ) {
          temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }
        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
      }
      var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
      return temp.toLowerCase();
    }
  })
  
  // 筛选微信卡券
  // card_id_list: ["p3y-kwzWYkcYie4CUqHd8T7l3IZM", "p3y-kw2wO-22D6NzdTi4JDf-3qs0"]
  // filter_word: {abstract: 'xx'}
  // .service('filter_wxcard',['$http',function($http){
  //   return function(card_id_list, filter_word){
        
  //   }
    
  // }])

})();