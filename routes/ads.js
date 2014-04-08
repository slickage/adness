var db = require(__dirname + '/../db');
var async = require('async');

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
      if (err) console.log(err);
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
    // TODO: var ip
    // TODO: var numberOfAds

    // get the auction winners
    db.getAdsInRotation(function(err, ads) {
      if (err) { return res.json(err); }

      if (!ads.winners || ads.winners.length === 0) {
        return res.json({ message: "This auction had no winners." });
      }

      // auction winners
      var winners = ads.winners;
      // get random winner
      var winner = randomWinner(winners);

      // get approved/rotation ads for random winner
      getApprovedAds(winner, function(err, approvedAds) {
        if (err) { return res.json(err); }

        if (!approvedAds || approvedAds.length === 0) {
          return res.json({ message: "There are no ads." });
        }

        // find random approved/rotational ad
        var ad = randomAd(approvedAds);
        return res.json(ad);
      });
    });
  }
};

function randomWinner(winners) {
  return winners[Math.floor(Math.random() * (winners.length))];
}

function randomAd(ads) {
  return ads[Math.floor(Math.random() * (ads.length))];
}

function getApprovedAds(winner, callback) {
  // get all their ads from the db
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