exports = module.exports = {
  newAd: function(req, res) {
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
  editAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) console.log(err);
      res.render('adEdit', {
        ad: models.ad,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  },
  updateAd: function(req, res) {
    req.model.load('ad', req);
    req.model.end(function(err, models) {
      if (err) { console.log(err); res.redirect(req.browsePrefix); }
      else {
        var ad = models.ad;
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
  }
};
