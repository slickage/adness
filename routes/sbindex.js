var _ = require('lodash');
var moment = require('moment');

module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);

    // var latestAuction, latestBids, latestPrice;
    // if (models.auctionsTimeRelative.open.length > 0) {
    //   latestAuction = models.auctionsTimeRelative.open[0];
    //   latestBids = models.auctionsTimeRelative.open[0].bidPerSlot;
    //   if (latestAuction.winningBids.length > 0) {
    //     latestPrice = latestAuction.winningBids[0].price + 0.05;
    //   }
    //   else { latestPrice = 0.50; }
    // }
    // else {
    //   latestAuction = {};
    //   latestBids = [];
    //   latestPrice = 0.50;
    // }

    // sort open auctions by start time
    var open = models.auctionsTimeRelative.open;
    var sortedOpen = _.sortBy(open, function(auction) {
      return auction.start;
    });

    // update auction start and end times
    sortedOpen.forEach(function(auction) {
      var startTime = moment(auction.start).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var endTime = moment(auction.end).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      startTime += ' (' + moment(auction.start).fromNow() +')';
      endTime += ' (' + moment(auction.end).fromNow() + ')';
      auction.start = startTime;
      auction.end = endTime;

      var adsStartTime = moment(auction.adsStart).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var adsEndTime = moment(auction.adsEnd).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      adsStartTime += ' (' + moment(auction.adsStart).fromNow() +')';
      adsEndTime += ' (' + moment(auction.adsEnd).fromNow() + ')';
      auction.adsStart = adsStartTime;
      auction.adsEnd = adsEndTime;
    });

    res.render('sbindex', {
      auctionsOpen: sortedOpen,
      // latestAuction: latestAuction,
      // latestAuctionBids: latestBids,
      // latestPrice: latestPrice,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
