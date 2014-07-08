/* jshint node: true */
'use strict';

module.exports = {
  "auction_closing": { perform: require('./auction_closing') },
  "recalculation": { perform: require('./auction_recalculation') }
};
