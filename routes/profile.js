module.exports = function(req, res) {
  req.model.load('auction', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('profile', {auction: models.auction, user: req.user});
  });
};
