/* jshint node: true */
'use strict';

var moment = require('moment');

module.exports = function(req, res) {
  req.model.load('userAds', req);
  req.model.load('profileUser', req);
  req.model.end(function(err, models) {
    if (err) { console.log('error: ' + JSON.stringify(err)); }

    var profileUser = models.profileUser;

    // sort ads
    var inRotation = [];
    var approved = [];
    var submitted = [];
    var saved = [];
    var rejected = [];
    models.userAds.forEach(function(ad) {
      if (ad.inRotation === true && ad.approved === true) { inRotation.push(ad); }
      else if (ad.approved === true) { approved.push(ad); }
      else if (ad.rejected === true) { rejected.push(ad); }
      else if (ad.submitted === true) { submitted.push(ad); }
      else { saved.push(ad); }
    });

    // user is viewing thier own page
    var isOwnPage = false;
    if (Number(req.params.userId) === Number(req.user.userId)) {
      isOwnPage = true;
    }

    // profile Name and ID
    var profileName = 'No User Found';
    var profileId = '';
    if (profileUser) {
      profileName = profileUser.username;
      profileId = profileUser._id;
    }
    else if (isOwnPage) {
      profileName = req.user.username;
      profileId = req.user.userId;
    }

    // show registration button
    var showRegButton = false;
    if (!profileUser && isOwnPage) {
      showRegButton = true;
    }

    // show registration ad alert
    var showRegAlert = false;
    if (!profileUser && isOwnPage || profileUser && !profileUser.registered) {
      showRegAlert = true;
    }

    // if there are ads, pull profile name and id from ad
    if (profileName === 'No User Found' && models.userAds && models.userAds.length > 0) {
      var userAds = models.userAds;
      profileName = userAds[0].username;
      profileId = userAds[0].userId;
      showRegAlert = true;
    }

    // serverTime 
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

    // render page
    res.render('profile', {
      profileName: profileName,
      profileId: profileId,
      isOwnPage: isOwnPage,
      showRegButton: showRegButton,
      showRegAlert: showRegAlert,
      inRotation: inRotation,
      approved: approved,
      rejected: rejected,
      submitted: submitted,
      saved: saved,
      serverTime: serverTime,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  });
};
