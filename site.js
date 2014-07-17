/* jshint node: true */
'use strict';

// express and express middleware
var express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    favicon = require('serve-favicon'),
    errorhandler = require('errorhandler'),
    morgan = require('morgan'),
    engine = require('ejs-locals'),
    flash = require('connect-flash'),
    rateLimiter = require('rate-limiter'),
    RedisStore = require('connect-redis')(session),
    // expressJwt = require('express-jwt'),
    site = express(), // this site!
    // authentication
    passport = require('./passport'),
    // jwt = require('jsonwebtoken'),
    // custom middleware
    browsePrefix = require('./middleware/browse-prefix'),
    // custom files
    config = require('./config'),
    invoice = require('./invoice'),
    // node-resque
    connectionDetails = config.redis,
    NR = require('node-resque'),
    jobs = require('./resque/jobs'),
    // helpful modules
    path = require('path'),
    async = require('async'),
    moment = require('moment');

// rate limiter for login
var rlRules = [ ['login', 'all', 10, 60, true] ];

// session options
var sessionOpts = {
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port
  }),
  cookie: cookieSession,
  secret: config.sessionSecret,
  resave: true,
  saveUninitialized: true
};

// development, debug, trust-proxy configs
var cookieSession = { secure: true, maxAge:86400000 };
if ('development' === site.get('env')) {
  cookieSession.secure = false;
  site.use(errorhandler());
}
if (config.debugMode) { site.use(morgan('dev')); }
if (config.trustProxy) {
  // Trust X-Forwarded-For
  site.enable('trust proxy');
  // Bug Workaround: https://github.com/expressjs/session with express 3.4.8
  // Documentation claims that if proxy is unset it obtains this option from express's 'trust proxy'
  // It however failed to save the session cookie in browser incognito mode without proxy = true
  sessionOpts.proxy = true;
}

// Express config on all environments
site.engine('ejs', engine);
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(require('./middleware/model-loader'));
site.use(require('connect-assets')());
site.use(favicon(__dirname + '/public/images/favicon.ico'));
site.use(browsePrefix);
site.use(cookieParser());
site.use(bodyParser.json());
site.use(bodyParser.urlencoded({ extended: true }));
site.use(session(sessionOpts));
site.use(passport.initialize());
site.use(passport.session());
site.use(rateLimiter.expressMiddleware(rlRules));
site.use(flash());
site.use(express.static(path.join(__dirname, 'public')));
require(__dirname + '/routes')(site);

// Node resque setup (For Auction Closing)
var auctionWorker = new NR.worker({connection: connectionDetails, queues: ['auction']}, jobs, function(){
  // optional: cleanup old improperly shutdown workers
  auctionWorker.workerCleanup();
  auctionWorker.start();
});

var recalcWorker = new NR.worker({connection: connectionDetails, queues: ['recalculation']}, jobs, function(){
  // optional: cleanup old improperly shutdown workers
  recalcWorker.workerCleanup();
  recalcWorker.start();
});

auctionWorker.on('start', function(){ console.log('auctionWorker started'); });
auctionWorker.on('end', function(){ console.log('auctionWorker ended'); });
auctionWorker.on('cleaning_worker', function(auctionWorker){
  console.log('cleaning old auctionWorker ' + auctionWorker);
});
auctionWorker.on('job', function(queue, job){
  console.log('working job ' + queue);
});
auctionWorker.on('success', function(queue, job, result){
  console.log('job success ' + queue + ' >> ' + result);
});
auctionWorker.on('error', function(queue, job, error){
  console.log('job failed ' + queue + ' >> ' + error);
});

recalcWorker.on('start', function(){ console.log('recalcWorker started'); });
recalcWorker.on('end', function(){ console.log('recalcWorker ended'); });
recalcWorker.on('cleaning_worker', function(recalcWorker){
  console.log('cleaning old recalcWorker ' + recalcWorker);
});
recalcWorker.on('job', function(queue, job){
  console.log('working job ' + queue);
});
recalcWorker.on('success', function(queue, job, result){
  console.log('job success ' + queue + ' >> ' + result);
});
recalcWorker.on('error', function(queue, job, error){
  console.log('job failed ' + queue + ' >> ' + error);
});

var queue = new NR.queue({connection: connectionDetails}, jobs, function(){
  queue.enqueue('auction', 'auction_closing',  []);
  queue.enqueue('recalculation', 'recalculation', []);
});


// Queued Invoice creation
// Each iteration is only run after the last iteration has stopped.
// Each iteration has a cool down period before being called.
async.whilst(
  function() { return true; }, // indefinite loop
  function(callback) {
    // cooled down call of queuedInvoices
    setTimeout(invoice.queuedInvoices, 1000 * 10, callback);
  },
  function(err) {
    console.log(err);
  }
);

module.exports = site;
