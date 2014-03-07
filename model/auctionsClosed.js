var db = require(__dirname + '/../db');
var biddingAlg = require('../bidding');
var async = require('async');

module.exports = function(req, cb) {
  // database call
  db.auctionsClosed(function(err, auctions) {
    if (!err) {
      // check that there's something to process TODO:
      if (auctions.length < 1) { cb(null, []); }

      // get bids for each auction and attach to auction
      async.mapSeries(auctions, getBids, function(err, results) {
        if (!err) { cb(null, results); }
        else { cb (err, []); }
      });
    } // end if
    else { cb(err, []); }
  });
};

function getBids(auction, callback) {
  // get bids for this auction
  db.getBidsPerAuction(auction.id, function(err, auctionAndBids) {
    if (err) callback(err, auction);

    // first object is the auction itself
    var openAuction = auctionAndBids.splice(0,1)[0].value;
    // the rest of the array are the bids

    // parse out the bids
    var bids = [];
    auctionAndBids.forEach(function(rawBids) {
      bids.push(rawBids.value);
    });

    // figure out winning bids
    var results = biddingAlg(Number(openAuction.slots), bids);

    // add winning bids and bids per slot to openAuction
    openAuction.winningBids = results.winningBids;
    openAuction.bidPerSlot = results.bidPerSlot;

    // return modified openAuction
    callback(null, openAuction);
  }); // end getBidsPerAuction
}