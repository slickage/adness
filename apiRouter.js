var db = require(__dirname + '/db');

module.exports = {
  newAuction: function(req, res) {
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
    console.log(req.params.auctionId);
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
    db.deleteBid(req.params.bidId, function(err, body) {
      if (err) { console.log(err); res.json(err); }
      else { res.json(body); }
    });
  }
};

