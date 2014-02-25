var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  console.log('auctionID in bids model: ' + req.params.auctionId);
  db.getBidsPerAuction(req.params.auctionId, function(err, auction) {
    if (!err) {
      console.log(auction);
      cb(null, auction);
    }
    else {
      cb(err, undefined);
    }
  });
};

