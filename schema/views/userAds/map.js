function(doc) {
  if(doc.type == "ad") {
    emit([doc.userId, doc.created_at], doc);
  }
}
