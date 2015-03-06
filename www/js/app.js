angular.module('rcs', [
  'ionic',
  'ngCordova',
  'ngMaterial',
  'ui.router'
])
.config([
  '$urlRouterProvider',
  '$stateProvider',
  '$httpProvider',
  config
])
.run(['$rootScope', '$state', '$stateParams', '$ionicPlatform', 'rcsBrightness', run]);

function config ($urlRouterProvider, $stateProvider, $httpProvider) {
  // to make "credentialed" requests that are cognizant of HTTP Cookies and HTTP Authentication information
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Requests_with_credentials
  // http://stackoverflow.com/questions/22372377/angularjs-http-post-withcredentials-fails-with-data-in-request-body
  $httpProvider.defaults.withCredentials = true;

  // default route
  $urlRouterProvider.otherwise('/about');

  // states
  $stateProvider
    .state('page', {
      abstract: true,
      templateUrl: 'template/page.html',
      resolve: {
        handshake: function (rcsSession) {
          return rcsSession.handshake().then(null, function handleError () {
            // just to make a promise
          });
        }
      },
      controller: 'pageCtrl'
    })

    // children of page
    .state('page.manage', {
      abstract: true,
      templateUrl: 'template/page-manage.html',
      controller: 'pageManageCtrl'
    })
    .state('page.use', {
      abstract: true,
      templateUrl: 'template/page-use.html',
      controller: 'pageUseCtrl'
    })

    // children of manage
    .state('page.manage.signin', {
      url: '/manage/signin',
      templateUrl: 'template/page-manage-signin.html',
      controller: 'signInCtrl',
    })
    .state('page.manage.restaurant', {
      url: '/manage/restaurant',
      templateUrl: 'template/page-manage-restaurant.html',
      controller: 'restaurantCtrl',
    })
    .state('page.manage.table', {
      url: '/manage/table',
      templateUrl: 'template/page-manage-table.html',
      controller: 'tableCtrl',
    })

    // children of use
    .state('page.use.about', {
      url: '/about',
      templateUrl: 'template/page-use-about.html',
      controller: 'aboutCtrl'
    })
    .state('page.use.menu', {
      url: '/menu',
      templateUrl: 'template/page-use-menu.html',
      controller: 'menuCtrl'
    })
    .state('page.use.eating', {
      url: '/eating',
      templateUrl: 'template/page-use-eating.html',
      controller: 'eatingCtrl'
    })
    .state('page.use.payment', {
      url: '/payment',
      templateUrl: 'template/page-use-payment.html',
      controller: 'paymentCtrl'
    });
}

function run ($rootScope, $state, $stateParams, $ionicPlatform, rcsBrightness) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    rcsBrightness.initialize(window.cordova);
    rcsBrightness.setKeepScreenOn(true);
    rcsBrightness.autoDim();
  });

  // remember the previous state for nav purpose
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    // if ($state.previous && $state.previous.state.name == toState.name) {
    //   // get rid of circlular state
    //   $state.previous = null;
    // } else {
    $state.previous = {
      state: fromState,
      params: fromParams
    }
    // }
  });
}