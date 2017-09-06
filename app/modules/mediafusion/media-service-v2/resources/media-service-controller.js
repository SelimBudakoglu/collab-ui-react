(function () {
  'use strict';

  /* @ngInject */
  function MediaServiceControllerV2($modal, $state, $stateParams, $translate, Authinfo, HybridServicesClusterService) {
    var vm = this;
    vm.backState = $stateParams.backState || 'services-overview';

    // Added for cs-page-header
    vm.tabs = [
      {
        title: $translate.instant('common.resources'),
        state: 'media-service-v2.list',
      }, {
        title: $translate.instant('common.settings'),
        state: 'media-service-v2.settings',
      },
    ];
    vm.addResourceModal = {
      resolve: {
        firstTimeSetup: true,
        yesProceed: true,
      },
      type: 'small',
      controller: 'RedirectAddResourceControllerV2',
      controllerAs: 'redirectResource',
      template: require('modules/mediafusion/media-service-v2/add-resources/add-resource-dialog.html'),
      modalClass: 'redirect-add-resource',
    };

    HybridServicesClusterService.serviceIsSetUp('squared-fusion-media')
      .then(function (enabled) {
        if (enabled) {
          vm.addResourceModal.resolve.firstTimeSetup = false;
        } else if (Authinfo.isCustomerLaunchedFromPartner()) {
          $modal.open({
            template: require('modules/hercules/service-specific-pages/components/add-resource/partnerAdminWarning.html'),
            type: 'dialog',
          });
        } else {
          $modal.open(vm.addResourceModal)
            .result
            .catch(function () {
              $state.go('services-overview');
            });
        }
      });
  }

  angular
    .module('Mediafusion')
    .controller('MediaServiceControllerV2', MediaServiceControllerV2);
}());
