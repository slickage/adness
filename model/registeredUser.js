var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // always return something 
  if (!req.user) { return cb(null, undefined); }
  db.getRegisteredUser(req.user.userId, function(err, user) {
    if (!err) { cb(null, user); }
    else { cb(null, undefined); }
  });
};