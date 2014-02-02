var couchbase = require('couchbase');
var uuid = require('node-uuid');

exports.findAll = function(req, res) {
  var params = {'include_docs': 'true'};
  var db = new couchbase.Connection({bucket: "auctions"}, function(err) {
    console.log('Querying all auctions with limit.');
    db.view('auctions', 'auctions').query({limit: 10}, function(err, results) {
      console.log(results);
      res.json({success: true});
    });
  });
}

exports.addAuction = function(req, res) {
  var auction = req.body;
  var auctionId = uuid.v4();
  console.log('addAuction: ' + auctionId);
  var db = new couchbase.Connection({bucket: "auctions"}, function(err) {
    if (err) throw err;
    db.set(auctionId, auction, function(err, result) {
      if (err) throw err;
      res.json({created: true});
    });
  });
}
