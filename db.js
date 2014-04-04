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

    // random true ending time of auction within 30 minutes of end
    var end = Number(body.end);
    var timeDifference = (1000 * 60 * 30);
    var trueEnd = Math.floor(Math.random() * (timeDifference+1));
    trueEnd = new Date(end).getTime() + trueEnd;

    var auction = {
      start: Number(body.start),
      end: end,
      trueEnd: trueEnd,
      slots: Number(body.slots),
      type: 'auction',
      enabled: true
    };
    couch.insert(auction, function(err, body, header) {
      if (err) { return cb(err, body, header); }
      auction._id = body.id;
      timer.addAuction(auction);
      return cb(err, body, header);
    });
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

        // random true ending time of auction within 30 minutes of end
        if (auction.end) {
          var end = Number(auction.end);
          var timeDifference = (1000 * 60 * 30);
          var trueEnd = Math.floor(Math.random() * (timeDifference+1));
          body.trueEnd = new Date(end).getTime() + trueEnd;
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
        couch.insert(body, function(err, data, header) {
          if (err) { return cb(err, data, header); }
          timer.updateAuction(body);
          return cb(err, data, header);
        });
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
        couch.destroy(auctionId, body._rev, function(err, body, header) {
          if(err) { return cb(err, body, header); }
          timer.deleteAuction({ _id: auctionId });
          return cb(err, body, header);
        });
      }
      else { cb(err, undefined); }
    });
  },
  fullAuctions: function(cb) {
    var currentTime = new Date().getTime();
    couch.view('adness', 'auctions', function(err, body) {
      if (!err) {
        var auctions = [];
        body.rows.forEach(function(doc) {
          // check if auction is open
          var value = doc.value;
          var open = (currentTime >= value.start && currentTime < value.trueEnd) && value.enabled;
          value.open = open;
          auctions.push(value);
        });
        cb(null, auctions);
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
          // check if auction is open
          var value = doc.value;
          var open = (currentTime >= value.start && currentTime < value.trueEnd) && value.enabled;
          value.open = open;

          // remove trueEnd from outside view
          delete value.trueEnd;
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
          // check if auction is open
          var open = (currentTime >= value.start && currentTime < value.trueEnd) && value.enabled;
          value.open = open;

          if (value.open) {
            // remove trueEnd from view
            delete value.trueEnd;
            auctions.open.push(value);
          }
          else if ((currentTime >= value.start && currentTime < value.end) && !value.enabled) {
            // remove trueEnd from view
            delete value.trueEnd;
            auctions.closed.push(value);
          }
          else if (value.start > currentTime) {
            // remove trueEnd from view
            delete value.trueEnd;
            auctions.future.push(value);
          }
          else if (value.end < currentTime) {
            // remove trueEnd from view
            delete value.trueEnd;
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
        // check that this is an auction
        if (body.type !== 'auction') {
          return cb({ message: 'Id is not for an auction.'}, undefined );
        }
        
        // figure out if it's open
        var currentTime = new Date().getTime();
        var open = (currentTime >= body.start &&
            currentTime < body.trueEnd) &&
            body.enabled;
        body.open = open;

        // remove true end time from view
        delete body.trueEnd;
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
          if (bid.value.type === 'auction') {
            // figure out if it's open
            var currentTime = new Date().getTime();
            var open = (currentTime >= bid.value.start &&
                currentTime < bid.value.trueEnd) &&
                bid.value.enabled;
            bid.value.open = open;

            // remove true end time from view
            delete bid.value.trueEnd;
          }
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
    // check that user is registered
    var regUser = body.regUser;
    if (regUser.registered !== true) {
      var message = "User is not registered.";
      return cb({ message: message }, undefined);
    }

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

          var bidUser = {
            username: body.user.username,
            userId: body.user.userId,
            email: body.user.email
          };

          // auction is open so make the bid
          var bid = {
            created_at: new Date().getTime(),
            type: 'bid',
            price: Number(body.price),
            slots: Number(body.slots),
            user: bidUser,
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
    // validate html
    var html = validate.html(body.html);

    // validate submitted
    var submitted = false;
    if (String(body.submitted).toLowerCase()  === "true") {
      submitted = true;
    }
    else if (String(body.submitted).toLowerCase() === "false") {
      submitted = false;
    }

    var ad = {
      html: html,
      username: body.user.username,
      userId: body.user.userId,
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
  getUserAds: function(userId, cb) {
    var key = Number(userId); // userId must be a number
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
  getSubmittedAds: function(cb) {
    couch.view('adness', 'submittedAds', function(err, body) {
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
          return cb({ message: 'Id is not for an ad.'}, undefined );
        }

        // validate admin or user
        if (ad.user.admin !== true) {
          if (body.userId !== ad.user.userId) {
            return cb({ message: "Editing another user's ad is not allowed."}, undefined);
          }
        }

        // update html if not approved or submitted
        if (body.approved !== true && body.submitted !== true) {
          if (ad.html) body.html = validate.html(ad.html);
        }

        // update modified_at
        body.modified_at = new Date().getTime();

        // handle both boolean and String true/false
        if (ad.user.admin === true) {
          // admin only booleans
          if (String(ad.approved).toLowerCase()  === "true") {
            body.approved = true;
          }
          else if (String(ad.approved).toLowerCase() === "false") {
            body.approved = false;
          }
          if (String(ad.rejected).toLowerCase()  === "true") {
            body.rejected = true;
          }
          else if (String(ad.rejected).toLowerCase() === "false") {
            body.rejected = false;
          }
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

        // validate user
        if (ad.user.admin !== true) {
          if (body.userId !== ad.user.userId) {
            return cb({ message: "Deleting another user's ad is not allowed."}, undefined);
          }
        }

        couch.destroy(body._id, body._rev, cb);
      }
      else { cb(err, undefined); }
    });
  },
  newBPReceipt: function(newReceipt, cb) {
    var receipt = {
      auctionId: newReceipt.auctionId,
      userId: newReceipt.userId,
      username: newReceipt.username,
      invoiceId: newReceipt.invoiceId || "",
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'bp_receipt'
    };
    couch.insert(receipt, cb);
  },
  getBPReceipt: function(receiptId, cb) {
    couch.get(receiptId, null, function(err, body) {
      if (!err) {
        if (body.type !== 'bp_receipt') {
          return cb({ message: 'Id is not for an BPReceipt.'}, undefined );
        }
        cb(null, body);
      }
      else { cb(err, undefined); }
    });
  },
  updateBPReceipt: function(newReceipt, cb) {
    // ensure that the receipt exists first
    couch.get(newReceipt._id, null, function(err, oldReceipt) {
      if (!err) {
        // make sure we're getting an receipt
        if (oldReceipt.type !== 'bp_receipt') {
          return cb({ message: 'Id is not for an BPReceipt.'}, undefined );
        }

        // update modified_at
        oldReceipt.modified_at = new Date().getTime();
        // update the rest of the values
        oldReceipt.auctionId = newReceipt.auctionId;
        oldReceipt.userId = newReceipt.userId;
        oldReceipt.username = newReceipt.username;
        oldReceipt.invoiceId = newReceipt.invoiceId;

        // update receipt
        couch.insert(oldReceipt, cb);
      }
      else { cb(err, undefined); }
    });
  },
  insertRegisteredUser: function(user, cb) {
    var registeredUser = {
      username: user.username,
      userId: user.userId,
      email: user.email,
      registrationStatus: user.registrationStatus,
      registered: user.registered,
      modified_at: new Date().getTime(),
      type: 'registeredUser'
    };
    if (user._id) registeredUser._id = user._id;
    if (user._rev) registeredUser._rev = user._rev;
    if (!user.created_at) registeredUser.created_at = new Date().getTime();

    couch.insert(registeredUser, cb);
  },
  getRegisteredUser: function(userId, cb) {
    couch.view('adness', 'registeredUser', { startkey: userId, endkey: {}, limit: 1 }, function(err, body) {

      if (err) { return cb(null, undefined); }
      
      var user;
      body.rows.forEach(function(row) {
        // check that this is an registered user
        if (row.value.type !== 'registeredUser') { return; }
        else { user = row.value;}
      });

      cb(null, user);
    });
  },
};

module.exports = db;

var timer = require('./events/event-timer');

