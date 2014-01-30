angular.module('app')
.controller('UserCtrl', function($scope, $http, $window) {
  $scope.submit = function() {
    console.log('submit!');
    $http
      .post('/authenticate', $scope.user)
      .success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;
        console.log('data.token: ' + data.token);
        $scope.message = 'Welcome';
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.sessionStorage.token;

        // Handle login errors here
        $scope.message = 'Error: Invalid user or password';
      });
  }
});
