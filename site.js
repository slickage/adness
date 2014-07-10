/* jshint node: true */
'use strict';

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
    config = require('./config'),
    ensureAuthenticated = require('./middleware/ensure-auth'),
    browsePrefix = require('./middleware/browse-prefix'),
    NR = require('node-resque'),
    connectionDetails = config.redis,
    jobs = require('./resque/jobs'),
    webhook = require('./webhook'),
    rateLimiter = require('rate-limiter'),
    flash = require('connect-flash'),
    invoice = require('./invoice'),
    async = require('async'),
    moment = require('moment');

// rate limiter for login
var rlRules = [
  ['login', 'all', 10, 60, true]
];

// Express config on all environments
site.engine('ejs', engine);
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(require('./middleware/model-loader'));
site.use(require('connect-assets')());
site.use(express.favicon());
if (config.debugMode) { site.use(express.logger('dev')); }
site.use(express.cookieParser());
site.use(express.bodyParser());
site.use(browsePrefix);
site.use(express.methodOverride());
site.use(express.json());
site.use(express.urlencoded());
if (config.trustProxy) { site.enable('trust proxy'); } // Trust X-Forwarded-For
site.use(express.session({
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port
  }),
  cookie: {
    secure: true,
    maxAge:86400000
  },
  secret: config.sessionSecret
}));
site.use(flash());
site.use(passport.initialize());
site.use(passport.session());
site.use(rateLimiter.expressMiddleware(rlRules));
site.use(site.router);
site.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == site.get('env')) {
  site.use(express.errorHandler());
}

// VIEWS - StarBurst general routes
site.get(config.sbPrefix, router.sbindex);
site.get(config.sbPrefix + '/rules', router.rules);
site.get(config.sbPrefix + '/history', router.history);
// AUCTIONS
site.get(config.sbPrefix + '/auctions/:auctionId', router.auction.showAuction);
site.post(config.sbPrefix + '/auctions/enable/:auctionId', ensureAuthenticated, router.auction.enableAuction);
site.post(config.sbPrefix + '/auctions/disable/:auctionId', ensureAuthenticated, router.auction.disableAuction);
site.post(config.sbPrefix + '/auctions/edit', ensureAuthenticated, router.auction.updateAuction);
site.post(config.sbPrefix + '/auctions', ensureAuthenticated, router.auction.newAuction);
site.del(config.sbPrefix + '/auctions/:auctionId', ensureAuthenticated, router.auction.deleteAuction);
// BIDS
site.post(config.sbPrefix + '/bids/edit', ensureAuthenticated, router.bid.updateBid);
site.del(config.sbPrefix + '/bids/:bidId', ensureAuthenticated, router.bid.deleteBid);
site.post(config.sbPrefix + '/bids', ensureAuthenticated, router.bid.newBid);
// ADS
site.get(config.sbPrefix + '/users/:userId', ensureAuthenticated, router.profile);
site.get(config.sbPrefix + '/ads/upload', ensureAuthenticated, router.ad_upload);
site.get(config.sbPrefix + '/ads/random', router.ads.random);
site.get(config.sbPrefix + '/ads/:adId/edit', ensureAuthenticated, router.ad_upload);
site.get(config.sbPrefix + '/ads/:adId', router.ads.getAd);
site.post(config.sbPrefix + '/ads/:adId/approve', ensureAuthenticated, router.ads.approveAd);
site.post(config.sbPrefix + '/ads/:adId/reject', ensureAuthenticated, router.ads.rejectAd);
site.post(config.sbPrefix + '/ads/:adId/delete', ensureAuthenticated, router.ads.postDeleteAd);
site.post(config.sbPrefix + '/ads/:adId/inRotation', ensureAuthenticated, router.ads.inRotation);
site.post(config.sbPrefix + '/ads/:adId/outRotation', ensureAuthenticated, router.ads.outRotation);
site.post(config.sbPrefix + '/ads/:adId', ensureAuthenticated, router.ads.updateAd);
site.post(config.sbPrefix + '/ads', ensureAuthenticated, router.ads.newAd);
site.del(config.sbPrefix + '/ads/:adId', ensureAuthenticated, router.ads.deleteAd);
// admin web routes
site.get('/admin/invoices/:auctionId', ensureAuthenticated, router.auction_invoices.invoices);
site.get('/admin/invoices', ensureAuthenticated, router.auction_invoices.auctions);

site.get('/admin/ads/reserved', ensureAuthenticated, router.reserved_ads.showAds);
site.get('/admin/ads/reserved/new', ensureAuthenticated, router.reserved_ads.newAd);
site.get('/admin/ads/reserved/:reservedAdId/edit', ensureAuthenticated, router.reserved_ads.editAd);
site.post('/admin/ads/reserved', ensureAuthenticated, router.reserved_ads.createAd);
site.post('/admin/ads/reserved/:reservedAdId', ensureAuthenticated, router.reserved_ads.updateAd);
site.del('/admin/ads/reserved/:reservedAdId', ensureAuthenticated, router.reserved_ads.deleteAd);

site.get('/admin/ads/factoids', ensureAuthenticated, router.factoids.showFacts);
site.post('/admin/ads/factoids', ensureAuthenticated, router.factoids.updateFacts);

site.get('/admin/ads/submitted', ensureAuthenticated, router.ads.submittedAds);
site.get('/admin/auctions/edit/:auctionId', ensureAuthenticated, router.auction.editAuction);
site.post('/admin/auctions/recalculate/:auctionId', ensureAuthenticated, router.auction.recalculateAuction);
site.get('/admin', ensureAuthenticated, router.admin);
// normal public web routes
site.get('/', router.index);


