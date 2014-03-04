var db = require(__dirname + '/../db');

module.exports = {
  showBidsPerAuction: function(req, res) {
    // TODO: 
    // req.model.load('auction', req);
    // req.model.end(function(err, models) {
    //   if (err) console.log(err);
    //   console.log(JSON.stringify(models));
    //   res.render('auction', {auction: models.auction, user: req.user});
    // });
  },

  // POST bid
  newBid: function(req, res) {
    var bid = req.body;
    bid.username = req.user;

    db.newBid(bid, function(err, body, header) {
      if (err) {
        console.log('[bid.insert] ', err.message);
        return;
      }
      console.log(body);
    });

    console.log(req.body);
    res.redirect('/sb/');
  }
};

