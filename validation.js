var sanitize = require('google-caja').sanitize;
var _ = require('lodash');
var config = require('./config');

module.exports = {
  isNumber: function(datetime) {
    // return true if this is a number
    return !isNaN(parseFloat(datetime)) && isFinite(datetime);
  },
  createAuction: function(start, end, adsStart, adsEnd) {
    // ensure all three parameters are given
    if (start && end && adsStart && adsEnd) {
      return this.updateAuction(start, end, adsStart, adsEnd);
    }
    else { return false; }
  },
  updateAuction: function(start, end, adsStart, adsEnd) {
    // check that start datetime is valid millisec
    if (start && !this.isNumber(start)) {
      return false;
    }

    // check that end datetime is a valid milli sec
    if (end && !this.isNumber(end)) {
      return false;
    }
    
    // check that end is after start
    if (start && end && end < start) {
      return false;
    }

    // check that ads start datetime is valid millisec
    if (adsStart && !this.isNumber(adsStart)) {
      return false;
    }

    // check that ads end datetime is a valid milli sec
    if (adsEnd && !this.isNumber(adsEnd)) {
      return false;
    }

    // check that adsEnd is after adsStart
    if (adsStart && adsEnd && adsEnd < adsStart) {
      return false;
    }

    // check that adsStart is after end
    if (adsStart && end && adsStart < end) {
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
  regions: function(regions) {
    // get all regions by name
    var configRegions = config.regions;
    var configRegionNames = _.pluck(configRegions, 'name');

    var valid = true;

    if (regions.length < 1) { valid = false; }

    regions.forEach(function(region) {
      // validate region name
      if (_.contains(configRegionNames, region.name) === false) {
        valid = false;
      }

      // validate slots exist
      if (!region.slots) { valid = false; }
      // valid slots is a number
      if (valid && !(!isNaN(parseFloat(region.slots)) && isFinite(region.slots))) {
        valid = false;
      }
      // validate slots is not negative
      if (valid && region.slots < 1) { valid = false; }
    });

    return valid;
  }
};
