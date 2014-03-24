var db = require(__dirname + '/../db');

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
        var timeTill = auction.trueEnd - currentTime;

        // for auctions in the future, build queue to notify winners
        if (timeTill > 0) {
          // account for setTimeout not being able to handle more than 24 days
          setDaysTimeout(auctionNotification, timeTill, auction);
        }
      });
      callback(null, true);
    }
  });
};

function setDaysTimeout(callback, timeTill, parameters) {
  // 86400 seconds in a day
  var msInDay = 86400*1000;
  var daysTill = Math.floor(timeTill / msInDay);
  var dayCount = 0;

  // if within this day
  if (daysTill === 0) {
    setTimeout(auctionNotification, timeTill, [parameters]);
  }
  else  {
    // set interval that counts the days
    var timer = setInterval(function() {
      dayCount++;  // a day has passed
      timeTill = timeTill - msInDay;

      if(dayCount === daysTill) {
         clearInterval(timer);
         setTimeout(auctionNotification, timeTill, [parameters]);
      }
    },msInDay);
  }
}

function auctionNotification(auction) {
  console.log("In AuctionNotification");
  console.log(auction);
}