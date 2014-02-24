#!/usr/bin/env node
var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');

var start = new Date();
var end = new Date(start);
end.setHours(end.getHours() + 4);

var openAuction = {
  type: 'auction',
  start: start.getTime(),
  end: end.getTime(),
  slots: 10,
  enabled: true
}

var closedAuction = {
  type: 'auction',
  start: start.getTime(),
  end: start.getTime(),
  slots: 10,
  enabled: true
}

var closedDisabledAuction = {
  type: 'auction',
  start: start.getTime(),
  end: start.getTime(),
  slots: 10,
  enabled: false
}

var disabledAuction = {
  type: 'auction',
  start: start.getTime(),
  end: end.getTime(),
  slots: 10,
  enabled: false
}

couch.insert(openAuction);
couch.insert(closedAuction);
couch.insert(disabledAuction);
couch.insert(closedDisabledAuction);

console.log('Seeding data to: ' + config.couchdb.url);
