(function () {
  'use strict';

  angular.module('Mediafusion')
    .controller('GroupDetailsControllerV2',

      /* @ngInject */
      function ($scope, $translate, $stateParams, $modal, $state, $timeout, FusionUtils, ClusterService) {

        var vm = this;
        vm.displayName = null;
        vm.nodeList = null;
        vm.openSettings = openSettings;
        vm.fakeUpgrade = false;
        vm.dateTime = null;

        vm.clusterId = $stateParams.clusterId;
        vm.connectorType = $stateParams.connectorType;
        vm.cluster = ClusterService.getCluster(vm.connectorType, vm.clusterId);

        if (vm.cluster) {
          vm.displayName = vm.cluster.name;
          vm.nodeList = vm.cluster.connectors;
          vm.dateTime = textForTime(vm.cluster.upgradeSchedule.scheduleTime);
          vm.releaseChannel = FusionUtils.getLocalizedReleaseChannel(vm.cluster.releaseChannel);
        }

        function textForTime(time) {
          var currentLanguage = $translate.use();
          if (currentLanguage === 'en_US') {
            return moment(time, 'HH:mm').format('hh:mm A');
          } else {
            return time;
          }
        }

        function openSettings(type, id) {
          $state.go('mediafusion-cluster.settings', {
            id: id
          });
        }

        vm.alarmsSummary = function () {
          var alarms = {};
          _.forEach(vm.nodeList, function (cluster) {
            _.forEach(cluster.alarms, function (alarm) {
              if (!alarms[alarm.id]) {
                alarms[alarm.id] = {
                  alarm: alarm,
                  hosts: []
                };
              }
              if (alarms[alarm.id].hosts.indexOf(cluster.hostname) == -1) {
                alarms[alarm.id].hosts.push(cluster.hostname);
              }
            });
          });
          return _.toArray(alarms);
        };

        // Changes for Upgrade now
        var promise = null;
        $scope.$watch(function () {
          return ClusterService.getCluster(vm.connectorType, vm.cluster.id);
        }, function (newValue) {
          vm.cluster = newValue;
          vm.nodeList = vm.cluster.connectors;
          var isUpgrading = vm.cluster.aggregates.upgradeState === 'upgrading';
          vm.softwareUpgrade = {
            provisionedVersion: vm.cluster.aggregates.provisioning.provisionedVersion,
            availableVersion: vm.cluster.aggregates.provisioning.availableVersion,
            isUpgradeAvailable: vm.cluster.aggregates.upgradeAvailable,
            hasUpgradeWarning: vm.cluster.aggregates.upgradeWarning,
            numberOfHosts: _.size(vm.cluster.aggregates.hosts),
            clusterStatus: vm.cluster.aggregates.state,
            showUpgradeWarning: function () {
              return vm.softwareUpgrade.isUpgradeAvailable && vm.softwareUpgrade.hasUpgradeWarning;
            }
          };

          if (isUpgrading) {
            vm.fakeUpgrade = false;
            var pendingHosts = _.chain(vm.cluster.aggregates.hosts)
              .filter({ upgradeState: 'pending' })
              .value();
            vm.upgradeDetails = {
              numberOfUpsmthngHosts: _.size(vm.cluster.aggregates.hosts) - pendingHosts.length,
              upgradingHostname: findUpgradingHostname(vm.cluster.aggregates.hosts)
            };
          }

          // If the upgrade is finished, display the success status during 2s
          vm.upgradeJustFinished = !isUpgrading && vm.fakeUpgrade;
          if (vm.upgradeJustFinished) {
            promise = $timeout(function () {
              vm.showUpgradeProgress = false;
            }, 2000);
          }
          vm.showUpgradeProgress = vm.fakeUpgrade || isUpgrading || vm.upgradeJustFinished;
        }, true);

        function findUpgradingHostname(hostnames) {
          var upgrading = _.chain(hostnames)
            .find({ upgradeState: 'upgrading' })
            .value();
          // could be undefined if we only have upgraded and pending connectors
          return _.get(upgrading, 'hostname', 'some host');
        }

        vm.showUpgradeNowDialog = function () {
          $modal.open({
            resolve: {
              clusterId: function () {
                return vm.cluster.id;
              }
            },
            type: 'small',
            controller: 'UpgradeNowControllerV2',
            controllerAs: 'upgradeClust',
            templateUrl: 'modules/mediafusion/media-service-v2/side-panel/upgrade-now-cluster-dialog.html'
          });

          $scope.$on('$destroy', function () {
            $timeout.cancel(promise);
          });
        };

        vm.alarms = [];
        vm.alarms = vm.alarmsSummary();
      }
    );
})();
