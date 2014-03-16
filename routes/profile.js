module.exports = function(req, res) {
  req.userId = req.params.userId;
  req.model.load("userAds", req);
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    // sort ads
    var approved = [];
    var submitted = [];
    var saved = [];
    models.userAds.forEach(function(ad) {
      if (ad.approved === true) { approved.push(ad); }
      else if (ad.submitted === true) { submitted.push(ad); }
      else { saved.push(ad); }
    });

    // render page
    res.render('profile', {
      approved: approved,
      submitted: submitted,
      saved: saved,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
