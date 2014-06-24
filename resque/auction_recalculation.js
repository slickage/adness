var db = require(__dirname + '/../db');
var timer = require('../events/event-timer');

module.exports = function(callback) {
  // get all recalculations
  db.getRecalculations(function(err, recalculations) {
    if (err) { console.log(err); callback(null, false); }
    else {
      // for each auction
      recalculations.forEach(function(recalculation) {
        if (!recalculation.finished) {
          // adjust time if already expired
          var now = new Date().getTime();
          if (recalculation.expiration < now) {
            recalculation.expiration = now + 1000 * 5;
          }

          timer.addRecalculation(recalculation);
        }
      });
      
      return callback(null, true);
    }
  });
};
