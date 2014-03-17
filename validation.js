var sanitize = require('google-caja').sanitize;

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
    return sanitize(html);
  }
};
