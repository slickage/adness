/* jshint node: true */
'use strict';

var auth = require(__dirname + '/../../middleware/ensure-auth');
var express = require('express');
var bids = express.Router();
var bidsCommon = require(__dirname + '/../common/bids');

module.exports = function(api) {
  // view bid
  bids.route('/:bidId')
  .get(function(req, res) {
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({bid: models.bid}); }
    });
  });

  // update bid, admin only
  bids.route('/edit')
  .post(auth, function(req, res) {
    // updating bids is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.params.bidId = req.body.bidId;
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); return res.json(err); }
      bidsCommon.updateBid(req, models, function(err, body) {
        if(err) { console.log(err); res.json(err); }
        else { res.json(body); }
      });
    });
  });

  // create bid
  bids.route('/')
  .post(auth, function(req, res) {
    req.model.load('auctionUser', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); return res.json(err); }
      bidsCommon.newBid(req, models, function(err, body) {
        if (err) { console.log(err); res.json(err); }
        else { res.json(body); }
      });
    });
  });

  // delete bid, admin only
  bids.route('/:bidId')
  .delete(auth, function(req, res) {
    // deleting bids is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }

    req.model.load('bid', req);
    req.model.end(function(err, models) {
      bidsCommon.deleteBid(req, models, function(results) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(results); }
      });
    });
  });

  api.use('/bids', bids);
};
