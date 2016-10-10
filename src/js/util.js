/*
  var qString = $window.location.search.substring(1);
  var qParts = qString.parseQuerystring();
  var q1 = qParts.q1;
*/
String.prototype.parseQuerystring = function () {
  var query = {};
  var a = this.split('&');
  for (var i in a)
  {
      var b = a[i].split('=');
      query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
  }
  return query;
}