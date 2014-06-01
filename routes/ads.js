var db = require(__dirname + '/../db');
var _ = require('lodash');
var async = require('async');
var geoip = require('geoip-lite');

exports = module.exports = {
  newAd: function(req, res) {
    req.body.user = req.user;

    if (req.body.blacklistedCN === undefined &&
       (req.body.blacklistUS || req.body.blacklistCN)) {
      req.body.blacklistedCN = [];
      if (req.body.blacklistUS) { req.body.blacklistedCN.push("US"); }
      if (req.body.blacklistCN) { req.body.blacklistedCN.push("CN"); }
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
      res.render('ads', {
        ad: models.ad,
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

        if (req.body.blacklistedCN === undefined &&
            (req.body.blacklistUS || req.body.blacklistCN)) {
          req.body.blacklistedCN = [];
          if (req.body.blacklistUS) { req.body.blacklistedCN.push("US"); }
          if (req.body.blacklistCN) { req.body.blacklistedCN.push("CN"); }
        }

        if (req.body.html) ad.html = req.body.html;
        if (req.body.blacklistedCN) ad.blacklistedCN = req.body.blacklistedCN;
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
      res.render('submittedAds', {
        ads: models.submittedAds,
        browsePrefix: req.browsePrefix,
        user: req.user});
    });
  },
  random: function(req, res) {
    // ip
    var ip = req.query.ip;
    var geo = geoip.lookup(ip);
    var country = "";
    if (geo) { country = geo.country; }

    // number Of Ads to return
    var limit = req.query.limit;
    if (!limit || limit == '0' ) { limit = 1; }

    // get the AdsInRotation object that has the winners of the last auction
    // this function will get all approved/in rotation ads for all winners
    // already country filtered and cleaned up.
    getWinnerAds(country, function(err, ads) {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      // check if there are any ads remaining
      if (ads.length === 0) {
        return res.json([]);
      }

      // limit the amount of ads returned
      fillAds(limit, ads, function(err, finalAds) {
        if (err) { return res.json(err); }
        return res.json(finalAds);
      });
    });
  }
};

function getWinnerAds(country, callback) {
  // get adsInRotation object
  db.getAdsInRotation(function(err, air) {
    var error;
    if (err) {
      error = new Error("There are no ads to display.");
      return callback(error, undefined);
    }

    if (!air.winners || air.winners.length === 0) {
      error = new Error("There are no ads to display.");
      return callback(error, undefined);
    }

    // get all winners from last auction
    var winners = air.winners;

    // cull all filtered ads for each winner
    async.concat(winners,
      // winners Iterator
      function(winner, callback) {
        // number of ad slots for this winner
        var slotLimit = winner.lineItems.length;

        // get all winner's ads from the db
        db.getUserAds(winner.userId, function(err, ads) {
          if (err) {
            console.log(err);
            return callback(null, []);
          }
          // filter winner's ads 
          filterAds(ads, country, slotLimit, callback);
        });
      },
      // final callback
      function(err, ads) {
      if (err) { return callback(err, undefined); }
      return callback(null, ads);
    });
  });
}

function filterAds(ads, country, slotLimit, cb) {
  async.filter(ads, function(ad, callback) {
    // country filter
    if (_.contains(ad.blacklistedCN, country)) {
      return callback(false);
    }

    // check if ad is approved
    if (ad.approved === true && ad.inRotation === true) {
      return callback(true);
    }
    else { callback(false); }
  },
  function(results) {
    // check if there are any ads left
    if (results.length === 0) {
      return cb(null, []);
    }

    // limit to slot size
    fillAds(slotLimit, results, function(err, finalAds) {
      if (err) { return cb(null, []); }
      return cb(null, finalAds);
    });
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

function fillAds(size, ads, callback) {
   var results = _.sample(ads, size);
   var fillSize = results.length;

   while (fillSize < size) {
    // find difference 
    var diffSize = size - fillSize;

    // get more ads
    var moreAds = _.sample(ads, diffSize);

    // add to results
    moreAds.forEach(function(item) {
      results.push(item);
    });

    // set new fillSize
    fillSize = results.length;
   }

   callback(null, results);
}
