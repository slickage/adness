var db = require(__dirname + '/../db');

module.exports = {
  showAuction: function(req, res) {
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.render('auction', {auction: models.auction, user: req.user});
    });
  },
  enableAuction: function(req, res) {
    // get auction by ID
    db.getAuction(req.params.auctionId, function(err, auction) {
      if (!err) {
        // enable auction
        auction.enabled = true;
        // save
        db.updateAuction(auction, function(err, body, header) {
          if (err) { res.json({ err: err }); }
          else { res.redirect('/admin'); }
        });
      }
      else {
        res.json({ err: "Auction not found." });
      }
    });
  },
  disableAuction: function(req, res) {
    // get auction by ID
    db.getAuction(req.params.auctionId, function(err, auction) {
      if (!err) {
        // disable auction
        auction.enabled = false;
        // save?
        db.updateAuction(auction, function(err, body, header) {
          if (err) { res.json({ err: err }); }
          else { res.redirect('/admin'); }
        });
      }
      else {
        res.json({ err: "Auction not found." });
      }
    });
  },
  newAuction: function(req, res) {
    db.newAuction(req.body, function(err, body, header) {
      if (err) { return; }
    });
    res.redirect('/admin');
  }
};

