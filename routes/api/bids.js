var uuid = require('node-uuid');

exports.findAll = function(req, res) {
  res.json({foo: 'bar'});
}

exports.addBid = function(req, res) {
  var auction = req.body;
  var auctionId = uuid.v4();
  console.log('Adding auction: ' + auctionId);
  res.json({created: true});
}
