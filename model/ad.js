var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  db.getAd(req.params.adId, function(err, ad) {
    if (!err) { cb(null, ad); }
    else { cb(err, undefined); }
  });
};