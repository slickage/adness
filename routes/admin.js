exports = module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) { console.log(err); }
    res.render('admin',
      {
        auctionsOpen: models.auctionsTimeRelative.open,
        auctionsClosed: models.auctionsTimeRelative.closed,
        auctionsFuture: models.auctionsTimeRelative.future,
        auctionsPast: models.auctionsTimeRelative.past,
        browsePrefix: req.browsePrefix,
        user: req.user
      }
    );
  });
};
