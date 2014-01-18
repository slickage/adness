var couchbase = require('couchbase');
var uuid = require('node-uuid');

exports.findAll = function(req, res) {
  res.json({foo: 'bar'});
}

exports.addBid = function(req, res) {
  var auction = req.body;
  var auctionId = uuid.v4();
  console.log('Adding auction: ' + auctionId);
  var db = new couchbase.Connection({bucket: "auctions"}, function(err) {
    if (err) throw err;
    db.set(auctionId, auction, function(err, result) {
      if (err) throw err;
      res.json({created: true});
    });
  });
}
