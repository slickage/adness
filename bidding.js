// slot is the number of slots to fill
// bids is all the bids from one auction, already sorted by bid price

module.exports = function(slots, bids) {
  // the slots filled by a set of bids
  var retVal = {
    winningBids: [],
    bidPerSlot: []
  };
  var slotsFilled = 0; // slot (loop) counter

  // filling loop
  while (slotsFilled < slots) {
    // get highest bid
    var highestBid = bids[0];

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