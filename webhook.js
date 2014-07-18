/* jshint node: true */
'use strict';

var db = require('./db');
var async = require('async');
var config = require('./config');
var request = require('request');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var regAdminTemplate = __dirname + '/email-templates/reg-admin-paid.ejs';
var auctUserTemplate = __dirname + '/email-templates/reg-user-paid.ejs';
var winAdminTemplate = __dirname + '/email-templates/winner-admin-paid.ejs';
var winUserTemplate = __dirname + '/email-templates/winner-user-paid.ejs';

module.exports = {
  registration: function(req, res) {
    // get receipt id from the post body
    var receiptId = req.body.token;
    var cachedReceipt;
    var auctUser;
    var alreadyPaid;

    async.waterfall([
      // get Receipt from the DB
      function(cb) { getReceipt(receiptId, cb); },
      // validate status call 
      function(receipt, cb) {
        if (receipt.invoiceStatus === 'paid') {
          alreadyPaid = true;
          return cb(null, receipt);
        }
        else { validateCall(receipt, cb); }
      },
      // update receipt's invoiceStatus to 'paid'
      function(receipt, cb) {
        if (alreadyPaid) { return cb(null, receipt); }
        else {
          receipt.invoiceStatus = 'paid';
          updateReceipt(receipt, cb);
        }
      },
      // get the AuctionUser using the Receipt
      function(receipt, cb) {
        cachedReceipt = receipt;

        if (alreadyPaid) { return cb(null, undefined); }
        else { getAuctUser(receipt, cb); }
      },
      // update the AuctionUser
      function(user, cb) {
        if (alreadyPaid) { return cb(null, undefined); }
        else {
          auctUser = user;
          updateAuctUser(user, alreadyPaid, cb);
        }
      }],
      // heckler admin with payment and invoice info
      function(err) {
        if (err) {
          console.log(err);
          return res.send(500, err.message);
        }

        if (alreadyPaid) { return res.json({ ok: true }); }

        // build registration email for admin template
        var data = {
          username: auctUser.username,
          invoiceId: cachedReceipt.invoice.id,
          invoiceUrl: config.baron.url
        };
        var adminStr = fs.readFileSync(regAdminTemplate, 'utf8');
        var adminHtml = ejs.render(adminStr, data);

        // heckle the admin that reg fee was paid
        console.log('Emailing Admin: Registration paid for ' + auctUser.username);
        heckler.email({
          from: config.senderEmail,
          to: config.admin.emails,
          subject: 'Registration Fee Paid for ' + auctUser.username,
          html: adminHtml
        });

        // build registration email for user template
        var userStr = fs.readFileSync(auctUserTemplate, 'utf8');
        var userHtml = ejs.render(userStr, data);

        // heckle the user that reg fee was paid
        console.log('Emailing ' + auctUser.username + ': Registration Paid.');
        heckler.email({
          from: config.senderEmail,
          to: auctUser.email,
          subject: 'Registration Fee Paid for ' + auctUser.username,
          html: userHtml
        });

        return res.json({ ok: true });
      }
    );
  },
  winner: function(req, res) {
    // get receipt id from the post body
    var receiptId = req.body.token;
    var auctionId = req.params.auctionId;
    var alreadyPaid;

    async.waterfall([
      // get Receipt from the DB
      function(cb) { getReceipt(receiptId, cb); },
      // validate status call 
      function(receipt, cb) {
        if (receipt.invoiceStatus === 'paid') {
          alreadyPaid = true;
          return cb(null, receipt);
        }
        else { validateCall(receipt, cb); }
      },
      // update receipt's invoiceStatus to 'paid'
      function(receipt, cb) {
        if (alreadyPaid) { return cb(null, receipt); }
        else {
          receipt.invoiceStatus = 'paid';
          updateReceipt(receipt, cb);
        }
      }],
      // heckler admin with payment and invoice info
      function(err, receipt) {
        if (err) { return res.send(500, err.message); }

        if (alreadyPaid) {
          return res.json({ ok: true });
        }
        
        // secondary vaildation
        if (receipt.metadata.auctionId !== auctionId) {
          return res.send(500, 'Invalid Request');
        }

        // build auction winner email template for admins
        var data = {
          username: receipt.metadata.user.username,
          userId: receipt.metadata.user.userId,
          auctionId: auctionId,
          invoiceId: receipt.invoice.id,
          invoiceUrl: config.baron.url,
          site: config.site.url,
          browsePrefix: req.browsePrefix
        };
        var adminStr = fs.readFileSync(winAdminTemplate, 'utf8');
        var adminHtml = ejs.render(adminStr, data);

        // heckle the admin that an auction payment was made
        console.log('Emailing Admin: Payment Cleared for ' + receipt.metadata.user.username + ' For Auction: ' + auctionId);
        heckler.email({
          from: config.senderEmail,
          to: config.admin.emails,
          subject: 'Payment on Auction: ' + auctionId + ' by user: ' + receipt.metadata.user.username,
          html: adminHtml
        });

        // build auction winner email template for users
        var userStr = fs.readFileSync(winUserTemplate, 'utf8');
        var userHtml = ejs.render(userStr, data);

        // heckle the user that an auction payment was made
        console.log('Emailing ' + receipt.metadata.user.username + ': Payment Made For Auction: ' + auctionId);
        heckler.email({
          from: config.senderEmail,
          to: receipt.metadata.user.email,
          subject: 'Payment Received for Auction: ' + auctionId,
          html: userHtml
        });
        
        return res.json({ ok: true });
      }
    );
  }
};

function validateCall(receipt, cb) {
  // call baron to check invoice status
  request.get(
    { uri: config.baron.internalUrl + '/api/invoices/' + receipt.invoice.id },
    function(err, response, body) {
      if (err) { return cb(err, undefined); }
      
      try {
        // parse body into json (status object)
        var parsedBody = JSON.parse(body);
        // get the invoice status
        var is_paid = parsedBody.is_paid;
        if (is_paid && is_paid === true) {
          return cb(null, receipt);
        }
        else {
          var statusError = new Error('Status is not set to paid.');
          return cb(statusError, undefined);
        }
      }
      catch (error) {
        var errorMsg = 'Could not validate webhook call, received response: ';
        errorMsg += body + '\n';
        errorMsg += error.message;
        var validateError = new Error(errorMsg );
        return cb(validateError, undefined);
      }
    }
  );
}

function getReceipt(receiptId, cb) {
  db.getReceipt(receiptId, function(err, receipt) {
    if (err) { return cb(err, undefined); }
    return cb(null, receipt);
  });
}

function updateReceipt(receipt, cb) {
  db.updateReceipt(receipt, function(err) {
    if (err) { return cb(err, undefined); }
    return cb(null, receipt);
  });
}

function getAuctUser(receipt, cb) {
  db.getAuctionUser(receipt.metadata.userId, function(err, user) {
    if (err) { return cb(err, undefined); }
    return cb(null, user);
  });
}

function updateAuctUser(user, alreadyPaid, cb) {
  user.registered = true;
  user.discount_remaining = config.registrationFee;
  delete user.userMessage;
  db.insertAuctionUser(user, cb);
}
