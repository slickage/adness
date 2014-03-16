var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getUserAds(req.userId, function(err, ads) {
    if (!err) { cb(null, ads); }
    else { cb(err, []); }
  });
};