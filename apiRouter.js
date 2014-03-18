var db = require(__dirname + '/db');

module.exports = {
  newAuction: function(req, res) {
    // creating auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.newAuction(req.body, function(err, body, header) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  },
  auction: function(req, res) {
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auction: models.auction }); }
    });
  },
  auctions: function(req, res) {
    req.model.load('auctions', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctions }); }
    });
  },
  auctionsTime: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative }); }
    });
  },
  auctionsOpen: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.open }); }
    });
  },
  auctionsClosed: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.closed }); }
    });
  },
  auctionsFuture: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.future }); }
    });
  },
  auctionsPast: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ auctions: models.auctionsTimeRelative.past }); }
    });
  },
  enableAuction: function(req, res) {
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
  },
  disableAuction: function(req, res) {
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
  },
  updateAuction: function(req, res) {
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
  },
  deleteAuction: function(req, res) {
    // deleteing auctions is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.deleteAuction(req.params.auctionId, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  },
  newBid: function(req, res) {
    var bid = req.body;
    bid.user = req.user; // add current user
    db.newBid(bid, function(err, body, header) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  },
  bids: function(req, res) {
    req.model.load('bids', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({bids: models.bids}); }
    });
  },
  bid: function(req, res) {
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({bid: models.bid}); }
    });
  },
  updateBid: function(req, res) {
    // updating bids is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.params.bidId = req.body.bidId;
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        var bid = models.bid;
        bid.user = req.user; // add current user
        if (req.body.price) bid.price = req.body.price;
        if (req.body.slots) bid.slots = req.body.slots;
        db.updateBid(bid, function(err, body) {
          if(err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  },
  deleteBid: function(req, res) {
    // deleting bids is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    db.deleteBid(req.params.bidId, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  },
  newAd: function(req, res) {
    var ad = req.body;
    ad.user = req.user;
    db.newAd(ad, function(err, body, header) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  },
  getAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else { res.json({ ad: models.ad }); }
    });
  },
  updateAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.json(err); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        if (req.body.html) ad.html = req.body.html;
        if (req.body.approved) ad.approved = req.body.approved;
        if (req.body.submitted) ad.submitted = req.body.submitted;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); res.json(err); }
          else { res.json(body); }
        });
      }
    });
  },
  deleteAd: function(req, res) {
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
  }
};

