/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');

module.exports = function(req, cb) {
  var userId = req.user.userId;
  var auctionId = req.body.auctionId;
  var region = req.body.region;
  db.getUserBidsPerRegion(auctionId, region, userId, function(err, bids) {
    if (err) { return cb(err, []); }
    else { return cb(null, bids); }
  });
};

