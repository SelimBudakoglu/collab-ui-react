(function () {
  'use strict';

  angular
    .module('Hercules')
    .service('ClusterService', ClusterService);

  /* @ngInject */
  function ClusterService($http, CsdmPoller, CsdmCacheUpdater, CsdmHubFactory, ConfigService, Authinfo) {
    var clusterCache = {
      c_mgmt: {},
      c_ucmc: {},
      c_cal: {}
    };
    var hub = CsdmHubFactory.create();
    var poller = CsdmPoller.create(fetch, hub);

    var service = {
      deleteCluster: deleteCluster,
      deleteHost: deleteHost,
      fetch: fetch,
      getCluster: getCluster,
      getClustersByConnectorType: getClustersByConnectorType,
      getConnector: getConnector,
      getRunningStateSeverity: getRunningStateSeverity,
      subscribe: hub.on,
      upgradeSoftware: upgradeSoftware
    };

    return service;

    ////////////////

    function extractDataFromResponse(res) {
      return res.data;
    }

    function overrideStateIfAlarms(connector) {
      if (connector.alarms.length > 0) {
        connector.state = 'has_alarms';
      }
      return connector;
    }

    function getRunningStateSeverity(state) {
      // we give a severity and a weight to all possible states
      // this has to be synced with the server generating the API consumed
      // by the general overview page (state of Call connectors, etc.)
      var label, value;
      switch (state) {
      case 'running':
        label = 'ok';
        value = 0;
        break;
      case 'not_installed':
        label = 'neutral';
        value = 1;
        break;
      case 'disabled':
      case 'downloading':
      case 'installing':
      case 'not_configured':
      case 'uninstalling':
      case 'registered':
        label = 'warning';
        value = 2;
        break;
      case 'has_alarms':
      case 'offline':
      case 'stopped':
      case 'unknown':
      default:
        label = 'error';
        value = 3;
      }

      return {
        label: label,
        value: value
      };
    }

    function getMostSevereRunningState(previous, connector) {
      var stateSeverity = getRunningStateSeverity(connector.state);
      if (stateSeverity.value > previous.stateSeverityValue) {
        return {
          state: connector.state,
          stateSeverity: stateSeverity.label,
          stateSeverityValue: stateSeverity.value
        };
      } else {
        return previous;
      }
    }

    function mergeAllAlarms(connectors) {
      return _.reduce(connectors, function (acc, connector) {
        return acc.concat(connector.alarms);
      }, []);
    }

    function getUpgradeState(connectors) {
      var allAreUpgraded = _.every(connectors, 'upgradeState', 'upgraded');
      return allAreUpgraded ? 'upgraded' : 'upgrading';
    }

    function mergeRunningState(connectors) {
      return _.chain(connectors)
        .map(overrideStateIfAlarms)
        .reduce(getMostSevereRunningState, {
          stateSeverityValue: -1
        })
        .get('state')
        .value();
    }

    function buildAggregates(type, cluster) {
      var connectors = cluster.connectors;
      var provisioning = _.find(cluster.provisioning, 'connectorType', type);
      var hosts = _.chain(connectors)
        .pluck('hostname')
        .uniq()
        .value();
      return {
        alarms: mergeAllAlarms(connectors),
        state: mergeRunningState(connectors),
        upgradeState: getUpgradeState(connectors),
        provisioning: provisioning,
        upgradeAvailable: _.get(provisioning, 'availableVersion', false) && provisioning.provisionedVersion !== provisioning.availableVersion,
        hosts: _.map(hosts, function (host) {
          // 1 host = 1 connector (for a given type)
          var connector = _.find(connectors, 'hostname', host);
          return {
            alarms: connector.alarms,
            hostname: host,
            state: connector.state,
            upgradeState: connector.upgradeState
          };
        })
      };
    }

    function addAggregatedData(type, clusters) {
      // We add aggregated data like alarms, states and versions to the cluster
      return _.map(clusters, function (cluster) {
        cluster.aggregates = buildAggregates(type, cluster);
        return cluster;
      });
    }

    function clusterType(type, clusters) {
      return _.chain(clusters)
        .map(function (cluster) {
          cluster = angular.copy(cluster);
          cluster.connectors = _.filter(cluster.connectors, 'connectorType', type);
          return cluster;
        })
        .filter(function (cluster) {
          return cluster.connectors.length > 0;
        })
        .value();
    }

    function fetch() {
      return $http
        .get(ConfigService.getUrlV2() + '/organizations/' + Authinfo.getOrgId() + '?fields=@wide')
        .then(extractDataFromResponse)
        .then(function (response) {
          // only keep fused clusters
          return _.filter(response.clusters, 'state', 'fused');
        })
        .then(function (clusters) {
          // start modeling the response to match how the UI uses it, per connectorType
          return {
            c_mgmt: clusterType('c_mgmt', clusters),
            c_ucmc: clusterType('c_ucmc', clusters),
            c_cal: clusterType('c_cal', clusters)
          };
        })
        .then(function (clusters) {
          var result = {
            c_mgmt: addAggregatedData('c_mgmt', clusters.c_mgmt),
            c_ucmc: addAggregatedData('c_ucmc', clusters.c_ucmc),
            c_cal: addAggregatedData('c_cal', clusters.c_cal)
          };
          return result;
        })
        .then(function (clusters) {
          var result = {
            c_mgmt: _.indexBy(clusters.c_mgmt, 'id'),
            c_ucmc: _.indexBy(clusters.c_ucmc, 'id'),
            c_cal: _.indexBy(clusters.c_cal, 'id')
          };
          return result;
        })
        .then(function (clusters) {
          CsdmCacheUpdater.update(clusterCache.c_mgmt, clusters.c_mgmt);
          CsdmCacheUpdater.update(clusterCache.c_ucmc, clusters.c_ucmc);
          CsdmCacheUpdater.update(clusterCache.c_cal, clusters.c_cal);
          return clusterCache;
        });
    }

    function getCluster(type, id) {
      return clusterCache[type][id];
    }

    function getClustersByConnectorType(type) {
      return _.values(clusterCache[type]);
    }

    function upgradeSoftware(clusterId, serviceType) {
      var url = ConfigService.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/services/' + serviceType + '/upgrade';
      return $http.post(url, '{}')
        .then(extractDataFromResponse)
        .then(function (data) {
          poller.forceAction();
          return data;
        });
    }

    function deleteCluster(id) {
      var url = ConfigService.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + id;
      return $http.delete(url)
        .then(function (data) {
          ['c_mgmt', 'c_ucmc', 'c_cal'].forEach(function (type) {
            if (clusterCache[type][id]) {
              delete clusterCache[type][id];
            }
          });
          poller.forceAction();
          return data;
        });
    }

    function deleteHost(id, serial) {
      var url = ConfigService.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + id + '/hosts/' + serial;
      return $http.delete(url)
        .then(function (data) {
          ['c_mgmt', 'c_ucmc', 'c_cal'].forEach(function (type) {
            var cluster = clusterCache[type][id];
            if (cluster) {
              _.remove(cluster.connectors, 'hostSerial', serial);
              if (cluster.connectors.length === 0) {
                delete clusterCache[type][id];
              }
            }
          });
          poller.forceAction();
          return data;
        });
    }

    function getConnector(connectorId) {
      var url = ConfigService.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/connectors/' + connectorId;
      return $http.get(url).then(extractDataFromResponse);
    }
  }
}());
