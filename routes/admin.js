exports = module.exports = function(req, res) {
  req.model.load('auctionsOpen', req);
  req.model.load('auctionsClosed', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);
    res.render('admin',
      {
        auctionsOpen: models.auctionsOpen,
        auctionsClosed: models.auctionsClosed,
        browsePrefix: req.browsePrefix,
        user: req.user
      }
    );
  });
};
