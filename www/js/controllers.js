angular
  .module('rcs')
  .controller('appCtrl', ['$scope', 'rcsBrightness', appCtrl])
  .controller('pageCtrl', ['$scope', '$state', '$materialDialog', pageCtrl])
  .controller('pageManageCtrl', ['$scope', '$state', 'rcsSession', pageManageCtrl])
  .controller('pageUseCtrl', ['$scope', '$state', '$interval', 'rcsSession', pageUseCtrl])
  .controller('signInCtrl', ['$scope', '$state', '$timeout', 'rcsSession', 'RCS_REQUEST_ERR', signInCtrl])
  .controller('restaurantCtrl', ['$scope', '$state', 'rcsHttp', 'rcsSession', restaurantCtrl])
  .controller('tableCtrl', ['$scope', '$state', '$cordovaDevice', '$materialDialog', 'rcsHttp', 'rcsSession', tableCtrl])
  .controller('aboutCtrl', ['$scope', '$state', '$interval', 'rcsSession', 'TABLE_STATUS', aboutCtrl])
  .controller('menuCtrl', ['$rootScope', '$scope', '$state', '$window', '$timeout', '$materialDialog', 'rcsSession', 'makeOrderGroupFilter', 'makeArrayTextFilter', 'RCS_EVENT', 'RCS_REQUEST_ERR', menuCtrl])
  .controller('eatingCtrl', ['$scope', '$state', '$interval', 'rcsSession', 'makeOrderGroupFilter', 'RCS_REQUEST_ERR', eatingCtrl])
  .controller('paymentCtrl', ['$scope', '$state', '$materialDialog', 'rcsSession', 'RCS_REQUEST_ERR', paymentCtrl]);

function requestErrorAction (res, handler) {
  // when the error is not defined, or when there is no handler, or when it is not handled
  if (!res.status || !angular.isFunction(handler) || !handler()) {
    alert('request failed');
  }
}

function appCtrl ($scope, rcsBrightness) {
  // scope methods
  $scope.clickPage = clickPage;

  // defines
  function clickPage () {
    rcsBrightness.autoDim(3);
  }
}

function pageCtrl ($scope, $state, $materialDialog) {
  // scope methods
  $scope.clickReturn = clickReturn;
  $scope.ifShowReturn = ifShowReturn;
  $scope.simpleDialog = simpleDialog;

  // defines
  function clickReturn () {
    return $state.go($state.previous.state.name);
  }

  function ifShowReturn () {
    // disable go back for about and eating page
    if ($state.current.name == 'page.use.about'
      || $state.current.name == 'page.use.eating'
      || $state.current.name == 'page.manage.signin') {
      return false;
    }

    if (!$state.previous
      || $state.previous.state.abstract
      || $state.previous.state.name == 'page.use.about') {
      return false;
    }

    return true;
  }

  function simpleDialog (textId, dissmissAction, event) {
    if (!angular.isFunction(dissmissAction)) {
      dissmissAction = function () {};
    }

    $materialDialog({
      templateUrl: 'template/dialog-message.html',
      clickOutsideToClose: true,
      escapeToClose: true,
      targetEvent: event,
      controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
        $scope.textId = textId;
        $scope.clickDismiss = clickDismiss;

        function clickDismiss () {
          dissmissAction();
          $hideDialog();
        }
      }]
    });
  }
}

function pageManageCtrl ($scope, $state, rcsSession) {
  // scope fields
  // scope methods
  $scope.clickUser = clickUser;
  $scope.getCurrentRestaurant = getCurrentRestaurant;
  $scope.getCurrentUser = getCurrentUser;

  // locals
  // initialize
  // defines
  function clickUser () {
    return $state.go('page.manage.signin');
  }

  function getCurrentRestaurant () {
    var restaurant = rcsSession.getSelectedRestaurant();
    return restaurant ? restaurant.RestaurantName : null;
  }

  function getCurrentUser () {
    var user = rcsSession.getSignedInUser();
    return user ? user.Name : null;
  }
}

