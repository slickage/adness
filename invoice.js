var db = require('./db');
var config = require('./config');
var request = require('request');

module.exports = {
  registration: function(auction, user, webhook, cb) {
    generateBPReceipt(auction, user, function(err, bpReceipt) {
      if (err) { return cb(err, undefined); }

      // generate an invoice for the registration fee
      var invoice = createRegistrationInvoice(auction, webhook, bpReceipt);

      generateInvoice(invoice, bpReceipt, cb);
    });
  },
  auction: function(auction, user, webhook, cb) {
    generateBPReceipt(auction, user, function(err, bpReceipt) {
      if (err) { return cb(err, undefined); }

      // generate an invoice for auction winners
      var invoice = createAuctionInvoice(user.payment, user.slots, webhook, bpReceipt);
      
      generateInvoice(invoice, bpRecipt, cb);
    });
  }
};

function createAuctionInvoice(payment, slots, webhook, bpReceipt) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.min_confirmations = 6; // TODO: confirm block chain confirmations
  invoice.line_items = [];
  for (var i = 0; i < slots; i++) {
    var lineItem = {};
    lineItem.description = "Auction Ad Slot";
    lineItem.quantity = 1;
    lineItem.amount = Number(payment) / Number(slots);
    invoice.line_items.push(lineItem);
  }
  invoice.balance_due = payment;
  invoice.webhooks = {};
  invoice.webhooks.paid = {url: webhook, token: bpReceipt._id};
  return invoice;
}

function createRegistrationInvoice(auction, webhook, bpReceipt) {
  var invoice = {};
  invoice.currency = "BTC";
  invoice.min_confirmations = 6; // TODO: confirm block chain confirmations
  invoice.line_items = [{
    description: "Auction " + auction._id + " Registration Fee",
    quantity: 1,
    amount: 0.25,
  }];
  invoice.balance_due = 0.25;
  invoice.webhooks = {};
  invoice.webhooks.paid = {url: webhook, token: bpReceipt._id};
  return invoice;
}

function generateBPReceipt(auction, user, cb) {
  // generate basicpay receipt with auctionId and username
  var bpReceipt = {auctionId: auction._id, username: user.username};

  // insert basicpay receipt into db
  db.newBPReceipt(bpReceipt, function(err, body) {
    if (err) { return cb(err, undefined); }

    // use basicpay receipt id as webhook token
    bpReceipt._id = body.id;
    console.log("Created a BP Receipt with ID: " + body.id);

    cb(null, bpReceipt);
  });
}

function generateInvoice(invoiceForm, bpReceipt, cb) {
  // send invoice to basicpay and get invoice id
  request.post(
    {
      uri: config.basicpay.url + '/invoices',
      method: "POST",
      form: invoiceForm
    },
    function(err, response, body) {
      if (err) { return cb(err, undefined); }
      
      // parse body into json (invoice)
      var invoice = JSON.parse(body);

      // check for valid invoice data
      if (invoice[0]) {
        // get the invoiceId
        var invoiceId = invoice[0]._id;

        console.log("Invoice " + invoiceId + " created for BPReceipt: " + bpReceipt._id);

        // update basicpay receipt with invoiceId
        bpReceipt.invoiceId = invoiceId;
        db.updateBPReceipt(bpReceipt, function(err, body) {
          if (err) { return cb(err, undefined); }
          console.log("Updated BP Receipt " + bpReceipt._id + " with Invoice ID " + bpReceipt.invoiceId);
          cb(null, invoiceId);
        });
      }
      else {
        var error = { message: 'BasicPay could not generate an invoice!' };
        return cb(error, undefined);
      }
    }
  );
}