/* jshint node: true */
'use strict';

var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couchapp = require('couchapp');
var ddoc = require('./couchapp');
var dbname = config.couchdb.name;

// check for db 
nano.db.get(dbname, function(err, body) {
  if (!err) { return buildSite(); }

  // db not found so create it
  console.log("Creating DB: " + dbname);
  nano.db.create(dbname, function(err, body) {
    if (err) {
      console.log("DB " + dbname + " was not found.");
      console.log("Could not create DB. Exiting...");
      return process.exit(1);
    }
    else {
      // build couchDB url
      var db = config.couchdb.url + '/' + dbname;
      // install db ddoc
      couchapp.createApp(ddoc, db, function(app) {
        app.push();
        // launch site
        buildSite();
      });
    }
  });
});

function buildSite() {
  var site = require('./site');
  console.log('Config: ' + JSON.stringify(config));
  site.listen(config.port);
  console.log('Listening at: http://0.0.0.0:' + config.port);
}