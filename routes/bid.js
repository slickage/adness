/* jshint node: true */
'use strict';

var bidsCommon = require(__dirname + '/common/bids');

module.exports = {
  // POST bid
  newBid: function(req, res) {
    req.model.load('userBidsPerRegion', req);
    req.model.load('auctionUser', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      bidsCommon.newBid(req, models, function() {
        res.redirect(req.browsePrefix + '/auctions/' + req.body.auctionId);
      });
    });
  },
  updateBid: function(req, res) {
    // updating bids are a admin only function for now
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.params.bidId = req.body.bidId; // is this really needed?
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        bidsCommon.updateBid(req, models, function(err) {
          if(err) { console.log(err); }
          res.redirect(req.browsePrefix);
        });
      }
    });
  },
  deleteBid: function(req, res) {
    // deleting bids is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }

    req.model.load('bid', req);
    req.model.end(function(err, models) {
      bidsCommon.deleteBid(req, models, function(err, results) {
        if (err) { res.send(500, err.message); }
        if (results) { res.json(results); }
      });
    });
  }
};
