exports = module.exports = function(req, res) {
  req.model.load('auction', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);
    res.render('ad_upload', {
      auction: models.auction,
      browsePrefix: req.browsePrefix,
      user: req.user});
  });
};
