var express = require('express'),
    site = express(),
    passport = require('./passport'),
    path = require('path'),
    engine = require('ejs-locals'),
    RedisStore = require('connect-redis')(express),
    jwt = require('jsonwebtoken'),
    expressJwt = require('express-jwt'),
    router = require('./router'),
    apiRouter = require('./apiRouter'),
    config = require('./config');

// Express config on all environments
site.engine('ejs', engine);
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(require('./middleware/model_loader'));
site.use(require('connect-assets')());
site.use(express.favicon());
site.use(express.logger('dev'));
site.use(express.cookieParser('adness'));
site.use(express.bodyParser());
site.use(browsePrefix);
site.use(express.methodOverride());
site.use(express.json());
site.use(express.urlencoded());
site.use(express.session({
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port,
  }),
  cookie: {
    secure: false,
    maxAge:86400000
  }
}));
site.use(passport.initialize());
site.use(passport.session());

site.use(site.router);
site.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == site.get('env')) {
  site.use(express.errorHandler());
}


// StarBurst middleware - TODO change to module
var nojsPrefix = '/sb';
function browsePrefix(req, res, next) {
  req.browsePrefix = nojsPrefix;
  return next();
}

// StarBurst routes
site.get(nojsPrefix, router.sbindex);
site.get(nojsPrefix + '/slot', router.slot);
site.get(nojsPrefix + '/history', router.history);
site.get(nojsPrefix + '/history/all', router.history_all);
site.get(nojsPrefix + '/registration', router.registration);
// StarBurst private web routes
site.get(nojsPrefix + '/profile', ensureAuthenticated, router.profile);
site.get(nojsPrefix + '/ads', ensureAuthenticated, router.ads);
site.get(nojsPrefix + '/ad/upload', ensureAuthenticated, router.ad_upload);
site.get(nojsPrefix + '/auctions/:auctionId', router.auction.showAuction);
site.get(nojsPrefix + '/payment', router.payment);
site.get(nojsPrefix + '/qr/:qrString', router.qr);

// normal public web routes
site.get('/', router.index);
// normal private web routes
site.get('/admin', ensureAuthenticated, router.admin);

// api routes
site.post('/auctions', router.auction.newAuction); // this should be private
site.post('/bid', router.bid.newBid);
var apiPrefix = '/api';
site.get(apiPrefix + '/auctions/open', apiRouter.auctionsOpen);
site.get(apiPrefix + '/auctions/closed', apiRouter.auctionsClosed);
site.get(apiPrefix + '/auctions/:auctionId', apiRouter.auction);
site.get(apiPrefix + '/auctions', apiRouter.auctions);
site.get(apiPrefix + '/bids/:startkey', apiRouter.bids);
site.post('/login',
  passport.authenticate('local', { failureRedirect: '/'}),
  function(req, res) {
    res.redirect(nojsPrefix + '/');
  }
);
site.get('/logout', function(req, res){
  req.logout();
  res.redirect(nojsPrefix + '/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect(nojsPrefix + '/');
}



console.log('Initialized.');
module.exports = site;
