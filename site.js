var express = require('express'),
    site = express(),
    passport = require('./passport'),
    path = require('path'),
    engine = require('ejs-locals'),
    RedisStore = require('connect-redis')(express),
    jwt = require('jsonwebtoken'),
    expressJwt = require('express-jwt'),
    router = require('./router'),
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
site.use(express.methodOverride());
site.use(express.json());
site.use(express.urlencoded());
site.use(express.session({
  store: new RedisStore,
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

// web routes
site.get('/', router.index);
site.get('/auction/details', ensureAuthenticated, router.auction_details);
site.get('/profile', ensureAuthenticated, router.profile);
site.get('/ad/upload', ensureAuthenticated, router.ad_upload);
site.post('/login', 
  passport.authenticate('local', { failureRedirect: '/'}),
  function(req, res) {
    res.redirect('/');
  }
);
site.get('/registration', router.registration);

site.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}

console.log('Initialized.');
module.exports = site;

