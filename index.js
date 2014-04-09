var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couchapp = require('couchapp');
var ddoc = require('./couchapp');

// check for db 
nano.db.get(config.couchdb.name, function(err, body) {
  if (!err) { return buildSite(); }

  // db not found so create it
  console.log("Creating DB: " + config.couchdb.name);
  nano.db.create(config.couchdb.name, function(err, body) {
    if (err) {
      console.log("DB " + config.couchdb.name + " was not found.");
      console.log("Could not create DB. Exiting...");
      return process.exit(1);
    }
    else {
      // build couchDB url
      var db = config.couchdb.url + '/' + config.couchdb.name;
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
  console.log('Listening on port: ' + config.port);
}