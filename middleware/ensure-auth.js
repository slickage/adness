var _ = require('underscore');
var config = require(__dirname + '/../config');

module.exports = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect(config.sbPrefix + '/');
}
