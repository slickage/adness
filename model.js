var MC = module.exports = require('emcee');
MC.model('auctions', require('./model/auctions'));
MC.model('auction', require('./model/auction'));
MC.model('auctionsTimeRelative', require('./model/auctionsTimeRelative'));
MC.model('bids', require('./model/bids'));
MC.model('bid', require('./model/bid'));
