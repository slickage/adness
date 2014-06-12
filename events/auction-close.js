var db = require(__dirname + '/../db');
var _ = require('lodash');
var config = require('../config');
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

    // get auction with all the winning bids for each region
    db.appendBidsToAuction(auction, function(err, auctionWithBids) {
      // find all winners across all regions
      var winningSlots = [];
      auctionWithBids.regions.forEach(function(region) {
        // get all the primarySlots from every region
        var slots = _.clone(region.primarySlots, true);
        winningSlots = winningSlots.concat(slots);
        // keep a list of winners per region
        region.winners = _.values(generateWinners(region.primarySlots));
      });

      // calculate the winners across all regions and how much each owes
      var winners = generateWinners(winningSlots);
      winners = _.values(winners);

      // notify all winners with a link to payment
      winners.forEach(function(winner) {
        notifyWinner(winner, auction._id);
      });

      // cull all the approved auctions from the winners
      upsertAdsInRotation(auctionWithBids);
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

function generateWinners(primarySlots) {
  var users = {};

  primarySlots.forEach(function(bid) {
    if (users[bid.user.userId]) {
      // add a payment instance
      var lineItem = { price: Number(bid.price), region: bid.region };
      users[bid.user.userId].lineItems.push(lineItem);
      // tally up total payment
      var payment = Number(users[bid.user.userId].payment) + Number(bid.price);
      payment = Number(payment).toFixed(2);
      users[bid.user.userId].payment = payment;
    }
    else {
      bid.user.payment = Number(bid.price);
      bid.user.lineItems = [];
      var firstLineItem = { price: bid.user.payment, region: bid.region };
      bid.user.lineItems.push(firstLineItem);
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

function upsertAdsInRotation(auction) {
  // clean up auction regions
  var regions = auction.regions;
  regions.forEach(function(region) {
    delete region.winningBids;
    delete region.primarySlots;
    delete region.secondarySlots;
    delete region.slots;
  });

  air = {};
  air.auctionId = auction._id;
  air.adsStart = auction.adsStart;
  air.adsEnd = auction.adsEnd;
  air.regions = regions;

  // insert the ads
  db.upsertAdsInRotation(air, function(err, body) {
    if (err) { console.log(err); }
  });
}

var invoice = require('../invoice');
