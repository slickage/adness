exports.bids = function(req, res) {
  res.json({foo:'bar'});
}

exports.auctions = require(__dirname + '/auctions.js');