function pageUseCtrl ($scope, $state, $interval, rcsSession) {
  // scope fields
  $scope.table = rcsSession.getSelectedTable();
  $scope.time = new Date();

  // scope methods
  $scope.clickCall = clickCall;
  $scope.clickOrdered = clickOrdered;
  $scope.getOrdered = getOrdered;
  $scope.ifShowCall = ifShowCall;
  $scope.ifShowEating = ifShowEating;
  $scope.ifShowOrdered = ifShowOrdered;

  // locals
  var refresh = $interval(function() {
    $scope.time = new Date();
  }, 1000*30)

  // initialize
  // defines
  function clickCall () {
    return $state.go('page.use.eating');
  }

  function clickOrdered () {
    return $state.go('page.use.eating');
  }

  function getOrdered () {
    return rcsSession.getSelectedTable().OrderItems ? rcsSession.getSelectedTable().OrderItems : [];
  }

  function ifShowCall () {
    // for eating page, the main content would contain it
    // for about page, it should be almost 'read-only'
    if ($state.current.name == 'page.use.eating'
      || $state.current.name == 'page.use.about') {
      return false;
    }
  }

  function ifShowEating () {
    if ($state.current.name != 'page.use.eating') {
      return false;
    }
  }

  function ifShowOrdered () {
    // for eating page, the main content would contain it
    // for about page, it should be almost 'read-only'
    if ($state.current.name == 'page.use.eating'
      || $state.current.name == 'page.use.about') {
      return false;
    }

    if (getOrdered().length == 0) {
      return false;
    }

    return true;
  }
}

function signInCtrl ($scope, $state, $timeout, rcsSession, RCS_REQUEST_ERR) {
  // scope fields
  $scope.signIn = {
    email: '',
    password: ''
  };
  $scope.signingIn = false;

  // scope methods
  $scope.clickGoToRestaurants = clickGoToRestaurants;
  $scope.clickSignIn = clickSignIn;
  $scope.clickSignOut = clickSignOut;
  $scope.getSignedInUser = getSignedInUser;
  $scope.ifSignedIn = ifSignedIn;

  // initialize
  rcsSession.unselectRestaurant();

  // defines
  function clickSignIn (event) {
    if ($scope.signingIn) return;
    if (!$scope.signIn.email || !$scope.signIn.password) return;

    // use timeout in order to show button ink
    $timeout(function () {
      $scope.signingIn = true;
      rcsSession.signIn(
        $scope.signIn.email,
        $scope.signIn.password,
        function success () {
          clickGoToRestaurants();
        },
        function error (res, status) {
          requestErrorAction(res, function () {
            switch (res.status) {
              case RCS_REQUEST_ERR.rcsSignInFail:
                $scope.simpleDialog(0, null, event);
                $scope.signingIn = false;
                return true;
              default:
                return false;
            }
          });
        });
    }, 250);
  }

  function clickGoToRestaurants () {
    $state.go('page.manage.restaurant');
  }

  function clickSignOut () {
    rcsSession.signOut();
  }

  function getSignedInUser () {
    return rcsSession.getSignedInUser();
  }

  function ifSignedIn () {
    return rcsSession.getSignedInUser() != null;
  }
}

function restaurantCtrl ($scope, $state, rcsHttp, rcsSession) {
  // scope fields
  $scope.restaurants = null;
  $scope.selectedIndex = 0;
  $scope.selectedIndexUi = 0;

  // scope methods
  $scope.clickGoTo = clickGoTo;
  $scope.clickRestaurant = clickRestaurant;
  $scope.ifDisableCickGoto = ifDisableCickGoto;

  // locals
  // initialize
  if (!rcsSession.getSignedInUser()) {
    return $state.go('page.manage.signin');
  }

  rcsSession.unselectRestaurant(initializeRestaurants);

  // defines
  function initializeRestaurants () {
    return rcsHttp.Restaurant.list()
      .success(function (res) {
        $scope.restaurants = res.Restaurants;
      });
  }

  function clickGoTo () {
    if ($scope.ifDisableCickGoto()) return;

    rcsSession.selectRestaurant($scope.restaurants[$scope.selectedIndex],
      function success () {
        $state.go('page.manage.table');
      });
  }

  function clickRestaurant (index) {
    $scope.selectedIndex = index;
  }

  function ifDisableCickGoto () {
    return $scope.selectedIndex == -1;
  }
}

