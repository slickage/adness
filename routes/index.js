module.exports = function(req, res) {
  // redirect to sb before spa version
  res.redirect(req.browsePrefix);
};
