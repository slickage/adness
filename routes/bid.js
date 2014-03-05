var db = require(__dirname + '/../db');

module.exports = {
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

