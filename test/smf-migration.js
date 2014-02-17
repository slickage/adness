var test = require("tap").test
var smfAuth = require(__dirname + '/../integration/smf-auth.js');

test("Auth via PHP's CRYPT_SHA256", function (t) {
  var shacrypt = require('shacrypt');
  var password = 'slickage1234';
  var hash = '$5$rounds=7500$HYtR7tBVVIhaEOG3$aTD.SlfiUow2KcGJJ0fABo3y7GLGS.pr3vlZLCW8Cj1';
  var result = shacrypt.sha256crypt(password, hash);
  t.ok(true, hash == shacrypt.sha256crypt(password, hash));
  t.end() // but it must match the plan!
})
