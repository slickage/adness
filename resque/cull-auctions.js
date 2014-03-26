var db = require(__dirname + '/../db');
var request = require('request');
var config = require('../config');

module.exports = function(callback) {
  // get all auctions in full (with trueEnd property)
  db.fullAuctions(function(err, auctions) {
    if (err) { console.log(err); callback(null, false); }
    else {
      // get current time
      var currentTime = new Date().getTime();

      // for each auction
      auctions.forEach(function(auction) {
        // find time to true end
        var timeTill = auction.trueEnd - currentTime;

        // for auctions in the future, build queue to notify winners
        if (timeTill > 0) {
          // account for setTimeout not being able to handle more than 24 days
          setDaysTimeout(auctionNotification, timeTill, auction);
        }
      });
      callback(null, true);
    }
  });
};

function setDaysTimeout(callback, timeTill, parameters) {
  // 86400 seconds in a day
  var msInDay = 86400*1000;
  var daysTill = Math.floor(timeTill / msInDay);
  var dayCount = 0;

  // if within this day
  if (daysTill === 0) {
    setTimeout(auctionNotification, timeTill, parameters);
  }
  else  {
    // set interval that counts the days
    var timer = setInterval(function() {
      dayCount++;  // a day has passed
      timeTill = timeTill - msInDay;

      if(dayCount === daysTill) {
         clearInterval(timer);
         setTimeout(auctionNotification, timeTill, parameters);
      }
    },msInDay);
  }
}

function auctionNotification(auction) {
  // get the winning bids and bids per slot from the db
  db.appendBidsToAuction(auction, function(err, auctionBids) {
    // calculate the winners and how much each owes
    var winners = generateWinners(auctionBids.bidPerSlot);
    for(var winner in winners) {
      // notify winners with a link to payment
      notifyWinner(winners[winner], auction._id);
    }
  });

  // get all the bids for this auction
  db.getBidsPerAuction(auction._id, function(err, bids) {
    // remove first bid since it's an auction
    bids.splice(0,1);

    // generate bidders from list of bids
    var bidders = generateBidders(bids);
    for(var bidder in bidders) {
      // notify bidders that the auction is closed
      notifyBidder(bidders[bidder], auction._id);
    }
  });
}

function generateWinners(bidPerSlot) {
  var users = {};

  bidPerSlot.forEach(function(bid) {
    if (users[bid.user.username]) {
      var payment = Number(users[bid.user.username].payment) + Number(bid.price);
      payment = Number(payment).toFixed(2);
      var slots = Number(users[bid.user.username].slots) + 1;
      slots = Number(slots);
      users[bid.user.username].payment = payment;
      users[bid.user.username].slots = slots;
    }
    else {
      bid.user.payment = bid.price;
      bid.user.slots = 1;
      users[bid.user.username] = bid.user;
    }
  });

  return users;
}

function generateBidders(bids) {
  var bidders = {};

  bids.forEach(function(bid) {
    if (!bidders[bid.user.username]) {
      bidders[bid.user.username] = bid.user;
    }
  });

  return bidders;
}

function notifyWinner(user, auctionId) {
  // generate basicpay receipt with auctionId and username
  var bpReceipt = {auctionId: auctionId, username: user.username};

  // insert basicpay receipt into db
  db.newBPReceipt(bpReceipt, function(err, body) {
    if (err) { return console.log(err); }
    // use basicpay receipt id as webhook token
    var token = body.id;
    
    // generate invoice
    var invoice = createInvoice(user.payment, user.slots, token);
    console.log(invoice);

    // send invoice to basicpay and get invoice id
    request.post(
      {
        uri: 'http://localhost:3000/invoices',
        method: "POST",
        form: invoice
      },
      function(err, response, body) {
        if (err) { return console.log(err); }
        console.log(body);

        if (body[0]) {
          // get the invoiceId
          var invoice = body[0];
          var invoiceId = invoice._id;
          console.log(invoiceId);

          // update basicpay receipt with invoiceId
          bpReceipt.invoiceId = invoiceId;
          db.updateBPReceipt(bpReceipt, function(err, body) {
            if (err) { return console.log(err); }

            // build email template
            
            // heckle the winners
          });
        }
        else { console.log("ERROR: BasicPay could not generate an invoice!"); }
      }
    );
  });
}

function notifyBidder(user, auctionId) {
  console.log("Bidder");
  console.log(user);
  // notify bidder that auction is closed

  // TODO: find the next open auction 

  // build the email template

  // heckle the bidders
}

function heckleUser(emailTemplate, email) {

}

function createInvoice(payment, slots, token) {
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
  invoice.webhooks.paid = {url: config.basicpay.url, token: token};
  return invoice;
}
