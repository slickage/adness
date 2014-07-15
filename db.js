/* jshint node: true */
'use strict';

var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use(config.couchdb.name);
var biddingAlg = require('./bidding');
var validate = require('./validation');
var _ = require('lodash');


var db = {
  newAuction: function(body, cb) {
    // validate times
    if (!validate.createAuction(body.start, body.end, body.adsStart, body.adsEnd)) {
      return cb({ message: 'Auction parameters were not valid.' }, undefined);
    }

    // validate description 
    var description = validate.html(body.description);

    // validate regions
    var regions;
    if (validate.regions(body.regions)) {
      regions = body.regions;
    }

    // random true ending time of auction within 30 minutes of end
    var end = Number(body.end);
    var timeDifference = (1000 * 60 * config.antiSnipeMinutes);
    var trueEnd = Math.floor(Math.random() * (timeDifference+1));
    trueEnd = new Date(end).getTime() + trueEnd;

    var auction = {
      start: Number(body.start),
      end: end,
      trueEnd: trueEnd,
      adsStart: Number(body.adsStart),
      adsEnd: Number(body.adsEnd),
      description: description,
      regions: regions,
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

        // validate times
        if (!validate.updateAuction(auction.start, auction.end, auction.adsStart, auction.adsEnd)) {
          return cb({ message: 'Auction parameters were not valid.'}, undefined );
        }

        // validate description
        if (auction.description) {
          body.description = validate.html(auction.description);
        }

        // validate regions
        if (auction.regions && validate.regions(auction.regions)) {
          body.regions = auction.regions;
        }

        // random true ending time of auction within 30 minutes of end
        if (auction.end) {
          var end = Number(auction.end);
          var timeDifference = (1000 * 60 * config.antiSnipeMinutes);
          var trueEnd = Math.floor(Math.random() * (timeDifference+1));
          body.trueEnd = new Date(end).getTime() + trueEnd;
        }

        // copy over on the allowed values into the retrieved auction
        if (auction.start) body.start = Number(auction.start);
        if (auction.end) body.end = Number(auction.end);
        if (auction.adsStart) body.adsStart = Number(auction.adsStart);
        if (auction.adsEnd) body.adsEnd = Number(auction.adsEnd);
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
    couch.view(config.couchdb.name, 'auctions', function(err, body) {
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
    couch.view(config.couchdb.name, 'auctions', function(err, body) {
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
    couch.view(config.couchdb.name, 'auctions', function(err, body) {
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
    couch.view(config.couchdb.name, 'auctionBids', {startkey: [key,0, 0, 0], endkey: [key,1, {}, {}]}, function(err, body) {
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
    couch.view(config.couchdb.name, 'auctionBids', params, function(err, body) {
      if (!err) {
        // first object is the auction itself
        // the rest of the array are the bids
        var openAuction = body.rows.splice(0,1)[0].value;

        // parse out the bids
        var bids = [];
        body.rows.forEach(function(rawBids) {
          bids.push(rawBids.value);
        });

        // remove non-valid bids (inplace)
        _.remove(bids, function(bid) {
          return bid.invalid === true || bid.lost === true;
        });

        // for each region, run biddingAlg and append
        auction.regions.forEach(function(region) {
          // grab only the bids for this region
          var regionBids = _.filter(bids, function(bid) {
            if (bid.region === region.name) { return true; }
          });

          // figure out winning bids
          var results = biddingAlg(Number(region.slots), regionBids);
          // add winning bids, primarySlots and secondarySlots to this region
          region.winningBids = results.winningBids;
          region.primarySlots = results.primarySlots;
          region.secondarySlots = results.secondarySlots;
        });

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
  getUserBidsPerRegion: function(auctionId, region, userId, cb) {
    var params = {startkey: [auctionId, region, userId], endkey: [auctionId, region, userId]};
    var view = 'getUserBidsPerRegion';
    couch.view(config.couchdb.name, view, params, function(err, body) {
      if (err) { console.log(err); return cb(err, undefined); }

      if (body) {
        var bids = [];
        body.rows.forEach(function(bid) {
          bids.push(bid.value);
        });

        return cb(null, bids);
      }
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
             currentTime < auction.trueEnd) &&
            auction.enabled) {

          // validate input
          if (!validate.createBid(body.price, body.slots)) {
            return cb({ message: 'Bid parameters were not valid.' }, undefined);
          }

          // validate bid region against auction regions
          var bidRegion = body.region;
          var auctionRegions = _.pluck(auction.regions, 'name');
          if (!_.contains(auctionRegions, bidRegion)) {
            var errorMessage = 'Bid does not contain a valid region for auction';
            return cb(new Error(errorMessage), undefined);
          }

          var bidUser = {
            username: body.user.username,
            userId: body.user.userId,
            email: body.user.email
          };

          // validate slot number max size
          var slots = Number(body.slots);
          var auctionRegion = _.find(auction.regions, function(region) {
            return region.name === bidRegion;
          });
          if (slots > auctionRegion.slots) { slots = auctionRegion.slots; }

          // auction is open so make the bid
          var bid = {
            created_at: new Date().getTime(),
            type: 'bid',
            price: Number(body.price),
            slots: slots,
            region: body.region,
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
                        currentTime < auction.trueEnd) &&
                        auction.enabled;
            if (open === true) {
              // validate input
              if (!validate.updateBid(bid.price, bid.slots)) {
                return cb({ message: 'Bid parameters were not valid.'}, undefined );
              }

              // validate bid region against auction regions
              var bidRegion = bid.region;
              var auctionRegions = _.pluck(auction.regions, 'name');
              if (!_.contains(auctionRegions, bidRegion)) {
                var errorMessage = 'Bid does not contain a valid region for auction';
                return cb(new Error(errorMessage), undefined);
              }

              if (bid.region) body.region = bid.region;
              if (bid.price) body.price = Number(bid.price);
              if (bid.slots) {
                var slots = Number(bid.slots);
                var auctionRegion = _.find(auction.regions, function(region) {
                  return region.name === bidRegion;
                });
                if (slots > auctionRegion.slots) { slots = auctionRegion.slots; }
                body.slots = slots;
              }
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
  forceUpdateBidStatus: function(bid, cb) {
    // !!!this should be an admin level only operation!!!
    // this will not take into account auction status 

    // ensure that the bid exists first
    couch.get(bid._id, null, function(err, oldBid) {
      if (err) { console.log(err); return cb(err, oldBid); }

      if (oldBid) {
        // ensure what we got is a bid
        if (oldBid.type !== 'bid') {
          return cb({ message: 'Id is not for a bid.'}, undefined );
        }

        // only update wonSlots, valid, void, and lost
        if (bid.wonSlots) oldBid.wonSlots = bid.wonSlots;
        if (bid.invalid) oldBid.invalid = bid.invalid; // admin invalidated
        if (bid.lost) oldBid.lost = bid.lost;    // don't count at all
        if (bid.void) oldBid.void = bid.void;    // only count wonSlots
        couch.insert(oldBid, cb);
      }
    });
  },
  deleteBid: function(bidId, cb) {
    // !!!this should be an admin level only operation!!!

    // ensure that the auction exists first
    couch.get(bidId, null, function(err, body) {
      if (!err) {
        // make sure we're getting a bid
        if (body.type !== 'bid') {
          return cb({ message: 'Id is not for a bid.'}, undefined );
        }

        body.invalid = true;
        couch.insert(body, cb);
      }
      else { cb(err, undefined); }
    });
  },
  newAd: function(body, cb) {
    // validate html
    var html = validate.html(body.html);

    // cull regions
    var regions = _.pluck(config.regions, 'name');

    // validate bid region against auction regions
    var adRegions = body.regions;
    adRegions.forEach(function(region) {
      if (!_.contains(regions, region)) {
        var errorMessage = 'Ad does not contain a valid region for auction';
        return cb(new Error(errorMessage), undefined);
      }
    });

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
      css: body.css,
      username: body.user.username,
      userId: body.user.userId,
      regions: adRegions,
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'ad',
      approved: false,
      rejected: false,
      submitted: submitted,
      inRotation: false
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
    couch.view(config.couchdb.name, 'userAds', {startkey: [key, 0], endkey: [key, {}]}, function(err, body) {
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
  getReviewAds: function(cb) {
    couch.view(config.couchdb.name, 'reviewAds', function(err, body) {
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
  getApprovedAds: function(cb) {
    couch.view(config.couchdb.name, 'approvedAds', function(err, body) {
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
  getRejectedAds: function(cb) {
    couch.view(config.couchdb.name, 'rejectedAds', function(err, body) {
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
          var typeErrorMessage = 'Id is not for an ad.';
          return cb(new Error(typeErrorMessage), undefined );
        }

        // validate admin or user
        if (ad.user.admin !== true) {
          if (body.userId !== ad.user.userId) {
            var userErrorMessage = "Editing another user's ad is not allowed.";
            return cb(new Error(userErrorMessage), undefined);
          }
        }

        // update html if not approved or submitted
        if (body.approved !== true && body.submitted !== true) {
          if (ad.html) body.html = validate.html(ad.html);
        }

        if (ad.css) { body.css = ad.css; }

        if (ad.regions) {
          // cull regions
          var regions = _.pluck(config.regions, 'name');

          // validate bid region against auction regions
          var adRegions = ad.regions;
          adRegions.forEach(function(region) {
            if (!_.contains(regions, region)) {
              var errorMessage = 'Ad does not contain a valid region for auction';
              return cb(new Error(errorMessage), undefined);
            }
          });

          body.regions = adRegions;
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
        if (String(ad.inRotation).toLowerCase()  === "true") {
          body.inRotation = true;
        }
        else if (String(ad.inRotation).toLowerCase() === "false") {
          body.inRotation = false;
        }

        // update ad
        couch.insert(body, cb);
      }
      else { return cb(err, undefined); }
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
      else { return cb(err, undefined); }
    });
  },
  newReceipt: function(newReceipt, cb) {
    var receipt = {
      metadata: newReceipt.metadata,
      invoiceType: newReceipt.invoiceType,
      invoiceStatus: "new",
      invoice: newReceipt.invoice || {},
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'receipt'
    };
    couch.insert(receipt, cb);
  },
  getReceipt: function(receiptId, cb) {
    couch.get(receiptId, null, function(err, body) {
      if (!err) {
        if (body.type !== 'receipt') {
          return cb({ message: 'Id is not for an Receipt.'}, undefined );
        }
        return cb(null, body);
      }
      else { return cb(err, undefined); }
    });
  },
  updateReceipt: function(newReceipt, cb) {
    // ensure that the receipt exists first
    couch.get(newReceipt._id, null, function(err, oldReceipt) {
      if (!err) {
        // make sure we're getting an receipt
        if (oldReceipt.type !== 'receipt') {
          return cb({ message: 'Id is not for an Receipt.'}, undefined );
        }

        // update modified_at
        oldReceipt.modified_at = new Date().getTime();
        // update the rest of the values
        oldReceipt.metadata = newReceipt.metadata || oldReceipt.metadata;
        oldReceipt.invoiceType = newReceipt.invoiceType || oldReceipt.invoiceType;
        oldReceipt.invoiceStatus = newReceipt.invoiceStatus || oldReceipt.invoiceStatus;
        oldReceipt.invoice = newReceipt.invoice || oldReceipt.invoice;

        // update receipt
        couch.insert(oldReceipt, cb);
      }
      else { return cb(err, undefined); }
    });
  },
  insertRegisteredUser: function(user, cb) {
    var registeredUser = {
      username: user.username,
      userId: user.userId,
      email: user.email,
      registrationStatus: user.registrationStatus,
      discount_remaining: user.discount_remaining,
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
    couch.view(config.couchdb.name, 'registeredUser', { startkey: userId, endkey: userId, limit: 1 }, function(err, body) {

      if (err) { return cb(null, undefined); }
      
      var user;
      body.rows.forEach(function(row) {
        // check that this is an registered user
        if (row.value.type !== 'registeredUser') { return; }
        else { user = row.value;}
      });

      return cb(null, user);
    });
  },
  getLatestAdsInRotation: function(cb) {
    var now = Number(new Date().getTime());
    var params = {startkey: [0], endkey: [now]};
    couch.view(config.couchdb.name, 'latestAdsInRotation', params, function(err, ads) {
      var air = {}; // return object

      // error case
      if (err) { air = undefined; }
      else {
        // limit 1 (latest end time)
        if (ads.rows.length > 0) {
          // pull our each value
          var airs = [];
          ads.rows.forEach(function(item) {
            airs.push(item.value);
          });

          // sort by end time
          airs = _.sortBy(airs, 'adsEnd');
          airs.reverse();

          air = airs[0];
        }
        else {
          err = new Error("No Ads In Rotation found.");
          air = undefined;
        }
      }

     return cb(err, air);
    });
  },
  getAdsInRotation: function(airId, cb) {
    couch.get(airId, null, function(err, body) {
      if (err) { body = undefined; }
      else {
        if (body.type !== 'adsInRotation') {
          err = new Error('Id is not for a AdsInRotation');
          body = undefined;
        }
      }
      return cb(err, body);
    });
  },
  upsertAdsInRotation: function(air, cb) {
    var airId = air.auctionId + "-air";
    couch.get(airId, null, function(err, body) {
      var airInsert = {};
      // air doesn't exist already
      if (err) {
        airInsert = air;
        airInsert._id = airId;
        airInsert.modified_at = new Date().getTime();
        airInsert.type = "adsInRotation";
      }
      else {
        airInsert = body;
        if (air.adsStart) airInsert.adsStart = air.adsStart;
        if (air.adsEnd) airInsert.adsEnd = air.adsEnd;
        if (air.regions) airInsert.regions = air.regions;
        airInsert.modified_at = new Date().getTime();
      }

      couch.insert(airInsert, cb);
    });
  },
  newQueuedInvoice: function(queuedInvoice, cb) {
    var newInvoice = {
      invoice: queuedInvoice.invoice,
      receipt: queuedInvoice.receipt,
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'queuedInvoice'
    };
    couch.insert(newInvoice, cb);
  },
  getAllQueuedInvoices: function(cb) {
    couch.view(config.couchdb.name, 'getQueuedInvoices', function(err, body) {
      if (!err) {
        var invoices = [];
        body.rows.forEach(function(doc) { invoices.push(doc.value); });
        cb(null, invoices);
      }
      else { cb(err, undefined); }
    });
  },
  deleteQueuedInvoice: function(invoiceId, cb) {
    couch.get(invoiceId, null, function(err, body) {
      if (!err) {
        if (body.type !== 'queuedInvoice') {
          return cb({ message: 'Id is not for an QueuedInvoice.'}, undefined );
        }

        couch.destroy(body._id, body._rev, cb);
      }
      else { return cb(err, undefined); }
    });
  },
  getAuctionInvoices: function(auctionId, cb) {
    var params = {startkey: [auctionId], endkey: [auctionId]};
    var view = 'getAuctionInvoices';
    couch.view(config.couchdb.name, view, params, function(err, body) {
      if (!err) {
        var invoices = [];
        body.rows.forEach(function(doc) { invoices.push(doc.value); });
        return cb(null, invoices);
      }
      else { return cb(err, undefined); }
    });
  },
  getUserInvoices: function(auctionId, userId, cb) {
    var params = {startkey: [auctionId, userId], endkey: [auctionId, userId]};
    var view = "getUserInvoices";
    couch.view(config.couchdb.name, view, params, function(err, body) {
      if (!err) {
        var invoices = [];
        body.rows.forEach(function(doc) { invoices.push(doc.value); });
        return cb(null, invoices);
      }
      else { return cb(err, undefined); }
    });
  },
  newRecalculation: function(recalculation, cb) {
    var newRecalculation = {
      auctionId: recalculation.auctionId,
      round: recalculation.round,
      expiration: recalculation.expiration,
      finished: false,
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'recalculation'
    };
    couch.insert(newRecalculation, function(err, body) {
      if (err) { console.log(err); }
      
      if (body) {
        recalculation._id = body.id;
        timer.addRecalculation(recalculation);
      }
      return cb(err, body);
    });
  },
  getRecalculation: function(calcId, cb) {
    couch.get(calcId, null, function(err, body) {
      if (!err) {
        if (body.type !== 'recalculation') {
          return cb({ message: 'Id is not for an Recalculation.'}, undefined );
        }
        return cb(null, body);
      }
      else { return cb(err, undefined); }
    });
  },
  getRecalculations: function(cb) {
    couch.view(config.couchdb.name, 'getRecalculations', function(err, body) {
      if (!err) {
        var recalculations = [];
        body.rows.forEach(function(doc) { recalculations.push(doc.value); });
        cb(null, recalculations);
      }
      else { cb(err, undefined); }
    });
  },
  updateRecalculation: function(recalculation, cb) {
    // ensure that the receipt exists first
    couch.get(recalculation._id, null, function(err, oldRecalculation) {
      if (!err) {
        // make sure we're getting an receipt
        if (oldRecalculation.type !== 'recalculation') {
          return cb({ message: 'Id is not for an Recalculation.'}, undefined );
        }

        // update modified_at
        oldRecalculation.modified_at = new Date().getTime();
        // update the rest of the values
        oldRecalculation.round = recalculation.round || oldRecalculation.round;
        oldRecalculation.expiration = recalculation.expiration || oldRecalculation.expiration;
        oldRecalculation.finished = recalculation.finished || oldRecalculation.finished;

        // update receipt
        couch.insert(oldRecalculation, function(err, body) {
          if (err) { console.log(err); }
          
          if (body) {
            if (oldRecalculation.finished) {
              timer.deleteRecalculation(oldRecalculation);
            }
            else {
              timer.updateRecalculation(oldRecalculation);
            }
          }
          return cb(err, body);
        });
      }
      else { return cb(err, undefined); }
    });
  },
  newReservedAd: function(reservedAd, cb) {
    // validate html
    var html = validate.html(reservedAd.html);

    // cull regions
    var regions = _.pluck(config.regions, 'name');

    // validate bid region against auction regions
    var adRegions = reservedAd.regions;
    adRegions.forEach(function(region) {
      if (!_.contains(regions, region)) {
        var errorMessage = 'Ad does not contain a valid region for auction';
        return cb(new Error(errorMessage), undefined);
      }
    });

    // in use
    if (reservedAd.in_use) {
      if (reservedAd.in_use.toLowerCase() === 'true') {
        reservedAd.in_use = true;
      }
      else reservedAd.in_use = false;
    }

    var ad = {
      html: html,
      css: reservedAd.css,
      username: reservedAd.user.username,
      userId: reservedAd.user.userId,
      regions: adRegions,
      created_at: new Date().getTime(),
      modified_at: new Date().getTime(),
      type: 'reserved_ad',
      in_use: reservedAd.in_use
    };
    couch.insert(ad, cb);
  },
  getReservedAd: function(reservedAdId, cb) {
    couch.get(reservedAdId, null, function(err, body) {
      if (!err) {
        if (body.type !== 'reserved_ad') {
          return cb({ message: 'Id is not for an reserved ad.'}, undefined );
        }
        cb(null, body);
      }
      else { cb(err, undefined); }
    });
  },
  getReservedAds: function(cb) {
    var view = 'getReservedAds';
    couch.view(config.couchdb.name, view, function(err, body) {
      if (!err) {
        var reservedAds = [];
        body.rows.forEach(function(doc) { reservedAds.push(doc.value); });
        return cb(null, reservedAds);
      }
      else { return cb(err, undefined); }
    });
  },
  updateReservedAd: function(reservedAd, cb) {
    // ensure that the ad exists first
    couch.get(reservedAd._id, null, function(err, body) {
      if (err) {
        console.log("This reserved ad does not exist.");
        return cb(err, undefined);
      }

      if (body) {
        // make sure we're getting an reservedAd
        if (body.type !== 'reserved_ad') {
          var typeErrorMessage = 'Id is not for an reserved ad.';
          return cb(new Error(typeErrorMessage), undefined );
        }

        // update html if not approved or submitted
        if (reservedAd.html) body.html = validate.html(reservedAd.html);

        // css
        if (reservedAd.css) { body.css = reservedAd.css; }

        // regions
        if (reservedAd.regions) {
          // cull regions
          var regions = _.pluck(config.regions, 'name');

          // validate bid region against auction regions
          var adRegions = reservedAd.regions;
          adRegions.forEach(function(region) {
            if (!_.contains(regions, region)) {
              var errorMessage = 'Ad does not contain a valid region for auction';
              return cb(new Error(errorMessage), undefined);
            }
          });

          body.regions = adRegions;
        }

        // update modified_at
        body.modified_at = new Date().getTime();

        // in use
        if (reservedAd.in_use) {
          if (reservedAd.in_use.toLowerCase() === 'true') body.in_use = true;
          else body.in_use = false;
        }

        // update ad
        couch.insert(body, cb);
      }
    });
  },
  deleteReservedAd: function(reservedAdId, cb) {
    // ensure that the ad exists first
    couch.get(reservedAdId, null, function(err, body) {
      if (!err) {
        // make sure we're getting a bid
        if (body.type !== 'reserved_ad') {
          return cb({ message: 'Id is not for an reserved ad.'}, undefined );
        }

        couch.destroy(body._id, body._rev, cb);
      }
      else { return cb(err, undefined); }
    });
  },
  upsertFactoid: function(newFactoids, cb) {
    var key = "";
    if (newFactoids._id) { key = newFactoids._id; }
    couch.get(key, null, function(err, body) {
      var factoids = {};
      // factoid doesn't exist already
      if (!body._id) {
        factoids.html = validate.html(newFactoids.html);
        factoids.css = newFactoids.css;
        factoids.list = newFactoids.list;
        factoids.created_at = new Date().getTime();
        factoids.modified_at = new Date().getTime();
        factoids.type = "factoids";
      }
      else {
        factoids = body;
        if (newFactoids.html) factoids.html = validate.html(newFactoids.html);
        if (newFactoids.css) factoids.css = newFactoids.css;
        if (newFactoids.list) factoids.list = newFactoids.list;
        factoids.modified_at = new Date().getTime();
      }

      couch.insert(factoids, cb);
    });
  },
  getFactoids: function(cb) {
    var view = 'getFactoids';
    couch.view(config.couchdb.name, view, function(err, factoids) {
      var facts = []; // return object

      // error case
      if (err) { facts = undefined; }
      else {
        // limit 1 (latest end time)
        if (factoids.rows.length > 0) {
          // pull our each value
          factoids.rows.forEach(function(item) {
            facts.push(item.value);
          });

          facts = facts[0];
        }
        else {
          err = new Error("No Factoids found.");
          facts = undefined;
        }
      }

     return cb(err, facts);
    });
  }
};

module.exports = db;

var timer = require('./events/event-timer');
