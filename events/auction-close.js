var db = require(__dirname + '/../db');
var _ = require('lodash');
var config = require('../config');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var winnerTemplate = __dirname + '/../email-templates/notify-winners.ejs';
var bidderTemplate = __dirname + '/../email-templates/notify-bidders.ejs';
var winnerModifiedTemplate = __dirname + '/../email-templates/notify-winners-modified.ejs';

module.exports = {
  notifyAuction: function (auction) {
    console.log("Starting Auction Close Event...");

    // get all the bids for this auction
    db.getBidsPerAuction(auction._id, function(err, bids) {
      if (err) { console.log(err);  return; }

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
      if (err) { console.log(err); return; }

      auctionWithBids.regions.forEach(function(region) {
        // find winners for this region
        region.winners = _.values(generateWinners(region.primarySlots));

        // notify each winner for this region
        region.winners.forEach(function(winner) {
          notifyWinner(winner, auction._id);
        });
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
  completeModifiedInvoice: function (err, results) {
    // function needs to be setup like this due to loss of scope in notifyAuction
    handleModifiedInvoice(err, results);
  },
  recalculateAuction: function(auction, cb) {
    console.log("Re-Calculating Auction Winners...");

    // error check inputs
    if (!auction) { return cb(new Error("Auction not found."), undefined); }

    // calculate winners for each region of thew new region
    var auctionWinners;
    auction.regions.forEach(function(region) {
      region.winners = _.values(generateWinners(region.primarySlots));
    });

    // get the adsInRotation object for this auction if it exists
    var airId = auction._id + "-air";
    db.getAdsInRotation(airId, function(err, air) {
      if (err) { return cb(err, undefined); }
      resolveRegions(auction, air.regions, cb);
    });
  }
};

function resolveRegions(auction, airRegions, cb) {
  auction.regions.forEach(function(auctionRegion) {
    // get the matching region from air
    var airRegion = _.find(airRegions, { name: auctionRegion.name });

    // new Winners
    var auctionWinners = auctionRegion.winners;

    // old Winners
    var airWinners = airRegion.winners;

    // match by auction winner
    auctionWinners.forEach(function(auctionWinner) {
      // check to see if this winner already exists
      var existingWinner = _.find(airWinners, function(airWinner) {
        if (airWinner.userId === auctionWinner.userId) {return true; }
        else { return false; }
      });

      // winner message stacks
      var newWinners = [];
      var modifiedWinners = [];

      // find the difference for an existing winner
      if (existingWinner) {
        // clone lineItems to prevent reference changes
        var auctionWinnerSlots = _.clone(auctionWinner.lineItems, true);
        var existingWinnerSlots = _.clone(existingWinner.lineItems, true);
        var differenceFound = false;

        // find differences in slots
        existingWinnerSlots.forEach(function(slot) {
          var index = _.findIndex(auctionWinnerSlots, slot);
          if (index > -1) { auctionWinnerSlots.splice(index, 1); }
          else { differenceFound = true; }
        });

        // less case
        if (differenceFound && auctionWinnerSlots.length === 0) {
          // there's less slots than before, log this
          console.log("auction winner: ");
          console.log(auctionWinner);
          console.log("Has Less Slots than before.");
          var lessError = "User: " + auctionWinner.username;
          lessError += " has less slots than before. This seems wrong.";
          return cb(new Error(lessError), undefined);
        }
        // more case
        else if (!differenceFound && auctionWinnerSlots.length > 0) {
          delete existingWinner.payment;
          // move the difference into old user to preserve new user for db
          existingWinner.lineItems = auctionWinnerSlots;
          modifiedWinners.push(existingWinner);
        }
        // less and more case
        else if (differenceFound && auctionWinnerSlots.length > 0) {
          console.log("auction winner: ");
          console.log(auctionWinner);
          console.log("Has Less and More Slots than before.");
          var moreError = "User: " + auctionWinner.username;
          moreError += " has less slots than before. This seems wrong.";
          return cb(new Error(moreError), undefined);
        }
        // else - same slots case
      }
      // or else notify them if they don't exist yet
      else { newWinners.push(auctionWinner); }

      // notifiy the new winners
      newWinners.forEach(function(winner) {
        notifyWinner(winner, auction._id);
      });

      // notify the modified winners
      modifiedWinners.forEach(function(winner) {
        notifyModifiedWinner(winner, auction._id);
      });
    });
  });
  
  // cull all the approved auctions from the winners
  upsertAdsInRotation(auction);
  return cb(null, true);
}

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

function notifyModifiedWinner(winner, auctionId) {
  console.log("Notifying " + winner.username + " that they've won more slots.");

  var webhook = config.site.url + '/hooks/auctions/' + auctionId;
  var invoiceForm = invoice.createAuctionInvoice(auctionId, winner, webhook);
  var data = {
    user: winner,
    auctionId: auctionId,
  };
  invoice.createInvoice(data, "auctionModified", invoiceForm, handleModifiedInvoice);
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

function handleModifiedInvoice(err, results) {
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
  var str = fs.readFileSync(winnerModifiedTemplate, 'utf8');
  var html = ejs.render(str, data);
  
  // heckle the winners
  console.log("Emailing " + winner.username + " with winner's template");
  heckler.email({
    from: config.senderEmail,
    to: winner.email,
    subject: "You've won more slots for #" + auctionId + ".",
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
