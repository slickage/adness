var db = require(__dirname + '/../db');
var biddingAlg = require('../bidding');

var retVal = [];
var calls = 0;
var callLimit = 0;

module.exports = function(req, cb) {
  // get all open auctions
  db.auctionsOpen(function(err, auctions) {

    if (!err) {
      // set number of auctions to process
      callLimit = auctions.length;
      calls = 0;
      retVal = [];

      console.log("Raw Auctions: " + JSON.stringify(auctions));

      // for each auction that's open
      auctions.forEach(function(auction) {
        // get bids for this open auction
        db.getBidsPerAuction(auction.id, function(err, auctionAndBids) {
          console.log("Auction And Bids: " + JSON.stringify(auctionAndBids));

          // first object is the auction itself
          var openAuction = auctionAndBids.splice(0,1)[0].value;
          // the rest of the array are the bids

          console.log("Raw Bids: ");
          console.log(auctionAndBids);

          // parse out the bids
          var bids = [];
          for (var n=0; n < auctionAndBids.length; n++) {
            bids.push(auctionAndBids[n].value);
          }

          console.log("Parsed Bids: ");
          console.log(bids);

          // figure out winning bids
          var results = biddingAlg(parseInt(openAuction.slots, 10), bids);

          console.log("Winning Bids: ");
          console.log(results.winningBids);

          console.log("Bids Per Slot:");
          console.log(results.bidPerSlot);

          // add winning bids and bids per slot to openAuction
          openAuction.winningBids = results.winningBids;
          openAuction.bidPerSlot = results.bidPerSlot;

          retVal.push(openAuction);
          coalateCalls(cb);
        }); // end getBidsPerAuction
      }); // end forEach
    } // end if
    else {
      cb(err, undefined);
    }
  });
};


var coalateCalls = function(cb) {
  calls++;
  if (callLimit == calls){
    console.log("RetVal");
    console.log(retVal);
    cb(null, retVal);
  }
};
