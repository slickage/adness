function(doc) {
  if(doc.type == "ad") {
    emit([doc.username, doc.created_at], doc);
  }
}
