var db = require(__dirname + '/../db');
var timer = require('../events/event-timer');

module.exports = function(callback) {
  // get all auctions in full (with trueEnd property)
  db.fullAuctions(function(err, auctions) {
    if (err) { console.log(err); callback(null, false); }
    else {
      // for each auction
      auctions.forEach(function(auction) {
        timer.addAuction(auction);
      });
      callback(null, true);
    }
  });
};
