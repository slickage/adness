angular.module('app')
.controller('UserCtrl', function($scope, $http, $window, $cookieStore) {
  $scope.message = 'Enter credentials to login.';
  
  $scope.showProfile = function() {
    return $scope.authenticated && $scope.initialAuthenticationUpdate;
  }
  
  $scope.showLoginControls = function() {
    return !$scope.authenticated && $scope.initialAuthenticationUpdate;
  }
  
  var updateAuthentication = function(authenticated) {
    $scope.authenticated = authenticated;
    if (!authenticated) {
      delete $window.sessionStorage.token;
      $cookieStore.remove('token');
    }
    if (!$scope.initialAuthenticationUpdate) $scope.initialAuthenticationUpdate = true;
  }
  
  // loaded from ng-init - loads profile to check if logged in via token.
  $scope.loadProfile = function() {
    $http
      .get('/api/profile')
      .success(function (data, status, headers, config) {
        $scope.message = 'Profile loaded.';
        updateAuthentication(true);

      })
      .error(function (data, status, headers, config) {
        console.log('status: ' + status);
        updateAuthentication(false);
      });
  }
  
  $scope.login = function() {
    $http
      .post('/authenticate', $scope.user)
      .success(function (data, status, headers, config) {
        $window.sessionStorage.token = data.token;
        $cookieStore.put('token', data.token);
        // $scope.message = 'Loading profile...';
        $scope.loadProfile();
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.sessionStorage.token;
        $cookieStore.remove('token');

        // Handle login errors here
        $scope.message = 'Invalid Login.';
        $scope.authenticated = false;
      });
  }
  
  $scope.logout = function() {
    $scope.message = 'Logged out.';
    updateAuthentication(false);
  }
});
