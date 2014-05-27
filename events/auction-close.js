var db = require(__dirname + '/../db');
var _ = require('lodash');
var config = require('../config');
var invoice = require('../invoice');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var winnerTemplate = __dirname + '/../email-templates/notify-winners.ejs';
var bidderTemplate = __dirname + '/../email-templates/notify-bidders.ejs';


module.exports = {
  notifyAuction: function (auction) {
    console.log("Starting Auction Close Event...");

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

      // cull all the approved auctions from the winners
      updateAds(winners, auction);
    });
  },
  notifySingleWinner: function (winner, auctionId) {
    // function needs to be setup like this due to loss of scope in notifyAuction
    notifyWinner(winner, auctionId);
  },
  completeInvoice: function (err, results) {
    // function needs to be setup like this due to loss of scope in notifyAuction
    handleInvoice(err, results);
  },
  getWinListing: null,
  updateWinners: null // will need to call updateAds
};

function generateWinners(bidPerSlot) {
  var users = {};

  bidPerSlot.forEach(function(bid) {
    if (users[bid.user.userId]) {
      // add a payment instance
      users[bid.user.userId].lineItems.push(Number(bid.price));
      // tally up total payment
      var payment = Number(users[bid.user.userId].payment) + Number(bid.price);
      payment = Number(payment).toFixed(2);
      users[bid.user.userId].payment = payment;
    }
    else {
      bid.user.payment = Number(bid.price);
      bid.user.lineItems = [];
      bid.user.lineItems.push(bid.user.payment);
      users[bid.user.userId] = bid.user;
    }
  });

  return users;
}

function generateBidders(bids) {
  var bidders = {};

  bids.forEach(function(bid) {
    if (!bidders[bid.user.userId]) {
      bidders[bid.user.userId] = bid.user;
    }
  });

  return bidders;
}

function notifyWinner(winner, auctionId) {
  console.log("Notifying " + winner.username + " that they've won.");

  var webhook = config.site.url + '/hooks/auctions/' + auctionId;
  var invoiceForm = invoice.createAuctionInvoice(auctionId, winner, webhook);
  var data = {
    user: winner,
    auctionId: auctionId,
  };
  invoice.createInvoice(data, "auction", invoiceForm, handleInvoice);
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
      from: config.senderEmail,
      to: user.email,
      subject: "Auction " + auctionId + " has ended.",
      html: html
    });
  });
}

function handleInvoice(err, results) {
  if (err) { return console.log(err); }

  var auctionId = results.receipt.metadata.auctionId;
  var winner = results.receipt.metadata.user;
  var invoiceId = results.invoice.id;

  // build email template
  var data = {
    auctionId: auctionId,
    user: winner,
    invoiceId: invoiceId,
    invoiceUrl: config.baron.url
  };
  var str = fs.readFileSync(winnerTemplate, 'utf8');
  var html = ejs.render(str, data);
  
  // heckle the winners
  console.log("Emailing " + winner.username + " with winner's template");
  heckler.email({
    from: config.senderEmail,
    to: winner.email,
    subject: "You're a winning bidder for #" + auctionId + ".",
    html: html
  });
}

function updateAds(winnersObject, auction) {
  var winners = _.values(winnersObject);
  updateAdsInRotation(auction, winners);
}

function updateAdsInRotation(auction, winners) {
  db.getAdsInRotation(function(err, air) {
    if (err) { air = {}; }
    air.auctionId = auction._id;
    air.winners = winners;
    
    // insert the ads
    db.insertAdsInRotation(air, function(err, body) {
      if (err) { console.log(err); }
    });
  });
}