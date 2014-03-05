exports = module.exports = function(req, res) {
  req.model.load('auctionsOpen', req);
  req.model.load('auctionsClosed', req);
  req.model.load('auctionsComing', req);
  req.model.load('auctionsPast', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);
    res.render('admin',
      {
        auctionsOpen: models.auctionsOpen,
        auctionsClosed: models.auctionsClosed,
        auctionsComing: models.auctionsComing,
        auctionsPast: models.auctionsPast,
        browsePrefix: req.browsePrefix,
        user: req.user
      }
    );
  });
};
