(function () {
  'use strict';

  /* @ngInject */
  function DeleteClusterSettingControllerV2($filter, $modalInstance, $q, $state, $translate, cluster, Authinfo, DeactivateMediaService, HybridServicesClusterService, MediaClusterServiceV2, MediaServiceAuditService, Notification) {
    var vm = this;
    vm.selectPlaceholder = $translate.instant('mediaFusion.add-resource-dialog.cluster-placeholder');
    vm.options = [];
    vm.close = $modalInstance.close;
    vm.selectModel = {};
    vm.fillModel = {};
    vm.radioModel = '1';
    vm.checkboxModel = false;
    vm.isMove = true;
    vm.successCount = 0;
    vm.errorCount = 0;
    vm.failedHostMove = [];
    vm.failedToDelete = false;
    vm.hosts = '';
    vm.ngDisable = false;
    vm.canContinue = canContinue;
    vm.clusters = [];
    vm.loading = true;

    HybridServicesClusterService.getAll()
      .then(function (clusters) {
        vm.clusters = _.filter(clusters, { targetType: 'mf_mgmt' });
        _.each(vm.clusters, function (clust) {
          if (cluster.id != clust.id) {
            vm.options.push(clust.name);
          }
        });
        vm.options.sort();
      });

    HybridServicesClusterService.get(cluster.id).then(function (response) {
      vm.cluster = response;
      vm.hosts = vm.cluster.connectors;
      vm.noOfHost = vm.hosts.length;
      for (var i = 0; i < vm.hosts.length; i++) {
        var key = vm.hosts[i].hostname;
        var value = vm.selectPlaceholder;
        vm.selectModel[key] = value;
        vm.fillModel[key] = false;
      }
    }).finally(function () {
      vm.loading = false;
    });

    vm.continue = function () {
      for (var i = 0; i < vm.hosts.length; i++) {
        var key = vm.hosts[i].hostname;
        vm.fillModel[key] = false;
        if (vm.selectModel[key] == vm.selectPlaceholder) {
          vm.fillModel[key] = true;
          vm.isMove = false;
        }
      }
      if (vm.isMove) {
        if (vm.hosts.length == 0) {
          deleteCluster();
          return;
        }
        moveNodesTocluster();
      }
      vm.isMove = true;
    };

    vm.deleteCluster = function () {
      //this is to deregister all host and delete cluster
      for (var i = 0; i < vm.hosts.length; i++) {
        defuseHost(vm.hosts[i]);
      }
      if (vm.clusters.length === 1) {
        DeactivateMediaService.deactivateHybridMediaService();
        $modalInstance.close();
        MediaServiceAuditService.devOpsAuditEvents('org', 'delete', Authinfo.getOrgId());
      }
    };

    function defuseHost(host) {
      HybridServicesClusterService.deregisterEcpNode(host.id)
        .then(incrementSuccessDefuse(host))
        .then(MediaServiceAuditService.devOpsAuditEvents('node', 'delete', host.hostSerial))
        .catch(incrementFailureCount(host));
    }

    function moveNodesTocluster() {
      var loopPromises = createCluster();
      var promise = $q.all(loopPromises);
      promise.then(function (response) {
        var clusterArray = _.compact(response);
        for (var i = 0; i < vm.hosts.length; i++) {
          var hostname = vm.hosts[i].hostname;
          var toClusterName = vm.selectModel[hostname];
          moveHost(hostname, toClusterName, clusterArray);
        }
      });
    }

    var recoverPromise = function () {
      return undefined;
    };

    function createCluster() {
      var loopPromises = [];
      var clusterListNames = [];
      for (var i = 0; i < vm.hosts.length; i++) {
        var hostname = vm.hosts[i].hostname;
        var toClusterName = vm.selectModel[hostname];
        var toCluster = $filter('filter')(vm.clusters, {
          name: toClusterName,
        }, true)[0];

        if (!_.includes(clusterListNames, toClusterName)) {
          if (!_.isUndefined(toCluster)) {
            var deferred = $q.defer();
            loopPromises.push(deferred.promise.catch(recoverPromise));
            deferred.resolve(toCluster);
          } else {
            var promise = updatePropertiesofCluster(toClusterName);
            loopPromises.push(promise.catch(recoverPromise));
          }
          clusterListNames.push(toClusterName);
        }
      }
      return loopPromises;
    }

    function updatePropertiesofCluster(toClusterName) {
      return HybridServicesClusterService.preregisterCluster(toClusterName, 'stable', 'mf_mgmt').then(function (res) {
        vm.clusterDetail = res;
        // Add the created cluster to property set
        MediaClusterServiceV2.getPropertySets()
          .then(function (propertySets) {
            if (propertySets.length > 0) {
              vm.videoPropertySet = _.filter(propertySets, {
                name: 'videoQualityPropertySet',
              });
              vm.qosPropertySet = _.filter(propertySets, {
                name: 'qosPropertySet',
              });
              if (vm.videoPropertySet.length > 0) {
                var clusterPayload = {
                  assignedClusters: vm.clusterDetail.id,
                };
                // Assign it the property set with cluster list
                MediaClusterServiceV2.updatePropertySetById(vm.videoPropertySet[0].id, clusterPayload);
              }
              if (vm.qosPropertySet.length > 0) {
                var clusterQosPayload = {
                  assignedClusters: vm.clusterDetail.id,
                };
                // Assign it the property set with cluster list
                MediaClusterServiceV2.updatePropertySetById(vm.qosPropertySet[0].id, clusterQosPayload);
              }
            }
            MediaServiceAuditService.devOpsAuditEvents('cluster', 'add', vm.clusterDetail.id);
          });
        return vm.clusterDetail;
      }, function () {
        vm.error = $translate.instant('mediaFusion.reassign.reassignErrorMessage', {
          hostName: toClusterName,
        });
        Notification.error(vm.error);
      });
    }

    function moveHost(hostname, toClusterName, response) {
      var host;
      var fromCluster;
      var toCluster;

      toCluster = _.find(response, function (res) {
        return _.get(res, 'name') === toClusterName;
      });

      host = $filter('filter')(vm.hosts, {
        hostname: hostname,
      }, true)[0];

      if (_.isUndefined(toCluster)) {
        vm.errorCount++;
        vm.failedHostMove.push(host.hostname);
        deleteCluster();
      } else {
        fromCluster = vm.cluster;
        HybridServicesClusterService.moveEcpNode(host.id, fromCluster.id, toCluster.id)
          .then(incrementSuccessCount(host, toCluster))
          .then(MediaServiceAuditService.devOpsAuditEvents('node', 'move', host.hostSerial))
          .catch(incrementFailureCount(host));
      }
    }

    function incrementSuccessDefuse() {
      return function () {
        vm.successCount++;
        deleteCluster();
      };
    }

    function incrementSuccessCount(host, toCluster) {
      return function () {
        vm.successCount++;
        vm.successMove = $translate.instant('mediaFusion.clusters.movedTo', {
          nodeName: host.hostname,
          clusterName: toCluster.name,
        });
        Notification.success(vm.successMove);
        deleteCluster();
      };
    }

    function incrementFailureCount(host) {
      return function () {
        vm.errorCount++;
        vm.failedHostMove.push(host.hostname);
        deleteCluster();
      };
    }

    function deleteCluster() {
      if (vm.successCount == vm.noOfHost) {
        HybridServicesClusterService.deregisterCluster(vm.cluster.id).then(function () {
          vm.success = $translate.instant('mediaFusion.clusters.clusterdeleteSuccess', {
            clustername: vm.cluster.name,
          });
          MediaServiceAuditService.devOpsAuditEvents('cluster', 'delete', vm.cluster.id);
          Notification.success(vm.success);
          $modalInstance.close();
          if (vm.clusters.length > 1) {
            $state.go('media-service-v2.list');
          }
        }, function (err) {
          vm.error = $translate.instant('mediaFusion.deleteGroup.errorMessage', {
            groupName: vm.cluster.name,
          });
          Notification.errorWithTrackingId(err, vm.error);
        });
      } else if ((vm.successCount + vm.errorCount) == vm.noOfHost) {
        vm.failedToDelete = true;
        vm.ngDisable = true;
        var nodesString = '';
        _.forEach(vm.failedHostMove, function (value) {
          nodesString = value + ', ' + nodesString;
        });
        vm.unableToMoveNodes = $translate.instant(
          'mediaFusion.clusters.unabletomovenodes', {
            nodes: nodesString,
          });
      }
    }
    function canContinue() {
      for (var i = 0; i < vm.hosts.length; i++) {
        var key = vm.hosts[i].hostname;
        if (vm.selectModel[key] == vm.selectPlaceholder || vm.selectModel[key] == '') {
          return false;
        }
      }
      return true;
    }
  }

  angular
    .module('Mediafusion')
    .controller('DeleteClusterSettingControllerV2', DeleteClusterSettingControllerV2);
}());
