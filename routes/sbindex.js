var _ = require('underscore');

module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    var latestAuction, latestBids, latestPrice;
    if (models.auctionsTimeRelative.open.length > 0) {
      latestAuction = models.auctionsTimeRelative.open[0];
      latestBids = models.auctionsTimeRelative.open[0].bidPerSlot;
      if (latestAuction.winningBids.length > 0) {
        latestPrice = latestAuction.winningBids[0].price + 0.05;
      }
      else { latestPrice = 0.50; }
    }
    else {
      latestAuction = {};
      latestBids = [];
      latestPrice = 0.50;
    }

    // sort open auctions by start time
    var open = models.auctionsTimeRelative.open;
    var sortedOpen = _.sortBy(open, function(auction) {
      return auction.start;
    });

    res.render('sbindex', {
      auctionsOpen: sortedOpen,
      latestAuction: latestAuction,
      latestAuctionBids: latestBids,
      latestPrice: latestPrice,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
