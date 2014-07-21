/* jshint node: true */
'use strict';

var db = require('./db');
var config = require('./config');
var request = require('request');
var async = require('async');

function createAuctionInvoice(auctionId, user, expiration, discounts, webhook) {
  var invoice = {};
  invoice.currency = 'BTC';
  invoice.expiration = expiration;
  invoice.min_confirmations = Number(config.bitcoin.numberOfConfs);
  invoice.line_items = [];
  for (var i = 0; i < user.lineItems.length; i++) {
    var lineItem = {};
    lineItem.description = 'Auction ' + auctionId + ' Ad Slot for ' + user.lineItems[i].region;
    lineItem.quantity = 1;
    lineItem.amount = Number(user.lineItems[i].price);
    invoice.line_items.push(lineItem);
  }
  invoice.discounts = discounts;
  invoice.api_key = config.baron.key;
  invoice.webhooks = {};
  // leave webhook token out at this point, it'll be generated later
  invoice.webhooks.paid = {};
  invoice.webhooks.paid.url = webhook;
  return invoice;
}

function createRegistrationInvoice(user, webhook) {
  var invoice = {};
  invoice.currency = 'BTC';
  invoice.min_confirmations = Number(config.bitcoin.numberOfConfs);
  invoice.line_items = [{
    description: user.username + ' Auction Registration Fee',
    quantity: 1,
    amount: config.registrationFee,
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
    console.log('Invoice Created without a type. Callback is not guaranteed.');
  var receipt = { metadata: metadata, invoiceType: invoiceType };
  // create baron receipt with username and auctionId
  generateReceipt(receipt, function(err, savedReceipt) {
    if (err) { return cb(err, undefined); }
    // add the receipt's id as the webhook token 
    if (invoice.webhooks) { invoice.webhooks.token = savedReceipt._id; }
    postInvoice(invoice, savedReceipt, true, cb);
  });
}

function generateReceipt(receipt, cb) {
  // insert baron receipt into db
  db.newReceipt(receipt, function(err, body) {
    if (err) { return cb(err, undefined); }

    // use baron receipt id as webhook token
    receipt._id = body.id;
    console.log('Created a BP Receipt with ID: ' + body.id);

    cb(null, receipt);
  });
}

function postInvoice(invoice, receipt, queue, cb) {
  // send invoice to baron and get invoice id
  request.post(
    {
      uri: config.baron.internalUrl + '/invoices',
      method: 'POST',
      form: invoice
    },
    function(err, response, body) {
      parseBaronResponse(err, body, function(err, response) {
        if (err) {
          if (queue) {
            console.log('Encountered an Error, Queuing Invoice...');
            delete invoice.api_key;
            var newInvoice = { invoice: invoice, receipt: receipt };
            db.newQueuedInvoice(newInvoice, function(err) {
              if (err) { console.log(err); }
            });
          }

          return cb(err, undefined);
        }
        else {
          saveInvoice(receipt, invoice, response, queue, cb);
        }
      });
    }
  );
}

function parseBaronResponse(postErr, body, cb) {
  // Pass through request.post error
  if (postErr) { return cb(postErr, null); }

  // Check for invalid JSON or unexpected Baron response
  var baronResponse;
  var invalidBody = false;
  var jsonParseError;
  try { baronResponse = JSON.parse(body); }
  catch (error) {
    jsonParseError = error;
  }
  var errorMsg = 'Invalid response from Baron: ';
  if (jsonParseError) {
    errorMsg += body + jsonParseError.message;
  }
  else {
    // Validate response from Baron
    if (!baronResponse.ok || baronResponse.ok === false || !baronResponse.id || !baronResponse.rev) {
      errorMsg += "missing ok: true, _id or _rev: " + body;
      invalidBody = true;
    }
  }

  // Pass back error or valid response
  if (jsonParseError || invalidBody) {
    var invoiceError = new Error(errorMsg);
    cb(invoiceError, undefined);
  }
  else { cb(null, baronResponse); }
}

function saveInvoice(receipt, originalInvoice, invoice, queue, cb) {
  console.log('Invoice ' + invoice.id + ' created for Receipt: ' + receipt._id);

  // update receipt with new invoice
  originalInvoice.id = invoice.id;
  receipt.invoice = originalInvoice;
  receipt.invoiceStatus = 'sent';
  db.updateReceipt(receipt, function(err) {
    if (err) { return cb(err, undefined); }
    console.log('Updated Receipt ' + receipt._id + ' with Invoice ID ' + receipt.invoice.id);
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
    // iterate through and call each queuedInvoice
    function (invoices, cb) {
      async.eachSeries(invoices, function(queuedInvoice, innerCb) {
        retryInvoice(queuedInvoice, innerCb);
      },
      function(err) { return cb(err); });
    }
  ],
  // final call to close this iteration of queuedInvoices
  function (err) {
    if (err) { console.log(err); }
    return callback(null);
  });
}

function retryInvoice(queuedInvoice, cb) {
  // call each one
  var invoice = queuedInvoice.invoice;
  var receipt = queuedInvoice.receipt;
  receipt.queuedInvoiceId = queuedInvoice._id;
  invoice.api_key = config.baron.key;
  postInvoice(invoice, receipt, false, function(err, results) {
    if (err) { console.log('retryInvoice: ' + err); }
    else {
      var invoiceType = results.receipt.invoiceType;
      var queuedInvoiceId = results.receipt.queuedInvoiceId;
      delete results.receipt.queuedInvoiceId;

      // create a modified callback
      if (invoiceType === 'registration') {
        registration.completeInvoice(null, results);
      }
      else if (invoiceType === 'auction') {
        auctionClose.completeInvoice(null, results);
      }
      else if (invoiceType === 'auctionModified'){
        auctionClose.completeModifiedInvoice(null, results);
      }
      else {
        console.log('QueuedInvoice with unknown type found.');
      }

      // delete queuedInvoice
      db.deleteQueuedInvoice(queuedInvoiceId, function(err) {
        if (err) { console.log('deleteQueuedInvoice: ' + JSON.stringify(err)); }
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
