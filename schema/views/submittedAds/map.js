function(doc) {
  if(doc.type == "ad" && doc.submitted === true) {
    emit([doc.created_at], doc);
  }
}
