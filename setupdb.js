/* jshint node: true */
'use strict';

var dbinit = require('./db-init');

// Setup Database without running adness
dbinit.validateDBExist(function() {});