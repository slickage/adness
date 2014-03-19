module.exports = function(req, res) {
  res.render('rules', {
    browsePrefix: req.browsePrefix,
    user: req.user
  });
};

