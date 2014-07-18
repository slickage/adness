/* jshint node: true */
'use strict';

var adsCommon = require(__dirname + '/common/ads');
var moment = require('moment');

exports = module.exports = {
  newAd: function(req, res) {
    adsCommon.newAd(req, function(err) {
      if (err) { console.log(err); }
      res.redirect(req.browsePrefix);
    });
  },
  getAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); return res.redirect(req.browsePrefix); }
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var data = adsCommon.getAd(models);
      data.serverTime = serverTime;
      data.browsePrefix = req.browsePrefix;
      data.user = req.user;
      res.render('ads', data);
    });
  },
  updateAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        res.redirect(req.browsePrefix);
      }
      adsCommon.updateAd(req, models, function(err) {
        if (err) { console.log(err); }
        res.redirect(req.browsePrefix);
      });
    });
  },
  deleteAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      adsCommon.deleteAd(req, models, function(err, result) {
        if (err) { console.log(err); res.redirect(req.browsePrefix); }
        res.render(result);
      });
    });
  },
  postDeleteAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      adsCommon.deleteAd(req, models, function(err) {
        if (err) { console.log(err); res.redirect(req.browsePrefix); }
        res.redirect(req.browsePrefix + '/users/' + req.user.userId);
      });
    });
  },
  approveAd: function(req, res) {
    // approving ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      adsCommon.approveAd(req, models, function(err) {
        if (err) { console.log(err); res.redirect(req.browsePrefix); }
        res.redirect(req.browsePrefix + '/users/' + req.user.userId);
      });
    });
  },
  rejectAd: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      adsCommon.rejectAd(req, models, function(err) {
        if (err) { console.log(err); res.redirect(req.browsePrefix); }
        res.redirect(req.browsePrefix + '/users/' + req.user.userId);
      });
    });
  },
  inRotation: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      adsCommon.rotation(true, req, models, function(err) {
        if (err) { console.log(err); res.redirect(req.browsePrefix); }
        res.redirect(req.browsePrefix + '/ads/' + models.ad._id);
      });
    });
  },
  outRotation: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      adsCommon.rotation(false, req, models, function(err) {
        if (err) { console.log(err); res.redirect(req.browsePrefix); }
        res.redirect(req.browsePrefix + '/ads/' + models.ad._id);
      });
    });
  },
  reviewAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('reviewAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var data = adsCommon.getAdsByType(models.reviewAds);
      data.serverTime = serverTime;
      data.browsePrefix = req.browsePrefix;
      data.user = req.user;
      res.render('reviewAds', data);
    });
  },
  approvedAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('approvedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var data = adsCommon.getAdsByType(models.approvedAds);
      data.serverTime = serverTime;
      data.browsePrefix = req.browsePrefix;
      data.user = req.user;
      res.render('approvedAds', data);
    });
  },
  rejectedAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('rejectedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var data = adsCommon.getAdsByType(models.rejectedAds);
      data.serverTime = serverTime;
      data.browsePrefix = req.browsePrefix;
      data.user = req.user;
      res.render('rejectedAds', data);
    });
  },
  random: function(req, res) {
    req.model.load('reservedAds', req);
    req.model.load('randomFactoid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      adsCommon.random(req, models, function(ads) {
        console.log('SHIT' + ads);
        return res.json(ads);
      });
    });
  }
};

