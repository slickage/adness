/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getReservedAd(req.params.reservedAdId, function(err, ad) {
    if (err) { return cb(err, undefined); }
    if (ad) { return cb(null, ad); }
  });
};