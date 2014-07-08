/* jshint node: true */
'use strict';

var _ = require('lodash');
var moment = require('moment');
var config = require('../config');
var db = require('../db');

module.exports = {
  showAds: function(req, res) {
    // admin check
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('reservedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }

      // reservedAds 
      var ads = models.reservedAds;

      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

      // sort bids by time
      ads = _.sortBy(ads, function(ad) { return ad.created_at; });

      res.render('reservedAds', {
        ads: ads,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  },
  newAd: function(req, res) {
    // cull regions
    var regions = _.pluck(config.regions, 'name');

    // serverTime 
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

    res.render('reservedAd_upload', {
      ad: undefined,
      regions: regions,
      serverTime: serverTime,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  },
  editAd: function(req, res) {
    req.model.load('reservedAd', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        return res.redirect("/admin/ads/reserved");
      }

      if (models.reservedAd) {
        var ad = models.reservedAd;

        // cull regions
        var regions = _.pluck(config.regions, 'name');

        // serverTime 
        var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

        res.render('reservedAd_upload', {
          ad: ad,
          regions: regions,
          serverTime: serverTime,
          browsePrefix: req.browsePrefix,
          user: req.user
        });
      }
    });
  },
  createAd: function(req, res) {
    req.body.user = req.user;

    // don't allow ads with no regions
    if (req.body.regions.length === 0) {
      return res.send(500, "No Regions found in this ad.");
    }

    db.newReservedAd(req.body, function(err, body, header) {
      if (err) { console.log(err); }
      return res.json({ok: true});
    });
  },
  updateAd: function(req, res) {
    req.model.load('reservedAd', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        return res.send(500, "No Reserved Ad found with this id.");
      }
      else {
        var ad = models.reservedAd;

        // don't allow ads with no regions
        if (req.body.regions.length === 0) {
          return res.redirect(req.browsePrefix);
        }

        if (req.body.html) ad.html = req.body.html;
        if (req.body.css) ad.css = req.body.css;
        if (req.body.regions) ad.regions = req.body.regions;
        if (req.body.in_use) ad.in_use = req.body.in_use;
        db.updateReservedAd(ad, function(err, body) {
          if (err) { console.log(err); }
          return res.json({ok: true});
        });
      }
    });
  },
  deleteAd: function(req, res) {
    req.model.load('reservedAd', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        return res.send(500, "No Reserved Ad found with this id.");
      }
      else {
        var ad = models.reservedAd;
        db.deleteReservedAd(ad._id, function(err, body) {
          if (err) { console.log(err); }
          return res.json({ok: true});
        });
      }
    });
  }
};
