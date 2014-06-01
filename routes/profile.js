module.exports = function(req, res) {
  req.model.load("userAds", req);
  req.model.load("profileUser", req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    var profileUser = models.profileUser;
    // sort ads
    var inRotation = [];
    var approved = [];
    var submitted = [];
    var saved = [];
    var rejected = [];
    models.userAds.forEach(function(ad) {
      if (ad.inRotation === true) { inRotation.push(ad); }
      else if (ad.approved === true) { approved.push(ad); }
      else if (ad.rejected === true) { rejected.push(ad); }
      else if (ad.submitted === true) { submitted.push(ad); }
      else { saved.push(ad); }
    });

    // render page
    res.render('profile', {
      profileUser: profileUser,
      inRotation: inRotation,
      approved: approved,
      rejected: rejected,
      submitted: submitted,
      saved: saved,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
