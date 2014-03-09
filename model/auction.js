var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  db.getAuction(req.params.auctionId, function(err, auction) {
    if (!err) {
      db.appendBidsToAuction(auction, cb);
    }
    else {
      cb(err, undefined);
    }
  });
};