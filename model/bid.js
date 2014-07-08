/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  db.getBid(req.params.bidId, function(err, auction) {
    if (!err) { cb(null, auction); }
    else { cb(err, undefined); }
  });
};