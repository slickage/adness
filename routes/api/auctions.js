var db = require(__dirname + '/../../db');
var uuid = require('node-uuid');

exports.findAll = function(req, res) {
  var params = {'include_docs': 'true'};
  db.mainBucket.view('auctions', 'auctions').query({limit: 10}, function(err, results) {
    console.log(results);
    res.json({success: true});
  });
}

exports.addAuction = function(req, res) {
  var auction = req.body;
  var auctionId = uuid.v4();
  console.log('addAuction: ' + auctionId);
  db.mainBucket.set(auctionId, auction, function(err, result) {
    if (err) throw err;
    res.json({created: true});
  });
}
