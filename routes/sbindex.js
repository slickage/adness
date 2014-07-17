/* jshint node: true */
'use strict';

var _ = require('lodash');
var moment = require('moment');
var probability = require('../auction_probability');
var config = require('../config');

module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.load('reservedAds', req);
  req.model.end(function(err, models) {
    if (err) { console.log(err); }

    var minutes = config.antiSnipeMinutes;

    // sort open auctions by start time
    var open = models.auctionsTimeRelative.open;
    var sortedOpen = _.sortBy(open, function(auction) {
      return auction.start;
    });

    sortedOpen.forEach(function(auction) {
      // update auction start and end times
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

      // number of reservedSlots and auction probabilities
      var reservedAds = models.reservedAds || [];
      probability.probability(auction, reservedAds);

      // add target="_blank" to auction description
      var targetBlank = '<a target="_blank"';
      auction.description = auction.description.replace('<a', targetBlank);
    });

    // serverTime 
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

    res.render('sbindex', {
      auctionsOpen: sortedOpen,
      minutes: minutes,
      serverTime: serverTime,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
