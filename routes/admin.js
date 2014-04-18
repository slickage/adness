var _ = require('underscore');

exports = module.exports = function(req, res) {
  // admin check
  if (!req.user.admin) { return res.redirect(req.browsePrefix); }
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) { console.log(err); }

    // flash messages 
    var infoMessage = req.flash('info');

    // open auctions sorted by start time (most recent first)
    var open = models.auctionsTimeRelative.open;
    var sortedOpen = _.sortBy(open, function(auction) {
      return auction.start;
    });

    // closed auctions sorte by start time (most recent first)
    var closed = models.auctionsTimeRelative.closed;
    var sortedClosed = _.sortBy(closed, function(auction) {
      return auction.start;
    });

    // future auctions sorte by start time (most recent first)
    var future = models.auctionsTimeRelative.future;
    var sortedFuture = _.sortBy(future, function(auction) {
      return auction.start;
    });

    // past auctions sorted by end time (most recent first)
    var past = models.auctionsTimeRelative.past;
    var sortedPast = _.sortBy(past, function(auction) {
      return -auction.end;
    });

    res.render('admin',
      {
        auctionsOpen: sortedOpen,
        auctionsClosed: sortedClosed,
        auctionsFuture: sortedFuture,
        auctionsPast: sortedPast,
        infoMessage: infoMessage,
        browsePrefix: req.browsePrefix,
        user: req.user
      }
    );
  });
};
