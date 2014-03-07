module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    var latestAuction, latestBids;
    if (models.auctionsTimeRelative.open.length > 0) {
      latestAuction = models.auctionsTimeRelative.open[0];
      latestBids = models.auctionsTimeRelative.open[0].bidPerSlot;
    }
    else {
      latestAuction = { _id: undefined };
      latestBids = [];
    }

    res.render('sbindex', {
      auctionsOpen: models.auctionsTimeRelative.open,
      latestAuction: latestAuction,
      latestAuctionBids: latestBids,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
