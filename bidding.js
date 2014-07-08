/* jshint node: true */
'use strict';

// slot is the number of slots to fill
// bids is all the bids from one auction, already sorted by bid price

module.exports = function(slots, bids) {
  // the winning bids and the slots filled by the set of bids
  var retVal = {
    winningBids: [],
    primarySlots: [],
    secondarySlots: []
  };
  var slotsFilled = 0; // slot (filling loop) counter
  var secondarySlotsFilled = 0; // secondary filling loop
  var primaryOverflow = 0;

  // if no bids, return nothing
  if (bids.length < 1) { return retVal; }

  // primary filling loop
  while (slotsFilled < slots) {
    var highestBid = {};
    // check if there are anymore bids
    if (bids.length > 0){
      // get highest bid
      highestBid = bids[0];
    }
    // else break out and return what we have
    else { break; }

    // adjust slots if bid is void
    var bidSlots = 0;
    if (highestBid.void && highestBid.wonSlots) {
      bidSlots = highestBid.wonSlots;
    }
    else if (highestBid.void && !highestBid.wonSlots) {
      bidSlots = 0;
    }
    else { bidSlots = highestBid.slots; }

    // add this bid to the list of winning bids
    retVal.winningBids.push(highestBid);

    // find the number of slots this bid fulfills
    slotsFilled += bidSlots;

    // fill the slots with the winning bid
    var counter = 0;
    while (retVal.primarySlots.length < slots &&
           counter < bidSlots) {
      retVal.primarySlots.push(highestBid);
      counter++;
    }

    if (slotsFilled > slots){
      primaryOverflow = slotsFilled - slots;
    }
    else {
      // remove highest bid
      bids.splice(0, 1);
    }
  }

  // if no bids, return nothing
  if (bids.length < 1) { return retVal; }

  // pre-add overflow
  var overflowCounter = 0;
  var overflowBid = bids[0];
  while (retVal.secondarySlots.length < slots &&
         overflowCounter < primaryOverflow) {
    retVal.secondarySlots.push(overflowBid);
    overflowCounter++;
    secondarySlotsFilled++;
  }
  bids.splice(0, 1);

  // secondary filling loop
  while (secondarySlotsFilled < slots) {
    var secondaryHighestBid = {};
    // check if there are anymore bids
    if (bids.length > 0){
      // get highest bid
      secondaryHighestBid = bids[0];
    }
    // else break out and return what we have
    else { break; }

    // adjust slots if bid is void
    var secBidSlots = 0;
    if (secondaryHighestBid.void && secondaryHighestBid.wonSlots) {
      secBidSlots = secondaryHighestBid.wonSlots;
    }
    else if (secondaryHighestBid.void && !secondaryHighestBid.wonSlots) {
      secBidSlots = 0;
    }
    else { secBidSlots = secondaryHighestBid.slots; }

    // find the number of slots this bid fulfills
    secondarySlotsFilled += secBidSlots;

    // fill the slots with the winning bid
    var secondaryCounter = 0;
    while (retVal.secondarySlots.length < slots &&
           secondaryCounter < secBidSlots) {
      retVal.secondarySlots.push(secondaryHighestBid);
      secondaryCounter++;
    }

    // remove highest bid
    bids.splice(0, 1);
  }

 return retVal;
};
