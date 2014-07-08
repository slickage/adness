/* jshint node: true */
'use strict';

var db = require('./db');
var config = require('./config');
var request = require('request');
var async = require('async');

function createAuctionInvoice(auctionId, user, expiration, discount, webhook) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.expiration = expiration;
  invoice.min_confirmations = Number(config.bitcoin.numberOfConfs);
  invoice.line_items = [];
  for (var i = 0; i < user.lineItems.length; i++) {
    var lineItem = {};
    lineItem.description = "Auction " + auctionId + " Ad Slot for " + user.lineItems[i].region;
    lineItem.quantity = 1;
    var originalAmount = Number(user.lineItems[i].price);
    var discountedAmount = originalAmount - (originalAmount * discount);
    lineItem.amount = discountedAmount.toFixed(4);
    invoice.line_items.push(lineItem);
  }
  invoice.api_key = config.baron.key;
  invoice.webhooks = {};
  // leave webhook token out at this point, it'll be generated later
  invoice.webhooks.paid = {};
  invoice.webhooks.paid.url = webhook;
  return invoice;
}

function createRegistrationInvoice(user, webhook) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.min_confirmations = Number(config.bitcoin.numberOfConfs);
  invoice.line_items = [{
    description: user.username + " Auction Registration Fee",
    quantity: 1,
    amount: 0.25,
  }];
  invoice.api_key = config.baron.key;
  invoice.webhooks = {};
  // leave webhook token out at this point, it'll be generated later
  invoice.webhooks.paid = {};
  invoice.webhooks.paid.url = webhook;
  return invoice;
}

// metadata: any extra data that may be needed in the callback's function
// invoiceType: a string to indicate which type of invoice this is.
//   This is needed to figure out which callback to use if the first
//   call fails and needs to be queued. (Could be optimized.)
function createInvoice(metadata, invoiceType, invoice, cb) {
  if (!invoiceType)
    console.log("Invoice Created without a type. Callback is not guaranteed.");
  var receipt = { metadata: metadata, invoiceType: invoiceType };
  // create baron receipt with username and auctionId
  generateReceipt(receipt, function(err, savedReceipt) {
    if (err) { return cb(err, undefined); }
    // add the receipt's id as the webhook token 
    if (invoice.webhooks) invoice.webhooks.token = savedReceipt._id;
    generateInvoice(invoice, savedReceipt, true, cb);
  });
}

function generateReceipt(receipt, cb) {
  // insert baron receipt into db
  db.newReceipt(receipt, function(err, body) {
    if (err) { return cb(err, undefined); }

    // use baron receipt id as webhook token
    receipt._id = body.id;
    console.log("Created a BP Receipt with ID: " + body.id);

    cb(null, receipt);
  });
}

function generateInvoice(invoice, receipt, queue, cb) {
  // send invoice to baron and get invoice id
  request.post(
    {
      uri: config.baron.internalUrl + '/invoices',
      method: "POST",
      form: invoice
    },
    function(err, response, body) {
      if (err) {
        if (queue) {
          console.log("Encountered an Error, Queuing Invoice...");
          var newInvoice = { invoice: invoice, receipt: receipt };
          db.newQueuedInvoice(newInvoice, function(err, body) {
            if (err) console.log(err);
          });
        }

        return cb(err, undefined);
      }
      else { saveInvoice(receipt, invoice, body, queue, cb); }
    }
  );
}

function saveInvoice(receipt, originalInvoice, body, queue, cb) {
  // parse body into json (invoice)
  var invoice;
  try { invoice = JSON.parse(body); }
  catch (error) {
    if (queue) {
      console.log("Encountered an Error, Queuing Invoice...");
      var newInvoice = { invoice: invoice, receipt: receipt };
      db.newQueuedInvoice(newInvoice, function(err, body) {
        if (err) { console.log(err); }
      });
    }

    var errorMsg = "Could not generate an invoice, received response: ";
    errorMsg += body + "\n";
    errorMsg += error.message;
    var invoiceError = new Error(errorMsg);
    return cb(invoiceError, undefined);
  }

  console.log("Invoice " + invoice.id + " created for Receipt: " + receipt._id);

  // update receipt with new invoice
  originalInvoice.id = invoice.id;
  receipt.invoice = originalInvoice;
  receipt.invoiceStatus = "sent";
  db.updateReceipt(receipt, function(err, body) {
    if (err) { return cb(err, undefined); }
    console.log("Updated Receipt " + receipt._id + " with Invoice ID " + receipt.invoice.id);
    var results = { receipt: receipt, invoice: invoice };
    return cb(null, results);
  });
}

function queuedInvoices(callback) {
  async.waterfall([
    // get all the queuedInvoices
    function (cb) {
      db.getAllQueuedInvoices(cb);
    },
    // iterative through and call each queuedInvoice
    function (invoices, cb) {
      async.eachSeries(invoices, function(queuedInvoice, innerCb) {
        retryInvoice(queuedInvoice, innerCb);
      },
      function(err) { return cb(err); });
    }
  ],
  // final call to close this iteration of queuedInvoices
  function (err, result) {
    if (err) { console.log(err); }
    return callback(null);
  });
}

function retryInvoice(queuedInvoice, cb) {
  // call each one
  var invoice = queuedInvoice.invoice;
  var receipt = queuedInvoice.receipt;
  receipt.queuedInvoiceId = queuedInvoice._id;
  generateInvoice(invoice, receipt, false, function(err, results) {
    if (err) { console.log(err); }
    else {
      var invoiceType = results.receipt.invoiceType;
      var queuedInvoiceId = results.receipt.queuedInvoiceId;
      delete results.receipt.queuedInvoiceId;

      // create a modified callback
      if (invoiceType === "registration") {
        registration.completeInvoice(null, results);
      }
      else if (invoiceType === "auction") {
        auctionClose.completeInvoice(null, results);
      }
      else if (invoiceType === "auctionModified"){
        auctionClose.completeModifiedInvoice(null, results);
      }
      else {
        console.log("QueuedInvoice with unknown type found.");
      }

      // delete queuedInvoice
      db.deleteQueuedInvoice(queuedInvoiceId, function(err, body) {
        if (err) console.log(err);
      });
    }

    return cb(null);
  });
}

module.exports = {
  createAuctionInvoice: createAuctionInvoice,
  createRegistrationInvoice: createRegistrationInvoice,
  createInvoice: createInvoice,
  queuedInvoices: queuedInvoices
};

var registration = require('./registration');
var auctionClose = require('./events/auction-close');
