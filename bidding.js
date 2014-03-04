// slot is the number of slots to fill
// bids is all the bids from one auction, already sorted by bid price

module.exports = function(slots, bids) {
  // if no bids, return nothing
  if (bids.length < 1) { return {}; }

  // the winning bids and the slots filled by the set of bids
  var retVal = {
    winningBids: [],
    bidPerSlot: []
  };
  var slotsFilled = 0; // slot (filling loop) counter

  // filling loop
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
    for (var i = 0; i < highestBid.slots; i++) {
      if (retVal.bidPerSlot.length < slots){
        retVal.bidPerSlot.push(highestBid);
      }
      else { break; }
    }

    // remove highest bid
    bids.splice(0, 1);
  }

 return retVal;
};