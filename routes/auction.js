var config = require(__dirname + '/../config');
var nano = require('nano')(config.couchdb.url);
var db = require(__dirname + '/../db');

module.exports = {
  addAuction: function(req, res) {
    /*
    req.model.load('auction', req);
    req.model.end(function(err, models) {
      if (err) console.log('error: ' + JSON.stringify(err));
      res.render('index', {auction: models.auction, user: req.user});
    })
    */
    var newAuction = req.body;
    newAuction['type'] = 'auction'
    var db = nano.use('adness');
    db.insert(newAuction, function(err, body, header) {
      if (err) {
        console.log('[auction.insert] ', err.message);
        return;
      }
      console.log('you have inserted the auction.')
      console.log(body);
    });

    console.log(req.body);
    res.redirect('/');
  }
};

