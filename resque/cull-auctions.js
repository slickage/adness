var db = require(__dirname + '/../db');
var NR = require('node-resque');
var jobs = require('./jobs');
var connectionDetails = require('../resque/redis-store');
var queue = new NR.queue({connection: connectionDetails}, jobs);


module.exports = function(callback) {
  // get all auctions in full (with trueEnd property)
  db.fullAuctions(function(err, auctions) {
    if (err) { console.log(err); callback(null, false); }
    else {
      // get current time
      var currentTime = new Date().getTime();

      // for each auction
      auctions.forEach(function(auction) {
        // find time to true end
        console.log("Auction TrueEnd: " + auction.trueEnd);
        console.log("CurrentTime: " + currentTime);
        var timeTill = auction.trueEnd - currentTime;

        // for auctions in the future, build queue to notify winners
        if (timeTill > 0) {
          console.log("Queuing: " + auction.id);
          console.log("TimeTill: " + timeTill);
          queue.enqueueIn(timeTill, 'auction', 'notify-winners', [auction]);
        }
      });
      callback(null, true);
    }
  });
};