// api routes
var apiPrefix = '/api';
// AUCTIONS
site.get(apiPrefix + '/auctions/time', apiRouter.auctionsTime);
site.get(apiPrefix + '/auctions/open', apiRouter.auctionsOpen);
site.get(apiPrefix + '/auctions/closed', apiRouter.auctionsClosed);
site.get(apiPrefix + '/auctions/future', apiRouter.auctionsFuture);
site.get(apiPrefix + '/auctions/past', apiRouter.auctionsPast);
site.get(apiPrefix + '/auctions/:auctionId/bids', apiRouter.bids);
site.get(apiPrefix + '/auctions/:auctionId', apiRouter.auction);
site.get(apiPrefix + '/auctions', apiRouter.auctions);
site.post(apiPrefix + '/auctions/enable/:auctionId', ensureAuthenticated, apiRouter.enableAuction);
site.post(apiPrefix + '/auctions/disable/:auctionId', ensureAuthenticated, apiRouter.disableAuction);
site.post(apiPrefix + '/auctions/edit', ensureAuthenticated, apiRouter.updateAuction);
site.post(apiPrefix + '/auctions', ensureAuthenticated, apiRouter.newAuction);
site.del(apiPrefix + '/auctions/:auctionId', ensureAuthenticated, apiRouter.deleteAuction);
// BIDS
site.get(apiPrefix + '/bids/:bidId', apiRouter.bid);
site.post(apiPrefix + '/bids/edit', ensureAuthenticated, apiRouter.updateBid);
site.post(apiPrefix + '/bids', ensureAuthenticated, apiRouter.newBid);
site.del(apiPrefix + '/bids/:bidId', ensureAuthenticated, apiRouter.deleteBid);
// ADS
site.get(apiPrefix + '/ads/submitted', ensureAuthenticated, apiRouter.submittedAds);
site.get(apiPrefix + '/ads/:adId', apiRouter.getAd);
site.post(apiPrefix + '/ads/:adId', ensureAuthenticated, apiRouter.updateAd);
site.post(apiPrefix + '/ads', ensureAuthenticated, apiRouter.newAd);
site.del(apiPrefix + '/ads/:adId', ensureAuthenticated, apiRouter.deleteAd);
site.post('/registration', router.registration);
site.get('/failedLogin', function(req, res) {
  // failed authentications go here and get redirected back to /login
  // this is to log failed login attempts for banning purposes
  res.redirect(config.sbPrefix + '/');
  }
);
site.post('/login',
  passport.authenticate('local', { failureRedirect: '/failedLogin'}),
  function(req, res) {
    res.redirect(config.sbPrefix + '/');
  }
);
site.get('/logout', function(req, res){
  req.logout();
  res.redirect(config.sbPrefix + '/');
});

// WEB HOOKS
site.post('/hooks/registration', webhook.registration);
site.post('/hooks/auctions/:auctionId', webhook.winner);

// 404 Handling, must be after mounting all routes
site.use(function(req, res) {
  res.status(404);
  if (req.accepts('html')) {
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
    res.render('error', {
      errorMsg: '404 Not Found',
      serverTime: serverTime,
      browsePrefix: req.browsePrefix,
      user: req.user
    });
  }
  else if (req.accepts('json')) {
    res.send({ error: 'Not found' });
  }
  else {
    res.type('text').send('Not found');
  }
});

// Catch all for any other errors
site.use(function(err, req, res) {
  res.status(err.status || 500);
  var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
  res.render('error', { errorMsg: err.message || 'Internal Server Error',
    serverTime: serverTime,
    browsePrefix: req.browsePrefix,
    user: req.user
  });
});

// Node resque setup (For Auction Closing)
var auctionWorker = new NR.worker({connection: connectionDetails, queues: ['auction']}, jobs, function(){
  auctionWorker.workerCleanup(); // optional: cleanup old improperly shutdown workers
  auctionWorker.start();
});

var recalcWorker = new NR.worker({connection: connectionDetails, queues: ['recalculation']}, jobs, function(){
  recalcWorker.workerCleanup(); // optional: cleanup old improperly shutdown workers
  recalcWorker.start();
});

auctionWorker.on('start', function(){ console.log("auctionWorker started"); });
auctionWorker.on('end', function(){ console.log("auctionWorker ended"); });
auctionWorker.on('cleaning_worker', function(auctionWorker, pid){
  console.log("cleaning old auctionWorker " + auctionWorker);
});
auctionWorker.on('job', function(queue, job){
  console.log("working job " + queue);
});
auctionWorker.on('success', function(queue, job, result){
  console.log("job success " + queue + " >> " + result);
});
auctionWorker.on('error', function(queue, job, error){
  console.log("job failed " + queue + " >> " + error);
});

recalcWorker.on('start', function(){ console.log("recalcWorker started"); });
recalcWorker.on('end', function(){ console.log("recalcWorker ended"); });
recalcWorker.on('cleaning_worker', function(recalcWorker, pid){
  console.log("cleaning old recalcWorker " + recalcWorker);
});
recalcWorker.on('job', function(queue, job){
  console.log("working job " + queue);
});
recalcWorker.on('success', function(queue, job, result){
  console.log("job success " + queue + " >> " + result);
});
recalcWorker.on('error', function(queue, job, error){
  console.log("job failed " + queue + " >> " + error);
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
