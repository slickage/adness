var _ = require('lodash');

module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    var auctions = models.auctionsTimeRelative.past;
    var sortedPast = _.sortBy(auctions, function(auction) {
      return -auction.end;
    });

    res.render('history', {
      auctions: sortedPast,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
