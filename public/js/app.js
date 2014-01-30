var App = angular.module('app', 
  ['ngRoute', 'ngResource'])
  .config(function($httpProvider){
    // $httpProvider.defaults.headers.common['X-CSRF-Token'] = $('meta[name=csrf-token]').attr('content');
    // $httpProvider.defaults.headers.common["Accept"] = "application/json";
    // $httpProvider.defaults.withCredentials = true;
  })
  .config(function($routeProvider, $locationProvider, $httpProvider){
    // $locationProvider.html5Mode(true);
    $routeProvider.when('/auctions', {templateUrl: '/auctions.html'});
    // $routeProvider.when('/posts/:postId', { templateUrl: '/post.html', controller: PostsCtrl});
    // $routeProvider.when('/trending', {templateUrl: '/trending.html', controller: TrendingCtrl});
    // $routeProvider.when('/trending/:dareId', {templateUrl: '/trending.html', controller: TrendingCtrl});
    // $routeProvider.when('/profile', {templateUrl: '/profile.html', controller: ProfileCtrl});
    // $routeProvider.when('/profile/:profileId', {templateUrl: '/profile.html', controller: ProfileCtrl});
    // $routeProvider.when('/forgot_password', {templateUrl: '/forgot_password.html', controller: PasswordCtrl});
    // $routeProvider.when('/users/password/edit', {templateUrl: '/reset_password.html', controller: PasswordCtrl});
    // $routeProvider.when('/api/users/password/edit', {templateUrl: '/reset_password.html', controller: PasswordCtrl});
    // $routeProvider.when('/signin', {templateUrl: '/signin.html', controller: LoginCtrl});
    // $routeProvider.when('/account', {templateUrl: '/account.html', controller: ProfileCtrl});
  });

App.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
      }
      return response || $q.when(response);
    }
  };
});

App.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});