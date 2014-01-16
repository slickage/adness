angular.module('app')
.controller('MainCtrl', function($scope) {
  $scope.bids = [];
  $scope.blankBid = {};
  
  $scope.submitBid = function(b) {
    if (b) {
      b.username = 'unknown';
      var newBid = angular.copy(b);
      $scope.bids.push(newBid);
      $scope.bid = $scope.blankBid;
    }
  }
});
