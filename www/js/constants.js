angular
  .module('rcs')
  .constant('TABLE_STATUS', {
    empty: 'empty',
    ordering: 'ordering',
    ordered: 'ordered',
    paying: 'paying',
    paid: 'paid'
  })
  .constant('STORAGE_KEY', {
    tableToken: 'rcs-table-token',
    tableId: 'rcs-table-id',
    tableRestaurantId: 'rcs-table-restaurantId'
  })
  .constant('RCS_EVENT', {
    orderingUpdate: 'ordering-update'
  })
  .constant('RCS_REQUEST_ERR', {
    rcsSignInFail: 433,
    rcsPendingOrder: 412
  });