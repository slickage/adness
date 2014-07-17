/* jshint node: true */
'use strict';

var auctionEnd = require('./auction-close');
var recalc = require('./recalculation');

var timedEvents = {};

module.exports = {
  addAuction: function(auction) {
    // find time to true end
    var currentTime = new Date().getTime();
    var timeTill = auction.trueEnd - currentTime;

    // for auctions in the future, build queue to notify winners
    if (timeTill > 0) {
      // account for setTimeout not being able to handle more than 24 days
      setDaysTimeout(auctionEnd.notifyAuction, timeTill, auction);
      console.log('Auction ' + auction._id + ' added to event: auction close.');
    }
  },
  updateAuction: function(auction) {
    console.log('Updating Auction Close Event');

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
      setDaysTimeout(auctionEnd.notifyAuction, timeTill, auction);
    }
  },
  deleteAuction: function(auction) {
    console.log('Deleting Auction Close Event: ' + auction._id);
    var timer = timedEvents[auction._id];
    clearTimeout(timer);
    clearInterval(timer);
    delete timedEvents[auction._id];
  },
  addRecalculation: function(recalculation) {
    // find time to true end
    var currentTime = new Date().getTime();
    var timeTill = recalculation.expiration - currentTime;

    // for auctions in the future, build queue to notify winners
    if (timeTill > 0) {
      // account for setTimeout not being able to handle more than 24 days
      setDaysTimeout(recalc.recalculate, timeTill, recalculation);
      console.log('Recalc: ' + recalculation._id + ' on round: ' + recalculation.round + ' scheduled for ' + timeTill);
    }
  },
  updateRecalculation: function(recalculation) {
    console.log('Updating Recalculation: ' + recalculation._id);

    // --- delete the current timer
    var timer = timedEvents[recalculation._id];
    clearTimeout(timer);
    clearInterval(timer);

    // --- add a new one
    var currentTime = new Date().getTime();
    var timeTill = recalculation.expiration - currentTime;

    // for auctions in the future, build queue to notify winners
    if (timeTill > 0) {
      // account for setTimeout not being able to handle more than 24 days
      setDaysTimeout(recalc.recalculate, timeTill, recalculation);
    }
  },
  deleteRecalculation: function(recalculation) {
    console.log('Deleting Recalculation: ' + recalculation._id);
    var timer = timedEvents[recalculation._id];
    clearTimeout(timer);
    clearInterval(timer);
    delete timedEvents[recalculation._id];
  }
};


function clearTimer(id) { delete timedEvents[id]; }

function setDaysTimeout(callback, timeTill, param) {
  // 86400 seconds in a day
  var msInDay = 86400*1000;
  var daysTill = Math.floor(timeTill / msInDay);
  var dayCount = 0;

  var timer;

  // if within this day
  if (daysTill === 0) {
    timer = setTimeout(callback, timeTill, param);
    setTimeout(clearTimer, timeTill + 100, param._id);
  }
  else  {
    // set interval that counts the days
    timer = setInterval(function() {
      dayCount++;  // a day has passed
      timeTill = timeTill - msInDay;

      if(dayCount === daysTill) {
         clearInterval(timer);
         setTimeout(callback, timeTill, param);
         setTimeout(clearTimer, timeTill + 100, param._id);
      }
    },msInDay);
  }

  // save timer
  timedEvents[param._id] = timer;
}