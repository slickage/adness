function(doc) {
  if(doc.type == "auction") {
    emit(doc._id, doc);
  }
}
