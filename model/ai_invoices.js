/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  // database call
  db.getAuctionInvoices(req.params.auctionId, function(err, invoices) {
    if (!err) { cb(null, invoices); }
    else { cb(err, undefined); }
  });
};
