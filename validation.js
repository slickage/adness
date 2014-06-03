var sanitize = require('google-caja').sanitize;
var _ = require('lodash');
var config = require('./config');

module.exports = {
  isNumber: function(datetime) {
    // return true if this is a number
    return !isNaN(parseFloat(datetime)) && isFinite(datetime);
  },
  createAuction: function(start, end, slots) {
    // ensure all three parameters are given
    if (start && end && slots) {
      return this.updateAuction(start, end, slots);
    }
    else { return false; }
  },
  updateAuction: function(start, end, slots) {
    // validate all inputs are numbers
    // validate that slots can't be negative
    // validate end time is after start time

    // check that start datetime is valid millisec
    if (start && !this.isNumber(start)) {
      return false;
    }

    // check that end datetime is a valid milli sec
    if (end && !this.isNumber(end)) {
      return false;
    }

    if (slots && !this.isNumber(slots)) {
      return false;
    }

    if (slots && slots < 0) {
      return false;
    }

    // check that end is after start
    if (start && end && end < start) {
      return false;
    }

    return true;
  },
  createBid: function(price, slots) {
    // ensure all parameters are given
    if (price && slots) {
      return this.updateBid(price, slots);
    }
    else { return false; }
  },
  updateBid: function(price, slots) {
    // validate all inputs are numbers
    // validate that slots can't be negative
    // validate end time is after start time

    // check that start datetime is valid millisec
    if (price && !this.isNumber(price)) {
      return false;
    }

    // check that end datetime is a valid milli sec
    if (slots && !this.isNumber(slots)) {
      return false;
    }

    if (price && price < 0) { return false; }
    if (slots && slots < 0) { return false; }

    return true;
  },
  html: function(html) {
    function urlX(url) { if(/^https?:\/\//.test(url)) { return url; }}
    return sanitize(html, urlX);
  },
  // TO BE DEPRECATED
  blacklistedCN: function(blacklist) {
    // check that the list is an array
    if (!_.isArray(blacklist)) { return ['US', 'CN']; }

    // check that each item in the list is a string
    var newList = [];
    blacklist.forEach(function(item) {
      if (_.isString(item)) { newList.push(item); }
    });

    return newList;
  },
  regions: function(region) {
    // check against configs
    var regionsList = config.regions.whitelist;
    var whitelistRegion = _.contains(regionsList, region);

    // check against global
    var globalRegion = false;
    if (region === 'Global') {
      globalRegion = true;
    }

    // check again EU
    var EURegion = false;
    if (region === 'EU') {
      EURegion = true;
    }

    if (whitelistRegion || globalRegion || EURegion) {
      return true;
    }
    else { return false; }

  }
};
