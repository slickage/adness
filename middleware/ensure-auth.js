var _ = require('underscore');
var config = require(__dirname + '/../config');

module.exports = function(req, res, next) {
  if (req.isAuthenticated()) {
    var username = req.user.username;
    var isAdmin = _.contains(config.admins, username);
    req.user.admin = isAdmin;
    return next();
  }
  res.redirect(config.sbPrefix + '/');
}
