function(doc) {
  if(doc.type == "auction") {
    var currentTime = new Date().getTime();
    if (doc.start > currentTime) {
      emit(doc._id, doc);
    }
  }
}
