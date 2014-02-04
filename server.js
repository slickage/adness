'use strict';
var express = require('express');
var RedisStore = require('connect-redis')(express);
var routes = require('./routes');
var api = require('./routes/api')
var http = require('http');
var path = require('path');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var secret = 'secret string for adness 1234!';

var isProduction = (process.env.NODE_ENV === 'production');
var port = process.env.PORT || 8080;
var app = express();
var passport = require('./passport');

// Enables CORS
var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
 
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

// Express config on all environments
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(require('connect-assets')());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secret}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('adness'));
app.use(express.session({store: new RedisStore}));
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(enableCORS);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routes
app.get('/login', routes.login);

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.post('/authenticate', function (req, res) {
  if (!(req.body.username === 'slickage' && req.body.password === 'slickage')) {
    res.send(401, 'Wrong user or password');
    return;
  }

  var profile = {
    first_name: 'Slickage',
    last_name: 'Studios',
    email: 'jw@slickage.com',
    id: 123
  };

  // We are sending the profile inside the token
  var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
  res.json({ token: token });
});

app.get('/api/bids', api.bids.findAll);
// app.post('/api/bids', api.bids);
app.get('/api/auctions', api.auctions.findAll);
app.post('/api/auctions', api.auctions.addAuction);
app.get('/api/profile', api.users.profile);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

console.log('Starting up...');
