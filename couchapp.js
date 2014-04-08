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

ddoc.views.registeredUser = {
  map: function(doc) {
    if(doc.type == "registeredUser") {
      emit(doc.userId, doc);
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
      emit([doc.userId, doc.created_at], doc);
    }
  }
};

ddoc.views.adsInRotation = {
  map: function(doc) {
    if(doc.type == 'adsInRotation') {
      emit(doc._id, doc);
    }
  }
};

