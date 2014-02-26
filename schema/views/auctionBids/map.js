function(doc) {
  if(doc.type == "auction") {
    emit([doc.id, 0], doc);
  }
  else if (doc.type == "bid") {
    emit([doc.auctionId, 1], doc);
  }
}
