module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('history', {
      auctions: models.auctionsTimeRelative.closed,
      browsePrefix: req.browsePrefix
    });
  });
};
