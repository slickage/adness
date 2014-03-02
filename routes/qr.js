var qr = require('qr-image');
var fs = require('fs');

module.exports = function(req, res) {
  var code = qr.image(req.params.qrString, { type: 'png' });
  code.pipe(res);
}

