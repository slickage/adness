/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getReservedAds(function(err, ads) {
    if (err) { return cb(err, undefined); }
    if (ads) { return cb(null, ads); }
  });
};