var registration = require('../registration');

exports = module.exports = function(req, res) {
  req.model.load("auction", req);
  req.model.end(function(err, models) {
    if (err) console.log(err); // render 404

    // register user to given auction
    registration(models.auction, req.user, function(err, results) {
      if (err) { console.log(err); /* render 404 */ }
      res.render('registration', {
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  });
};
