(function () {
  'use strict';

  angular
    .module('Hercules')
    .service('ClusterService', ClusterService);

  /* @ngInject */
  function ClusterService($http, CsdmPoller, CsdmCacheUpdater, CsdmHubFactory, UrlConfig, Authinfo, FusionClusterStatesService) {
    var clusterCache = {
      c_mgmt: {},
      c_ucmc: {},
      c_cal: {},
      mf_mgmt: {},
      hds_app: {},
      cs_mgmt: {},
      cs_context: {},
    };
    var hub = CsdmHubFactory.create();
    var poller = CsdmPoller.create(fetch, hub);

    return {
      deleteHost: deleteHost,
      fetch: fetch,
      getCluster: getCluster,
      getClustersByConnectorType: getClustersByConnectorType,
      subscribe: hub.on,
      upgradeSoftware: upgradeSoftware,
      mergeRunningState: mergeRunningState,

      // Internal functions exposed for easier testing.
      _mergeAllAlarms: mergeAllAlarms,
    };

    ////////////////

    function extractDataFromResponse(res) {
      return _.get(res, 'data');
    }

    function overrideStateIfAlarms(connector) {
      if (connector.alarms.length > 0) {
        connector.state = _.some(connector.alarms, function (alarm) {
          return alarm.severity === 'critical' || alarm.severity === 'error';
        }) ? 'has_error_alarms' : 'has_warning_alarms';
      }
      return connector;
    }

    function getMostSevereRunningState(previous, connector) {
      var severity = FusionClusterStatesService.getSeverity(connector);
      if (severity.severity > previous.stateSeverityValue) {
        return {
          state: connector.state,
          stateSeverity: severity.label,
          stateSeverityValue: severity.severity,
        };
      } else {
        return previous;
      }
    }

    function mergeAllAlarms(connectors) {

      var allAlarms = _.chain(connectors)
        .reduce(function (acc, connector) {
          var modifiedAlarms = _.map(connector.alarms, function (alarm) {
            alarm.hostname = connector.hostname;
            alarm.affectedNodes = [connector.hostname];
            return alarm;
          });
          return acc.concat(modifiedAlarms);
        }, [])
        // This sort must happen before the uniqWith so that we keep the oldest alarm when
        // finding duplicates (the order is preserved when running uniqWith, that is, the
        // first entry of a set of duplicates is kept).
        .sortBy(function (e) {
          return e.firstReported;
        })
        .value();

      var deduplicatedAlarms = _.chain(allAlarms)
        .uniqWith(function (e1, e2) {
          return e1.id === e2.id
            && e1.title === e2.title
            && e1.description === e2.description
            && e1.severity === e2.severity
            && e1.solution === e2.solution
            && _.isEqual(e1.solutionReplacementValues, e2.solutionReplacementValues);
        })
        // We only sort by ID once we have pruned the duplicates, to save a few cycles.
        // This sort makes sure refreshing the page will always keep things ordered the
        // same way, even if a new alarm (with a 'younger' firstReportedBy) replaces an
        // older alarm of the same ID.
        .sortBy(function (e) {
          return e.id;
        })
        .value();

      if (allAlarms.length > deduplicatedAlarms.length) {
        var removedAlarms = _.differenceWith(allAlarms, deduplicatedAlarms, _.isEqual);
        _.forEach(removedAlarms, function (removedAlarm) {
          var alarmSiblings = _.filter(allAlarms, function (a) {
            return removedAlarm.id === a.id
              && removedAlarm.title === a.title
              && removedAlarm.description === a.description
              && removedAlarm.severity === a.severity
              && removedAlarm.solution === a.solution
              && _.isEqual(removedAlarm.solutionReplacementValues, a.solutionReplacementValues);
          });
          _.forEach(alarmSiblings, function (alarm) {
            alarm.affectedNodes = _.flatMap(alarmSiblings, function (a) {
              return a.hostname;
            });
            alarm.affectedNodes.sort();
          });
        });
      }
      return deduplicatedAlarms;
    }

    function getUpgradeState(connectors) {
      var allAreUpgraded = _.every(connectors, { upgradeState: 'upgraded' });
      return allAreUpgraded ? 'upgraded' : 'upgrading';
    }

    function mergeRunningState(connectors, type) {
      if (_.size(connectors) === 0 &&
          (type === 'hds_app' || type === 'mf_mgmt')) {
        return {
          state: 'no_nodes_registered',
          stateSeverity: 'neutral',
          stateSeverityValue: 1,
        };
      }
      if (_.size(connectors) === 0) {
        return {
          state: 'not_registered',
          stateSeverity: 'neutral',
          stateSeverityValue: 1,
        };
      }
      return _.chain(connectors)
        .map(overrideStateIfAlarms)
        .reduce(getMostSevereRunningState, {
          stateSeverityValue: -1,
        })
        .value();
    }

    function buildAggregates(type, cluster) {
      var connectors = cluster.connectors;
      var provisioning = _.find(cluster.provisioning, { connectorType: type });
      var upgradeAvailable = provisioning && _.some(cluster.connectors, function (connector) {
        return provisioning.availableVersion && connector.runningVersion !== provisioning.availableVersion;
      });
      var state;
      if (type === 'hds_app' || type === 'mf_mgmt') {
        state = mergeRunningState(connectors, type).state;
      } else {
        state = mergeRunningState(connectors).state;
      }
      var hosts = _.chain(connectors)
        .map('hostname')
        .uniq()
        .value();
      return {
        alarms: mergeAllAlarms(connectors),
        state: state,
        upgradeState: getUpgradeState(connectors),
        provisioning: provisioning,
        upgradeAvailable: upgradeAvailable,
        upgradeWarning: upgradeAvailable && _.some(cluster.connectors, { state: 'offline' }),
        hosts: _.map(hosts, function (host) {
          // 1 host = 1 connector (for a given type)
          var connector = _.find(connectors, { hostname: host });
          return {
            alarms: connector.alarms,
            hostname: host,
            state: connector.state,
            upgradeState: connector.upgradeState,
          };
        }),
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
          cluster = _.cloneDeep(cluster);
          cluster.connectors = _.filter(cluster.connectors, { connectorType: type });
          return cluster;
        })
        .filter(function (cluster) {
          return _.some(cluster.provisioning, { connectorType: type });
        })
        .value();
    }

    function fetch() {
      return $http
        .get(UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '?fields=@wide')
        .then(extractDataFromResponse)
        .then(function (response) {
          // only keep clusters that has a targetType (just to be on the safe side)
          return _.filter(response.clusters, function (cluster) {
            return cluster.targetType !== 'unknown';
          });
        })
        .then(function (clusters) {
          // start modeling the response to match how the UI uses it, per connectorType
          return {
            c_mgmt: clusterType('c_mgmt', clusters),
            c_ucmc: clusterType('c_ucmc', clusters),
            c_cal: clusterType('c_cal', clusters),
            mf_mgmt: clusterType('mf_mgmt', clusters),
            hds_app: clusterType('hds_app', clusters),
            cs_mgmt: clusterType('cs_mgmt', clusters),
            cs_context: clusterType('cs_context', clusters),
          };
        })
        .then(function (clusters) {
          var result = {
            c_mgmt: addAggregatedData('c_mgmt', clusters.c_mgmt),
            c_ucmc: addAggregatedData('c_ucmc', clusters.c_ucmc),
            c_cal: addAggregatedData('c_cal', clusters.c_cal),
            mf_mgmt: addAggregatedData('mf_mgmt', clusters.mf_mgmt),
            hds_app: addAggregatedData('hds_app', clusters.hds_app),
            cs_mgmt: addAggregatedData('cs_mgmt', clusters.cs_mgmt),
            cs_context: addAggregatedData('cs_context', clusters.cs_context),
          };
          return result;
        })
        .then(function (clusters) {
          var result = {
            c_mgmt: _.keyBy(clusters.c_mgmt, 'id'),
            c_ucmc: _.keyBy(clusters.c_ucmc, 'id'),
            c_cal: _.keyBy(clusters.c_cal, 'id'),
            mf_mgmt: _.keyBy(clusters.mf_mgmt, 'id'),
            hds_app: _.keyBy(clusters.hds_app, 'id'),
            cs_mgmt: _.keyBy(clusters.cs_mgmt, 'id'),
            cs_context: _.keyBy(clusters.cs_context, 'id'),
          };
          return result;
        })
        .then(function (clusters) {
          CsdmCacheUpdater.update(clusterCache.c_mgmt, clusters.c_mgmt);
          CsdmCacheUpdater.update(clusterCache.c_ucmc, clusters.c_ucmc);
          CsdmCacheUpdater.update(clusterCache.c_cal, clusters.c_cal);
          CsdmCacheUpdater.update(clusterCache.mf_mgmt, clusters.mf_mgmt);
          CsdmCacheUpdater.update(clusterCache.hds_app, clusters.hds_app);
          CsdmCacheUpdater.update(clusterCache.cs_mgmt, clusters.cs_mgmt);
          CsdmCacheUpdater.update(clusterCache.cs_context, clusters.cs_context);
          return clusterCache;
        });
    }

    function getCluster(type, id) {
      return clusterCache[type][id];
    }

    function getClustersByConnectorType(type) {
      var clusters = _.chain(clusterCache[type])
        .values() // turn them to an array
        .sortBy(function (cluster) {
          return cluster.name.toLocaleUpperCase();
        })
        .value();
      return clusters;
    }

    function upgradeSoftware(clusterId, connectorType) {
      var url = UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/services/' + connectorType + '/upgrade';
      return $http.post(url, '{}')
        .then(extractDataFromResponse)
        .then(function (data) {
          poller.forceAction();
          return data;
        });
    }

    function deleteHost(id, serial) {
      var url = UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + id + '/hosts/' + serial;
      return $http.delete(url)
        .then(extractDataFromResponse)
        .then(function (data) {
          poller.forceAction();
          return data;
        });
    }
  }
}());
