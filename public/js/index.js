angular.module('app')
.controller('MainCtrl', function($scope) {
  $scope.bids = [];
  
  $scope.submitBid = function(b) {
    if (b) {
      b.username = 'unknown';
      // if (b.slots >= 1 && b.btc_per_slot >= 0.05) {  
        var newBid = angular.copy(b);
        $scope.bids.push(newBid);
      // }
    }
  }
});
