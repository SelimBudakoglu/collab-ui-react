(function () {
  'use strict';

  angular.module('Core')
  .controller('CustomerSubscriptionsDetailCtrl', CustomerSubscriptionsDetail);

  function CustomerSubscriptionsDetail($stateParams, $q, $translate, $window, Authinfo, Auth, CustomerAdministratorService, Notification, UserListService, Userservice) {
    var vm = this;
    vm.subscriptions = [];
    vm.currentCustomer = $stateParams.currentCustomer;
    vm.customerOrgId = vm.currentCustomer.customerOrgId;
    vm.customerName = vm.currentCustomer.customerName;
    vm.customerEmail = vm.currentCustomer.customerEmail;
    vm.getSubscriptions = getSubscriptions;
    vm.sendMail = sendMail;
    vm.partnerAdmins = [];
    vm.partnerOrgName = Authinfo.getOrgName();
    vm.partnerEmail = Authinfo.getPrimaryEmail();
    vm.customerInfo = [];
    vm.customerInfoClipboard = [];
    vm._helpers = {
      getCustomerFullAdmins: getCustomerFullAdmins,
      getSimplifiedUserList: getSimplifiedUserList,
      flattenAndJoin: flattenAndJoin,
    };

    init();

    function init() {
      var newLine = '\n';
      var newLineHtml = '%0D%0A';
      var promises = {
        partnerAdmins: getPartnerAdmins(),
        subscriptions: getSubscriptions(),
        customerFullAdmins: getCustomerFullAdmins(),
      };
      $q.all(promises).then(function (results) {
        vm.partnerAdmins = results.partnerAdmins;
        vm.subscriptions = results.subscriptions;
        vm.customerFullAdmins = results.customerFullAdmins;
        var subscriptionDisplay = _.map(results.subscriptions, function (sub) {
          return sub.subscriptionId + ' - ' + sub.siteUrl;
        });
        var partnerAdminDisplay = _.map(results.partnerAdmins, function (admin) {
          return admin.name + ' - ' + admin.email;
        });

        var infoArray = [$translate.instant('customerSubscriptions.customerAdmin'),
          vm.customerName + ' - ' + vm.customerEmail, '',
          $translate.instant('customerSubscriptions.partnerAdmin'), partnerAdminDisplay, '',
          $translate.instant('customerSubscriptions.webexSubscriptions'), subscriptionDisplay];
        vm.customerInfo = vm._helpers.flattenAndJoin(infoArray, newLineHtml);
        vm.customerInfoClipboard = vm._helpers.flattenAndJoin(infoArray, newLine);
      });
    }

    function sendMail() {
      $window.location.href = 'mailto:' + '' + '?subject=' + 'Subscription Info: ' + vm.customerName + '&body=' + vm.customerInfo;
    }

    function getSubscriptions() {
      var subscriptionArray = [];
      return Auth.getCustomerAccount(vm.customerOrgId).then(function (response) {
        var resources = _.get(response, 'data.customers[0].licenses', []);
        _.forEach(resources, function (customerLicenses) {
          var subscriptionId = _.get(customerLicenses, 'billingServiceId', 'Trial');
          var siteUrl = _.get(customerLicenses, 'siteUrl', '');
          var customerSubscription = {};
          if (siteUrl !== '') {
            if (!_.find(subscriptionArray, {
              siteUrl: siteUrl,
              subscriptionId: subscriptionId,
            })) {
              customerSubscription = {
                siteUrl: siteUrl,
                subscriptionId: subscriptionId,
              };
              subscriptionArray.push(customerSubscription);
            }
          }
        });
        return subscriptionArray;
      }).catch(function () {
        return [];
      });
    }

    function getSimplifiedUserList(ciResponse) {
      var users = _.get(ciResponse, 'data.Resources', []);
      return _.map(users, function (user) {
        var email = Userservice.getPrimaryEmailFromUser(user);
        var displayName = Userservice.getAnyDisplayableNameFromUser(user);
        displayName = (displayName === email) ? undefined : displayName;
        return {
          email: email,
          name: displayName,
        };
      });
    }

    function getCustomerFullAdmins() {
      var params = { orgId: vm.customerOrgId };
      return UserListService.listFullAdminUsers(params).then(getSimplifiedUserList);
    }

    function getPartnerAdmins() {
      return CustomerAdministratorService.getCustomerAdmins(vm.customerOrgId)
        .then(getSimplifiedUserList)
        .catch(function (response) {
          Notification.errorWithTrackingId(response, 'customerAdminPanel.customerAdministratorServiceError');
          return [];
        });
    }

    function flattenAndJoin(targetArray, joiner) {
      return _.chain(targetArray)
      .flatten()
      .join(joiner)
      .value();
    }
  }

})();
