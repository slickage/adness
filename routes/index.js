var model = require(__dirname + '/../model');
exports.index = function(req, res) {
  model.getBids();
  res.render('index', {});
}
exports.login = function(req, res) {
  res.render('login', {});
}
