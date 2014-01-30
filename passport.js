// passport
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log(username);
    console.log(password);
    var user = { id: username, password: password };
    return done(null, user);
    // return done(null, false, { message: 'Incorrect username.' });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  done(null, id);
});

module.exports = passport;