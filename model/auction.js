var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  console.log('auctionId: ' + req.params.auctionId);
  db.getAuction(req.params.auctionId, function(err, auction) {
    if (!err) {
      cb(null, auction);
    }
    else {
      cb(err, undefined);
    }
  });
}

