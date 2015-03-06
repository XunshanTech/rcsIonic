angular
  .module('rcs')
  .factory('rcsBrightness', ['$timeout', rcsBrightness])
  .factory('rcsLocalstorage', ['$window', rcsLocalstorage])
  .factory('rcsHttp', ['$http', '$log', '$state', rcsHttp])
  .factory('rcsSession', ['$rootScope', '$interval', 'rcsLocalstorage', 'rcsHttp', 'RCS_EVENT', 'STORAGE_KEY', rcsSession]);

function rcsSession ($rootScope, $interval, rcsLocalstorage, rcsHttp, RCS_EVENT, STORAGE_KEY) {
  var sessionService = {
    handshake: handshake,
    downloadMenu: downloadMenu,
    refreshTable: refreshTable,
    refreshPendingOrderRequest: refreshPendingOrderRequest,

    getMenuItems: getMenuItems,
    getFlavorRequirements: getFlavorRequirements,
    getOrdering: getOrdering,
    getSelectedRestaurant: getSelectedRestaurant,
    getSelectedTable: getSelectedTable,
    getSignedInUser: getSignedInUser,
    getRequestCd: getRequestCd,
    getPendingOrderRequest: getPendingOrderRequest,

    signIn: signIn,
    signOut: signOut,
    selectRestaurant: selectRestaurant,
    unselectRestaurant: unselectRestaurant,
    linkTable: linkTable,

    increaseMenuItemSelection: increaseMenuItemSelection,
    decreaseMenuItemSelection: decreaseMenuItemSelection,
    requestOrder: requestOrder,
    requestWithCd: requestWithCd,
    requestPay: requestPay,
    clearOrdering: clearOrdering
  }

  // locals
  var ordering = [];
  var menuItems = null;
  var flavorRequirements = null;
  var signedInUser = null;
  var selectedRestaurant = null;
  var selectedTable = null;
  var linkedTableId = null;
  var linkedTableToken = null;
  var linkedTableRestaurantId = null;
  var requestCd = {};
  var pendingOrderRequest = null;

  // defines
  function handshake () {
    // load info from storage to session
    linkedTableId = rcsLocalstorage.get(STORAGE_KEY.tableId, null);
    linkedTableToken = rcsLocalstorage.get(STORAGE_KEY.tableToken, null);
    linkedTableRestaurantId = rcsLocalstorage.get(STORAGE_KEY.tableRestaurantId, null);

    if (linkedTableId && linkedTableToken && linkedTableRestaurantId) {
      // validate token, doing so will sign out current user
      return rcsHttp.Table.validateToken(linkedTableRestaurantId, linkedTableId, linkedTableToken)
        .success(function (res) {
          selectedTable = res.Table;
          menuItems = res.Menu;
          flavorRequirements = res.FlavorRequirements;
        })
        .error(function () {
          // clear session & storage
          // TODO: only do it for match mismatch
          linkedTableRestaurantId = null;
          linkedTableId = null;
          linkedTableToken = null;
          rcsLocalstorage.clear(STORAGE_KEY.tableId);
          rcsLocalstorage.clear(STORAGE_KEY.tableToken);
          rcsLocalstorage.clear(STORAGE_KEY.tableRestaurantId);
        });
    } else {
      // clear session & storage
      linkedTableRestaurantId = null;
      linkedTableId = null;
      linkedTableToken = null;
      rcsLocalstorage.clear(STORAGE_KEY.tableId);
      rcsLocalstorage.clear(STORAGE_KEY.tableToken);
      rcsLocalstorage.clear(STORAGE_KEY.tableRestaurantId);

      // keep session for testing purpose
      // return rcsHttp.User.handshake()
      //   .success(function (res) {
      //     signedInUser = res;
      //   });

      // sign out on start to secure user session
      return rcsHttp.User.signOut()
        .success(function (res) {
          signedInUser = null;
        });
    }
  }

  function downloadMenu (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Restaurant.downloadMenu(linkedTableRestaurantId, linkedTableId, linkedTableToken)
      .success(function (res) {
        var menuItems = res.Menu;
        flavorRequirements = res.FlavorRequirements;

        successAction();
      })
      .error(errorAction);
  }

  function refreshTable (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Table.validateToken(linkedTableRestaurantId, linkedTableId, linkedTableToken)
      .success(function (res) {
        // save to session
        selectedTable = res.Table;
        menuItems = res.Menu;
        flavorRequirements = res.FlavorRequirements;

        successAction();
      })
      .error(errorAction);
  }

  function linkTable (tableId, deviceId, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Table.link(selectedRestaurant.id, tableId, deviceId)
      .success(function (res) {
        // save to session
        linkedTableId = res.id;
        linkedTableToken = res.Token;
        linkedTableRestaurantId = selectedRestaurant.id;

        rcsHttp.Table.validateToken(linkedTableRestaurantId, linkedTableId, linkedTableToken)
          .success(function (res) {
            selectedTable = res.Table;
            menuItems = res.Menu;
            flavorRequirements = res.FlavorRequirements;
            // save to storage
            rcsLocalstorage.set(STORAGE_KEY.tableId, linkedTableId);
            rcsLocalstorage.set(STORAGE_KEY.tableToken, linkedTableToken);
            rcsLocalstorage.set(STORAGE_KEY.tableRestaurantId, linkedTableRestaurantId);

            successAction();
          })
          .error(errorAction);
      })
      .error(errorAction);
  }

  function getMenuItems () {
    return angular.copy(menuItems);
  }

  function getFlavorRequirements () {
    return angular.copy(flavorRequirements);
  }

  function getOrdering () {
    return angular.copy(ordering);
  }

  function getSelectedRestaurant () {
    return selectedRestaurant;
  }

  function getSignedInUser () {
    return signedInUser;
  }

  function selectRestaurant (restaurant, successAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    selectedRestaurant = restaurant;

    successAction();
  }

  function increaseMenuItemSelection (itemId) {
    // itemId should be a string in format "20.0", "20.1" or "20.10"
    ordering.push(itemId);
    $rootScope.$emit(RCS_EVENT.orderingUpdate);
  }

  function decreaseMenuItemSelection (menuItemId) {
    for (var i = ordering.length - 1; i >= 0; i--) {
      if (ordering[i] == menuItemId) {
        ordering.splice(i, 1);
        break;
      }
    }
    $rootScope.$emit(RCS_EVENT.orderingUpdate);
  }

  function getSelectedTable () {
    return selectedTable;
  }

  function signIn (email, password, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.User.signIn(email, password)
      .success(function (res) {
        signedInUser = res;
        successAction();
      })
      .error(errorAction);
  }

  function signOut (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.User.signOut()
      .success(function () {
        signedInUser = null;
        successAction();
      })
      .error(errorAction);
  }

  function unselectRestaurant (successAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    selectedRestaurant = null;

    successAction();
  }

  function requestOrder (orderFlavor, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Request.createOrder(linkedTableRestaurantId, linkedTableId, linkedTableToken, ordering, orderFlavor)
      .success(function (res) {
        // clear ordering data in session
        ordering = [];

        // store this pending request to session
        pendingOrderRequest = res.newRequest;

        // update table data in session
        if (res.setTable) {
          selectedTable = res.setTable;
        }

        successAction(res);
      })
      .error(errorAction);
  }

  function requestWithCd (requestType, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Request.createRequest(linkedTableRestaurantId, linkedTableId, linkedTableToken, requestType)
      .success(function (res) {
        // update table data in session
        if (res.setTable) {
          selectedTable = res.setTable;
        }

        // count down cd
        requestCd[requestType] = 30;
        var cd = $interval(function () {
          if (--requestCd[requestType] == 0) {
            $interval.cancel(cd);
          }
        }, 1000);

        successAction();
      })
      .error(errorAction);
  }

  function getRequestCd (requestType) {
    return requestCd[requestType] ? requestCd[requestType] : 0;
  }

  function requestPay (isPremium, cellPhone, payType, payAmount, successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    rcsHttp.Request.createPay(
      linkedTableRestaurantId, linkedTableId, linkedTableToken,
      isPremium, payType, payAmount, cellPhone)
      .success(function (res) {
        // update table data in session
        if (res.setTable) {
          selectedTable = res.setTable;
        }

        successAction();
      })
      .error(errorAction);
  }

  function getPendingOrderRequest () {
    return pendingOrderRequest;
  }

  function refreshPendingOrderRequest (successAction, errorAction) {
    if (!angular.isFunction(successAction)) {
      successAction = function () {};
    }

    if (!angular.isFunction(errorAction)) {
      errorAction = function () {};
    }

    if (!pendingOrderRequest) {
      return successAction();
    }

    rcsHttp.Request.get(
      linkedTableRestaurantId, linkedTableId, linkedTableToken,
      pendingOrderRequest.id)
      .success(function (res) {
        // update pending request data in session
        pendingOrderRequest = res.Request;

        successAction();
      })
      .error(errorAction);
  }

  function clearOrdering () {
    ordering = [];
  }

  return sessionService;
}

