var auctionEnd = require('./auction-close');
var config = require('../config');
var db = require('../db');
var _ = require('lodash');
var async = require('async');
var request = require('request');

module.exports = {
  recalculate: function(recalculation) {
    console.log("Running Recalculation for auction: " + recalculation.auctionId);

    var finalRecalc = false;

    // increment round and expiration
    var nextRound = recalculation.round + 1;
    // see if next round exists
    if (nextRound <= config.rounds.maxRounds) {
      console.log("Incrementing Recalculation to round: " + nextRound + " for Auction: " + recalculation.auctionId);
      // next round
      recalculation.round = nextRound;
      // next expiration
      var roundValue = config.rounds["round" + recalculation.round];
      recalculation.expiration = new Date().getTime() + roundValue.timeOffset;
    }
    // next round doesn't exist, call final recalculation
    else {
      console.log("Running Final Recalculation for Auction: " + recalculation.auctionId);
      finalRecalc = true; }

    /// --- assuming next round exists

    // Resolve invoices for this auction.
    // Check all invoice for this auction and remove or modify all 
    // bids that haven't paid. 
    // Return whether another recalc is necessary
    var auctionId = recalculation.auctionId;
    checkInvoices(auctionId, function(err, results) {
      if (err) { console.log(err); }

      // invalidate all leftover bids on final Recalculation
      if (finalRecalc) {
        voidLeftoverBids(auctionId, function(err, bids) {
          auctionRecalculation(auctionId, recalculation);
        });
      }
      // Run an auction recalculation to send new invoices
      // For final recalc, all other bids are gone so no new invoices
      else if (results) { auctionRecalculation(auctionId, recalculation); }

      // update the recalculation object and send to event-timer
      // always recalculate unless told otherwise
      var wonSlots = 0;
      if (results && results.wonSlots) { wonSlots = results.wonSlots; }
      updateRecalculation(recalculation, finalRecalc, wonSlots);
    });
  }
};

/* 
 * Check the status of each invoice. If it's paid, 
 * cull all the bids for the and increment the wonSlots 
 * property of the bid. If it's not paid, void the bid.
 * This will processes as many invoices and bids as possible by
 * printing errors but continues anyway.
 */
function checkInvoices(auctionId, cb) {
  if (!auctionId) { return cb(new Error("AuctionId not found"), undefined); }

  // get all invoices (receipts) for this auction
  db.getAuctionInvoices(auctionId, function(err, receipts) {
    if (err) { console.log(err); receipts = []; }

    console.log("Found " + receipts.length + " invoices.");

    // removed invoices that aren't expired
    var now = new Date().getTime();
    _.remove(receipts, function(receipt) {
      return receipt.invoice.expiration > now;
    });

    // check if all invoices are paid, this should stop a recalc 
    var bids = {};

    async.series([
      function(seriesCB) {
        // For each invoice(receipt):
        // figure out if the invoice is paid or not
        // then get all the bids for this invoice
        async.eachSeries(
          receipts,
          function(receipt, callback) {
            resolveReceipt(receipt, function(receiptErr, results) {
              if (receiptErr) { console.log(receiptErr); }

              if (results && results.bids) {
                // add invoiceBids to overalBids
                var invoiceBids = results.bids;
                collateBids(bids, invoiceBids);
              }

              // ignore errors and continue with next invoice
              return callback(null);
            });
          },
          function(allReceiptErr) {
            if (allReceiptErr) { console.log(allReceiptErr); }
            return seriesCB(null);
          }
        );
      },
      function(bidsCallback) {
        // modify bids from invoices
        bids = _.values(bids);
        console.log("Updating " + bids.length + " bids.");
        async.eachSeries(
          bids,
          function(bid, callback) {
            resolveBid(auctionId, bid, function(bidErr, results) {
              if (bidErr) { console.log(bidErr); }

              console.log("Resolved Bid: ");
              console.log(bid);

              // ignore error and continue with next bid
              return callback(null);
            });
          },
          function(allBidErr) {
            if (allBidErr) { console.log(allBidErr); }
            console.log("all bids updated");
            return bidsCallback(null);
          }
        );
      }
    ],
    function(err, results) {
      // sum up wonSlots in bids
      var wonSlots = 0;
      bids.forEach(function(bid) {
        if (bid.wonSlots) { wonSlots = wonSlots + bid.wonSlots; }
      });

      var retval = { wonSlots: wonSlots };
      return cb(err, retval);
    });
  });
}

function resolveReceipt(receipt, cb) {
  var invoicePaid = false;
  var bids = [];

  // get latest baron invoice copy
  var invoice = receipt.invoice;
  getInvoiceStatus(invoice.id, function(err, paid) {
    if (err) { return cb(err, null); }

    console.log("Invoice: " + invoice.id + " - paid = " + paid);

    // check invoice paid
    invoicePaid = paid;
    
    // get all the bids/slots for this invoice
    var invoiceSlots = receipt.metadata.user.lineItems;
    var userId = receipt.metadata.user.userId;
    bids = bidsFromLineItems(invoiceSlots, userId, paid);
    bids = _.values(bids);

    // return bids for this receipt
    var retval = { paid: invoicePaid, bids: bids };
    return cb(err, retval);
  });
}

function getInvoiceStatus(invoiceId, cb) {
  // check status of invoice against baron
  request.get(
    { uri: config.baron.internalUrl + '/api/invoices/' + invoiceId },
    function(err, responce, body) {
      if (err) { return cb(err, undefined); }
      else {
        var parsedBody;
        try { parsedBody = JSON.parse(body); }
        catch (error) {
          errorMsg = "Could not parse response, received response: ";
          errorMsg += body + "\n";
          errorMsg += error.message;
          var validateError = new Error(errorMsg );
          return cb(validateError, undefined);
        }

        // get the invoice status
        var valid = false;
        var is_paid = parsedBody.is_paid;
        var remaining_balance = parsedBody.remaining_balance;
        if (is_paid && is_paid === true) { valid = true; }
        else if (remaining_balance && remaining_balance === 0) { valid = true; }
        else { valid = false; }

        return cb(null, valid);
      }
    }
  );
}

