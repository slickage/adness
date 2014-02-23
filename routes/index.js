module.exports = function(req, res) {
  req.model.load('auctions', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('index', {auction: models.auction, user: req.user});
  });
};
