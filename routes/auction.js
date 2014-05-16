var db = require(__dirname + '/../db');
var _ = require('lodash');

module.exports = {
  showAuction: function(req, res) {
    if (req.user) {
      req.userId = req.user.userId;
    }
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
      var approvedAds = _.filter(models.userAds, function(ad) { return ad.inRotation === true; });
      // find latest price for this auction
      var latestPrice;
      // first check if there are slots open
      if (auction.slots > auction.bidPerSlot.length) {
        latestPrice = 0.50;
      }
      else {
        // otherwise find the lowest price
        var bidLength = auction.winningBids.length - 1;
        latestPrice = auction.winningBids[bidLength].price + 0.05;
      }
      // remove first item because it's the auction
      models.bids.splice(0, 1);
      // render view
      res.render('auction', {
        auction: auction,
        bids: bids,
        browsePrefix: req.browsePrefix,
        latestPrice: latestPrice,
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
      if (err) console.log(err);
      res.render('auctionEdit', {
        auction: models.auction,
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
        if (req.body.slots) auction.slots = req.body.slots;
        if (req.body.enabled) auction.enabled = req.body.enabled;
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
