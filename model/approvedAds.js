/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
var _ = require('lodash');

module.exports = function(req, cb) {
  db.getApprovedAds(function(err, adsAndUsers) {
    if (err) { return cb(err, []); }
    else {
      // since we're using linked documents
      // we have a combination of ads and users

      // separate out users
      var users = [];
      users = _.remove(adsAndUsers, function(item) {
        return item.type === 'auctionUser';
      });

      // the rest is ads
      var ads = adsAndUsers;
      
      var results = { ads: ads, users: users };
      return cb(null, results);
    }
  });
};
