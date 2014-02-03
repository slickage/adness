'use strict';

var couchbase = require('couchbase');
module.exports.mainBucket = new couchbase.Connection({bucket:'adness'}, function(){});