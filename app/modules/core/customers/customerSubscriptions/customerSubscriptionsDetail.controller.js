(function () {
  'use strict';

  angular.module('Core')
  .controller('CustomerSubscriptionsDetailCtrl', CustomerSubscriptionsDetail);

  function CustomerSubscriptionsDetail($stateParams, $window, Authinfo, Auth) {

    var vm = this;
    vm.subscriptions = [];
    vm.test = 'hello';
    vm.currentCustomer = $stateParams.currentCustomer;
    vm.customerOrgId = vm.currentCustomer.customerOrgId;
    vm.customerName = vm.currentCustomer.customerName;
    vm.customerEmail = vm.currentCustomer.customerEmail;
    vm.getSubscriptions = getSubscriptions;
    vm.sendMail = sendMail;
    vm.partnerOrgName = Authinfo.getOrgName();
    vm.partnerEmail = Authinfo.getPrimaryEmail();
    vm.customerInfo = '';
    vm.customerHeaderInfo = ['Customer Info:', vm.customerName, vm.customerEmail, '', 'Partner Admin:', vm.partnerOrgName, vm.partnerEmail, '', 'Webex Subscriptions:', ''].join('%0D%0A');
    vm.customerHeaderInfoClipboard = ['Customer Info:', vm.customerName, vm.customerEmail, '', 'Partner Admin:', vm.partnerOrgName, vm.partnerEmail, '', 'Webex Subscriptions:', ''].join('\n');

    init();

    function init() {
      getSubscriptions();
    }

    function sendMail() {
      $window.location.href = 'mailto:' + '' + '?subject=' + 'Subscription Info: ' + vm.customerName + '&body=' + vm.customerHeaderInfo + vm.customerInfo;
    }

    function getSubscriptions() {
      return Auth.getCustomerAccount(vm.customerOrgId).then(function (response) {
        var resources = _.get(response, 'data.customers[0].licenses', []);
        _.forEach(resources, function (customerLicenses) {
          var subscriptionId = 'Trial';
          var trainSite = '';
          var offerName = '';
          var customerSubscription = {};
          if (customerLicenses.billingServiceId) {
            subscriptionId = _.get(customerLicenses, 'billingServiceId');
          }
          if (customerLicenses.siteUrl) {
            trainSite = _.get(customerLicenses, 'siteUrl');
          }
          if (customerLicenses.offerName) {
            offerName = _.get(customerLicenses, 'offerName');
          }
          if (trainSite !== '') {
            customerSubscription = {
              trainSite: trainSite,
              subscriptionId: subscriptionId,
              offerName: offerName
            };
            vm.subscriptions.push(customerSubscription);
            var subString = [];

            _.forEach(vm.subscriptions, function (sub) {

              subString = ['', sub.offerName, sub.subscriptionId, sub.trainSite].join('%0D%0A');

            });
            vm.customerInfo += subString;
          }

        });

      });
    }
  }

})();
