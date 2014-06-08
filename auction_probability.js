var config = require('./config');
var _ = require('lodash');

module.exports = {
  probability: probability
};


function probability(auction) {
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
    var totalSlots = Number(region.slots) + Number(globalSlots);
    region.probability = "1 in " + totalSlots;
    region.chances = (1 / totalSlots).toFixed(5) + "%";

    auctionGlobalRegions.forEach(function(globalRegion) {
      var probability = " 1 in " + totalSlots + " in " + region.name;
      globalRegion.probability.push(probability);

      var chances = " " + (1 / totalSlots).toFixed(5) + "% in " + region.name;
      globalRegion.chances.push(chances);
    });
  });
  // probabilities for global auctions
  auctionGlobalRegions.forEach(function(globalRegion) {
    var probability = " 1 in " + globalSlots + " in " + globalRegion.name;
      globalRegion.probability.push(probability);

      var chances = " " + (1 / globalSlots).toFixed(5) + "% in " + globalRegion.name;
      globalRegion.chances.push(chances);
  });
  auction.regions = auction.regions.concat(auctionGlobalRegions);
}
