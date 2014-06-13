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

    // profile name
    var profileName = "No User Found";
    var profileId = "";
    if (profileUser) {
      profileName = profileUser.username;
      profileId = profileUser.userId;
    }
    else if (Number(req.params.userId) === Number(req.user.userId)) {
      profileName = req.user.username;
      profileId = req.user.userId;
    }

    // show registration button
    var showRegButton = false;
    if (!profileUser && Number(req.params.userId) === req.user.userId) {
      showRegButton = true;
    }

    // user is viewing thier own page
    var isOwnPage = false;
    if (Number(req.params.userId) === req.user.userId) {
      isOwnPage = true;
    }

    // render page
    res.render('profile', {
      profileName: profileName,
      profileId: profileId,
      isOwnPage: isOwnPage,
      showRegButton: showRegButton,
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
