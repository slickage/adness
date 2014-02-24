function(doc) {
  if(doc.type == "auction") {
    var currentTime = new Date().getTime();
    if ((currentTime < doc.start ||
        currentTime >= doc.end) ||
        !doc.enabled) {
      emit(doc._id, doc);
    }
  }
}
