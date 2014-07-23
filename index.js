/* jshint node: true */
'use strict';

var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couchapp = require('couchapp');
var ddoc = require('./couchapp');
var dbname = config.couchdb.name;
var async = require('async');
// Increment when model changes in an incompatible way
var dbVersion = 1;

// Initialization Sanity Checks
async.waterfall([
  validateSessionSecret,
  validateDBExist,
  checkDBVersion,
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

  nano.db.get(dbname, function(err) {
    if (err) {
      if (err.error && err.reason === 'You are not authorized to access this db.' ) {
        console.log('CouchDB Error: ' + err.reason + '  ' + config.couchdb.url + '/' + dbname);
        process.exit(255);
      }
      console.log(err);
      // db not found so create it
      console.log('DB ' + dbname + ' was not found. ');
      console.log('Creating DB: ' + dbname);
      nano.db.create(dbname, function(err) {
        if (err) {
          var message = 'Could not create DB. Exiting...';
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

function checkDBVersion(cb) {
  var couch = nano.use(config.couchdb.name);
  couch.get('db_version', function(err, dbVersionObj) {
    if (!err) {
      if (dbVersionObj.version !== dbVersion) {
        // Upgrade needed
        // TODO: Replace with db conversion function
        var error = new Error('Adness Database Requires Upgrade.');
        return cb(error);
      }
      else {
        console.log('Adness Database version ' + dbVersionObj.version);
        return cb();
      }
    }
    else {
      if (err.reason &&
          err.reason === 'missing' ||
          err.reason === 'deleted') {
        // insert
        dbVersionObj = {};
        dbVersionObj._id = 'db_version';
        dbVersionObj.version = dbVersion;
        couch.insert(dbVersionObj, function() {
          console.log('Adness Database version ' + dbVersionObj.version);
          return cb();
        });
      }
      else {
        // FATAL other error
        console.log('checkDbVersion Fatal Error');
        return cb(err);
      }
    }
  });
}

function buildSite() {
  var site = require('./site');
  if (config.debugMode) { console.log('Config: ' + JSON.stringify(config)); }
  site.listen(config.port);
  console.log('Listening at: http://0.0.0.0:' + config.port);
}