function tableCtrl ($scope, $state, $cordovaDevice, $materialDialog, rcsHttp, rcsSession) {
  // scope fields
  $scope.refreshing = false;
  $scope.linking = false;
  $scope.tables = null;
  $scope.selectedIndex = -1;
  $scope.selectedIndexUi = -1;
  $scope.selectedTable = null;
  $scope.deviceModel = null;
  $scope.deviceSystemVersion = null;
  $scope.deviceId = null;

  try {
    // there will be exception when app is not running on real device
    $scope.deviceModel = $cordovaDevice.getModel();
    $scope.deviceSystemVersion = $cordovaDevice.getVersion();
    $scope.deviceId = $cordovaDevice.getUUID();
  } catch (ex) { }

  // scope methods
  $scope.clickLink = clickLink;
  $scope.clickRefreshTable = clickRefreshTable;
  $scope.clickTable = clickTable;
  $scope.ifDisableCickLink = ifDisableCickLink;
  $scope.ifNotLinked = ifNotLinked;

  // locals
  // initialize
  if (!rcsSession.getSelectedRestaurant()) {
    return $state.go('page.manage.restaurant');
  }

  var restaurantId = rcsSession.getSelectedRestaurant().id;

  clickRefreshTable();

  // defines
  function clickRefreshTable () {
    $scope.refreshing = true;

    return rcsHttp.Table.list(restaurantId)
      .success(function (res) {
        $scope.refreshing = false;
        $scope.tables = res.Tables
        $scope.selectedIndex = -1;
        $scope.selectedTable = null;
      });
  }

  function clickLink (event) {
    if ($scope.ifDisableCickLink()) return;
    if ($scope.linking) return;

    $scope.linking = true;

    var table = $scope.selectedTable;

    rcsSession.linkTable(table.id, $scope.deviceId,
      function success () {
        var dialogEditMenuItemType = {
          templateUrl: 'template/dialog-linkSuccess.html',
          clickOutsideToClose: false,
          escapeToClose: false,
          targetEvent: event,
          controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
            $scope.table = table;
            $scope.clickSignout = clickSignout;

            function clickSignout () {
              rcsSession.signOut(function () {
                // start to use
                $state.go('page.use.about')
                $hideDialog();
              });
            }
          }]
        }

        $materialDialog(dialogEditMenuItemType);
      },
      function error (res) {
        requestErrorAction(res);
        $scope.linking = true;
      });
  }

  function clickTable (index, table) {
    $scope.selectedIndex = index;
    $scope.selectedTable = table;
  }

  function ifDisableCickLink () {
    return $scope.selectedIndex == -1 || !$scope.deviceId;
  }

  function ifNotLinked (table) {
    return table.LinkedTabletId == null;
  }
}

function aboutCtrl ($scope, $state, $interval, rcsSession, TABLE_STATUS) {
  // scope fields
  $scope.restaurantName = null;
  $scope.table = null;
  $scope.justClicked = false;

  // scope methods
  $scope.clickRefresh = clickRefresh;
  $scope.clickStartOrder = clickStartOrder;

  // locals
  var refreshInterval = null;

  // events
  $scope.$on("$destroy", function() {
    if (refreshInterval) {
      $interval.cancel(refreshInterval);
    }
  });

  // initialize
  initialize();

  // defines
  function initialize () {
    $scope.table = rcsSession.getSelectedTable();

    if (!$scope.table) {
      return $state.go('page.manage.signin');
    }

    $scope.restaurantName = $scope.table.Restaurant.RestaurantName;

    switch($scope.table.Status) {
      case TABLE_STATUS.ordering:
      case TABLE_STATUS.ordered:
        return $state.go('page.use.eating');

      case TABLE_STATUS.paying:
      case TABLE_STATUS.paid:
        // polling table table status, until it become 'empty'
        if (!refreshInterval) {
          refreshInterval = $interval(function () {
            $scope.clickRefresh();
          }, 1000*5);
        }
        break;

      case TABLE_STATUS.empty:
        // stop polling table status, wating for eater to click 'StartOrder'
        if (refreshInterval) {
          $interval.cancel(refreshInterval);
        }
        break;
    }
  }

  function clickRefresh () {
    if ($scope.justClicked) return;

    $scope.justClicked = true;

    rcsSession.refreshTable(function success () {
      initialize();
      $scope.justClicked = false;
    }, requestErrorAction)
  }

  function clickStartOrder () {
    rcsSession.clearOrdering();
    return $state.go('page.use.menu');
  }
}

