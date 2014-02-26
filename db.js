var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');

var db = {
  newAuction: function(body, cb) {
    console.log(body);
    var auction = {
      start: new Date(body.startDate + ' ' + body.startTime).getTime(),
      end: new Date(body.endDate + ' ' + body.endTime).getTime(),
      slots: body.slots || 0,
      type: 'auction',
      enabled: true
    };
    couch.insert(auction, cb);
  },
  allAuctions: function(cb) {
    var currentTime = new Date().getTime();
    console.log('all auctions');
    couch.view('adness', 'auctions', function(err, body) {
      if (!err) {
        body.rows.forEach(function(doc) {
          var value = doc.value;
          console.log(currentTime);
          console.log(value.start);
          console.log(value.end);
          var open = (currentTime >= value.start && currentTime < value.end) && value.enabled;
          value.open = open;
          console.log(value);
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
  },
  auctionsOpen: function(cb) {
    couch.view('adness', 'auctionsOpen', function(err, body) {
      if (!err) {
        cb(null, body.rows);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  auctionsClosed: function(cb) {
    couch.view('adness', 'auctionsClosed', function(err, body) {
      if (!err) {
        cb(null, body.rows);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  getBidsPerAuction: function (auctionId, cb) {
    var startkey = [];
    startkey.push(parseInt(auctionId));
    startkey.push(0);
    console.log(startkey);
    var endkey = [];
    endkey.push(parseInt(auctionId));
    endkey.push({});
    console.log(endkey);
    couch.view('adness', 'auctionBids', {startkey: [1,0], endkey: [1,1]}, function(err, body) {
      console.log("body");
      console.log(body);
      if (!err) {
        cb(null, body.rows);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  newBid: function(body, cb) {
    console.log(body);
    var bid = {
      created_at: new Date().getTime(),
      type: 'bid',
      price: body.price,
      slots: body.slots,
      auctionId: body.auctionId
    };
    couch.insert(bid, cb);
  }
};


module.exports = db;
