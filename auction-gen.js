var _ = require('underscore');
var Charlatan = require('charlatan');
var auctionConfig = require('./auction_config.js');
Charlatan.setLocale('en-us');

// name generation
var names = [];
for (var i = 0; i < 10; i++) {
  var name = Charlatan.Name.firstName().toLowerCase();
  names.push(name);
}

console.log(JSON.stringify(names));
var bidInterval = setInterval(function() {
  var bid = {
    name: names[_.random(0, 9)],
    slots: _.random(1, 7),
    btc_per_slot: _.random(10, 100) / 100
  }
  console.log('Bid: ' + JSON.stringify(bid));
}, 1000);
