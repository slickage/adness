function(doc) {
  if(doc.type == "auction") {
    var currentTime = new Date().getTime();
    if (doc.end <= currentTime) {
      emit(doc._id, doc);
    }
  }
}
