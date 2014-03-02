var payments = require(__dirname + '/../payments');
module.exports = function(req, res) {
  req.model.end(function(err, models) {
    if (err) console.log('error: ' + JSON.stringify(err));

    payments.getPaymentAddress(function(err, address) {
      var paymentAddress = 'bitcoin:' + address
      if (err) address = 'error';
      res.render('payment', {
        auction: models.auction,
        browsePrefix: req.browsePrefix,
        paymentAddress: paymentAddress,
        user: req.user});
    })
  });
};
