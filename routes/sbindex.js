var _ = require('lodash');
var moment = require('moment');
var probability = require('../auction_probability');
var config = require('../config');

module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);

    var minutes = config.antiSnipeMinutes;

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
      
      // auction probabilities
      probability.probability(auction);

      // add target="_blank" to auction description
      var targetBlank = '<a target="_blank"';
      auction.description = auction.description.replace('<a', targetBlank);
    });

    // serverTime 
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

    // number of reservedSlots
    var reservedSlots = config.ads.reservedSlots;

    res.render('sbindex', {
      auctionsOpen: sortedOpen,
      minutes: minutes,
      reservedSlots: reservedSlots,
      serverTime: serverTime,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
