/* jshint node: true */
'use strict';

var bidding = require('../bidding');

var bidTest = function() {

  // need to test for no bid scenario
  // need to test for under filled slots
  // need to test for sorting by same price

  // test data
  var slots = 8;
  var bids = [
    {
      created_at: new Date().getTime(),
      type: 'bid',
      price: 3,
      slots: 3,
      user: 'testuser',
      auctionId: 1,
      bidId: 1
    },
    {
      created_at: new Date().getTime() + 1000,
      type: 'bid',
      price: 3,
      slots: 4,
      user: 'testuser',
      auctionId: 1,
      bidId: 2
    },
    {
      created_at: new Date().getTime() + 2000,
      type: 'bid',
      price: 2.8,
      slots: 7,
      user: 'testuser',
      auctionId: 1,
      bidId: 3
    },
    {
      created_at: new Date().getTime() + 3000,
      type: 'bid',
      price: 2.5,
      slots: 2,
      user: 'testuser',
      auctionId: 1,
      bidId: 4
    },
    {
      created_at: new Date().getTime() + 4000,
      type: 'bid',
      price: 2,
      slots: 8,
      user: 'testuser',
      auctionId: 1,
      bidId: 5
    },
    {
      created_at: new Date().getTime() + 5000,
      type: 'bid',
      price: 1,
      slots: 3,
      user: 'testuser',
      auctionId: 1,
      bidId: 6
    }
  ];

  var results = bidding(slots, bids);
  console.log(results);
};

// run test
bidTest();