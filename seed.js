#!/usr/bin/env node
var config = require('./config');
var nano = require('nano')(config.couchdb.url);
var couch = nano.use('adness');

var start = new Date();
var end = new Date(start);
end.setHours(end.getHours() + 4);

var openAuction = {
  id: 1,
  type: 'auction',
  start: start.getTime(),
  end: end.getTime(),
  slots: 10,
  enabled: true
};

var closedAuction = {
  id: 2,
  type: 'auction',
  start: start.getTime(),
  end: start.getTime(),
  slots: 10,
  enabled: true
};

var closedDisabledAuction = {
  id: 3,
  type: 'auction',
  start: start.getTime(),
  end: start.getTime(),
  slots: 10,
  enabled: false
};

var disabledAuction = {
  id: 4,
  type: 'auction',
  start: start.getTime(),
  end: end.getTime(),
  slots: 10,
  enabled: false
};

var bid = {
  type: 'bid',
  price: 2,
  auctionId: 1
};

couch.insert(openAuction);
couch.insert(closedAuction);
couch.insert(disabledAuction);
couch.insert(closedDisabledAuction);
couch.insert(bid);

console.log('Seeding data to: ' + config.couchdb.url);