function menuCtrl ($rootScope, $scope, $state, $window, $timeout, $materialDialog, rcsSession, makeOrderGroupFilter, makeArrayTextFilter, RCS_EVENT, RCS_REQUEST_ERR) {
  // scope fields
  $scope.currentOrderPage = null;
  $scope.currentPage = null;
  $scope.justClickedConfirm = false;
  $scope.maxOrderPage = null;
  $scope.maxPage = null;
  $scope.menuItems = null;
  $scope.flavorRequirements = null;
  $scope.menuItemsRows = null;
  $scope.menuTypes = null;
  $scope.ordering = null;
  $scope.orderingGroupAll = null;
  $scope.menuItemsRowsAll = null;
  $scope.orderingGroup = null;
  $scope.selectedIndex = null;
  $scope.star = '_star';

  // scope methods
  $scope.clickConfirm = clickConfirm;
  $scope.clickOrderingMinus = clickOrderingMinus;
  $scope.clickOrderingPlus = clickOrderingPlus;
  $scope.clickOrderPageNext = clickOrderPageNext;
  $scope.clickOrderPagePrevious = clickOrderPagePrevious;
  $scope.clickPageNext = clickPageNext;
  $scope.clickPagePrevious = clickPagePrevious;
  $scope.clickRefreshMenu = clickRefreshMenu;
  $scope.clickToggleStar = clickToggleStar;
  $scope.onTabSelected = onTabSelected;

  // locals
  var refreshRows = refreshRows;
  var loadPage = loadPage;

  var height = ($window.innerHeight -64) *.82 - 50 - 60;
  var pageRowLimit = Math.floor(height / 100);
  var pageOrderRowLimit = Math.floor(height / 80);

  // events
  $rootScope.$on(RCS_EVENT.orderingUpdate, updateOrdering);

  // initialize
  initializeMenu();

  // defines
  function initializeMenu () {
    $scope.menuItems = rcsSession.getMenuItems();
    $scope.flavorRequirements = rcsSession.getFlavorRequirements();
    $scope.menuTypes = [];

    if (!$scope.menuItems) return;

    for (var i = 0; i < $scope.menuItems.length; i++) {
      if ($scope.menuItems[i].IsRecommended == true) {
        $scope.menuTypes.push($scope.star);
        break;
      }
    };

    for (var i = 0 ; i < $scope.menuItems.length; i++) {
      var type = $scope.menuItems[i].Type;
      if ($scope.menuTypes.indexOf(type) == -1) {
        $scope.menuTypes.push(type);
      }
    }

    $scope.selectedIndex = 0;
    refreshRows();

    updateOrdering();
  }

  function clickConfirm (event) {
    if ($scope.justClickedConfirm) return;

    $scope.justClickedConfirm = true;

    function submit (orderFlavor) {
      rcsSession.requestOrder(
        orderFlavor,
        function success () {
          $scope.justClickedConfirm = false;
          $state.go('page.use.about');
        }, function error (res) {
          $scope.justClickedConfirm = false;
          requestErrorAction(res, function () {
            switch (res.status) {
              case RCS_REQUEST_ERR.rcsPendingOrder:
                $scope.simpleDialog(1, null, event);
                return true;
              default:
                return false;
            }
          });
      });
    }

    var flavorRequirements = $scope.flavorRequirements;
    if (!flavorRequirements || !angular.isArray(flavorRequirements) || flavorRequirements.length == 0) {
        submit(undefined); // 'undefined' for no flavor requirement
    } else {
      var menuCtrlScope = $scope;

      $materialDialog({
        templateUrl: 'template/dialog-checkFlavorRequirement.html',
        clickOutsideToClose: true,
        escapeToClose: true,
        targetEvent: event,
        controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
          // scope fields
          $scope.requirementSelections = [];

          // scope methods
          $scope.clickDone = clickDone;
          $scope.clickCancel = clickCancel;

          // locals

          // initialize
          for (var i = 0; i < menuCtrlScope.flavorRequirements.length; i++) {
            $scope.requirementSelections[i] = {
              name: menuCtrlScope.flavorRequirements[i],
              selected: false
            };
          }

          // defines
          function clickDone () {
            var selectedRequirements = [];
            for (var i = 0; i < $scope.requirementSelections.length; i++) {
              var selection = $scope.requirementSelections[i];
              if (selection.selected == true) {
                selectedRequirements.push(selection.name);
              }
            }
            submit(selectedRequirements);
            $hideDialog();
          }

          function clickCancel () {
            menuCtrlScope.justClickedConfirm = false;
            $hideDialog();
          }
        }]
      });
    }
  }

  function clickOrderingMinus (ordering) {
    if ($scope.justClickedConfirm) return;
    rcsSession.decreaseMenuItemSelection(ordering.id);
  }

  function clickOrderingPlus (ordering) {
    if ($scope.justClickedConfirm) return;
    rcsSession.increaseMenuItemSelection(ordering.id);
  }

  function clickPageNext () {
    if ($scope.currentPage == $scope.maxPage) return;
    $scope.currentPage++;
    loadPage();
  }

  function clickPagePrevious () {
    if ($scope.currentPage == 1) return;
    $scope.currentPage--;
    loadPage();
  }

  function loadPage () {
    var start = ($scope.currentPage - 1) * pageRowLimit;
    $scope.menuItemsRows = $scope.menuItemsRowsAll.slice(start, start + pageRowLimit);
  }

  function clickOrderPageNext () {
    if ($scope.currentOrderPage == $scope.maxOrderPage) return;
    $scope.currentOrderPage++;
    loadOrderPage();
  }

  function clickOrderPagePrevious () {
    if ($scope.currentOrderPage == 1) return;
    $scope.currentOrderPage--;
    loadOrderPage();
  }

  function loadOrderPage () {
    var start = ($scope.currentOrderPage - 1) * pageOrderRowLimit;
    $scope.orderingGroup = $scope.orderingGroupAll.slice(start, start + pageOrderRowLimit);
  }

  function clickRefreshMenu () {
    rcsSession.downloadMenu(function success () {
      initializeMenu();
    })
  }

  function onTabSelected (index) {
    $scope.selectedIndex = index;
    refreshRows();
  }

  function refreshRows () {
    // refresh $scope.menuItemsRowsAll
    var row = 0;
    var rowItemLimit = 2;
    var rowItemCount = 0;

    $scope.menuItemsRowsAll = [];
    for (var i = $scope.menuItems.length - 1; i >= 0; i--) {
      if (!$scope.menuItemsRowsAll[row]) {
        $scope.menuItemsRowsAll[row] = [];
      }

      var menuItem = $scope.menuItems[i];

      if ($scope.menuTypes[$scope.selectedIndex] == $scope.star) {
        if (!menuItem.IsRecommended) {
          continue;
        }
      } else {
        if (menuItem.Type != $scope.menuTypes[$scope.selectedIndex]) {
          continue;
        }
      }

      $scope.menuItemsRowsAll[row].push(menuItem);
      if (++rowItemCount == rowItemLimit) {
        row++;
        rowItemCount = 0;
      }
    };

    // refresh page count
    $scope.currentPage = 1;
    $scope.maxPage = Math.ceil($scope.menuItemsRowsAll.length / pageRowLimit);

    // load page
    loadPage();
  }

  function clickToggleStar (toShow) {
    $scope.showStar = toShow;
    refreshRows();
  }

  function updateOrdering () {
    $scope.ordering = rcsSession.getOrdering();

    // group the order to show count
    $scope.orderingGroupAll = makeOrderGroupFilter(
      $scope.ordering,
      $scope.menuItems);

    // mark if menuItem is selected
    for (var i = 0 ; i < $scope.menuItems.length; i++) {
      var menuItem = $scope.menuItems[i];

      menuItem.selected = false;

      for (var j = $scope.ordering.length - 1; j >= 0; j--) {
        if (menuItem.id == parseInt($scope.ordering[j].split('.')[0])) {
          menuItem.selected = true;
          break;
        }
      }
    }

    // refresh page count
    $scope.maxOrderPage = Math.ceil($scope.orderingGroupAll.length / pageOrderRowLimit);
    if (!$scope.currentOrderPage) {
      $scope.currentOrderPage = 1;
    } else if ($scope.currentOrderPage > $scope.maxOrderPage) {
      $scope.currentOrderPage = $scope.maxOrderPage;
    }

    // load page
    loadOrderPage();
  }
}

