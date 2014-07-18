/* jshint node: true */
'use strict';

var MC = module.exports = require('emcee');
MC.model('auctions', require('./model/auctions'));
MC.model('auction', require('./model/auction'));
MC.model('auctionsTimeRelative', require('./model/auctionsTimeRelative'));
MC.model('bids', require('./model/bids'));
MC.model('bid', require('./model/bid'));
MC.model('ad', require('./model/ad'));
MC.model('userAds', require('./model/userAds'));
MC.model('reviewAds', require('./model/reviewAds'));
MC.model('approvedAds', require('./model/approvedAds'));
MC.model('rejectedAds', require('./model/rejectedAds'));
MC.model('auctionUser', require('./model/auctionUser'));
MC.model('profileUser', require('./model/profileUser'));
MC.model('auction_invoices', require('./model/ai_invoices'));
MC.model('reservedAd', require('./model/reservedAd'));
MC.model('reservedAds', require('./model/reservedAds'));
MC.model('factoids', require('./model/factoids'));
MC.model('randomFactoid', require('./model/randomFactoid'));
MC.model('userBidsPerRegion', require('./model/userBidsPerRegion'));
