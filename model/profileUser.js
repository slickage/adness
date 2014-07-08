/* jshint node: true */
'use strict';

var db = require(__dirname + '/../db');
module.exports = function(req, cb) {
  var userId = Number(req.params.userId);
  db.getRegisteredUser(userId, function(err, user) {
    if (!err) { cb(null, user); }
    else { cb(null, undefined); }
  });
};