var auctionNotification = require('./auction-close');

var timedEvents = {};

module.exports = {
  addAuction: function(auction) {
    // find time to true end
    var currentTime = new Date().getTime();
    var timeTill = auction.trueEnd - currentTime;

    // for auctions in the future, build queue to notify winners
    if (timeTill > 0) {
      // account for setTimeout not being able to handle more than 24 days
      setDaysTimeout(auctionNotification, timeTill, auction);
      console.log("Auction " + auction._id + " added to event: auction close.");
    }
  },
  updateAuction: function(auction) {
    console.log("Updating Auction Close Event");

    // --- delete the current timer
    var timer = timedEvents[auction._id];
    clearTimeout(timer);
    clearInterval(timer);

    // --- add a new one
    var currentTime = new Date().getTime();
    var timeTill = auction.trueEnd - currentTime;

    // for auctions in the future, build queue to notify winners
    if (timeTill > 0) {
      // account for setTimeout not being able to handle more than 24 days
      setDaysTimeout(auctionNotification, timeTill, auction);
    }
  },
  deleteAuction: function(auction) {
    console.log('Deleting Auction Close Event: ' + auction._id);
    var timer = timedEvents[auction._id];
    clearTimeout(timer);
    clearInterval(timer);
    delete timedEvents[auction._id];
  }
};


function clearTimer(auctionId) {
  delete timedEvents[auctionId];
}

function setDaysTimeout(callback, timeTill, auction) {
  // 86400 seconds in a day
  var msInDay = 86400*1000;
  var daysTill = Math.floor(timeTill / msInDay);
  var dayCount = 0;

  var timer;

  // if within this day
  if (daysTill === 0) {
    timer = setTimeout(callback, timeTill, auction);
    setTimeout(clearTimer, timeTill + 100, auction._id);
  }
  else  {
    // set interval that counts the days
    timer = setInterval(function() {
      dayCount++;  // a day has passed
      timeTill = timeTill - msInDay;

      if(dayCount === daysTill) {
         clearInterval(timer);
         setTimeout(callback, timeTill, auction);
         setTimeout(clearTimer, timeTill + 100, auction._id);
      }
    },msInDay);
  }

  // save auction timer
  timedEvents[auction._id] = timer;
}