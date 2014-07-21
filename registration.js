/* jshint node: true */
'use strict';

var db = require('./db');
var invoice = require('./invoice');
var config = require('./config');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var regTemplate = __dirname + '/email-templates/registration.ejs';
var async = require('async');

function updateAuctUser(user, userMessage, cb) {
  if (!userMessage) {
    delete user.userMessage;
  }
  else {
    user.userMessage = userMessage;
  }
  db.insertAuctionUser(user, cb);
}

function addUser(user, cb) {
    // validation
    if (!user) { return cb({message: 'Not Logged In.'}); }
    // Add auction user
    var auctionUser = {
      _id: user.userId,
      username: user.username,
      email: user.email,
      admin: user.admin,
      registered: false
    };
    // Admin is automatically eligible to bid
    if (user.admin) { auctionUser.registered = true; }
    db.insertAuctionUser(auctionUser, function(err) {
      if (err) {
        if (err.error && err.error === 'conflict' ) {
          // Harmless collision
          console.log('DEBUG registration.addUser() Document update conflict:');
          return cb({message: 'You clicked Register too fast.  Reload the homepage.'});
        }
        else {
          console.log(err);
          return cb({message: 'Database Error'});
        }
      }
      else {
        // submit registration fee invoice
        var webhook = config.site.internalUrl + '/hooks/registration';
        var invoiceForm = invoice.createRegistrationInvoice(user, webhook);
        var data = {
          userId: user.userId,
          username: user.username,
          email: user.email,
          admin: user.admin
        };
        invoice.createInvoice(data, 'registration', invoiceForm, function (err, result) {
          if (err) {
            console.log(err);
            return cb({message: 'Temporary failure: createInvoice failed to submit the invoice to Baron.  After this is fixed the invoice will be submitted and you will receive an e-mail.'});
          }
          else {
            completeInvoice(null, result);
            cb(null);
          }
        });
      }
    });
}
function completeInvoice(err, result) {
    // build registration email
    var data = {
      invoiceId: result.invoice.id,
      invoiceUrl: config.baron.url,
      registrationFee: config.registrationFee
    };
    var str = fs.readFileSync(regTemplate, 'utf8');
    var html = ejs.render(str, data);

    var metadata = result.receipt.metadata;
    var user;

    async.waterfall([
      function(cb) {
        // heckle the user for registration fee
        console.log('Emailing ' + metadata.username + ' with registration email-templates');
        heckler.email({
          from: config.senderEmail,
          to: metadata.email,
          subject: 'Auction Registration Fee Invoice',
          html: html
        });
        cb();
      },
      function(cb) {
        // obtain user from the database
        db.getAuctionUser(metadata.userId, function (err, dbUser) {
          if (err) {
            console.log('completeInvoice() getAuctionUser(): ' + JSON.stringify(err));
            cb();
          }
          else {
            user = dbUser;
            cb();
          }
        });
      },
      function(cb) {
        // Add status to user
        updateAuctUser(user, 'Registration Fee Required.  [<a href="' + config.baron.url + '/invoices/' + result.invoice.id + '" target="_blank">View Invoice</a>]', cb);
      }
    ],
    function() {
      return;
    });
}

module.exports = {
  addUser: addUser,
  completeInvoice: completeInvoice
};