function eatingCtrl ($scope, $state, $interval, rcsSession, makeOrderGroupFilter, RCS_REQUEST_ERR) {
  // scope fields
  $scope.menuItems = null;
  $scope.ordered = [];
  $scope.orderedGroup = [];
  $scope.refreshing = false;
  $scope.pending = true;
  $scope.justClicked = {};

  // scope methods
  $scope.clickGoToOrder = clickGoToOrder;
  $scope.clickRefresh = clickRefresh;
  $scope.clickRequest = clickRequest;
  $scope.clickPay = clickPay;
  $scope.getRequestCd = getRequestCd;
  $scope.ifDisableClickOrder = ifDisableClickOrder;
  $scope.ifDisableClickPay = ifDisableClickPay;

  // locals
  var refreshInterval = null;

  // events
  $scope.$on("$destroy", function() {
    if (refreshInterval) {
      $interval.cancel(refreshInterval);
    }
  });

  // initialize
  $scope.justClicked['water'] = false;
  $scope.justClicked['call'] = false;

  if (!rcsSession.getPendingOrderRequest()) {
    $scope.pending = false;
    clickRefresh();
  } else {
    // polling until there is no pending ordering request
    refreshInterval = $interval(function () {
      rcsSession.refreshPendingOrderRequest(function success () {
        var request = rcsSession.getPendingOrderRequest();

        if (!request || request.Status == 'closed') {
          if (refreshInterval) {
            $interval.cancel(refreshInterval);
          }

          $scope.simpleDialog(3, null, null);

          clickRefresh();
        }

      }, requestErrorAction);

    }, 1000*5);
  }

  // defines
  function initializeOrdered () {
    $scope.ordered = rcsSession.getSelectedTable().OrderItems ? rcsSession.getSelectedTable().OrderItems : [];

    // group the order to show count
    $scope.orderedGroup = makeOrderGroupFilter($scope.ordered, rcsSession.getMenuItems());
  }

  function clickGoToOrder () {
    if ($scope.ifDisableClickOrder()) return;

    $state.go('page.use.menu');
  }

  function clickRefresh () {
    if ($scope.refreshing) return;

    $scope.refreshing = true;
    rcsSession.refreshTable(function success () {
      initializeOrdered();
      $scope.refreshing = false;
      $scope.pending = false;
    }, requestErrorAction)
  }

  function clickRequest (requestType, event) {
    if ($scope.justClicked[requestType] || $scope.getRequestCd(requestType) != 0) return;

    $scope.justClicked[requestType] = true;

    var successAction = function () {
      $scope.justClicked[requestType] = false;
      $scope.simpleDialog(2, null, event);
    }

    return rcsSession.requestWithCd(requestType, successAction, requestErrorAction);
  }

  function clickPay () {
    if ($scope.ifDisableClickPay()) return;

    return $state.go('page.use.payment');
  }

  function getRequestCd (requestType) {
    return rcsSession.getRequestCd(requestType);
  }

  function ifDisableClickOrder (argument) {
    return $scope.refreshing == true || $scope.pending == true;
  }

  function ifDisableClickPay () {
    return $scope.ordered.length == 0 || $scope.refreshing == true || $scope.pending == true;
  }
}

