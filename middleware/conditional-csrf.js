/* jshint node: true */
'use strict';

var csrf = require('csurf');

module.exports = function(req, res, next) {
  // don't generate CSRF if api route
  if ( null !== req.path.match(/^\/api/) ) {
    return next();
  }
  else if ( null !== req.path.match(/^\/hooks/) ) {
    return next();
  }
  else {
    (csrf())(req, res, function(err) {
      res.locals.csrftoken = req.csrfToken();
      return next(err);
    });
  }
};
