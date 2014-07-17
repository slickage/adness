/* jshint node: true */
'use strict';

var registration = require('../registration');
var moment = require('moment');

exports = module.exports = function(req, res) {
  req.model.load('registeredUser', req);
  req.model.end(function(err, models) {
    var view = 'registration';
    var error = '';

    // serverTime 
    var serverTime = moment().utc().format('YYYY MMMM D, h:mm:ss A ZZ');

    if (err) {
      console.log(err);
      view = 'registrationError';
      error = err.message;
      return res.render(view, {
        err: error,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    }

    if (models.registeredUser) {
      view = 'registrationError';
      error = 'This user has already been registered';
      return res.render(view, {
        err: error,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    }

    // register user to given auction
    registration.invoice(req.user, function(err) {
      if (err) {
        console.log(err);
        view = 'registrationError';
        error = err.message;
      }

      return res.render(view, {
        err: error,
        serverTime: serverTime,
        browsePrefix: req.browsePrefix,
        user: req.user
      });
    });
  });
};
