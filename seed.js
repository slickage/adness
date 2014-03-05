#!/usr/bin/env node
var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');


var start = new Date();
var end = new Date(start);
end.setHours(end.getHours() + 4);

// within time and enabled
var openAuction = {
  type: 'auction',
  start: start.getTime(),
  end: end.getTime(),
  slots: 10,
  enabled: true
};

// within time and disabled
var closedAuction = {
  type: 'auction',
  start: start.getTime(),
  end: end.getTime(),
  slots: 10,
  enabled: false
};


var comingStart = new Date();
var comingEnd = new Date(start);
comingStart.setMonth(comingStart.getMonth() + 4);
comingEnd.setMonth(comingEnd.getMonth() + 4);
comingEnd.setHours(comingEnd.getHours() + 4);

// coming auction 
var comingAuction = {
  type: 'auction',
  start: comingStart.getTime(),
  end: comingEnd.getTime(),
  slots: 10,
  enabled: true
};


var pastStart = new Date();
var pastEnd = new Date(start);
pastStart.setMonth(pastStart.getMonth() - 4);
pastEnd.setMonth(pastEnd.getMonth() - 4);
pastEnd.setHours(pastEnd.getHours() + 4);

// past auction
var pastAuction = {
  type: 'auction',
  start: pastStart.getTime(),
  end: pastEnd.getTime(),
  slots: 10,
  enabled: true
};

couch.insert(openAuction);
couch.insert(closedAuction);
couch.insert(comingAuction);
couch.insert(pastAuction);

console.log('Seeding data to: ' + config.couchdb.url);
