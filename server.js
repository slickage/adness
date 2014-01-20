'use strict';

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
  // handle the error safely
  console.log('uncaughtException');
  console.log(err);
});

var express = require('express');
var RedisStore = require('connect-redis')(express);
var routes = require('./routes');
var api = require('./routes/api')
var http = require('http');
var path = require('path');
var expressJwt = require('express-jwt');

var isProduction = (process.env.NODE_ENV === 'production');
var port = process.env.PORT || 8080;
var app = express();

// passport
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// Express config on all environments
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(require('connect-assets')());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
// We are going to protect /api routes with JWT
// app.use('/api', expressJwt({secret: 'adness 1234!'}));
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

// routes
app.get('/', routes.index);
app.get('/login', routes.login);

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

app.post('/authenticate', function (req, res) {
  if (!(req.body.username === 'slickage' && req.body.password === 'slickage')) {
    res.send(401, 'Wrong user or password');
    return;
  }

  var profile = {
    first_name: 'Slickage',
    last_name: 'Studios',
    email: 'john@doe.com',
    id: 123
  };

  // We are sending the profile inside the token
  var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
  res.json({ token: token });
});

app.get('/api/bids', api.bids);
app.post('/api/bids', api.bids);
app.get('/api/auctions', api.auctions.findAll);
app.post('/api/auctions', api.auctions.addAuction);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

console.log('Starting up...');
