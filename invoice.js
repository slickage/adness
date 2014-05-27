var db = require('./db');
var config = require('./config');
var request = require('request');

module.exports = {
  auction: function(auctionId, user, webhook, cb) {
    // create baron receipt with username and auctionId
    var bpReceipt = {
      auctionId: auctionId,
      userId: user.userId,
      username: user.username
    };
    generateReceipt(bpReceipt, function(err, bpReceipt) {
      if (err) { return cb(err, undefined); }

      // generate an invoice for auction winners
      var invoice = createAuctionInvoice(auctionId, user, webhook, bpReceipt._id);
      if (invoice.webhooks) invoice.webhooks.token = bpReceipt._id;

      generateInvoice(user, invoice, bpReceipt, cb);
    });
  },

  createAuctionInvoice: createAuctionInvoice,
  createRegistrationInvoice: createRegistrationInvoice,
  createInvoice: createInvoice
};

function createAuctionInvoice(auctionId, user, webhook) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.min_confirmations = Number(config.bitcoin.numberOfConfs);
  invoice.line_items = [];
  for (var i = 0; i < user.lineItems.length; i++) {
    var lineItem = {};
    lineItem.description = "Auction " + auctionId + " Ad Slot";
    lineItem.quantity = 1;
    lineItem.amount = Number(user.lineItems[i]);
    invoice.line_items.push(lineItem);
  }
  invoice.access_token = config.baron.key;
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
  invoice.access_token = config.baron.key;
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
    generateInvoice(invoice, savedReceipt, cb);
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

function generateInvoice(invoice, receipt, cb) {
  // send invoice to baron and get invoice id
  request.post(
    {
      uri: config.baron.internalUrl + '/invoices',
      method: "POST",
      form: invoice
    },
    function(err, responce, body) {
      if (err) {
        // queue broken invoices
        return cb(err, undefined);
      }
      saveInvoice(receipt, body, cb);
    }
  );
}

function saveInvoice(receipt, body, cb) {
  // parse body into json (invoice)
  var invoice;
  try { invoice = JSON.parse(body); }
  catch (error) {
    errorMsg = "Could not generate an invoice, received response: ";
    errorMsg += body + "\n";
    errorMsg += error.message;
    var invoiceError = new Error(errorMsg );
    return cb(invoiceError, undefined, undefined);
  }

  console.log("Invoice " + invoice.id + " created for Receipt: " + receipt._id);

  // update receipt with new invoice
  receipt.invoice = invoice;
  db.updateReceipt(receipt, function(err, body) {
    if (err) { return cb(err, undefined, undefined); }
    console.log("Updated Receipt " + receipt._id + " with Invoice ID " + receipt.invoice.id);
    var results = { receipt: receipt, invoice: invoice };
    cb(null, results);
  });
}

function queueInvoice(invoiceForm, receipt, cb) {

}