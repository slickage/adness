var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  console.log('startkey in bids model: ' + req.params.startkey);
  db.getBidsPerAuction(req.params.startkey, function(err, auction) {
    if (!err) {
      console.log(auction);
      cb(null, auction);
    }
    else {
      cb(err, undefined);
    }
  });
};

