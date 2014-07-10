/* jshint node: true */
'use strict';

var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couchapp = require('couchapp');
var ddoc = require('./couchapp');
var dbname = config.couchdb.name;
var async = require('async');

// Initialization Sanity Checks
async.waterfall([
  validateSessionSecret,
  validateDBExist,
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

function validateDBExist(cb) {
  var error = null;

  nano.db.get(dbname, function(err, body) {
    if (err) {
      // db not found so create it
      console.log("DB " + dbname + " was not found. ");
      console.log("Creating DB: " + dbname);
      nano.db.create(dbname, function(err, body) {
        if (err) {
          var message = "Could not create DB. Exiting...";
          error = new Error(message);
          return cb(error);
        }
        else {
          // build couchDB url
          var db = config.couchdb.url + '/' + dbname;
          // install db ddoc
          couchapp.createApp(ddoc, db, function(app) {
            app.push();
            return cb();
          });
        }
      });
    }
    else { return cb(); }
  });
}

function buildSite() {
  var site = require('./site');
  console.log('Config: ' + JSON.stringify(config));
  site.listen(config.port);
  console.log('Listening at: http://0.0.0.0:' + config.port);
}