function bidsFromLineItems(lineItems, userId, paid) {
  var bids = {};
  lineItems.forEach(function(slot) {
    if (bids[slot.bidId]) {
      // get existing bid
      var oldBid = bids[slot.bidId];
      // assign bid status by paid var
      if (paid) { oldBid.wonSlots = oldBid.wonSlots + 1; }
      else { oldBid.void = true; }
      bids[slot.bidId] = oldBid;
    }
    else {
      // create new bid
      var newBid = { bidId: slot.bidId, userId: userId };
      // assign bid status by paid var
      if (paid) { newBid.wonSlots = 1; }
      else { newBid.void = true; }
      bids[slot.bidId] = newBid;
    }
  });
  return bids;
}

function collateBids(bids, newBids) {
  if (!bids) { return {}; }
  if (!newBids) { return bids; }

  newBids.forEach(function(bid) {
    // get existing bid
    var oldBid = bids[bid.bidId];
    
    if (oldBid) {
      // add wonSlots
      if (bid.wonSlots) {
        if (oldBid.wonSlots) {
          oldBid.wonSlots = oldBid.wonSlots + bid.wonSlots;
        }
        else { oldBid.wonSlots = bid.wonSlots; }
      }
      // add void
      if (bid.void) { oldBid.void = bid.void; }
    }
    else {
      var newBid = { bidId: bid.bidId };
      // add wonSlots if exists
      if (bid.wonSlots) { newBid.wonSlots = bid.wonSlots; }
      // add void if exists
      if (bid.void) { newBid.void = bid.void; }
      // add to bids array
      bids[bid.bidId] = newBid;
    }
  });

  return bids;
}

function resolveBid(auctionId, bid, cb) {
  // build new bid with updated status: wonSlots and void
  var newBid = {
    _id: bid.bidId,
    wonSlots: bid.wonSlots,
    void: bid.void
  };
  db.forceUpdateBidStatus(newBid, function(forceErr, results) {
    // if bid is void, make all user's bids void
    if (results && bid.void === true) {
      voidUserBids(auctionId, bid.userId, function(err) {
        return cb(err);
      });
    }
    else { return cb(forceErr, results); }
  });
}

function voidUserBids(auctionId, userId, cb) {
  // get all bids for this auction for this user
  db.getUserBidsPerAuction(auctionId, userId, function(err, userbids) {
    if (err) console.log(err);
    if (userbids) {
      async.eachSeries(
        userbids,
        function(userbid, callback) {
          if (err) console.log(err);
          // check if bid is void already
          if (userbid.void) { return callback(null); }
          // otherwise update this userbid
          var updateBid = { _id: userbid._id, void: true };
          db.forceUpdateBidStatus(updateBid, function(updateErr, results) {
            if (updateErr) { console.log(updateErr); }
            return callback(null);
          });
        },
        function(allBidErr) { if (allBidErr) { console.log(allBidErr); } }
      );
    }

    return cb(err, userbids);
  });
}

function auctionRecalculation(auctionId, recalculation) {
  console.log("Recalculating Auction Slots...");
  // get the auction object
  db.getAuction(recalculation.auctionId, function(err, auction) {
    if (err) { console.log(err); }

    db.appendBidsToAuction(auction, function(err, auctionWithBids) {
      if (err) { console.log(err); }

      // call auction recalculation
      auctionEnd.recalculateAuction(auctionWithBids, recalculation,
        function(err, results) {
          if (err) { console.log(err); }
        }
      );
    });
  });
}

function updateRecalculation(recalculation, finalRecalc, wonSlots) {
  console.log("Updating Recalculation...");

  db.getAuction(recalculation.auctionId, function(err, auction) {
    if (err) { console.log(err); }

    // get all slots from all regions in auction
    var auctionSlots = 0;
    auction.regions.forEach(function(region) {
      if (region.slots) { auctionSlots = auctionSlots + Number(region.slots); }
    });

    // compare to wonSlots
    if (wonSlots >= auctionSlots) { recalculation.finished = true; }

    // compare to finalRecalc
    if (finalRecalc) { recalculation.finished = true; }

    // add one minute to recalculation expiration
    recalculation.expiration = recalculation.expiration + (1000 * 60);
    db.updateRecalculation(recalculation, function(err, results) {
      if (err) { console.log(err); }
    });

  });
}

function voidLeftoverBids(auctionId, cb) {
  console.log("Voiding any leftover bids...");

  // get all bids for this auction
  db.getBidsPerAuction(auctionId, function(err, bids) {
    if (err) { console.log(err); }

    if (bids) {
      // splice out first bid, it's an auction
      bids.splice(0, 1);

      // update each bid
      async.eachSeries(
        bids,
        function(bid, callback) {
          // check if bid is void already
          if (bid.void) { return callback(null); }
          // check if bid is invalid already
          if (bid.invalid) { return callback(null); }
          // check if bid has won slots
          if (bid.wonSlots) { return callback(null); }

          // otherwise update this userbid
          var updateBid = { _id: bid._id, lost: true };
          db.forceUpdateBidStatus(updateBid, function(updateErr, results) {
            if (updateErr) { console.log(updateErr); }
            return callback(null);
          });
        },
        function(allBidErr) { if (allBidErr) { console.log(allBidErr); } }
      );
    }

    return cb(err, bids);
  });
}