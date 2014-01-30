angular.module('app')
.controller('MainCtrl', function($scope, $http) {
  $scope.bids = [];
  $scope.blankBid = {};
  
  $scope.submitBid = function(b) {
    if (b) {
      b.username = 'unknown';
      var newBid = angular.copy(b);
      $scope.bids.push(newBid);
      $scope.bid = $scope.blankBid;
    }
    
    $http
      .get('/api/bids')
      .success(function (data, status, headers, config) {
        console.log('called api/bids');
        console.log(data);
      })
      .error(function (data, status, headers, config) {
      });
  }
});
