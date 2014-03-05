var MC = module.exports = require('emcee');
MC.model('auctions', require('./model/auctions'));
MC.model('auction', require('./model/auction'));
MC.model('auctionsOpen', require('./model/auctionsOpen'));
MC.model('auctionsClosed', require('./model/auctionsClosed'));
MC.model('auctionsComing', require('./model/auctionsComing'));
MC.model('auctionsPast', require('./model/auctionsPast'));
MC.model('bids', require('./model/bids'));
