/* jshint node: true */
'use strict';

var config = require(__dirname + '/../config');

module.exports = function(req, res, next) {
  req.browsePrefix = config.sbPrefix;
  return next();
};
