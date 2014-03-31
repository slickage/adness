var db = require('./db');
var invoice = require('./invoice');
var config = require('./config');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var regTemplate = __dirname + '/email-templates/registration.ejs';

module.exports = function(auction, user, cb) {
  // validation
  if (!user) { return cb({message: 'no user found.'}, undefined); }

  // build an invoice for the registration fee
  var webhook = "http://localhost:8080/webhooks/registration/" + auction._id;
  invoice.registration(auction, user, webhook, function(err, invoiceId) {
    if (err) { return cb(err, undefined); }

    // build registration email template
    var data = {
      auctionId: auction._id,
      invoiceId: invoiceId,
      invoiceUrl: config.basicpay.url
    };
    var str = fs.readFileSync(regTemplate, 'utf8');
    var html = ejs.render(str, data);

    // heckle the user for registration fee
    console.log("Emailing " + user.username + " with registration template");
    heckler.email({
      from: "Test <taesup63@gmail.com>",
      to: "taesup63@gmail.com",
      subject: "Auction " + auction._id + " Registration Fee Invoice",
      html: html
    });
    
    // add user to auction with status "processing"
    user.registrationStatus = "invoice sent";
    user.registered = false;
    delete user.admin; // remove admin status if available
    auction.users.push(user);
    // update auction
    db.updateAuction(auction, cb);
  });
};
