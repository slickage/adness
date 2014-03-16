exports = module.exports = function(req, res) {
  req.model.load('ad', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);

    res.render('ad_upload', {
      ad: models.ad,
      browsePrefix: req.browsePrefix,
      user: req.user});
  });
};
