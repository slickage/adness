function(doc) {
  if(doc.type == "auction") {
    emit([doc._id, 0, 0, 0], doc);
  }
  else if (doc.type == "bid") {
    // the third key is the bid price. 
    // we multiply the third key by -1 to make it sort that descending. 
    // this should always work because prices can never be negative or zero.
    // this ain't pretty but it works. 
    emit([doc.auctionId, 1, -doc.price, doc.created_at], doc);
  }
}
