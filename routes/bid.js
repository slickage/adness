var db = require(__dirname + '/../db');

module.exports = {
  // POST bid
  newBid: function(req, res) {
    var bid = req.body;
    bid.user = req.user; // add current user
    db.newBid(bid, function(err, body, header) {
      if (err) { console.log(err); }
      res.redirect(req.browsePrefix);
    });
  },
  updateBid: function(req, res) {
    req.params.bidId = req.body.bidId;
    req.model.load('bid', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var bid = models.bid;
        bid.user = req.user; // add current user
        if (req.body.price) bid.price = req.body.price;
        if (req.body.slots) bid.slots = req.body.slots;
        db.updateBid(bid, function(err, body) {
          if(err) { console.log(err); }
          res.redirect(req.browsePrefix);
        });
      }
    });
  }
};

