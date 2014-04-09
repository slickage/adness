var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couchapp = require('couchapp');
var ddoc = require('./couchapp');
var dbname = config.couchdb.name;
var couch;

// check for db 
nano.db.get(dbname, function(err, body) {
  if (!err) {
    couch = nano.use(dbname);
    return seed();
  }

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
        couch = nano.use(dbname);
        seed();
      });
    }
  });
});

var seed = function() {
  var start = new Date();
  var end = new Date(start);
  end.setHours(end.getHours() + 4);
  var timeDifference = (1000 * 60 * 30);
  var trueEnd = Math.floor(Math.random() * (timeDifference+1));
  trueEnd = end.getTime() + trueEnd;

  // within time and enabled
  var openAuction = {
    type: 'auction',
    start: start.getTime(),
    end: end.getTime(),
    trueEnd: trueEnd,
    slots: 10,
    enabled: true
  };

  // within time and disabled
  var closedAuction = {
    type: 'auction',
    start: start.getTime(),
    end: end.getTime(),
    trueEnd: trueEnd,
    slots: 10,
    enabled: false
  };


  var comingStart = new Date();
  var comingEnd = new Date(start);
  comingStart.setMonth(comingStart.getMonth() + 4);
  comingEnd.setMonth(comingEnd.getMonth() + 4);
  comingEnd.setHours(comingEnd.getHours() + 4);
  var timeDifference = (1000 * 60 * 30);
  var comingTrueEnd = Math.floor(Math.random() * (timeDifference+1));
  comingTrueEnd = comingEnd.getTime() + comingTrueEnd;

  // coming auction 
  var comingAuction = {
    type: 'auction',
    start: comingStart.getTime(),
    end: comingEnd.getTime(),
    trueEnd: comingTrueEnd,
    slots: 10,
    enabled: true
  };


  var pastStart = new Date();
  var pastEnd = new Date(start);
  pastStart.setMonth(pastStart.getMonth() - 4);
  pastEnd.setMonth(pastEnd.getMonth() - 4);
  pastEnd.setHours(pastEnd.getHours() + 4);
  var timeDifference = (1000 * 60 * 30);
  var pastTrueEnd = Math.floor(Math.random() * (timeDifference+1));
  pastTrueEnd = pastEnd.getTime() + pastTrueEnd;

  // past auction
  var pastAuction = {
    type: 'auction',
    start: pastStart.getTime(),
    end: pastEnd.getTime(),
    trueEnd: pastTrueEnd,
    slots: 10,
    enabled: true
  };

  couch.insert(openAuction);
  couch.insert(closedAuction);
  couch.insert(comingAuction);
  couch.insert(pastAuction);


  // recurring auctions
  var times = 0;
  var start = new Date();
  var end = new Date(start.getTime() + (1000 * 60 * 5));
  while (times < 50) {
    start.setTime(start.getTime() + (1000 * 60 * 5));
    end.setTime(end.getTime() + (1000 * 60 * 5));

    var recurringAuction = {
      type: 'auction',
      start: start.getTime(),
      end: end.getTime(),
      trueEnd: end.getTime(),
      slots: 8,
      enabled: true
    };
    couch.insert(recurringAuction);
    times++;
  }


  console.log('Seeding data to: ' + config.couchdb.url);
}
