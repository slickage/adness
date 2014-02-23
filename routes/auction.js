var db = require(__dirname + '/../db');

module.exports = {
  showAuction: function(req, res) {
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      console.log(JSON.stringify(models));
      res.render('auction', {auction: models.auction, user: req.user});
    });
  },

  // POST auction
  newAuction: function(req, res) {
    /*
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) console.log('error: ' + JSON.stringify(err));
      res.render('index', {auction: models.auction, user: req.user});
    })
    */

    db.newAuction(req.body, function(err, body, header) {
      if (err) {
        console.log('[auction.insert] ', err.message);
        return;
      }
      console.log(body);
    });

    console.log(req.body);
    res.redirect('/');
  }
};

