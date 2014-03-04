module.exports = function(req, res) {
  console.log(req.browsePrefix);
  req.model.load('auctionsOpen', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));
    res.render('sbindex', {
      auctionsOpen: models.auctionsOpen,
      latestAuction: models.auctionsOpen[0],
      latestAuctionBids: models.auctionsOpen[0].bidPerSlot || [],
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
