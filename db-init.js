/* jshint node: true */
'use strict';

var config = require('./config');
var db = require('./db');
var nano = require('nano')(db.getCouchUrl());
var ddoc = require('./ddoc');
var dbname = config.couchdb.name;
var adnessDb;
// Increment when model changes in an incompatible way
var dbVersion = 1;

function validateDBExist(cb) {
  var error = null;

  nano.db.get(dbname, function(err) {
    if (err) {
      if (err.error && err.error === 'unauthorized' ) {
        console.log('CouchDB Error: ' + err.reason + '  ' + err.request.uri);
        process.exit(255);
      }
      // db not found so create it
      console.log('DB ' + dbname + ' was not found. ');
      nano.db.create(dbname, function(err) {
        if (err) {
          var message = 'Could not create DB.  Check DB_USER and DB_PASS?';
          error = new Error(message);
          return cb(error);
        }
        else {
          // install db ddoc
          console.log('Created DB: ' + dbname);
          adnessDb = nano.use(dbname);
          adnessDb.insert(ddoc, function(err) {
            if (err) {
              console.log('Failed to push design document');
              return process.exit(1);
            }
            else {
              cb();
            }
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

module.exports = {
  validateDBExist: validateDBExist,
  checkDBVersion: checkDBVersion
};