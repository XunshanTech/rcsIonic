angular
  .module('rcs')
  .filter('makeOrderGroup', makeOrderGroup)
  .filter('makeArrayText', makeArrayText);

function makeOrderGroup () {
  return function (orderItems, menuItems) {
    if (!orderItems) {
      return [];
    }

    if (!menuItems) {
      return orderItems;
    }

    var tempOrderGroup = [];

    for (var i = orderItems.length - 1; i >= 0; i--) {
      var itemId = orderItems[i].toString(); // in format list 28.4, 17.10, 36
      var menuItemId = parseInt(itemId.split('.')[0]); // --> 28, 17, 36
      var flavorId = parseInt(itemId.split('.')[1]) // --> 4, 10, NaN

      for (var j = menuItems.length - 1; j >= 0; j--) {
        if (menuItems[j].id == menuItemId) {
          var menuItem = menuItems[j];
          var flavor = undefined;

          if (flavorId > 0 && menuItem.Flavor && angular.isArray(menuItem.Flavor) && menuItem.Flavor.length >= flavorId) {
            flavor = menuItem.Flavor[flavorId - 1];
          } else {
              itemId = menuItemId + ".0";
          }

          if (tempOrderGroup[itemId]) {
            tempOrderGroup[itemId].count++;
          } else {
            tempOrderGroup[itemId] = {
              id: itemId,
              name: menuItem.Name,
              type: menuItem.Type,
              price: menuItem.Price,
              premiumPrice: menuItem.PremiumPrice,
              alias: menuItem.Alias,
              flavor: flavor,
              count: 1
            };
          }

          break;
        }
      }
    }

    var orderGroup = [];
    for (groupIndex in tempOrderGroup) {
      if (angular.isDefined(tempOrderGroup[groupIndex])) {
        orderGroup.push(tempOrderGroup[groupIndex]);
      }
    }

    return orderGroup;
  }
}

function makeArrayText () {
  return function (array) {
    if (!array || !angular.isArray(array) || array.length == 0) {
      return '(无)';
    }

    var text = '';
    for (var i = 0 ; i < array.length; i++) {
      if (i != 0) text += '/';
      text += array[i];
    }

    return text;
  }
}