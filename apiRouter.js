module.exports = {
  auction: function(req, res) {
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      console.log(JSON.stringify(models));
      res.json({ auction: models.auction });
    });

  },
  auctions: function(req, res) {
    req.model.load('auctions', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({ auctions: models.auctions });
    });
  },
  auctionsOpen: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({ auctions: models.auctionsTimeRelative.open });
    });
  },
  auctionsClosed: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({ auctions: models.auctionsTimeRelative.closed });
    });
  },
  auctionsFuture: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({ auctions: models.auctionsTimeRelative.future });
    });
  },
  auctionsPast: function(req, res) {
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({ auctions: models.auctionsTimeRelative.past });
    });
  },
  bids: function(req, res) {
    req.model.load('bids', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({bids: models.bids});
    });
  },
  bid: function(req, res) {
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.json({bid: models.bid});
    });
  }
};

