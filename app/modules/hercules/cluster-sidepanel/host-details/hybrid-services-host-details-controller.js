(function () {
  'use strict';

  angular
    .module('Hercules')
    .controller('HybridServicesHostDetailsController', HybridServicesHostDetailsController);

  /* @ngInject */
  function HybridServicesHostDetailsController($scope, $state, $stateParams, ClusterService, $translate, $modal, FusionClusterStatesService) {
    var cluster;
    var vm = this;
    vm.deleteExpresswayNode = deleteExpresswayNode;
    vm.showReassignHostDialog = showReassignHostDialog;
    vm.showDeregisterHostDialog = showDeregisterHostDialog;

    vm.getSeverity = FusionClusterStatesService.getSeverity;

    $scope.$watch(function () {
      return ClusterService.getCluster($stateParams.connectorType, $stateParams.clusterId);
    }, function (newValue) {
      cluster = newValue;
      vm.clustername = cluster.name;
      vm.host = _.find(cluster.connectors, {
        hostSerial: $stateParams.hostSerial,
      });
      if (vm.host && vm.host.hostname) {
        vm.localizedConnectorName = $translate.instant('hercules.connectorNameFromConnectorType.' + vm.host.connectorType);
        vm.localizedConnectorSectionHeader = $translate.instant('hercules.connectors.localizedConnectorAndHostHeader', {
          connectorName: vm.localizedConnectorName,
          hostname: vm.host.hostname,
        });
      }
    }, true);

    function deleteExpresswayNode() {
      $modal.open({
        templateUrl: 'modules/hercules/cluster-sidepanel/host-details/confirm-deleteHost-dialog.html',
        type: 'dialog',
        controller: 'ConfirmDeleteHostController',
        controllerAs: 'confirmDeleteHostDialog',
        resolve: {
          cluster: function () {
            return cluster;
          },
          hostSerial: function () {
            return vm.host.hostSerial;
          },
          connectorType: function () {
            return vm.host.connectorType;
          },
        },
      });
    }

    /* Only used for Hybrid Media nodes  */
    function showReassignHostDialog() {
      $modal.open({
        resolve: {
          cluster: function () {
            return cluster;
          },
          connector: function () {
            return vm.host;
          },
        },
        type: 'small',
        controller: 'ReassignClusterControllerV2',
        controllerAs: 'reassignClust',
        templateUrl: 'modules/mediafusion/media-service-v2/side-panel/reassign-node-to-different-cluster/reassign-cluster-dialog.html',
      })
        .result
        .then(function () {
          $state.go('media-service-v2.list');
        });
    }

    /* Only used for Hybrid Media nodes  */
    function showDeregisterHostDialog() {
      $modal.open({
        resolve: {
          cluster: function () {
            return cluster;
          },
          connector: function () {
            return vm.host;
          },
        },
        type: 'small',
        controller: 'HostDeregisterControllerV2',
        controllerAs: 'hostDeregister',
        templateUrl: 'modules/mediafusion/media-service-v2/side-panel/deregister-node/host-deregister-dialog.html',
      })
        .result
        .then(function () {
          $state.go('media-service-v2.list');
        });
    }

    vm.showGoToHostAction = function () {
      return vm.host.connectorType !== 'mf_mgmt';
    };

    vm.showMoveNodeAction = function () {
      return vm.host.connectorType === 'mf_mgmt';
    };

    vm.showDeregisterNodeAction = function () {
      return vm.host.connectorType === 'mf_mgmt';
    };

    vm.showDeleteNodeAction = function () {
      return (vm.host.state === 'offline' && vm.host.connectorType === 'c_mgmt');
    };
  }
}());