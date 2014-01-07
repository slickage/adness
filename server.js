'use strict';
var express = require('express');
var RedisStore = require('connect-redis')(express);
var routes = require('./routes');
var http = require('http');
var path = require('path');

var isProduction = (process.env.NODE_ENV === 'production');
var port = process.env.PORT || 8080;
var app = express();

// all environments
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(require('connect-assets')());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('adness'));  
app.use(express.session({ store: new RedisStore }));  
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

console.log('Starting up...');
