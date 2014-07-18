/* jshint node: true */
'use strict';

var auctionsCommon = require(__dirname + '/common/auctions');
var moment = require('moment');

module.exports = {
  showAuction: function(req, res) {
    // move userId over for userAds
    if (req.user) { req.params.userId = req.user.userId; }
    req.model.load('auction', req);
    req.model.load('bids', req);
    req.model.load('auctionUser', req);
    req.model.load('userAds', req);
    req.model.load('reservedAds', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        return res.redirect(req.browsePrefix);
      }
      // render view
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var data = auctionsCommon.showAuction(req, models);
      data.serverTime = serverTime;
      data.browsePrefix = req.browsePrefix;
      data.user = req.user;
      res.render('auction', data);
    });
  },
  editAuction: function(req, res) {
    // editing auctions is an admin open function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.load('bids', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var data = auctionsCommon.editAuction(req, models);
      data.serverTime = serverTime;
      data.browsePrefix = req.browsePrefix;
      data.user = req.user;
      res.render('auctionEdit', data);
    });
  },
  enableAuction: function(req, res) {
    // enabling auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect('/admin'); }
      else {
        auctionsCommon.setAuctionEnabled(true, models, function(err, body) {
          if (err) { console.log(err); }
          req.flash('info', 'Auction ' + body.id + ' Enabled.');
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
        auctionsCommon.setAuctionEnabled(false, models, function(err, body) {
          if (err) { console.log(err); }
          req.flash('info', 'Auction ' + body.id + ' Disabled.');
          res.end();
        });
      }
    });
  },
  newAuction: function(req, res) {
    // adding auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    auctionsCommon.newAuction(req, function(err, body) {
      if (err) { console.log(err); }
      req.flash('info', 'Auction ' + body.id + ' Created.');
      res.end();
    });
  },
  updateAuction: function(req, res) {
    // updating auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.params.auctionId = req.body.auctionId;
    req.model.load('auction', req);
    req.model.load('bids', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect('/admin'); }
      else {
        auctionsCommon.updateAuction(req, models, function(err, body) {
          if (err) { console.log(err); return res.end();}
          req.flash('info', 'Auction ' + body.id + ' Updated.');
          res.end();
        });
      }
    });
  },
  deleteAuction: function(req, res) {
    // deleting auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    auctionsCommon.deleteAuction(req, function(err, body) {
      if (err) { console.log(err); }
      req.flash('info', 'Auction ' + body.id + ' Deleted.');
      res.end();
    });
  },
  recalculateAuction: function(req, res) {
    // enabling auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      var message;
      var httpStatus = 200;
      if (err) { console.log(err); message = err.message; httpStatus = 500; }
      auctionsCommon.recalculateAuction(req, message, httpStatus, models, function(status, msg) {
        res.send(status, msg);
      });
    });
  }
};
