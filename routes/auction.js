var db = require(__dirname + '/../db');
var _ = require('lodash');
var moment = require('moment');
var config = require('../config');

module.exports = {
  showAuction: function(req, res) {
    // move userId over for userAds
    if (req.user) { req.params.userId = req.user.userId; }
    req.model.load('auction', req);
    req.model.load('bids', req);
    req.model.load('registeredUser', req);
    req.model.load('userAds', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        return res.redirect(req.browsePrefix);
      }

      var auction = models.auction;
      var bids = models.bids;
      var regUser = models.registeredUser;
      var approvedAds = _.filter(models.userAds, function(ad) {
        return ad.inRotation === true;
      });
      // find latest price for this auction
      // var latestPrice;
      // // first check if there are slots open
      // if (auction.slots > auction.bidPerSlot.length) {
      //   latestPrice = 0.50;
      // }
      // else {
      //   // otherwise find the lowest price
      //   var bidLength = auction.winningBids.length - 1;
      //   latestPrice = auction.winningBids[bidLength].price + 0.05;
      // }
      // remove first item because it's the auction
      models.bids.splice(0, 1);

      // preserve auction times
      var auctionStart = auction.start;
      var auctionEnd = auction.end;

      // update start and end time 
      var startTime = moment(auction.start).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var endTime = moment(auction.end).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      startTime += ' (' + moment(auction.start).fromNow() + ')';
      endTime += ' (' + moment(auction.end).fromNow() + ')';
      auction.start = startTime;
      auction.end = endTime;
      var adsStartTime = moment(auction.adsStart).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var adsEndTime = moment(auction.adsEnd).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      adsStartTime += ' (' + moment(auction.adsStart).fromNow() + ')';
      adsEndTime += ' (' + moment(auction.adsEnd).fromNow() + ')';
      auction.adsStart = adsStartTime;
      auction.adsEnd = adsEndTime;

      // update creation time for bids
      bids.forEach(function(bid) {
        var bidTime = moment(bid.created_at).utc().format('YYYY MMMMM D, h:mm:ss A ZZ');
        bid.created_at = bidTime + ' (' + moment(bid.created_at).fromNow() + ')';
      });

      // render view
      res.render('auction', {
        auction: auction,
        auctionStart: auctionStart,
        auctionEnd: auctionEnd,
        bids: bids,
        browsePrefix: req.browsePrefix,
        // latestPrice: latestPrice,
        user: req.user,
        reguser: regUser,
        ads: approvedAds
      });
    });
  },
  editAuction: function(req, res) {
    // editing auctions is an admin open function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {

      // cull regions
      var regions = _.pluck(config.regions, 'name');
      
      if (err) console.log(err);
      res.render('auctionEdit', {
        auction: models.auction,
        regions: regions,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  },
  enableAuction: function(req, res) {
    // enabling auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect('/admin'); }
      else {
        // enable auction
        models.auction.enabled = true;
        // save auction
        db.updateAuction(models.auction, function(err, body, header) {
          if (err) { console.log(err); }
          req.flash('info', "Auction " + body.id + " Enabled.");
          res.end();
        });
      }
    });
  },
  disableAuction: function(req, res) {
    // diabling auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect('/admin'); }
      else {
        // disable auction
        models.auction.enabled = false;
        // save auction
        db.updateAuction(models.auction, function(err, body, header) {
          if (err) { console.log(err); }
          req.flash('info', "Auction " + body.id + " Disabled.");
          res.end();
        });
      }
    });
  },
  newAuction: function(req, res) {
    // adding auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.newAuction(req.body, function(err, body, header) {
      if (err) { console.log(err); }
      req.flash('info', "Auction " + body.id + " Created.");
      res.end();
    });
  },
  updateAuction: function(req, res) {
    // updating auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.params.auctionId = req.body.auctionId;
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect('/admin'); }
      else {
        var auction = models.auction;
        if (req.body.start) auction.start = req.body.start;
        if (req.body.end) auction.end = req.body.end;
        if (req.body.adsStart) auction.adsStart = req.body.adsStart;
        if (req.body.adsEnd) auction.adsEnd = req.body.adsEnd;
        if (req.body.enabled) auction.enabled = req.body.enabled;
        if (req.body.description) auction.description = req.body.description;
        if (req.body.regions) auction.regions = req.body.regions;
        db.updateAuction(auction, function(err, body) {
          if (err) { console.log(err); }
          req.flash('info', "Auction " + body.id + " Updated.");
          res.end();
        });
      }
    });
  },
  deleteAuction: function(req, res) {
    // deleting auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.deleteAuction(req.params.auctionId, function(err, body) {
      if (err) { console.log(err); }
      req.flash('info', "Auction " + body.id + " Deleted.");
      res.end();
    });
  }
};
