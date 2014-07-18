/* jshint node: true */
'use strict';

var auth = require(__dirname + '/../../middleware/ensure-auth');
var express = require('express');
var ads = express.Router();
var adsCommon = require(__dirname + '/../common/ads');

module.exports = function(api) {
  // view reserved ads, admin only
  ads.route('/review')
  .get(auth, function(req, res) {
    req.model.load('reviewAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(adsCommon.getAdsByType(models.reviewAds)); }
    });
  });

  // view approved ads, admin only
  ads.route('/approved')
  .get(auth, function(req, res) {
    req.model.load('approvedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(adsCommon.getAdsByType(models.approvedAds)); }
    });
  });

  // view rejected ads, admin only
  ads.route('/rejected')
  .get(auth, function(req, res) {
    req.model.load('rejectedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(adsCommon.getAdsByType(models.rejectedAds)); }
    });
  });

  // view a specific ad
  ads.route('/:adId')
  .get(function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(adsCommon.getAd(models)); }
    });
  });

  // update an ad
  ads.route('/:adId')
  .post(auth, function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        adsCommon.updateAd(req, models, function(err, body) {
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
    adsCommon.newAd(req, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  });

  // delete an ad
  ads.route('/:adId')
  .delete(auth, function(req, res) {
            console.log('deleting....');

    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        adsCommon.deleteAd(req, models, function(err, body) {
          if (err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  });

  api.use('/ads', ads);
};
