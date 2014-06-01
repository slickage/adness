// slot is the number of slots to fill
// bids is all the bids from one auction, already sorted by bid price

module.exports = function(slots, bids) {
  // the winning bids and the slots filled by the set of bids
  var retVal = {
    winningBids: [],
    bidPerSlot: [],
    secondarySlots: []
  };
  var slotsFilled = 0; // slot (filling loop) counter
  var secondarySlotsFilled = 0; // secondary filling loop

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

    // add this bid to the list of winning bids
    retVal.winningBids.push(highestBid);

    // find the number of slots this bid fulfills
    slotsFilled += highestBid.slots;

    // fill the slots with the winning bid
    var counter = 0;
    while (retVal.bidPerSlot.length < slots &&
           counter < highestBid.slots) {
      retVal.bidPerSlot.push(highestBid);
      counter++;
    }

    // remove highest bid
    bids.splice(0, 1);
  }

    // if no bids, return nothing
  if (bids.length < 1) { return retVal; }

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

    // find the number of slots this bid fulfills
    secondarySlotsFilled += secondaryHighestBid.slots;

    // fill the slots with the winning bid
    var secondaryCounter = 0;
    while (retVal.secondarySlots.length < slots &&
           secondaryCounter < secondaryHighestBid.slots) {
      retVal.secondarySlots.push(secondaryHighestBid);
      secondaryCounter++;
    }

    // remove highest bid
    bids.splice(0, 1);
  }

 return retVal;
};
