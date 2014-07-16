/* jshint node: true */
'use strict';

var auth = require(__dirname + '/../../middleware/ensure-auth');
var db = require(__dirname + '/../../db');
var express = require('express');
var auctions = express.Router();

module.exports = function(api) {
  // get all auctions sorted by time period (open, closed, future, past)
  auctions.route('/time')
  .get(function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative }); }
    });
  });

  // get all open auctions
  auctions.route('/open')
  .get(function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.open }); }
    });
  });

  // get all closed auctions
  auctions.route('/closed')
  .get(function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.closed }); }
    });
  });

  // get all future auctions
  auctions.route('/future')
  .get(function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.future }); }
    });
  });

  // get all past auctions
  auctions.route('/past')
  .get(function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.past }); }
    });
  });

  // get all bids for an auction (includes winning, primary and secondary)
  auctions.route('/:auctionId/bids')
  .get(function(req, res) {
    req.model.load('bids', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({bids: models.bids}); }
    });
  });

  // get a specific auction by auction's id
  auctions.route('/:auctionId')
  .get(function(req, res) {
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auction: models.auction }); }
    });
  });

  // get all auctions 
  auctions.route('/')
  .get(function(req, res) {
    req.model.load('auctions', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctions }); }
    });
  });

  // enable an auction, admin only
  auctions.route('/enable/:auctionId')
  .post(auth, function(req, res) {
    // enabling auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        // enable auction
        models.auction.enabled = true;
        // save auction
        db.updateAuction(models.auction, function(err, body, header) {
          if (err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });
  
  // disable an auction, admin only
  auctions.route('/disable/:auctionId')
  .post(auth, function(req, res) {
    // disabling auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        // enable auction
        models.auction.enabled = false;
        // save auction
        db.updateAuction(models.auction, function(err, body, header) {
          if (err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });

  // update an auction, admin only
  auctions.route('/edit')
  .post(auth, function(req, res) {
    // updating auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.params.auctionId = req.body.auctionId;
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        var auction = models.auction;
        if (req.body.start) auction.start = req.body.start;
        if (req.body.end) auction.end = req.body.end;
        if (req.body.slots) auction.slots = req.body.slots;
        if (req.body.enabled) auction.enabled = req.body.enabled;
        db.updateAuction(auction, function(err, body) {
          if(err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });

  // create a new auction, admin only
  auctions.route('/')
  .post(auth, function(req, res) {
    // creating auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.newAuction(req.body, function(err, body, header) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  });

  // delete an auction, admin only
  auctions.route(':auctionId')
  .delete(auth, function(req, res) {
    // deleteing auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.deleteAuction(req.params.auctionId, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  });

  api.use('/auctions', auctions);
};
