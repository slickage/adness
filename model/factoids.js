var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getFactoids(function(err, facts) {
    if (err) { return cb(err, undefined); }
    if (facts) { return cb(null, facts); }
  });
};