var db = require('./db');
var invoice = require('./invoice');
var config = require('./config');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var regTemplate = __dirname + '/email-templates/registration.ejs';

module.exports = function(user, cb) {
  // validation
  if (!user) { return cb({message: 'no user found.'}, undefined); }

  // build an invoice for the registration fee
  var webhook = "http://localhost:8080/webhooks/registration/";
  invoice.registration(user, webhook, function(err, invoiceId) {
    if (err) { return cb(err, undefined); }

    // build registration email template
    var data = {
      invoiceId: invoiceId,
      invoiceUrl: config.basicpay.url
    };
    var str = fs.readFileSync(regTemplate, 'utf8');
    var html = ejs.render(str, data);

    // heckle the user for registration fee
    console.log("Emailing " + user.username + " with registration template");
    heckler.email({
      from: "Test <info@bitcointalk.org>",
      to: user.email,
      subject: "Auction Registration Fee Invoice",
      html: html
    });
    
    // add registered user with new status
    var registeredUser = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      registrationStatus: "Invoice Sent.",
      registered: false
    };
    db.insertRegisteredUser(registeredUser, cb);
  });
};
