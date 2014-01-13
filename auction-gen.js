var _ = require('underscore');
var db = require('riak-js').getClient();
var Charlatan = require('charlatan');
Charlatan.setLocale('en-us');
var names = [];
for (var i = 0; i < 10; i++) {
  var name = Charlatan.Name.firstName().toLowerCase();
  names.push(name);
}

console.log(JSON.stringify(names));
var bidInterval = setInterval(function() {
  console.log('- Bid Interval -');
  var name = names[_.random(0, 9)];
  
}, 1000);


