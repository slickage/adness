var db = require('./db');
var invoice = require('./invoice');
var config = require('./config');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var regTemplate = __dirname + '/email-templates/registration.ejs';

module.exports = {
  invoice: function(user, cb) {
    // validation
    if (!user) { return cb({message: 'no user found.'}, undefined); }

    // build an invoice for the registration fee
    var webhook = config.site.url + "/hooks/registration";
    var invoiceForm = invoice.createRegistrationInvoice(user, webhook);
    var data = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      admin: user.admin
    };
    invoice.createInvoice(data, "registration", invoiceForm, this.completeInvoice);
    return cb(null, {});
  },
  completeInvoice: function(err, results) {
    if (err) { return console.log(err); }
    
    var invoice = results.invoice;
    var metadata = results.receipt.metadata;

    // build registration email template
    var data = {
      invoiceId: invoice.id,
      invoiceUrl: config.baron.url
    };
    var str = fs.readFileSync(regTemplate, 'utf8');
    var html = ejs.render(str, data);

    // heckle the user for registration fee
    console.log("Emailing " + metadata.username + " with registration template");
    heckler.email({
      from: config.senderEmail,
      to: metadata.email,
      subject: "Auction Registration Fee Invoice",
      html: html
    });
    
    // add registered user with new status
    var registeredUser = {
      userId: metadata.userId,
      username: metadata.username,
      email: metadata.email,
      registrationStatus: "Invoice Sent.",
      registered: false
    };
    if (metadata.admin) { registeredUser.registered = true; }
    db.insertRegisteredUser(registeredUser, function(err, results) {
      if (err) console.log(err);
    });
  }
};
