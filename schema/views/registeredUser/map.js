function(doc) {
  if(doc.type == "registeredUser") {
    emit(doc.userId, doc);
  }
}
