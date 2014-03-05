var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  db.auctionsPast(function(err, auctions) {
    if (!err) {
      cb(null, auctions);
    }
    else {
      cb(err, undefined);
    }
  });
};
