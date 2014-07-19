/* jshint node: true */
'use strict';

module.exports = function(req, res, next) {
  // don't generate CSRF if api route
  if ( null !== req.path.match(/^\/api/) ) {
    return next();
  }
  else {
    // otherwise generate a csrf token to res.locals
    res.locals.csrftoken = req.csrfToken();
    return next();
  }
};
