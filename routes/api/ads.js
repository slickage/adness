/* jshint node: true */
'use strict';

var auth = require(__dirname + '/../../middleware/ensure-auth');
var db = require(__dirname + '/../../db');
var express = require('express');
var ads = express.Router();

module.exports = function(api) {
  // view reserved ads, admin only
  ads.route('/review')
  .get(auth, function(req, res) {
    req.model.load('reviewAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ ad: models.reviewAds }); }
    });
  });

  // view approved ads, admin only
  ads.route('/approved')
  .get(auth, function(req, res) {
    req.model.load('approvedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ ad: models.approvedAds }); }
    });
  });

  // view rejected ads, admin only
  ads.route('/rejected')
  .get(auth, function(req, res) {
    req.model.load('rejectedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ ad: models.rejectedAds }); }
    });
  });

  // view a specific ad
  ads.route('/:adId')
  .get(function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ ad: models.ad }); }
    });
  });

  // update an ad
  ads.route('/:adId')
  .post(auth, function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        if (req.body.html) { ad.html = req.body.html; }
        if (req.body.approved) { ad.approved = req.body.approved; }
        if (req.body.submitted) { ad.submitted = req.body.submitted; }
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });

  // create a new ad
  ads.route('/')
  .post(auth, function(req, res) {
    var ad = req.body;
    ad.user = req.user;
    db.newAd(ad, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  });

  // delete an ad
  ads.route('/:adId')
  .delete(auth, function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        db.deleteAd(ad, function(err, body) {
          if (err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });

  api.use('/ads', ads);
};
