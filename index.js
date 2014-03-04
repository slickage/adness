'use strict';
var site = require('./site');
var config = require('./config');
console.log('Config: ' + JSON.stringify(config));

site.listen(config.port);
console.log('Listening on port: ' + config.port);
