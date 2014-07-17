/* jshint node: true */
'use strict';

var auth = require(__dirname + '/../../middleware/ensure-auth');
var db = require(__dirname + '/../../db');
var express = require('express');
var bids = express.Router();

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
      if (err) { console.log(err); res.json(err); }
      else {
        var bid = models.bid;
        bid.user = req.user; // add current user
        if (req.body.price) { bid.price = req.body.price; }
        if (req.body.slots) { bid.slots = req.body.slots; }
        db.updateBid(bid, function(err, body) {
          if(err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });

  // create bid
  bids.route('/')
  .post(auth, function(req, res) {
    req.model.load('registeredUser', req);
    req.model.end(function(err, models) {
      var bid = req.body;
      bid.user = req.user; // add current user
      bid.regUser = models.registeredUser;
      db.newBid(bid, function(err, body) {
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
    db.deleteBid(req.params.bidId, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  });

  api.use('/bids', bids);
};
