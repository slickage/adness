var db = require(__dirname + '/../db');
var _ = require('lodash');
var async = require('async');
var geoip = require('geoip-lite');
var config = require('../config');
var moment = require('moment');

exports = module.exports = {
  newAd: function(req, res) {
    req.body.user = req.user;

    // cull regions
    if (!req.body.regions) {
      var regions = [];
      var configRegions = _.pluck(config.regions, 'name');
      configRegions.forEach(function(region) {
        if (req.body[region]) { regions.push(region); }
      });
      req.body.regions = regions;
    }

    db.newAd(req.body, function(err, body, header) {
      if (err) { console.log(err); }
      res.redirect(req.browsePrefix);
    });
  },
  getAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); return res.redirect(req.browsePrefix); }
      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      res.render('ads', {
        ad: models.ad,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user});
    });
  },
  updateAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) {
        console.log(err);
        res.redirect(req.browsePrefix);
      }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user

        // cull regions
        if (!req.body.regions) {
          var regions = [];
          var configRegions = _.pluck(config.regions, 'name');
          configRegions.forEach(function(region) {
            if (req.body[region]) { regions.push(region); }
          });
          req.body.regions = regions;
        }

        if (req.body.html) ad.html = req.body.html;
        if (req.body.regions) ad.regions = req.body.regions;
        if (req.body.approved) ad.approved = req.body.approved;
        if (req.body.submitted) ad.submitted = req.body.submitted;
        if (req.body.submitted && req.body.submitted.toLowerCase() === 'true')
          ad.rejected = false;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix);
        });
      }
    });
  },
  deleteAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        db.deleteAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.end();
        });
      }
    });
  },
  postDeleteAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        db.deleteAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix + '/users/' + req.user.userId);
        });
      }
    });
  },
  approveAd: function(req, res) {
    // approving ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        ad.approved = true;
        ad.submitted = false;
        ad.rejected = false;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix + '/users/' + req.user.userId);
        });
      }
    });
  },
  rejectAd: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        ad.approved = false;
        ad.rejected = true;
        ad.submitted = false;
        ad.inRotation = false;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix + '/users/' + req.user.userId);
        });
      }
    });
  },
  inRotation: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        ad.inRotation = true;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix + '/ads/' + ad._id);
        });
      }
    });
  },
  outRotation: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
        ad.user = req.user; // add current user
        ad.inRotation = false;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix + '/ads/' + ad._id);
        });
      }
    });
  },
  submittedAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load("submittedAds", req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      res.render('submittedAds', {
        ads: models.submittedAds,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user});
    });
  },
  random: function(req, res) {
    // ip -> country code (country)
    var ip = req.query.ip;
    var geo = geoip.lookup(ip);
    var country = "";
    if (geo) { country = geo.country; }

    // number Of Ads to return (limit)
    var limit = req.query.limit;
    if (!limit || limit == '0' ) { limit = 1; }

    // get ads based on region and limit
    // should always return an array even if it is empty or error
    getRandomAds(country, limit, function(err, ads) {
      if (err) { console.log(err); }
      return res.json(ads);
    });
  }
};

function getRandomAds(country, limit, callback) {
  // get adsInRotation object
  db.getLatestAdsInRotation(function(err, air) {
    var error;
    if (err) {
      error = new Error("There are no ads to display.");
      return callback(error, []);
    }

    // get all regions that match this country code
    var matchingRegions = findMatchingRegions(country, air.regions);

    // for each matching region, 
    // get all the ads from the winners
    async.concat(matchingRegions, getRegionalAds,
      function(err, results) {
        if (err) { console.log(err); results = []; }

        // random select ads until limit is reached and callback
        results = fillAds(results, limit);

        // clean each ad
        results.forEach(function(ad) { cleanAd(ad); });
        return callback(null, results);
      }
    );
  });
}

function findMatchingRegions(country, regions) {
  var matchingRegions = [];
  regions.forEach(function(region) {
    // get the same region from config
    var configRegion = _.find(config.regions, { name: region.name });
    var countriesList = configRegion.countries;
    var exclusive = configRegion.exclusive;

    // add any global regions
    if (!countriesList) { matchingRegions.push(region); }

    // if there's a countries list and an exclusive boolean
    if (countriesList && exclusive) {
      if (!_.contains(countriesList, country)) {
        matchingRegions.push(region);
      }
    }
    else if (countriesList) {
      if (_.contains(countriesList, country)) {
        matchingRegions.push(region);
      }
    }
  });
  return matchingRegions;
}

// returns all the ads for a region
function getRegionalAds(region, cb) {
  var winners = region.winners;
  async.concat(winners,
    function(winner, callback) {
      getWinnersAds(winner, region.name, callback);
    },
    function(err, winnerAds) {
      if (err) { console.log(err); winnerAds = []; }
      return cb(null, winnerAds);
    }
  );
}

// returns random ads for the given region from the winner's 
// in rotation set of ads. Will fill to winner's lineitem total
function getWinnersAds(winner, regionName, callback) {
  // number of ad slots for this winner
  var slotLimit = winner.lineItems.length;

  // get all winner's ads from the db
  db.getUserAds(winner.userId, function(err, ads) {
    if (err) {
      console.log(err);
      return callback(null, []);
    }

    // filter user's ad to be approved, in rotation, and contain this region
    var filteredAds = _.filter(ads, function(ad) {
      var valid = false;

      if (ad.approved === true && ad.inRotation === true) {
        valid = true;
      }

      if (valid && _.contains(ad.regions, regionName)) {
        valid = true;
      }
      else { valid = false; }

      return valid;
    });

    // fill the results array with a random selection of winner's ads 
    // untill slotLimit is reached
    var results = fillAds(filteredAds, slotLimit);
    return callback(null, results);
  });
}

function cleanAd(ad) {
  delete ad._id;
  delete ad._rev;
  delete ad.userId;
  delete ad.type;
  delete ad.approved;
  delete ad.submitted;
  delete ad.inRotation;
  delete ad.rejected;
  return ad;
}

function fillAds(ads, size) {
  // error checking ads
  if (!ads || ads.length === 0) { return []; }

  var results = _.sample(ads, size); // will only sample to list length
  var fillSize = results.length;

  while (fillSize < size) {
    // find difference 
    var diffSize = size - fillSize;

    // get more ads
    var moreAds = _.sample(ads, diffSize);

    // add to results
    results = results.concat(moreAds);

    // set new fillSize
    fillSize = results.length;
  }

  return results;
}
