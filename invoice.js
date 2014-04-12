var db = require('./db');
var config = require('./config');
var request = require('request');

module.exports = {
  registration: function(user, webhook, cb) {
    // create baron receipt with username
    var bpReceipt = { userId: user.userId, username: user.username };
    generateBPReceipt(bpReceipt, function(err, bpReceipt) {
      if (err) { return cb(err, undefined); }

      // generate an invoice for the registration fee
      var invoice = createRegistrationInvoice(user, webhook, bpReceipt);

      generateInvoice(invoice, bpReceipt, cb);
    });
  },
  auction: function(auctionId, user, webhook, cb) {
    // create baron receipt with username and auctionId
    var bpReceipt = {
      auctionId: auctionId,
      userId: user.userId,
      username: user.username
    };
    generateBPReceipt(bpReceipt, function(err, bpReceipt) {
      if (err) { return cb(err, undefined); }

      // generate an invoice for auction winners
      var invoice = createAuctionInvoice(auctionId, user.payment, user.slots, webhook, bpReceipt._id);
      
      generateInvoice(invoice, bpReceipt, cb);
    });
  }
};

function createAuctionInvoice(auctionId, payment, slots, webhook, token) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.min_confirmations = 6; // TODO: confirm block chain confirmations
  invoice.line_items = [];
  for (var i = 0; i < slots; i++) {
    var lineItem = {};
    lineItem.description = "Auction " + auctionId + " Ad Slot";
    lineItem.quantity = 1;
    lineItem.amount = Number(payment) / Number(slots);
    invoice.line_items.push(lineItem);
  }
  invoice.balance_due = payment;
  invoice.webhooks = {};
  invoice.webhooks.paid = {url: webhook, token: token};
  return invoice;
}

function createRegistrationInvoice(user, webhook, bpReceipt) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.min_confirmations = 6; // TODO: confirm block chain confirmations
  invoice.line_items = [{
    description: user.username + " Auction Registration Fee",
    quantity: 1,
    amount: 0.25,
  }];
  invoice.balance_due = 0.25;
  invoice.webhooks = {};
  invoice.webhooks.paid = {url: webhook, token: bpReceipt._id};
  return invoice;
}

function generateBPReceipt(bpReceipt, cb) {
  // insert baron receipt into db
  db.newBPReceipt(bpReceipt, function(err, body) {
    if (err) { return cb(err, undefined); }

    // use baron receipt id as webhook token
    bpReceipt._id = body.id;
    console.log("Created a BP Receipt with ID: " + body.id);

    cb(null, bpReceipt);
  });
}

function generateInvoice(invoiceForm, bpReceipt, cb) {
  // send invoice to baron and get invoice id
  request.post(
    {
      uri: config.baron.url + '/invoices',
      method: "POST",
      form: invoiceForm
    },
    function(err, response, body) {
      if (err) { return cb(err, undefined); }
      
      // parse body into json (invoice)
      var invoice = JSON.parse(body);
      // get the invoiceId
      var invoiceId = invoice.id;

      console.log("Invoice " + invoiceId + " created for BPReceipt: " + bpReceipt._id);

      // update baron receipt with invoiceId
      bpReceipt.invoiceId = invoiceId;
      db.updateBPReceipt(bpReceipt, function(err, body) {
        if (err) { return cb(err, undefined); }
        console.log("Updated BP Receipt " + bpReceipt._id + " with Invoice ID " + bpReceipt.invoiceId);
        cb(null, invoiceId);
      });
    }
  );
}