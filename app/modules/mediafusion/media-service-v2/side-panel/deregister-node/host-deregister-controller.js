(function () {
  'use strict';

  /* @ngInject */
  function HostDeregisterControllerV2($translate, $modalInstance, HybridServicesClusterService, MediaServiceAuditService, Notification, connectorId, hostSerial) {
    var vm = this;

    vm.saving = false;

    vm.deregister = function () {
      vm.saving = true;
      HybridServicesClusterService
        .deregisterEcpNode(connectorId)
        .then(function () {
          MediaServiceAuditService.devOpsAuditEvents('node', 'delete', hostSerial);
          $modalInstance.close();
          Notification.success('mediaFusion.deleteNodeSuccess');
        })
        .catch(function (err) {
          vm.error = $translate.instant('mediaFusion.clusters.deregisterNodeErrorGeneric');
          Notification.errorWithTrackingId(err, vm.error);
        })
        .finally(function () {
          vm.saving = false;
        });
    };
  }

  angular
    .module('Mediafusion')
    .controller('HostDeregisterControllerV2', HostDeregisterControllerV2);
}());
