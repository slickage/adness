var registration = require('../registration');

exports = module.exports = function(req, res) {
  req.model.load("registeredUser", req);
  req.model.end(function(err, models) {
    var view = 'registration';
    var error = '';

    if (err) {
      console.log(err);
      view = 'registrationError';
      error = err.message;
      return res.render(view, {
        err: error,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    }

    if (models.registeredUser) {
      view = 'registrationError';
      error = 'This user has already been registered';
      return res.render(view, {
        err: error,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    }

    // register user to given auction
    registration(req.user, function(err, results) {
      if (err) {
        console.log(err);
        view = 'registrationError';
        error = err.message;
      }

      return res.render(view, {
        err: error,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  });
};
