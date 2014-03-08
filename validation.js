module.exports = {
  datetimeMilli: function(datetime) {
    // return true if this is a number
    return !isNaN(parseFloat(datetime)) && isFinite(datetime);
  },
  auctionTimes: function(start, end) {
    // check that start datetime is valid millisec
    var startValid = this.datetimeMilli(start);
    // fails if start or end time is not valid
    if (!startValid) {
      return { err: "Start date/time is not valid." };
    }

    // check that end datetime is a valid milli sec
    var endValid = this.datetimeMilli(end);
    // fails if start or end time is not valid
    if (!endValid) {
      return { err: "End date/time is not valid." };
    }

    // check that end is after start
    if (end < start) {
      return { err: "End date/time is before Start" };
    }

    return {};
  },
  slots: function(slots) {
    return this.datetimeMilli(slots);
  }
};