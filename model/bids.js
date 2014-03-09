var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  db.getBidsPerAuction(req.params.startkey, function(err, auction) {
    if (!err) { cb(null, auction); }
    else { cb(err, undefined); }
  });
};

