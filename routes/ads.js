exports = module.exports = function(req, res) {
  req.model.end(function(err, models) {
    if (err) console.log(err);
    console.log(JSON.stringify(models));
    res.render('ads', {
      auction: models.auction,
      browsePrefix: req.browsePrefix,
      user: req.user});
  });
};
