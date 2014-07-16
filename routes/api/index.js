/* jshint node: true */
'use strict';

var express = require('express');
var api = express.Router();
  
require(__dirname + '/auctions')(api);
require(__dirname + '/bids')(api);
require(__dirname + '/ads')(api);

module.exports = api;
