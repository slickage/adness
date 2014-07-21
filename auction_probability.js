/* jshint node: true */
'use strict';

var config = require('./config');
var _ = require('lodash');

module.exports = {
  probability: probability
};


function probability(auction, reservedAds) {
  if (!reservedAds || !Array.isArray(reservedAds)) { reservedAds = []; }

  // filter reservedAds in use
  var inUseAds = _.filter(reservedAds, function(ad) {
    return ad.in_use === true;
  });

  // global region names from config
  var globalNames = [];
  config.regions.forEach(function(region) {
    if (!region.countries) {
      globalNames.push(region.name);
    }
  });

  // global regions from auction
  var globalSlots = 0;
  var auctionGlobalRegions = _.remove(auction.regions, function(region) {
    if (_.contains(globalNames, region.name)) {
      region.probability = [];
      region.chances = [];
      // global regions total number of slots
      globalSlots = Number(globalSlots) + Number(region.slots);
      return true;
    }
    else { return false; }
  });


  // probabilities for local auctions
  auction.regions.forEach(function(region) {
    // matching reserved Ads
    var reservedSlots = 0;
    inUseAds.forEach(function(ad) {
      if (_.contains(ad.regions, region.name)) {
        reservedSlots = reservedSlots + 1;
        return;
      }

      var regionInter = _.intersection(globalNames, ad.regions);
      if (regionInter.length > 0) {
        reservedSlots = reservedSlots + 1;
      }
    });

    // plus one for factoid
    reservedSlots = reservedSlots + 1;

    // add reservedSlots to this region
    region.reservedSlots = Number(reservedSlots);
    region.globalSlots = Number(globalSlots);

    // total slots for this region
    var totalSlots = Number(region.slots) + Number(globalSlots) + reservedSlots;
    region.probability = '1 in ' + totalSlots;
    region.chances = (100 * 1 / totalSlots).toFixed(5) + '%';

    // add global probablities and chances to global region
    auctionGlobalRegions.forEach(function(globalRegion) {
      var probability = '\n 1 in ' + totalSlots;
      globalRegion.probability.push(probability);

      var chances = '\n ' + (100 * 1 / totalSlots).toFixed(5) + '% in ' + region.name;
      globalRegion.chances.push(chances);
    });
  });


  // probabilities for global auctions
  auctionGlobalRegions.forEach(function(globalRegion) {
    // matching global reserved Ads
    var reservedSlots = 0;
    inUseAds.forEach(function(ad) {
      if (_.contains(ad.regions, globalRegion.name)) {
        reservedSlots = reservedSlots + 1;
      }
    });

    // plus one for factoid
    reservedSlots = reservedSlots + 1;

    // add reservedSlots to this region
    globalRegion.reservedSlots = reservedSlots;
    globalRegion.otherSlots = Number(globalSlots) - Number(globalRegion);

    globalSlots = Number(globalSlots) + Number(reservedSlots);

    // probablities and chances
    var probability = ' 1 in ' + globalSlots;
    globalRegion.probability.push(probability);

    var chances = ' ' + (100 * 1 / globalSlots).toFixed(5) + '% for everywhere else';
    globalRegion.chances.push(chances);
  });
  auction.regions = auction.regions.concat(auctionGlobalRegions);
}
