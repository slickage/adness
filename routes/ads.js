var db = require(__dirname + '/../db');
var _ = require('underscore');
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
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
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
          res.redirect(req.browsePrefix);
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
        ad.rejected = false;
        db.updateAd(ad, function(err, body) {
          if (err) { console.log(err); }
          res.redirect(req.browsePrefix);
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
          res.redirect(req.browsePrefix);
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

    // numberOfAds
    var limit = req.query.limit;
    if (!limit || limit == '0' ) { limit = 1; }

    // get the AdsInRotation object that has the winners of the last auction
    // this function will get all approved/in rotation ads for all winners
    getWinnerAds(function(err, ads) {
      if (err) {
        console.log(err);
        return res.json([]);
      }

      // remove all ads not for this region 
      var filteredAds = _.reject(ads, function(ad) {
        return _.contains(ad.blacklistedCN, country);
      });

      // limit the amount of ads returned
      async.times(limit, function(n, next) {
        var ad = randomAd(filteredAds);
        next(null, ad);
      },
      function(err, limitedAds) {
        if (err) { res.json(err); }
        res.json(limitedAds);
      });
    });
  }
};

function getWinnerAds(callback) {
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
    // get all ads for each winner
    async.concat(winners, getApprovedAds, function(err, ads) {
      if (err) { return callback(err, undefined); }
      return callback(null, ads);
    });
  });
}

function getApprovedAds(winner, callback) {
  // get winner's ads from the db
  db.getUserAds(winner.userId, function(err, ads) {
    if (err) {
      console.log(err);
      return callback(null, []);
    }
    // find all the approved ads and return
    findApprovedAds(ads, callback);
  });
}

function findApprovedAds(ads, cb) {
  async.filter(ads, function(ad, callback) {
    // check if ad is approved
    if (ad.approved === true && ad.inRotation === true) { return callback(true); }
    else { callback(false); }
  },
  function(results) { return cb(null, results); });
}

function randomAd(ads) {
  return ads[Math.floor(Math.random() * (ads.length))];
}
