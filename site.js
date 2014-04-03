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
    connectionDetails = require('./resque/redis-store'),
    jobs = require('./resque/jobs'),
    webhook = require('./webhook');

// Express config on all environments
site.engine('ejs', engine);
site.set('views', path.join(__dirname, 'views'));
site.set('view engine', 'ejs');
site.use(require('./middleware/model-loader'));
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

// VIEWS - StarBurst general routes
site.get(config.sbPrefix, router.sbindex);
site.get(config.sbPrefix + '/rules', router.rules);
site.get(config.sbPrefix + '/history', router.history);
site.get(config.sbPrefix + '/payment', router.payment);
site.get(config.sbPrefix + '/qr/:qrString', router.qr);
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
site.get(config.sbPrefix + '/ads/:adId/edit', ensureAuthenticated, router.ad_upload);
site.get(config.sbPrefix + '/ads/:adId', router.ads.getAd);
site.post(config.sbPrefix + '/ads/:adId/approve', ensureAuthenticated, router.ads.approveAd);
site.post(config.sbPrefix + '/ads/:adId/reject', ensureAuthenticated, router.ads.rejectAd);
site.post(config.sbPrefix + '/ads/:adId/delete', ensureAuthenticated, router.ads.postDeleteAd);
site.post(config.sbPrefix + '/ads/:adId', ensureAuthenticated, router.ads.updateAd);
site.post(config.sbPrefix + '/ads', ensureAuthenticated, router.ads.newAd);
site.del(config.sbPrefix + '/ads/:adId', ensureAuthenticated, router.ads.deleteAd);
// admin web routes
site.get('/admin/ads/submitted', ensureAuthenticated, router.ads.submittedAds);
site.get('/admin/auctions/edit/:auctionId', ensureAuthenticated, router.auction.editAuction);
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
site.post('/login',
  passport.authenticate('local', { failureRedirect: '/'}),
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

// Node resque setup
var worker = new NR.worker({connection: connectionDetails, queues: ['auction']}, jobs, function(){
  worker.workerCleanup(); // optional: cleanup old improperly shutdown workers
  worker.start();
});

worker.on('start',           function(){ console.log("worker started"); });
worker.on('end',             function(){ console.log("worker ended"); });
worker.on('cleaning_worker', function(worker, pid){ console.log("cleaning old worker " + worker); });
worker.on('poll',            function(queue){ console.log("worker polling " + queue); });
worker.on('job',             function(queue, job){ console.log("working job " + queue + " " + JSON.stringify(job)); });
worker.on('reEnqueue',       function(queue, job, plugin){ console.log("reEnqueue job (" + plugin + ") " + queue + " " + JSON.stringify(job)); });
worker.on('success',         function(queue, job, result){ console.log("job success " + queue + " " + JSON.stringify(job) + " >> " + result); });
worker.on('error',           function(queue, job, error){ console.log("job failed " + queue + " " + JSON.stringify(job) + " >> " + error); });
worker.on('pause',           function(){ console.log("worker paused"); });

var queue = new NR.queue({connection: connectionDetails}, jobs, function(){
  queue.enqueue('auction', 'cull-auctions',  []);
});


module.exports = site;
