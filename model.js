var MC = module.exports = require('emcee');
MC.model('auctions', require('./model/auctions'));
MC.model('auction', require('./model/auction'));
MC.model('auctionsOpen', require('./model/auctionsOpen'));
MC.model('auctionsClosed', require('./model/auctionsClosed'));
