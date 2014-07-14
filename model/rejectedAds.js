/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getRejectedAds(function(err, ads) {
    if (!err) { cb(null, ads); }
    else { cb(err, []); }
  });
};