function paymentCtrl ($scope, $state, $materialDialog, rcsSession, RCS_REQUEST_ERR) {
  // scope fields
  $scope.menuItems = null;
  $scope.ordered = null;
  $scope.orderedGroup = [];
  $scope.grandTotal = 0;
  $scope.grandTotalPremium = 0;
  $scope.isPremium = false;
  $scope.cellPhone = null;
  $scope.justClicked = {};

  // scope methods
  $scope.clickPay = clickPay;
  $scope.clickIsPremium = clickIsPremium;

  // locals
  var makeOrderGroupFilter = makeOrderGroup();

  // initialize
  $scope.justClicked['cash'] = false;
  $scope.justClicked['card'] = false;

  rcsSession.refreshTable(function success () {
    initializeOrdered();
  }, requestErrorAction);

  // defines
  function initializeOrdered () {
    $scope.ordered = rcsSession.getSelectedTable().OrderItems ? rcsSession.getSelectedTable().OrderItems : [];

    // group the order to show count
    $scope.orderedGroup = makeOrderGroupFilter($scope.ordered, rcsSession.getMenuItems());

    for (var i = $scope.orderedGroup.length - 1; i >= 0; i--) {
      var item = $scope.orderedGroup[i];
      $scope.grandTotal += item.price * item.count;
      $scope.grandTotalPremium += item.premiumPrice * item.count;
    };
  }

  function clickPay (payType, event) {
    if ($scope.justClicked[payType]) return;

    $scope.justClicked[payType] = true;
    var cellPhone = $scope.cellPhone;

    var successAction = function () {
      $state.go('page.use.about');
    }

    var errorAction = function (res) {
      $scope.justClicked[payType] = false;
      requestErrorAction(res);
    }

    var shouldPay = $scope.isPremium ? $scope.grandTotalPremium : $scope.grandTotal;
    var isPremium = $scope.isPremium;

    if (payType == 'cash') {
      // ask for cash change
      $materialDialog({
        templateUrl: 'template/dialog-payCash.html',
        clickOutsideToClose: true,
        escapeToClose: true,
        targetEvent: event,
        controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
          // scope fields
          $scope.shouldPay = shouldPay;
          $scope.willPay = 0;

          // scope methods
          $scope.clickNeedChange = clickNeedChange;
          $scope.clickNoNeed = clickNoNeed;
          $scope.ifValidPay = ifValidPay;

          // locals

          // defines
          function clickNeedChange () {
            if (!$scope.ifValidPay()) return;

            rcsSession.requestPay(isPremium, cellPhone, payType, $scope.willPay, successAction, errorAction);
            $hideDialog();
          }

          function clickNoNeed () {
            if ($scope.ifValidPay()) return;

            rcsSession.requestPay(isPremium, cellPhone, payType, $scope.shouldPay, successAction, errorAction);
            $hideDialog();
          }

          function ifValidPay () {
            $scope.willPay = parseFloat($scope.willPay);
            if (!angular.isNumber($scope.willPay) || !$scope.willPay || $scope.willPay < $scope.shouldPay) {
              return false;
            }

            return true;
          }
        }]
      });

      $scope.justClicked[payType] = false;
    } else {
      return rcsSession.requestPay($scope.isPremium, cellPhone, payType, shouldPay, successAction, errorAction);
    }
  }

  function clickIsPremium (event) {
    var paymentScope = $scope;

    $materialDialog({
      templateUrl: 'template/dialog-isPremium.html',
      clickOutsideToClose: true,
      escapeToClose: true,
      targetEvent: event,
      controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
        // scope fields
        $scope.cellPhone = null;

        // scope methods
        $scope.clickConfirm = clickConfirm;
        $scope.ifValidPhone = ifValidPhone;

        // locals

        // defines
        function clickConfirm () {
          if (!$scope.ifValidPhone()) return;
          paymentScope.isPremium = true;
          paymentScope.cellPhone = $scope.cellPhone;
          $hideDialog();
        }

        function ifValidPhone () {
          if ($scope.cellPhone && $scope.cellPhone.toString().length == 11) return true;

          return false;
        }
      }]
    });
  }
}