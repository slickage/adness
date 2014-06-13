var moment = require('moment');

module.exports = function(req, res) {
  
  // serverTime 
  var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

  res.render('rules', {
    serverTime: serverTime,
    browsePrefix: req.browsePrefix,
    user: req.user
  });
};

