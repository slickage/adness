var express = require('express'),
    site = express(),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    path = require('path'),
    engine = require('ejs-locals'),
    RedisStore = require('connect-redis')(express),
    jwt = require('jsonwebtoken'),
    expressJwt = require('express-jwt'),
    router = require('./router'),
    config = require('./config')
    smfAuth = require('./integration/smf-auth');
passport.serializeUser(function(user, done) {
  done(null, 1);
});

passport.deserializeUser(function(id, done) {
  done(null, {username: 'slickage'});
});
passport.use(new LocalStrategy(
  function(username, password, done) {
    smfAuth.authenticate(username, password, function(err, user) {
      (err) ? done(err) : done(null, user);
    });
  }
));

// Express config on all environments
site.engine('ejs', engine);
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(require('./middleware/model_loader'));
site.use(require('connect-assets')());
site.use(express.favicon());
site.use(express.logger('dev'));
site.use(express.bodyParser());
site.use(express.json());
site.use(express.urlencoded());
site.use(express.methodOverride());
site.use(express.cookieParser('adness'));
site.use(express.session({store: new RedisStore}));
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
site.get('/auction/details', router.auction_details);
site.get('/profile', router.profile);
site.get('/ad/upload', router.ad_upload);
site.post('/login', 
  passport.authenticate(
    'local',
    { failureRedirect: '/login'}
  ),
  function(req, res) {
    console.log('test');
    res.redirect('/');
  }
);


console.log('Initialized.');
module.exports = site;

