var ddoc = {
  _id: '_design/adness',
  views: {},
  lists: {},
  shows: {}
};

module.exports = ddoc;

ddoc.views.auctionBids = {
  map: function(doc) {
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
};

ddoc.views.auctions = {
  map: function(doc) {
    if(doc.type == "auction") {
      emit(doc._id, doc);
    }
  }
};

ddoc.views['recent-items'] = {
  map: function(doc) {
    if (doc.created_at) {
      var p = doc.profile || {};
      emit(doc.created_at, {
        message:doc.message,
        gravatar_url : p.gravatar_url,
        nickname : p.nickname,
        name : doc.name
      });
    }
  }
};

ddoc.views.submittedAds = {
  map: function(doc) {
    if(doc.type == "ad" && doc.submitted === true) {
      emit([doc.created_at], doc);
    }
  }
};

ddoc.views.userAds = {
  map: function(doc) {
    if(doc.type == "ad") {
      emit([doc.username, doc.created_at], doc);
    }
  }
};

