angular.module('app')
.controller('MainCtrl', function($scope) {
  // <td>{{bid.username}}</td>
  // <td>{{bid.slots}}</td>
  // <td>{{bid.btc_per_slot}}</td>
  // <td>{{bid.slots * bid.btcPerSlot}}</td>
  $scope.bids = [
  {
    username: 'wangbus',
    slots: 5,
    btc_per_slot: 3
  },
  {
    username: 'warren',
    slots: 3,
    btc_per_slot: 4
  },
  {
    username: 'jsakuda',
    slots: 2,
    btc_per_slot: 4
  }
  ]
});