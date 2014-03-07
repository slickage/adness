module.exports = function(req, res) {
  console.log(req.browsePrefix);
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('index', {
      auction: models.auctionsTimeRelative.open,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
