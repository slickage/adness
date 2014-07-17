/* jshint node: true, couch: true */
'use strict';

var config = require('./config');

var ddoc = {
  _id: '_design/' + config.couchdb.name,
  views: {},
  lists: {},
  shows: {}
};

module.exports = ddoc;

ddoc.views.auctionBids = {
  map: function(doc) {
    if(doc.type === 'auction') {
      emit([doc._id, 0, 0, 0], doc);
    }
    else if (doc.type === 'bid') {
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
    if(doc.type === 'auction') {
      emit(doc._id, doc);
    }
  }
};

ddoc.views.registeredUser = {
  map: function(doc) {
    if(doc.type === 'registeredUser') {
      emit([doc._id], doc);
    }
  }
};

ddoc.views.reviewAds = {
  map: function(doc) {
    if(doc.type === 'ad' && doc.submitted === true) {
      emit([doc.created_at, 0], null);
      if (doc.userId) {
        emit([doc._id, 1], {_id: doc.userId.toString()});
      }
    }
  }
};

ddoc.views.rejectedAds = {
  map: function(doc) {
    if(doc.type === 'ad' && doc.rejected === true) {
      emit([doc.created_at, 0], null);
      if (doc.userId) {
        emit([doc._id, 1], {_id: doc.userId.toString()});
      }
    }
  }
};

ddoc.views.approvedAds = {
  map: function(doc) {
    if(doc.type === 'ad' && doc.approved === true) {
      emit([doc.created_at, 0], null);
      if (doc.userId) {
        emit([doc._id, 1], {_id: doc.userId.toString()});
      }
    }
  }
};

ddoc.views.userAds = {
  map: function(doc) {
    if(doc.type === 'ad') {
      emit([doc.userId, doc.created_at], doc);
    }
  }
};

ddoc.views.latestAdsInRotation = {
  map: function(doc) {
    if(doc.type === 'adsInRotation') {
      emit([doc.adsStart], doc);
    }
  }
};

ddoc.views.getQueuedInvoices = {
  map: function(doc) {
    if (doc.type === 'queuedInvoice') {
      emit(doc._id, doc);
    }
  }
};

ddoc.views.getAuctionInvoices = {
  map: function(doc) {
    if (doc.type === 'receipt') {
      emit([doc.metadata.auctionId], doc);
    }
  }
};

ddoc.views.getRecalculations = {
  map: function(doc) {
    if (doc.type === 'recalculation') {
      emit(doc._id, doc);
    }
  }
};

ddoc.views.getUserBidsPerRegion = {
  map: function(doc) {
    if (doc.type === 'bid') {
      emit([doc.auctionId, doc.region, doc.user.userId], doc);
    }
  }
};

ddoc.views.getUserInvoices = {
  map: function(doc) {
    if (doc.type === 'receipt') {
      emit([doc.metadata.auctionId, doc.metadata.user.userId], doc);
    }
  }
};

ddoc.views.getReservedAds = {
  map: function(doc) {
    if (doc.type === 'reserved_ad') {
      emit([doc._id], doc);
    }
  }
};

ddoc.views.getFactoids = {
  map: function(doc) {
    if (doc.type === 'factoids') {
      emit(doc._id, doc);
    }
  }
};
