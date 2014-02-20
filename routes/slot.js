exports = module.exports = function(req, res) {
  req.model.load('auction', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);
    console.log(JSON.stringify(models));
    res.render('slot', {auction: models.auction, user: req.user});
  });
};