function rcsHttp ($http, $log, $state) {
  var baseUrl = 'http://rcsserver.cloudapp.net:1337/';
  // var baseUrl = 'http://localhost:1337/';
  var httpService = {};

  var errorAction = function (data, status) {
    $log.debug(data || 'request failed');
    // alert(data || 'request failed');
    if (status == 403) {
      // $rootScope.$emit(RCS_EVENT.forbidden);
      // $state.go('page.manage.signin');
    } else {
      // $state.go('page.use.about');
    }
  }

  httpService.User = {
    signIn: function (email, password) {
      return $http
        .post(baseUrl + 'User/login', {
          Email: email,
          Password: password
        })
        .error(errorAction);
    },
    signOut: function () {
      return $http
        .post(baseUrl + 'User/logout')
        .error(errorAction);
    },
    handshake: function () {
      return $http
        .post(baseUrl + 'User/handshake')
        .error(errorAction);
    }
  }

  httpService.Restaurant = {
    list: function () {
      return $http
        .post(baseUrl + 'Restaurant/list')
        .error(errorAction);
    },
    downloadMenu: function (restaurantId, tableId, token) {
      return $http
        .post(baseUrl + 'Restaurant/downloadMenu', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token
        })
        .error(errorAction);
    }
  }

  httpService.Table = {
    list: function (restaurantId) {
      restaurantId = parseInt(restaurantId);
      return $http
        .post(baseUrl + 'Table/list', {
          RestaurantId: restaurantId
        })
        .error(errorAction);
    },
    link: function (restaurantId, tableId, deviceId) {
      restaurantId = parseInt(restaurantId);
      tableId = parseInt(tableId);
      return $http
        .post(baseUrl + 'Table/link/' + tableId, {
          RestaurantId: restaurantId,
          LinkedTabletId: deviceId
        })
        .error(errorAction);
    },
    validateToken: function (restaurantId, tableId, token) {
      restaurantId = parseInt(restaurantId);
      tableId = parseInt(tableId);
      return $http
        .post(baseUrl + 'Table/validateToken', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token
        })
        .error(errorAction);
    }
  }

  httpService.Request = {
    createOrder: function (restaurantId, tableId, token, orderItems, flavorRequirements) {
      return $http
        .post(baseUrl + 'Request/create', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token,
          Type: 'order',
          OrderItems: orderItems,
          FlavorRequirements: flavorRequirements
        })
        .error(errorAction);
    },
    createPay: function (restaurantId, tableId, token, isPremium, payType, payAmount, cellPhone) {
      return $http
        .post(baseUrl + 'Request/create', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token,
          Type: 'pay',
          IsPremium: isPremium,
          PayType: payType,
          PayAmount: payAmount,
          CellPhone: cellPhone
        })
        .error(errorAction);
    },
    createRequest: function (restaurantId, tableId, token, requestType) {
      return $http
        .post(baseUrl + 'Request/create', {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token,
          Type: requestType
        })
        .error(errorAction);
    },
    get: function (restaurantId, tableId, token, requestId) {
      return $http
        .post(baseUrl + 'Request/get/' + requestId, {
          RestaurantId: restaurantId,
          TableId: tableId,
          Token: token
        })
        .error(errorAction);
    }
  }

  return httpService;
}

