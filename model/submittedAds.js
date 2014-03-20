var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getSubmittedAds(function(err, ads) {
    if (!err) { cb(null, ads); }
    else { cb(err, []); }
  });
};