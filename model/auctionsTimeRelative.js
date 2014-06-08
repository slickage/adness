var db = require(__dirname + '/../db');
var biddingAlg = require('../bidding');
var async = require('async');

module.exports = function(req, cb) {
  // database call
  db.auctionsTimeRelative(function(err, auctions) {
    if (!err) {
      // handle the each of the four arrays
      async.parallel({
        open: function(callback) {
          async.map(auctions.open, db.appendBidsToAuction, function(err, results) {
            if (err) { auctions.open = []; }
            else {
              auctions.open = results;
              callback(null, auctions.open);
            }
          });
        },
        closed: function(callback) {
          async.map(auctions.closed, db.appendBidsToAuction, function(err, results) {
            if (err) { auctions.closed = []; }
            else {
              auctions.closed = results;
              callback(null, auctions.closed);
            }
          });
        },
        future: function(callback) {
          async.map(auctions.future, db.appendBidsToAuction, function(err, results) {
            if (err) { auctions.future = []; }
            else {
              auctions.future = results;
              callback(null, auctions.future);
            }
          });
        },
        past: function(callback) {
          async.map(auctions.past, db.appendBidsToAuction, function(err, results) {
            if (err) { auctions.past = []; }
            else {
              auctions.past = results;
              callback(null, auctions.past);
            }
          });
        }
      },
      function(err, results) {
        if (!err) { cb(null, auctions); }
        else { cb(err, []); }
      });
    } // end if
    else { cb(err, []); }
  });
};