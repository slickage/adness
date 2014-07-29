/* jshint node: true */
'use strict';

var config = require('./config');
var async = require('async');
var dbinit = require('./db-init');

// Initialization Sanity Checks
async.waterfall([
  validateSessionSecret,
  dbinit.validateDBExist,
  dbinit.checkDBVersion,
  ],
  function(err) {
    if (err) {
      console.log('Adness Init ' + err);
      process.exit(1);
    }
    else { buildSite(); }
  }
);

function validateSessionSecret(cb) {
  var secret = config.sessionSecret;
  var error = null;

  if (secret === 'secret string for adness 1234!') {
    var message = 'Do not use the default SESSION_SECRET';
    error = new Error(message);
  }
  
  return cb(error);
}

function buildSite() {
  var site = require('./site');
  if (config.debugMode) { console.log('Config: ' + JSON.stringify(config)); }
  site.listen(config.port);
  console.log('Listening at: http://0.0.0.0:' + config.port);
}