var express = require('express'),
    site = express(),
    router = require('./router'),
    path = require('path'),
    config = require('./config');

var RedisStore = require('connect-redis')(express);
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');

// Express config on all environments
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(require('./middleware/model_loader'));
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

// web routes
site.get('/', router.index);
site.get('/auction/details', router.auction_details);
site.get('/profile', router.profile);
site.get('/ad/upload', router.ad_upload);

console.log('Initialized.');
module.exports = site;

