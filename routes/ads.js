/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
var _ = require('lodash');
var async = require('async');
var geoip = require('geoip-lite');
var config = require('../config');
var moment = require('moment');
var rework = require('rework');
var walk = require('rework-walk');
var namegen = require('../namegenerator');

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

    // don't allow ads with no regions
    if (req.body.regions.length === 0) {
      return res.redirect(req.browsePrefix);
    }

    db.newAd(req.body, function(err, body) {
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

        // don't allow ads with no regions
        if (req.body.regions.length === 0) {
          return res.redirect(req.browsePrefix);
        }

        if (req.body.html) { ad.html = req.body.html; }
        if (req.body.css) { ad.css = req.body.css; }
        if (req.body.regions) { ad.regions = req.body.regions; }

        if (!ad.user.admin || ad.user.admin && ad.user.userid === ad.userid) {
          if (req.body.submitted) { ad.submitted = req.body.submitted; }
          if (req.body.submitted && req.body.submitted.toLowerCase() === 'true') {
            ad.rejected = false;
            ad.approved = false;
          }
        }
        db.updateAd(ad, function(err) {
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
        db.deleteAd(ad, function(err) {
          if (err) { console.log(err); }
          res.json({ ok: true });
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
        db.deleteAd(ad, function(err) {
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
        db.updateAd(ad, function(err) {
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
        db.updateAd(ad, function(err) {
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
        db.updateAd(ad, function(err) {
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
        db.updateAd(ad, function(err) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix + '/ads/' + ad._id);
        });
      }
    });
  },
  reviewAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('reviewAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      // get the list of ads
      var ads = models.reviewAds.ads;
      var users = models.reviewAds.users;
      var validAds = [];

      // for each ad, check if the user's registered === true
      ads.forEach(function(ad) {
        // first find the matching user
        var matchingUser = _.find(users, function(user) {
          return user._id === ad.userId.toString();
        });

        if (matchingUser && matchingUser.registered === true) {
          validAds.push(ad);
        }
      });

      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      res.render('reviewAds', {
        ads: validAds,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user});
    });
  },
  approvedAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('approvedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      // get the list of ads
      var ads = models.approvedAds.ads;
      var users = models.approvedAds.users;
      var validAds = [];

      // for each ad, check if the user's registered === true
      ads.forEach(function(ad) {
        // first find the matching user
        var matchingUser = _.find(users, function(user) {
          return user._id === ad.userId.toString();
        });

        if (matchingUser && matchingUser.registered === true) {
          validAds.push(ad);
        }
      });

      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      res.render('approvedAds', {
        ads: validAds,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user});
    });
  },
  rejectedAds: function(req, res) {
    // rejecting ads is an admin only function
    if (!req.user.admin) { return res.redirect(req.browsePrefix); }
    req.model.load('rejectedAds', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); }
      // get the list of ads
      var ads = models.rejectedAds.ads;
      var users = models.rejectedAds.users;
      var validAds = [];

      // for each ad, check if the user's registered === true
      ads.forEach(function(ad) {
        // first find the matching user
        var matchingUser = _.find(users, function(user) {
          return user._id === ad.userId.toString();
        });

        if (matchingUser && matchingUser.registered === true) {
          validAds.push(ad);
        }
      });

      // serverTime 
      var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
      res.render('rejectedAds', {
        ads: validAds,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user});
    });
  },
  random: function(req, res) {
    req.model.load('reservedAds', req);
    req.model.load('randomFactoid', req);
    req.model.end(function(err, models) {

      var reservedAds = models.reservedAds;
      var fact = models.randomFactoid;

      // ip -> country code (country)
      var ip = req.query.ip;
      var geo = geoip.lookup(ip);
      var country = '';
      if (geo) { country = geo.country; }

      // number Of Ads to return (limit)
      var limit = req.query.limit;
      if (!limit || limit === '0' ) { limit = 1; }

      // get ads based on region and limit
      // should always return an array even if it is empty or error
      getRandomAds(country, limit, reservedAds, fact, function(err, ads) {
        if (err) { console.log(err); }
        return res.json(ads);
      });
    });
  }
};

function getRandomAds(country, limit, reservedAds, factoid, callback) {
  // get adsInRotation object
  db.getLatestAdsInRotation(function(err, air) {
    if (err) {
      console.log('There are no user ads to display.');
      air = { regions: [] };
    }

    // get all regions that match this country code
    var matchingRegions = findMatchingRegions(country, air.regions);

    // filter reservedAds in use
    var inUseAds = _.filter(reservedAds, function(ad) {
      return ad.in_use === true;
    });

    // get all reservedAds that match this country
    var matchingAds = findMatchingReservedAds(country, inUseAds);

    // for each matching region, 
    // get all the ads from the winners
    async.concat(matchingRegions, getRegionalAds,
      function(err, results) {
        if (err) { console.log(err); results = []; }

        // results are ads for every winner for all matching regions
        // the number of ads per winner is in accordance to the number of
        // slots they've won for this region. 

        // Inject the reserved ads at this point. 
        results = results.concat(matchingAds);

        // Inject random factoid there
        results = results.concat(factoid);

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

function findMatchingReservedAds(country, ads) {
  var matchingAds = [];

  // for each ad get it's regions
  ads.forEach(function(ad) {
    var regionMatched = _.find(ad.regions, function(region) {
      // get the same region from config
      var configRegion = _.find(config.regions, { name: region });
      var countriesList = configRegion.countries;
      var exclusive = configRegion.exclusive;

      // add any global region
      if (!countriesList) { return true; }

      // if there's a countries list and an exclusive boolean
      if (countriesList && exclusive) {
        if (!_.contains(countriesList, country)) { return true; }
      }
      else if (countriesList) {
        if (_.contains(countriesList, country)) { return true; }
      }
      else { return false; }
    });


    if (regionMatched) { matchingAds.push(ad); }
  });

  return matchingAds;
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
  delete ad._rev;
  delete ad.username;
  delete ad.userId;
  delete ad.type;
  delete ad.approved;
  delete ad.in_use;
  delete ad.submitted;
  delete ad.inRotation;
  delete ad.rejected;

  // generate random name
  var name = namegen.generateRandomName();

  // compile and clean csss
  if (!ad.css) { ad.css = ''; }
  var css = rework(ad.css)
      .use(prefixCSS(name))
      .toString();
  ad.css = css;

  // append parent div to html
  ad.html = '<div id="' + name + '">' + ad.html + '</div>';

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

function prefixCSS(prefix) {
  return function(style) {
    walk(style, function (rule) {
      if (!rule.selectors) { return; }

      rule.selectors = rule.selectors.map(function (selector) {
        if (!selector) { return selector; }

        if (selector.match(/^(html|body)/)) {
          return selector.replace(/^(html|body)/, prefix);
        }

        if (selector.indexOf('+') > -1 || selector.indexOf('~') > -1) {
          selector = selector.replace('+', '');
          selector = selector.replace('~', '');
          selector = selector.trim();
        }

        return prefix + ' ' + selector;
      });

      // flatten selectors
      rule.selectors = _.flatten(rule.selectors);
    });
  };
}
