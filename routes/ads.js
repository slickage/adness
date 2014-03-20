var db = require(__dirname + '/../db');

exports = module.exports = {
  newAd: function(req, res) {
    req.body.user = req.user;
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
        ad.user = req.user;
        if (req.body.html) ad.html = req.body.html;
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
  }
};
