module.exports = function(req, res) {
  req.model.load('auction', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    console.log('user: ' + JSON.stringify(req.user));
    res.render('index', {auction: models.auction, user: req.user});
  });
};
