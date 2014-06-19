var _ = require('lodash');
var moment = require('moment');
var config = require('../config');

module.exports = {
  auctions: function(req, res) {
    // admin check
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auctionsTimeRelative', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }

      // past auctions sorted by end time (most recent first)
      var past = models.auctionsTimeRelative.past;
      var sortedPast = _.sortBy(past, function(auction) {
        return -auction.end;
      });

      formatAuctionTime(sortedPast);

      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

      res.render('ai_auctions', {
        auctionsPast: sortedPast,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  },
  invoices: function(req, res) {
    // admin check
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('auction_invoices', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }

      var invoices = models.auction_invoices;
      var auctionId = req.params.auctionId;
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

      res.render('ai_invoices', {
        auctionId: auctionId,
        invoices: invoices,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  }
};

function formatAuctionTime(auctions) {
  auctions.forEach(function(auction) {
    var startTime = moment(auction.start).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
    var endTime = moment(auction.end).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
    startTime += ' (' + moment(auction.start).fromNow() +')';
    endTime += ' (' + moment(auction.end).fromNow() + ')';
    auction.start = startTime;
    auction.end = endTime;

    var adsStartTime = moment(auction.adsStart).utc();
    adsStartTime = adsStartTime.format('YYYY MMMM D, h:mm:ss A ZZ');
    adsStartTime += ' (' + moment(auction.adsStart).utc().fromNow() + ')';
    auction.adsStart = adsStartTime;
    var adsEndTime = moment(auction.adsEnd).utc();
    adsEndTime = adsEndTime.format('YYYY MMMM D, h:mm:ss A ZZ');
    adsEndTime += ' (' + moment(auction.adsEnd).utc().fromNow() + ')';
    auction.adsEnd = adsEndTime;
  });
}