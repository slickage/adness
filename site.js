var express = require('express'),
    site = express(),
    router = require('./router'),
    MC = require('./models'),
    path = require('path'),
    config = require('./config');

var RedisStore = require('connect-redis')(express);
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');

var modelLoader = function(req, res, next) {
  req.model = res.model = new MC;
  console.log('hi im a middleware');
  next();
};


// Express config on all environments
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(modelLoader);
site.use(require('connect-assets')());
site.use(express.favicon());
site.use(express.logger('dev'));
site.use(express.bodyParser());
// We are going to protect /api routes with JWT
site.use('/api', expressJwt({secret: config.secret}));
site.use(express.json());
site.use(express.urlencoded());
site.use(express.methodOverride());
site.use(express.cookieParser('adness'));
site.use(express.session({store: new RedisStore}));
// site.use(passport.initialize());
// site.use(passport.session());

site.use(site.router);
site.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == site.get('env')) {
  site.use(express.errorHandler());
}

site.get('/', router.index);

console.log('Initialized.');
module.exports = site;