function rcsLocalstorage ($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    clear: function(key) {
      delete $window.localStorage[key];
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}

function rcsBrightness ($timeout) {
  var brightness = null;
  var dimTimeout = null;

  return {
    initialize: function (cordova) {
      if (cordova && cordova.require) {
        brightness = cordova.require("cordova.plugin.Brightness.Brightness");
      }
    },
    getBrightness: function (successAction, errorAction) {
      if (!brightness) return;
      brightness.getBrightness(successAction, errorAction);
    },
    setBrightness: function (value, successAction, errorAction) {
      // value = -1: using system setting
      // 0 < value < 1: using app setting, 0 for 0% light, 1 for 100% light
      if (!brightness) return;
      brightness.setBrightness(value, successAction, errorAction);
    },
    setKeepScreenOn: function (value, successAction, errorAction) {
      if (!brightness) return;
      brightness.setKeepScreenOn(value, successAction, errorAction);
    },
    autoDim: function () {
      if (!brightness) return;

      if (dimTimeout) {
        $timeout.cancel(dimTimeout);
        dimTimeout = null;
      }

      brightness.setBrightness(-1, function () {
        if (!dimTimeout) {
          dimTimeout = $timeout(function () {
            brightness.setBrightness(0);
            dimTimeout = null;
          }, 20*1000);
        }
      });
    }
  }
}