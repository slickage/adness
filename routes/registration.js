exports = module.exports = function(req, res) {
  req.model.end(function(err, models) {
    if (err) console.log(err);
    res.render('registration', {
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
