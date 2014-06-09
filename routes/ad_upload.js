var _ = require('lodash');
var config = require('../config');

exports = module.exports = function(req, res) {
  req.model.load('ad', req);
  req.model.end(function(err, models) {
    if (err) console.log(err);

    // cull regions
    var regions = _.pluck(config.regions, 'name');

    res.render('ad_upload', {
      ad: models.ad,
      regions: regions,
      browsePrefix: req.browsePrefix,
      user: req.user});
  });
};
