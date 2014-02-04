'use strict';
var server = require('nano')('http://localhost:5984')
  , db     = server.use('adness');

module.exports = db;
