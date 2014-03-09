var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');
var biddingAlg = require('./bidding');

var db = {
  newAuction: function(body, cb) {
    var auction = {
      start: Number(body.start),
      end: Number(body.end),
      slots: Number(body.slots) || 0,
      type: 'auction',
      enabled: true
    };
    couch.insert(auction, cb);
  },
  updateAuction: function(auction, cb) {
    couch.insert(auction, cb);
  },
  allAuctions: function(cb) {
    var currentTime = new Date().getTime();
    couch.view('adness', 'auctions', function(err, body) {
      if (!err) {
        var auctions = [];
        body.rows.forEach(function(doc) {
          var value = doc.value;
          var open = (currentTime >= value.start && currentTime < value.end) && value.enabled;
          value.open = open;
          auctions.push(value);
        });
        cb(null, auctions);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  auctionsTimeRelative: function(cb) {
    var currentTime = new Date().getTime();
    var auctions = {
      open: [],
      closed: [],
      future: [],
      past: []
    };
    couch.view('adness', 'auctions', function(err, body) {
      if (!err) {
        body.rows.forEach(function(doc) {
          var value = doc.value;
          var open = (currentTime >= value.start && currentTime < value.end) && value.enabled;
          value.open = open;
          
          if ((currentTime >= value.start && currentTime < value.end) && value.enabled) {
            auctions.open.push(value);
          }
          else if ((currentTime >= value.start && currentTime < value.end) && !value.enabled) {
            auctions.closed.push(value);
          }
          else if (value.start > currentTime) {
            auctions.future.push(value);
          }
          else if (value.end < currentTime) {
            auctions.past.push(value);
          }
        });
        cb(null, auctions);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  getAuction: function(auctionId, cb) {
    couch.get(auctionId, null, function(err, body) {
      if (!err) {
        var currentTime = new Date().getTime();
        var open = (currentTime >= body.start &&
            currentTime < body.end) &&
            body.enabled;
        body.open = open;
        cb(null, body);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  getBidsPerAuction: function (auctionId, cb) {
    var key = auctionId;
    couch.view('adness', 'auctionBids', {startkey: [key,0, 0, 0], endkey: [key,1, {}, {}]}, function(err, body) {
      if (!err) {
        var bids = [];
        body.rows.forEach(function(bid) {
          bids.push(bid.value);
        });
        cb(null, bids);
      }
      else {
        cb(err, undefined);
      }
    });
  },
  appendBidsToAuction: function(auction, cb) {
    var key = auction._id;
    var params = {startkey: [key,0, 0, 0], endkey: [key,1, {}, {}]};
    couch.view('adness', 'auctionBids', params, function(err, body) {
      if (!err) {
        // first object is the auction itself
        var openAuction = body.rows.splice(0,1)[0].value;
        // the rest of the array are the bids

        // parse out the bids
        var bids = [];
        body.rows.forEach(function(rawBids) {
          bids.push(rawBids.value);
        });

        // figure out winning bids
        var results = biddingAlg(Number(openAuction.slots), bids);

        // add winning bids and bids per slot to openAuction
        auction.winningBids = results.winningBids;
        auction.bidPerSlot = results.bidPerSlot;

        cb(null, auction);
      }
      else { cb(err, undefined); }
    });
  },
  newBid: function(body, cb) {
    // get auction first to see if it's open
    couch.get(body.auctionId, null, function(err, auction) {
      if (!err) {
        // check to see if auction is open
        var currentTime = new Date().getTime();
        if ((currentTime >= auction.start &&
             currentTime < auction.end) &&
            auction.enabled) {

          // auction is open so make the bid
          var bid = {
            created_at: new Date().getTime(),
            type: 'bid',
            price: Number(body.price),
            slots: Number(body.slots),
            user: body.username,
            auctionId: body.auctionId
          };
          couch.insert(bid, cb);
        }
        else {
          // auction is not open
          cb({ message: "Auction is not open." }, undefined);
        }
      }
      else { cb(err, undefined); }
    });
  }
};


module.exports = db;
