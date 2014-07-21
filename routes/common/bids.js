/* jshint node: true */
'use strict';

var db = require(__dirname + '/../../db');
var async = require('async');
var _ = require('lodash');
var request = require('request');
var config = require('../../config');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var invalidTemplate = __dirname + '/../../email-templates/invalid-bid.ejs';

module.exports = {
  newBid: function(req, models, cb) {
    // auction profile
    var auctionUser = models.auctionUser;
    // previous bids
    var previousBids = models.userBidsPerRegion;
    // current bid
    var bid = req.body;

    // validate that the user is registered
    if (!auctionUser || auctionUser && auctionUser.registered !== true) {
      var registeredErrorMessage = 'You are not registered with the Auction Website.';
      req.flash('error', registeredErrorMessage);
      return cb();
    }

    // validate that user is not suspended
    if (auctionUser && auctionUser.suspended === true) {
      var suspendedErrorMessage = 'You\'ve been suspended from the auction system. You may not bid on anymore auctions.';
      req.flash('error', suspendedErrorMessage);
      return cb();
    }

    // pull out invalid bids from previous bids
    _.remove(previousBids, function(bid) {
      return bid.invalid === true || bid.lost === true;
    });

    // validate current bid is of correct increment
    var currentBidPrice = bid.price * 100;
    var minIncrement = 0.05 * 100;
    var modulusBid = Number(currentBidPrice % minIncrement).toFixed(2);
    if (modulusBid > 0) {
      var incrementErrorMessage = 'Bid Price is not of increment: ';
      incrementErrorMessage += 0.05;
      req.flash('error', incrementErrorMessage);
      return cb();
    }

    // validate that this new bid is of higher price than before
    var invalidBid = false;
    var highestBidPrice = 0;
    previousBids.forEach(function(oldBid) {
      if (oldBid.price >= bid.price) {
        invalidBid = true;
        if (oldBid.price > highestBidPrice) {
          highestBidPrice = oldBid.price;
        }
      }
    });

    if (!invalidBid) {
      // append current user for validation
      bid.user = req.user;

      // append registered User for validation
      bid.auctUser = auctionUser;

      // save new bid
      db.newBid(bid, function(err) {
        if (err) {
          console.log(err);
          req.flash('error', err.message);
        }
        return cb();
      });
    }
    else {
      var message = 'Your last bid had a price that was lower ';
      message += 'than your previous highest bid price of ';
      message += highestBidPrice;
      req.flash('error', message);
      return cb();
    }
  },
  updateBid: function(req, models, cb) {
    var bid = models.bid;
    bid.user = req.user; // add current user
    if (req.body.price) { bid.price = req.body.price; }
    if (req.body.slots) { bid.slots = req.body.slots; }
    if (req.body.region) { bid.region = req.body.region; }
    db.updateBid(bid, cb);
  },
  deleteBid: function(req, models, cb) {
    var bid = models.bid;
    var auctionId = bid.auctionId;
    var userId = bid.user.userId;
    var username = bid.user.username;
    var email = bid.user.email;

    // first invalidate bid
    db.deleteBid(bid._id, function(err, results) {
      if (err) {
        console.log(err);
        return (err, undefined);
      }
      if (results) {
        // then void respective invoice
        invalidateUserInvoices(auctionId, bid._id, userId, function(err, invoiceMessages) {
          if (err) {
            console.log(err);
            return (err, undefined);
          }
          if (invoiceMessages) {
            // email the user about the invalid bid
            notifyInvalidBidUser(invoiceMessages, auctionId, bid._id, username, email);
            return cb(null, invoiceMessages);
          }
        });
      }
    });
  }
};

function invalidateUserInvoices(auctionId, bidId, userId, cb) {
  // get all invoices for this bid
  db.getUserInvoices(auctionId, userId, function(err, invoices) {
    if (err) { console.log(err); return cb(err, []); }

    var messages = [];
    
    // invalidate each invoice
    async.eachSeries(
      invoices,
      function(invoice, callback) {
        var voidInvoice = false;
        // check invoice for bidId
        var lineItems = invoice.metadata.user.lineItems;
        if (lineItems) {
          lineItems.forEach(function(lineItem) {
            if (lineItem.bidId === bidId) { voidInvoice = true; }
          });
        }

        // break out if voidInvoice === false
        if (voidInvoice === false) {
          return callback(null);
        }

        // invalidate invoice
        var invoiceId = invoice.invoice.id;
        invalidateInvoice(invoiceId, function(err, result) {
          if (err) { console.log(err); }

          if (result) {
            var message = 'Invoice: ' + invoiceId + ' was invalidated.';
            messages.push(message);
          }
          else {
            var errMessage = 'Invoice: ' + invoiceId + ' could not be invalidated. It may have been paid already.';
            messages.push(errMessage);
          }

          return callback(null);
        });
      },
      function(err) {
        if (err) { console.log(err); }
        return cb(err, messages);
      }
    );
  });
}

function invalidateInvoice(invoiceId, cb) {
  // check status of invoice against baron
  request.post(
    {
      uri: config.baron.internalUrl + '/invoices/' + invoiceId + '/void',
      form: { api_key: config.baron.key }
    },
    function(err, response) {
      if (err) { return cb(null, false); }
      else {
        var status = response.statusCode;
        if (Number(status) === 200) { return cb(null, true); }
        else { return cb(null, false); }
      }
    }
  );
}

function notifyInvalidBidUser(invoices, auctionId, bidId, username, email) {
  // build email template
  var data = {
    bidId: bidId,
    invoices: invoices,
    auctionId: auctionId,
    username: username
  };
  var str = fs.readFileSync(invalidTemplate, 'utf8');
  var html = ejs.render(str, data);
  
  // heckle the winners
  console.log('Emailing ' + username + ' with invalid bid template');
  heckler.email({
    from: config.senderEmail,
    to: email,
    subject: 'Your bid:' + bidId + ', has been invalidated in auction: ' + auctionId,
    html: html
  });
}
