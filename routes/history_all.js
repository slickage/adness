module.exports = function(req, res) {
  req.model.load('auctionsClosed', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('history_all', {
      auctions: models.auctionsClosed,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
