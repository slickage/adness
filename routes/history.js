var _ = require('lodash');
var moment = require('moment');

module.exports = function(req, res) {
  req.model.load('auctionsTimeRelative', req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    var auctions = models.auctionsTimeRelative.past;
    var sortedPast = _.sortBy(auctions, function(auction) {
      return -auction.end;
    });

    sortedPast.forEach(function(auction) {
      var startTime = moment(auction.start).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      var endTime = moment(auction.end).utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      startTime += ' (' + moment(auction.start).fromNow() +')';
      endTime += ' (' + moment(auction.end).fromNow() + ')';
      auction.start = startTime;
      auction.end = endTime;
    });

    // serverTime 
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

    res.render('history', {
      auctions: sortedPast,
      serverTime: serverTime,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
