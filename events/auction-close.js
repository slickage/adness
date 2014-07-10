/* jshint node: true */
'use strict';

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

    // calculate expiration time for invoices
    var roundValue = config.rounds.round1;
    var expiration = new Date().getTime() + roundValue.timeOffset;
    var discount = roundValue.discount;

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
          notifyWinner(winner, expiration, discount, auction._id);
        });
      });

      // cull all the approved auctions from the winners
      upsertAdsInRotation(auctionWithBids);

      // create new recalculation object
      expiration = expiration + 1000 * 60; // one minute grace period
      var recalculation = {
        auctionId: auction._id,
        round: 1,
        expiration: expiration
      };
      db.newRecalculation(recalculation, function(err, results) {
        if (err) { console.log(err); }
      });
    });
  },
  completeInvoice: function (err, results) {
    // function needs to be setup like this due to loss of scope in notifyAuction
    handleInvoice(err, results);
  },
  completeModifiedInvoice: function (err, results) {
    // function needs to be setup like this due to loss of scope in notifyAuction
    handleModifiedInvoice(err, results);
  },
  // assumes that recalculation has been incremented and expiration updated
  recalculateAuction: function(auction, recalculation, cb) {
    console.log("Re-Calculating Auction Winners...");

    // error check inputs
    if (!auction) { return cb(new Error("Auction not found.")); }
    if (!recalculation) { return cb(new Error("Recalculation not found")); }

    // calculate winners for each region of the new recalculation
    var auctionWinners;
    auction.regions.forEach(function(region) {
      region.winners = _.values(generateWinners(region.primarySlots));
    });

    // get the adsInRotation object for this auction if it exists
    var airId = auction._id + "-air";
    db.getAdsInRotation(airId, function(err, air) {
      if (err) { return cb(err, undefined); }
      resolveRegions(auction, recalculation, air.regions, cb);
    });
  }
};

function resolveRegions(auction, recalculation, airRegions, cb) {
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
          lessError += " has less slots than before.";
          // return cb(new Error(lessError), undefined);
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
          moreError += " has less and more slots than before.";
          return cb(new Error(moreError), undefined);
        }
        // else - same slots case
      }
      // or else notify them if they don't exist yet
      else { newWinners.push(auctionWinner); }

      // calculate discount for this round
      var round = recalculation.round;
      var roundValue = config.rounds["round" + round];
      var discount = roundValue.discount;

      // calculate expiration for this recalculation
      var expiration = recalculation.expiration;
      var halfOffset = roundValue.timeOffset / 2;
      var now = new Date().getTime();
      if (now > expiration - halfOffset) {
        // get next round offset
        if ( (round + 1) <= config.rounds.maxRound) {
          round = round + 1;
          var nextOffset = config.rounds["round" + round].timeOffset;
          expiration = expiration + nextOffset;
        }
      }

      // notifiy the new winners
      newWinners.forEach(function(winner) {
        notifyWinner(winner, expiration, discount, auction._id);
      });

      // notify the modified winners
      modifiedWinners.forEach(function(winner) {
        notifyModifiedWinner(winner, expiration, discount, auction._id);
      });

      var message = "Finished Recalculating Auction Slots For: ";
      message += auctionWinner.username;
      message += " in Region: " + auctionRegion.name;
      console.log(message);
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
      var lineItem = {
        bidId: bid._id,
        price: Number(bid.price),
        region: bid.region
      };
      users[bid.user.userId].lineItems.push(lineItem);
      // tally up total payment
      var payment = Number(users[bid.user.userId].payment) + Number(bid.price);
      payment = Number(payment).toFixed(2);
      users[bid.user.userId].payment = payment;
    }
    else {
      bid.user.payment = Number(bid.price);
      bid.user.lineItems = [];
      var firstLineItem = {
        bidId: bid._id,
        price: bid.user.payment,
        region: bid.region
      };
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

function notifyWinner(winner, expiration, discount, auctionId) {
  console.log("Notifying " + winner.username + " that they've won.");
  invoiceUser(winner, expiration, discount, auctionId, "auction", handleInvoice);
}

function notifyModifiedWinner(winner, expiration, discount, auctionId) {
  console.log("Notifying " + winner.username + " that they've won more slots.");
  invoiceUser(winner, expiration, discount, auctionId, "auctionModified", handleModifiedInvoice);
}

function invoiceUser(winner, expiration, discount, auctionId, invoiceType, cbHandle) {
  // get registeredUser to see if there's any discounts
  db.getRegisteredUser(winner.userId, function(err, regUser) {
    if (err) { console.log(err); }

    if (regUser) {
      // compile discounts
      var discounts = [];
      // reg discount
      if (regUser.discount_remaining > 0) {
        var regDiscount = {
          description: 'Registration Discount',
          amount: Number(regUser.discount_remaining)
        };
        discounts.push(regDiscount);
      }
      // given discount
      if (discount > 0) {
        var recalcDiscount = {
          description: 'Recalculation Discount',
          percentage: discount
        };
        discounts.push(recalcDiscount);
      }

      // set regUser discount to zero
      regUser.discount_remaining = 0;
      db.insertRegisteredUser(regUser, function(err, results) {
        if (err) { console.log(err); }
        if (results) { console.log('Discount used for: ' + regUser.username); }
      });

      var webhook = config.site.internalUrl + '/hooks/auctions/' + auctionId;
      var invoiceForm = invoice.createAuctionInvoice(auctionId, winner, expiration, discounts, webhook);
      var data = {
        user: winner,
        auctionId: auctionId
      };
      invoice.createInvoice(data, invoiceType, invoiceForm, cbHandle);
    }
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
  var expiration = results.receipt.invoice.expiration;
  expiration = new Date(expiration);
  expiration = expiration.toUTCString();

  // build email template
  var data = {
    auctionId: auctionId,
    user: winner,
    invoiceId: invoiceId,
    invoiceUrl: config.baron.url,
    expiration: expiration
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
  var expiration = results.receipt.invoice.expiration;
  expiration = new Date(expiration);
  expiration = expiration.toUTCString();

  // build email template
  var data = {
    auctionId: auctionId,
    user: winner,
    invoiceId: invoiceId,
    invoiceUrl: config.baron.url,
    expiration: expiration
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

  var air = {};
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
