var MC = require(__dirname + '/../models');

module.exports = modelLoader = function(req, res, next) {
  req.model = res.model = new MC;
  next();
};


