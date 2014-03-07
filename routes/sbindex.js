module.exports = function(req, res) {
  console.log(req.browsePrefix);
  req.model.load('auctionsOpen', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    var latestAuction, latestBids;
    if (models.auctionsOpen.length > 0) {
      latestAuction = models.auctionsOpen[0];
      latestBids = models.auctionsOpen[0].bidPerSlot;
    }
    else {
      latestAuction = { _id: undefined };
      latestBids = [];
    }

    res.render('sbindex', {
      auctionsOpen: models.auctionsOpen,
      latestAuction: latestAuction,
      latestAuctionBids: latestBids,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
