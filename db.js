var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');
var biddingAlg = require('./bidding');
var validate = require('./validation');

var db = {
  newAuction: function(body, cb) {
    // validate input
    if (!validate.createAuction(body.start, body.end, body.slots)) {
      return cb({ message: 'Auction parameters were not valid.' }, undefined);
    }

    var auction = {
      start: Number(body.start),
      end: Number(body.end),
      slots: Number(body.slots),
      type: 'auction',
      enabled: true
    };
    couch.insert(auction, cb);
  },
  updateAuction: function(auction, cb) {
    // ensure that the auction exists first
    couch.get(auction._id, null, function(err, body) {
      if (!err) {
        // make sure we're getting an auction
        if (body.type !== 'auction') {
          return cb({ message: 'Id is not for an auction.'}, undefined );
        }

        // validate input
        if (!validate.updateAuction(auction.start, auction.end, auction.slots)) {
          return cb({ message: 'Auction parameters were not valid.'}, undefined );
        }
        
        // copy over on the allowed values into the retrieved auction
        if (auction.start) body.start = Number(auction.start);
        if (auction.end) body.end = Number(auction.end);
        if (auction.slots) body.slots = Number(auction.slots);
        // handle both boolean and String true/false
        if (String(auction.enabled).toLowerCase()  === "true") {
          body.enabled = true;
        }
        else if (String(auction.enabled).toLowerCase() === "false") {
          body.enabled = false;
        }
        // update auction
        couch.insert(body, cb);
      }
      else { cb(err, undefined); }
    });
  },
  deleteAuction: function(auctionId, cb) {
    // ensure that the auction exists first
    couch.get(auctionId, null, function(err, body) {
      if (!err) {
        // make sure we're getting an auction
        if (body.type !== 'auction') {
          return cb({ message: 'Id is not for an auction.'}, undefined );
        }
        
        // delete associated bids?
        couch.destroy(auctionId, body._rev, cb);
      }
      else { cb(err, undefined); }
    });
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
      else { cb(err, undefined); }
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
        if (body.type !== 'auction') {
          return cb({ message: 'Id is not for an auction.'}, undefined );
        }
        var currentTime = new Date().getTime();
        var open = (currentTime >= body.start &&
            currentTime < body.end) &&
            body.enabled;
        body.open = open;
        cb(null, body);
      }
      else { cb(err, undefined); }
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
      else { cb(err, undefined); }
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
  getBid: function(bidId, cb) {
    couch.get(bidId, null, function(err, body) {
      if (!err) {
        if (body.type !== "bid") {
          return cb({ message: "Id is not for a bid." }, undefined);
        }
        cb(null, body);
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

          // validate input
          if (!validate.createBid(body.price, body.slots)) {
            return cb({ message: 'Bid parameters were not valid.' }, undefined);
          }

          // auction is open so make the bid
          var bid = {
            created_at: new Date().getTime(),
            type: 'bid',
            price: Number(body.price),
            slots: Number(body.slots),
            user: body.user,
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
  },
  updateBid: function(bid, cb) {
    // ensure that the bid exists first
    couch.get(bid._id, null, function(err, body) {
      if (!err) {
        // ensure what we got is a bid
        if (body.type !== 'bid') {
          return cb({ message: 'Id is not for a bid.'}, undefined );
        }

        // deprecated since only admins could possibly update bids
        // check that this user is the same user as the bid
        // if (body.user.username !== bid.user.username) {
        //   return cb({ message: "Editing another users bid is not allowed."}, undefined);
        // }

        // check that this is the right bid and revision
        couch.get(body.auctionId, null, function(err, auction) {
          if (!err) {
            if (auction.type !== 'auction') {
              return cb({ message: 'Id is not for an auction.'}, undefined );
            }

            // check that the auction is open
            var currentTime = new Date().getTime();
            var open = (currentTime >= auction.start &&
                        currentTime < auction.end) &&
                        auction.enabled;
            if (open === true) {
              // validate input
              if (!validate.updateBid(bid.price, bid.slots)) {
                return cb({ message: 'Bid parameters were not valid.'}, undefined );
              }

              if (bid.price) body.price = Number(bid.price);
              if (bid.slots) body.slots = Number(bid.slots);
              couch.insert(body, cb);
            }
            else {
              cb({ message: "This auction is not open."}, undefined);
            }
          }
          else { cb(err, undefined); }
        });
      }
      else { cb(err, undefined); }
    });
  },
  deleteBid: function(bidId, cb) {
    // ensure that the auction exists first
    couch.get(bidId, null, function(err, body) {
      if (!err) {
        // make sure we're getting a bid
        if (body.type !== 'bid') {
          return cb({ message: 'Id is not for a bid.'}, undefined );
        }

        // this should be an admin function so we don't need to 
        // check that the user is the same
        
        couch.destroy(bidId, body._rev, cb);
      }
      else { cb(err, undefined); }
    });
  },
  newAd: function(body, cb) {
    // validate input
    if (!validate.createAd(body.html)) {
      return cb({ message: 'Ad HTML was not valid.' }, undefined);
    }

    // validate submitted
    var submitted = false;
    if (String(body.submitted).toLowerCase()  === "true") {
      submitted = true;
    }
    else if (String(body.submitted).toLowerCase() === "false") {
      submitted = false;
    }

    var ad = {
      html: body.html,
      username: body.user.username,
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'ad',
      approved: false,
      submitted: submitted
    };
    couch.insert(ad, cb);
  },
  getAd: function(adId, cb) {
    couch.get(adId, null, function(err, body) {
      if (!err) {
        if (body.type !== 'ad') {
          return cb({ message: 'Id is not for an ad.'}, undefined );
        }
        cb(null, body);
      }
      else { cb(err, undefined); }
    });
  },
  getUserAds: function(username, cb) {
    var key = username;
    couch.view('adness', 'userAds', {startkey: [key, 0], endkey: [key, {}]}, function(err, body) {
      if (!err) {
        var ads = [];
        body.rows.forEach(function(ad) {
          ads.push(ad.value);
        });
        cb(null, ads);
      }
      else { cb(err, undefined); }
    });
  },
  updateAd: function(ad, cb) {
    // ensure that the ad exists first
    couch.get(ad._id, null, function(err, body) {
      if (!err) {
        // make sure we're getting an ad
        if (body.type !== 'ad') {
          console.log(body.type);
          return cb({ message: 'Id is not for an ad.'}, undefined );
        }

        // validate input
        if (!validate.updateAd(ad.html)) {
          return cb({ message: 'Ad HTML was not valid.'}, undefined );
        }
        
        // validate user (TODO: remove for admin)
        if (body.username !== ad.username) {
          return cb({ message: "Editing another user's ad is not allowed."}, undefined);
        }

        // copy over on the allowed values into the retrieved ad
        if (ad.html) body.html = ad.html;
        body.modified_at = new Date().getTime();
        // handle both boolean and String true/false
        // TODO: admin validation!!!!
        if (String(ad.approved).toLowerCase()  === "true") {
          body.approved = true;
        }
        else if (String(ad.approved).toLowerCase() === "false") {
          body.approved = false;
        }
        // handle both boolean and String true/false
        if (String(ad.submitted).toLowerCase()  === "true") {
          body.submitted = true;
        }
        else if (String(ad.submitted).toLowerCase() === "false") {
          body.submitted = false;
        }
        // update ad
        couch.insert(body, cb);
      }
      else { cb(err, undefined); }
    });
  },
  deleteAd: function(ad, cb) {
    // ensure that the ad exists first
    couch.get(ad._id, null, function(err, body) {
      if (!err) {
        // make sure we're getting a bid
        if (body.type !== 'ad') {
          return cb({ message: 'Id is not for an ad.'}, undefined );
        }

        // validate user (TODO: remove for admin)
        if (body.username !== ad.user.username) {
          return cb({ message: "Editing another user's ad is not allowed."}, undefined);
        }
        
        couch.destroy(body._id, body._rev, cb);
      }
      else { cb(err, undefined); }
    });
  }
};


module.exports = db;
