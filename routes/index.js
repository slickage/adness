module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);
    res.render('index', {
      auction: models.auctionsTimeRelative.open,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
