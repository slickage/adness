var db = require('./db');
var async = require('async');
var config = require('./config');
var request = require('request');
var ejs = require('ejs');
var fs = require('fs');
var heckler = require('heckler');
var regTemplate = __dirname + '/email-templates/reg-paid.ejs';
var winTemplate = __dirname + '/email-templates/winner-paid.ejs';

module.exports = {
  registration: function(req, res) {
    // get bpreceipt from the post body
    var bprId = req.body.token;
    var bpReceipt;
    var regUser;

    async.waterfall([
      // get Basic Pay Receipt from the DB
      function(cb) {
        getBPReceipt(bprId, cb);
      },
      // validate call 
      function(receipt, cb) {
        validateCall(receipt, cb);
      },
      // get the RegisteredUser using the BPReceipt
      function(receipt, cb) {
        bpReceipt = receipt;
        getRegUser(receipt, cb);
      },
      // update the RegisteredUser
      function(user, cb) {
        regUser = user;
        updateRegUser(user, cb);
      }],
      // heckler admin with payment and invoice info
      function(err, results) {
        if (err) {
          console.log(err);
          return res.send(500, err.message);
        }

        // build registration email template
        var data = {
          username: regUser.username,
          invoiceId: bpReceipt.invoiceId,
          invoiceUrl: config.baron.url
        };
        var str = fs.readFileSync(regTemplate, 'utf8');
        var html = ejs.render(str, data);

        // heckle the admin that reg fee was paid
        console.log("Emailing Admin: Registration Cleared for " + regUser.username);
        heckler.email({
          from: config.senderEmail,
          to: config.admin.emails,
          subject: "Registration Fee Paid for " + regUser.username,
          html: html
        });

        return res.json({ ok: true });
      }
    );
  },
  winner: function(req, res) {
    // get bpreceipt from the post body
    var bprId = req.body.token;
    var auctionId = req.params.auctionId;
    async.waterfall([
      // get Basic Pay Receipt from the DB
      function(cb) {
        getBPReceipt(bprId, cb);
      },
      // validate call 
      function(receipt, cb) {
        validateCall(receipt, cb);
      }],
      // heckler admin with payment and invoice info
      function(err, bpReceipt) {
        if (err) { return res.send(500, err.message); }
        
        // secondary vaildation
        if (bpReceipt.auctionId !== auctionId) {
          return res.send(500, "Invalid Request");
        }

        // build registration email template
        var data = {
          username: bpReceipt.username,
          userId: bpReceipt.userId,
          auctionId: auctionId,
          invoiceId: bpReceipt.invoiceId,
          invoiceUrl: config.baron.url,
          site: config.site.url,
          browsePrefix: req.browsePrefix
        };
        var str = fs.readFileSync(winTemplate, 'utf8');
        var html = ejs.render(str, data);

        // heckle the admin that an  auction payment was made
        console.log("Emailing Admin: Payment Cleared for " + bpReceipt.username + " For Auction: " + auctionId);
        heckler.email({
          from: config.senderEmail,
          to: config.admin.emails,
          subject: "Payment on Auction: " + auctionId + " by user: " + bpReceipt.username,
          html: html
        });
        
        return res.json({ ok: true });
      }
    );
  }
};

function validateCall(receipt, cb) {
  // call baron to check invoice status
  request.get(
    { uri: config.baron.internalUrl + '/status/' + receipt.invoiceId },
    function(err, response, body) {
      if (err) { return cb(err, undefined); }
      
      var status;
      try {
        // parse body into json (status object)
        var parsedBody = JSON.parse(body);
        // get the invoice status
        status = parsedBody.status;
        if (status && status === "paid") {
          return cb(null, receipt);
        }
        else {
          var statusError = new Error("Status is not set to paid.");
          return cb(statusError, undefined);
        }
      }
      catch (error) {
        errorMsg = "Could not validate webhook call, received response: ";
        errorMsg += body + "\n";
        errorMsg += error.message;
        var validateError = new Error(errorMsg );
        return cb(validateError, undefined);
      }
    }
  );
}

function getBPReceipt(bprId, cb) {
  db.getBPReceipt(bprId, function(err, receipt) {
    if (err) { cb(err, undefined); }
    cb(null, receipt);
  });
}

function getRegUser(receipt, cb) {
  db.getRegisteredUser(receipt.userId, function(err, user) {
    if (err) { cb(err, undefined); }
    cb(null, user);
  });
}

function updateRegUser(user, cb) {
  user.registered = true;
  delete user.registrationStatus;
  db.insertRegisteredUser(user, cb);
}

