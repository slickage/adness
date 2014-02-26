module.exports = function(req, res) {
  req.model.load('auctionsOpen', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('index', {auction: models.auctionsOpen, user: req.user});
  });
};
