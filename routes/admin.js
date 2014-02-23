exports = module.exports = function(req, res) {
  req.model.load('auctions', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);
    res.render('admin', {auctions: models.auctions, user: req.user});
  });
};
