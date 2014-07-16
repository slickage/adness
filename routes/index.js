/* jshint node: true */
'use strict';

var moment = require('moment');
var config = require(__dirname + '/../config');
var api = require(__dirname + '/api');
var webhook = require(__dirname + '/../webhook');
var auth = require(__dirname + '/../middleware/ensure-auth');
var passport = require(__dirname + '/../passport');
var prefix = config.sbPrefix;

module.exports = function(site) {
  // VIEWS - StarBurst general routes
  site.get('/', index);
  site.get(prefix, require('./sbindex'));
  site.get(prefix + '/rules', require('./rules'));
  site.get(prefix + '/history', require('./history'));

  // AUCTIONS
  addAuctionRoutes(site);
  // BIDS
  addBidRoutes(site);
  // ADS
  addAdsRoutes(site);
  // ADMIN
  addAdminRoutes(site);

  // web page login
  site.post('/login',
    passport.authenticate('local', { failureRedirect: '/failedLogin'}),
    function(req, res) {
      console.log(req.ip + ' ' + req.user.username + ' logged in.');
      res.redirect(prefix + '/');
    }
  );
  site.get('/logout', function(req, res){
    req.logout();
    res.redirect(prefix + '/');
  });
  site.post('/registration', require('./registration'));
  site.get('/failedLogin', function(req, res) {
    // failed authentications go here and get redirected back to /login
    // this is to log failed login attempts for banning purposes
    res.redirect(prefix + '/');
    }
  );

  // API routes
  site.use('/api', api);

  // webhooks
  site.post('/hooks/registration', webhook.registration);
  site.post('/hooks/auctions/:auctionId', webhook.winner);

  // error routes
  site.use(handle404);
  site.use(handle500);
};

// index redirect to /sb
function index (req, res) {
  // redirect to sb before spa version
  res.redirect(req.browsePrefix);
}

// Auction routes
function addAuctionRoutes(site) {
  var auctionRoutes = require('./auction');

  // show auction
  var showRoute = prefix + '/auctions/:auctionId';
  site.get(showRoute, auctionRoutes.showAuction);

  // enable auction
  var enableRoute = prefix + '/auctions/enable/:auctionId';
  site.post(enableRoute, auth, auctionRoutes.enableAuction);

  // disable auction
  var disableRoute = prefix + '/auctions/disable/:auctionId';
  site.post(disableRoute, auth, auctionRoutes.disableAuction);

  // update auction
  var updateRoute = prefix + '/auctions/edit';
  site.post(updateRoute, auth, auctionRoutes.updateAuction);

  // create auction
  var createRoute = prefix + '/auctions';
  site.post(createRoute, auth, auctionRoutes.newAuction);

  // delete auction
  var deleteRoute = prefix + '/auctions/:auctionId';
  site.delete(deleteRoute, auth, auctionRoutes.deleteAuction);
}

// Bid routes
function addBidRoutes(site) {
  var bidRoutes = require('./bid');

  // edit bid
  site.post(prefix + '/bids/edit', auth, bidRoutes.updateBid);
  // delete bid
  site.del(prefix + '/bids/:bidId', auth, bidRoutes.deleteBid);
  // create bid
  site.post(prefix + '/bids', auth, bidRoutes.newBid);
}

// Ad routes
function addAdsRoutes(site) {
  var adsRoutes = require('./ads');

  // user profile view
  site.get(prefix + '/users/:userId', auth, require('./profile'));
  // ad editor
  site.get(prefix + '/ads/editor', auth, require('./ad_upload'));
  // random ad (JSON only)
  site.get(prefix + '/ads/random', adsRoutes.random);
  // edit ad (ad editor)
  site.get(prefix + '/ads/:adId/edit', auth, require('./ad_upload'));
  // get ad
  site.get(prefix + '/ads/:adId', adsRoutes.getAd);
  // approved ad
  site.post(prefix + '/ads/:adId/approve', auth, adsRoutes.approveAd);
  // reject ad
  site.post(prefix + '/ads/:adId/reject', auth, adsRoutes.rejectAd);
  // delete ad (through post)
  site.post(prefix + '/ads/:adId/delete', auth, adsRoutes.postDeleteAd);
  // ad into rotation
  site.post(prefix + '/ads/:adId/inRotation', auth, adsRoutes.inRotation);
  // ad out of rotation
  site.post(prefix + '/ads/:adId/outRotation', auth, adsRoutes.outRotation);
  // update ad
  site.post(prefix + '/ads/:adId', auth, adsRoutes.updateAd);
  // create ad
  site.post(prefix + '/ads', auth, adsRoutes.newAd);
  // delete ad
  site.delete(prefix + '/ads/:adId', auth, adsRoutes.deleteAd);
}

// Admin routes
function addAdminRoutes(site) {
  var auctionInvoicesRoutes = require('./auction_invoices');
  // view invoices per auction
  site.get('/admin/invoices/:auctionId', auth, auctionInvoicesRoutes.invoices);
  // view list of auctions with invoices
  site.get('/admin/invoices', auth, auctionInvoicesRoutes.auctions);

  var reservedAdsRoutes = require('./reserved_ads');
  site.get('/admin/ads/reserved', auth, reservedAdsRoutes.showAds);
  site.get('/admin/ads/reserved/new', auth, reservedAdsRoutes.newAd);
  var editReservedAdRoute = '/admin/ads/reserved/:reservedAdId/edit';
  site.get(editReservedAdRoute, auth, reservedAdsRoutes.editAd);
  site.post('/admin/ads/reserved', auth, reservedAdsRoutes.createAd);
  site.post('/admin/ads/reserved/:reservedAdId', auth, reservedAdsRoutes.updateAd);
  site.delete('/admin/ads/reserved/:reservedAdId', auth, reservedAdsRoutes.deleteAd);

  var factoidRoutes = require('./factoids');
  site.get('/admin/ads/factoids', auth, factoidRoutes.showFacts);
  site.post('/admin/ads/factoids', auth, factoidRoutes.updateFacts);

  var adsRoutes = require('./ads');
  site.get('/admin/ads/review', auth, adsRoutes.reviewAds);
  site.get('/admin/ads/approved', auth, adsRoutes.approvedAds);
  site.get('/admin/ads/rejected', auth, adsRoutes.rejectedAds);

  var auctionRoutes = require('./auction');
  site.get('/admin/auctions/edit/:auctionId', auth, auctionRoutes.editAuction);
  site.post('/admin/auctions/recalculate/:auctionId', auth, auctionRoutes.recalculateAuction);

  site.get('/admin', auth, require('./admin'));
}

// 404 Handling, must be after mounting all routes
function handle404 (req, res) {
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
}

// Catch all for any other errors
function handle500 (err, req, res) {
  res.status(err.status || 500);
  var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');
  res.render('error', { errorMsg: err.message || 'Internal Server Error',
    serverTime: serverTime,
    browsePrefix: req.browsePrefix,
    user: req.user
  });
}