var db = require(__dirname + '/../db');

module.exports = {
  // POST bid
  newBid: function(req, res) {
    // add username to bid (should alrady be authenticated)
    var bid = req.body;
    bid.username = req.user;

    db.newBid(bid, function(err, body, header) {
      if (err) { console.log('[bid.insert] ', err.message); }
      res.redirect('/sb/');
    });
  }
};

