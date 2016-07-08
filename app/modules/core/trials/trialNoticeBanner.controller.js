(function () {
  'use strict';

  angular.module('core.trial')
    .controller('TrialNoticeBannerCtrl', TrialNoticeBannerCtrl);

  /* @ngInject */
  function TrialNoticeBannerCtrl(Authinfo, EmailService, Notification, TrialService, UserListService) {
    var vm = this;
    var partnerAdminId;

    vm.canShow = canShow;
    vm.daysLeft = undefined;
    vm.hasRequested = false;
    vm.partnerAdminEmail = undefined;
    vm.partnerAdminDisplayName = undefined;
    vm.sendRequest = sendRequest;
    vm._helpers = {
      getDaysLeft: getDaysLeft,
      getPrimaryPartnerInfo: getPrimaryPartnerInfo,
      sendEmail: sendEmail,
      getWebexSiteUrl: getWebexSiteUrl
    };

    init();

    ///////////////////////

    function init() {
      getDaysLeft();
      getPrimaryPartnerInfo();
    }

    function canShow() {
      return Authinfo.isUserAdmin() && !!TrialService.getTrialIds().length && partnerAdminId && (partnerAdminId !== Authinfo.getUserId());
    }

    function sendRequest() {
      return vm._helpers.sendEmail()
        .then(function () {
          Notification.success('trials.requestConfirmNotifyMsg', {
            partnerAdminDisplayName: vm.partnerAdminDisplayName
          });
          vm.hasRequested = true;
        });
    }

    function getDaysLeft() {
      var trialIds = TrialService.getTrialIds();
      return TrialService.getExpirationPeriod(trialIds).then(function (response) {
        vm.daysLeft = response;
      });
    }

    function getPrimaryPartnerInfo() {
      return UserListService.listPartnersAsPromise(Authinfo.getOrgId()).then(function (response) {
        vm.partnerAdminEmail = _.get(response, 'data.partners[0].userName');
        vm.partnerAdminDisplayName = _.get(response, 'data.partners[0].displayName');

        partnerAdminId = _.get(response, 'data.partners[0].id');
      });
    }

    function sendEmail() {
      var customerName = Authinfo.getOrgName();
      var customerEmail = Authinfo.getPrimaryEmail();
      var partnerEmail = vm.partnerAdminEmail;
      var webexSiteUrl = vm._helpers.getWebexSiteUrl();
      return EmailService.emailNotifyPartnerTrialConversionRequest(
        customerName, customerEmail, partnerEmail, webexSiteUrl);
    }

    function getWebexSiteUrl() {
      // find the first instance matching the criteria...
      var result = _.find(Authinfo.getConferenceServices(), function (service) {
        return _.get(service, 'license.siteUrl', null);
      });
      // ...and return the appropriate value
      return _.get(result, 'license.siteUrl', null);

    }
  }
})();
