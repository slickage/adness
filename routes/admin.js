exports = module.exports = function(req, res) {
  // admin check
  if (!req.user.admin) { return res.redirect(req.browsePrefix); }
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) { console.log(err); }

    // flash messages 
    var infoMessage = req.flash('info');

    res.render('admin',
      {
        auctionsOpen: models.auctionsTimeRelative.open,
        auctionsClosed: models.auctionsTimeRelative.closed,
        auctionsFuture: models.auctionsTimeRelative.future,
        auctionsPast: models.auctionsTimeRelative.past,
        infoMessage: infoMessage,
        browsePrefix: req.browsePrefix,
        user: req.user
      }
    );
  });
};
