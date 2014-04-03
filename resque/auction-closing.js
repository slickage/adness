var db = require(__dirname + '/../db');
var request = require('request');
var config = require('../config');
var invoice = require('../invoice');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var winnerTemplate = __dirname + '/../email-templates/notify-winners.ejs';
var bidderTemplate = __dirname + '/../email-templates/notify-bidders.ejs';


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
    setTimeout(auctionNotification, timeTill, parameters);
  }
  else  {
    // set interval that counts the days
    var timer = setInterval(function() {
      dayCount++;  // a day has passed
      timeTill = timeTill - msInDay;

      if(dayCount === daysTill) {
         clearInterval(timer);
         setTimeout(auctionNotification, timeTill, parameters);
      }
    },msInDay);
  }
}

function auctionNotification(auction) {
  // get all the bids for this auction
  db.getBidsPerAuction(auction._id, function(err, bids) {
    // remove first bid since it's an auction
    bids.splice(0,1);

    // generate bidders from list of bids
    var bidders = generateBidders(bids);
    for(var bidder in bidders) {
      // notify bidders that the auction is closed
      notifyBidder(bidders[bidder], auction._id);
    }
  });

  // get the winning bids and bids per slot from the db
  db.appendBidsToAuction(auction, function(err, auctionBids) {
    // calculate the winners and how much each owes
    var winners = generateWinners(auctionBids.bidPerSlot);
    for(var winner in winners) {
      // notify winners with a link to payment
      notifyWinner(winners[winner], auction._id);
    }
  });
}

function generateWinners(bidPerSlot) {
  var users = {};

  bidPerSlot.forEach(function(bid) {
    if (users[bid.user.username]) {
      var payment = Number(users[bid.user.username].payment) + Number(bid.price);
      payment = Number(payment).toFixed(2);
      var slots = Number(users[bid.user.username].slots) + 1;
      slots = Number(slots);
      users[bid.user.username].payment = payment;
      users[bid.user.username].slots = slots;
    }
    else {
      bid.user.payment = bid.price;
      bid.user.slots = 1;
      users[bid.user.username] = bid.user;
    }
  });

  return users;
}

function generateBidders(bids) {
  var bidders = {};

  bids.forEach(function(bid) {
    if (!bidders[bid.user.username]) {
      bidders[bid.user.username] = bid.user;
    }
  });

  return bidders;
}

function notifyWinner(user, auctionId) {
  console.log("Notifying " + user.username + " that they've won.");

  var webhook = config.site.url + '/auctions/' + auctionId;
  invoice.auction(auctionId, user, webhook, function(err, invoiceId) {
    if (err) { return console.log(err); }

    // build email template
    var data = {
      auctionId: auctionId,
      user: user,
      invoiceId: invoiceId,
      invoiceUrl: config.basicpay.url
    };
    var str = fs.readFileSync(winnerTemplate, 'utf8');
    var html = ejs.render(str, data);
    
    // heckle the winners
    console.log("Emailing " + user.username + " with winner's template");
    heckler.email({
      from: config.admin.senderEmail,
      to: user.email,
      subject: "You're the winning bidder for an auction.",
      html: html
    });
  });
}

function notifyBidder(user, auctionId) {
  console.log("Notifying " + user.username + " that the auction is closed.");
  
  // find the next open auction 
  db.auctionsTimeRelative(function(err, auctions) {
    if (err) { return console.log(err); }
    
    // find next auction if available
    var auction = null;
    var futureAuctions = auctions.future;
    if (futureAuctions[0]) { auction = futureAuctions[0]; }

    // build email template
    var data = { auctionId: auctionId, nextAuction: auction };
    var str = fs.readFileSync(bidderTemplate, 'utf8');
    var html = ejs.render(str, data);
    
    // heckle the winners
    console.log("Emailing " + user.username + " with bidder's template");
    heckler.email({
      from: config.admin.senderEmail,
      to: user.email,
      subject: "Auction " + auctionId + " has ended.",
      html: html
    });
  });
}
