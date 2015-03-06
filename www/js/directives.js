angular
  .module('rcs')
  .directive('rcsMenuItem', ['$materialDialog', 'rcsSession', rcsMenuItem])
  .directive('rcsNumberInput', [rcsNumberInput]);

function rcsMenuItem ($materialDialog, rcsSession) {
  return {
    link: link,
    restrict: 'E',
    templateUrl: 'template/directive-rcsMenuItem.html',
    replace: false
  };

  function link ($scope, $element, $attrs) {
    // scope fields
    // scope methods
    $scope.clickMenuItem = clickMenuItem;
    $scope.getFlavorText = getFlavorText;

    // locals
    // initialize

    // defines
    function clickMenuItem () {
      if ($scope.justClickedConfirm) return;

      var menuItem = $scope.menuItem;

      if (!menuItem.Flavor) {
        var itemId = menuItem.id + ".0";
        rcsSession.increaseMenuItemSelection(itemId);
      } else {
        $materialDialog({
          templateUrl: 'template/dialog-chooseFlavor.html',
          clickOutsideToClose: true,
          escapeToClose: true,
          targetEvent: event,
          controller: ['$scope', '$hideDialog', function($scope, $hideDialog) {
            // scope fields
            $scope.name = menuItem.Name;
            $scope.flavorList = menuItem.Flavor;
            $scope.flavorId = 0;

            // scope methods
            $scope.clickChoose = clickChoose;
            $scope.clickCancel = clickCancel;
            $scope.clickFlavor = clickFlavor;

            // locals

            // defines
            function clickChoose () {
              var itemId = menuItem.id + "." + $scope.flavorId;
              rcsSession.increaseMenuItemSelection(itemId);
              $hideDialog();
            }

            function clickCancel () {
              $hideDialog();
            }

            function clickFlavor (flavorId) {
              $scope.flavorId = flavorId;
            }
          }]
        });
      }
    }

    function getFlavorText () {
      var flavorList = $scope.menuItem.Flavor;
      if (!flavorList || !angular.isArray(flavorList) || flavorList.length == 0) {
        return undefined;
      }

      var text = '';
      for (var i = 0 ; i < flavorList.length; i++) {
        if (i != 0) text += '/';
        text += flavorList[i];
      }

      return text;
    }
  }
}

function rcsNumberInput () {
  return {
    link: link,
    restrict: 'E',
    templateUrl: 'template/directive-rcsNumberInput.html',
    require: 'ngModel',
    replace: false
  };

  function link ($scope, $element, $attrs, $ngModel) {
    // scope fields
    $scope.numberRows = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]]

    // scope methods
    $scope.clickBackspace = clickBackspace;
    $scope.clickClear = clickClear;
    $scope.clickNumber = clickNumber;

    // locals
    var numberText = '';

    // initialize

    // defines
    function clickBackspace () {
      if (numberText == '') return;

      numberText = numberText.substring(0, numberText.length - 1);
      $ngModel.$setViewValue(parseInt(numberText));
    }

    function clickClear () {
      numberText = '';
      $ngModel.$setViewValue(parseInt(numberText));
    }

    function clickNumber (number) {
      numberText = numberText + number;
      $ngModel.$setViewValue(parseInt(numberText));
    }
  }
}