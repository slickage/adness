var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');

var db = {
  newAuction: function(body, cb) {
    var auction = {
      start: Date(),
      end: Date(),
      slots: body.slots || 0,
      type: 'auction'
    };
    couch.insert(auction, cb);
  },
  allAuctions: function(cb) {
    console.log('all auctions');
    couch.view('adness', 'auctions', function(err, body) {
      if (!err) {
        body.rows.forEach(function(doc) {
          console.log(doc.value);
        });
        cb(null, body.rows);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  getAuction: function(auctionId, cb) {
    couch.get(auctionId, null, function(err, body) {
      if (!err) {
        cb(null, body);
      }
      else {
        cb(err, undefined);
      }
    });
  }
};


module.exports = db;
