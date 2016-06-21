(function () {
  'use strict';

  /* @ngInject */
  function MediaClusterServiceV2($q, $http, $location, $log, CsdmPoller, CsdmCacheUpdater, MediaConnectorMockV2, MediaConverterServiceV2, MediaConfigServiceV2, Authinfo, CsdmHubFactory, Notification, UrlConfig) {
    var clusterCache = {};

    function extractDataFromResponse(res) {
      return res.data;
    }

    var fetch = function () {
      if ($location.absUrl().match(/mediaservice-backend=mock/)) {
        var data = MediaConverterServiceV2.convertClusters(MediaConnectorMockV2.mockData());
        var defer = $q.defer();
        defer.resolve(data);
        CsdmCacheUpdater.update(clusterCache, data);
        return defer.promise;
      }

      if ($location.absUrl().match(/mediaservice-backend=nodata/)) {
        var defer2 = $q.defer();
        defer2.resolve([]);
        return defer2.promise;
      }

      return $http
        .get(MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters')
        .then(extractDataFromResponse)
        .then(MediaConverterServiceV2.convertClusters)
        .then(_.partial(CsdmCacheUpdater.update, clusterCache));
    };

    var getClusters = function () {
      return clusterCache;
    };

    var getAggegatedClusters = function (clusters, groupList) {
      $log.log("In getAggregatedClusters");
      //$log.log("clusterCache : ", clusterCache);
      return MediaConverterServiceV2.aggregateClusters(clusters, groupList);
    };

    var setProperty = function (clusterId, property, value) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/properties';
      var payload = {};
      payload[property] = value;
      return $http.post(url, payload);
    };

    var deleteCluster = function (clusterId) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId;
      return $http.delete(url).then(function () {
        if (clusterCache[clusterId]) {
          delete clusterCache[clusterId];
        }
      });
    };

    var deleteHost = function (clusterId, serial) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/hosts/' + serial;
      return $http.delete(url).then(function () {
        var cluster = clusterCache[clusterId];
        if (cluster && cluster.hosts) {
          _.remove(cluster.hosts, {
            serial: serial
          });
          if (cluster.hosts.length === 0) {
            delete clusterCache[clusterId];
          }
        }
      });
    };

    var getClusterList = function () {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters';
      return $http.get(url).then(extractDataFromResponse);
    };

    var getConnector = function (connectorId) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/connectors/' + connectorId;
      return $http.get(url).then(extractDataFromResponse);
    };

    var defuseConnector = function (clusterId, callback) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId;
      $http
        .delete(url)
        .success(callback)
        .error(createErrorHandler('Unable to defuse', callback));
    };

    function createSuccessCallback(callback) {
      return function (data) {
        callback(null, data);
      };
    }

    function createErrorHandler(message, callback) {
      return function () {
        Notification.notify(message, arguments);
        callback(arguments);
      };
    }

    var getGroups = function () {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/property_sets' + '?' + 'type=' + 'mf.group';
      return $http.get(url).then(extractDataFromResponse);
    };

    var updateGroupAssignment = function (clusterId, propertySetId) {
      var clusterAssignedPropertySet = {
        'property_set_id': propertySetId
      };

      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/assigned_property_sets';
      return $http.post(url, clusterAssignedPropertySet);
    };

    var removeGroupAssignment = function (clusterId, propertySetId) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/assigned_property_sets/' + propertySetId;
      return $http.delete(url);
    };

    var createGroup = function (groupName) {
      var grp = {
        'orgId': Authinfo.getOrgId(),
        'type': 'mf.group',
        'name': groupName,
        'properties': {
          'mf.group.displayName': groupName,
        }
      };

      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/property_sets';
      return $http
        .post(url, grp);
      //.success(callback);
    };

    var deleteGroup = function (propertySetId) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/property_sets/' + propertySetId;
      return $http.delete(url);
    };

    var changeRole = function (role, clusterId) {
      var grp = {
        'mf.role': role
      };

      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '/properties';
      return $http
        .post(url, grp);
      //.success(callback);
    };

    var getPropertySet = function (propertySet) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/property_sets/' + propertySet;
      return $http.get(url).then(extractDataFromResponse);
    };

    var setPropertySet = function (propertySet, value) {
      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/property_sets/' + propertySet;
      return $http.post(url, value);
    };

    var getOrganization = function (callback) {
      var url = UrlConfig.getAdminServiceUrl() + 'organizations/' + Authinfo.getOrgId();

      $http.get(url)
        .success(function (data, status) {
          data = data || {};
          data.success = true;
          callback(data, status);
        })
        .error(function (data, status) {
          if (!data || !(data instanceof Object)) {
            data = {};
          }
          data.success = false;
          data.status = status;
          callback(data, status);
        });

      //return $http.get(url).then(extractDataFromResponse);
    };

    var getClustersV2 = function () {
      var url = MediaConfigServiceV2.getV2Url() + '/organizations/' + Authinfo.getOrgId() + '?fields=@wide';

      return $http.get(url).then(extractDataFromResponse);
    };

    var createClusterV2 = function (clusterName, releaseChannel) {
      var payLoad = {
        "name": clusterName,
        "releaseChannel": releaseChannel,
        "targetType": "mf_mgmt"
      };

      var url = MediaConfigServiceV2.getV2Url() + '/organizations/' + Authinfo.getOrgId() + '/clusters';
      return $http
        .post(url, payLoad);
    };

    var addRedirectTarget = function (hostName, clusterId) {
      var payLoad = {
        "hostname": hostName,
        "clusterId": clusterId,
        ttlInSeconds: 60 * 60
      };

      var url = MediaConfigServiceV2.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/allowedRedirectTargets';
      return $http
        .post(url, payLoad);
    };

    function get(clusterId) {
      return $http
        .get(UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId + '?fields=@wide')
        .then(extractDataFromResponse);
    }

    function getAll() {
      return $http
        .get(UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '?fields=@wide')
        .then(extractClustersFromResponse)
        .then(onlyKeepFusedClusters)
        //.then(addServicesStatuses)
        .then(sort);
    }

    function extractClustersFromResponse(response) {
      return response.data.clusters;
    }

    function onlyKeepFusedClusters(clusters) {
      return _.filter(clusters, 'state', 'fused');
    }

    function extractDataFromResponse(res) {
      return res.data;
    }

    function sort(clusters) {
      // Could be anything but at least make it consistent between 2 page refresh
      return _.sortBy(clusters, 'type');
    }

    function deleteV2Cluster(clusterId) {
      var url = UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId;
      return $http.post(url);
    }

    function updateV2Cluster(clusterId, clusterName, releaseChannel) {
      var payLoad = {
        "name": clusterName,
        "releaseChannel": releaseChannel
      };

      var url = UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '/clusters/' + clusterId;
      return $http
        .post(url, payLoad);
    }

    function moveV2Host(connectorId, fromCluster, toCluster) {
      var payLoad = {
        "managementConnectorId": connectorId,
        "fromClusterId": fromCluster,
        "toClusterId": toCluster
      };

      var url = UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '/actions/moveNodeByManagementConnectorId/invoke';
      return $http
        .post(url, payLoad);
    }

    function defuseV2Connector(connectorId) {
      var url = UrlConfig.getHerculesUrlV2() + '/organizations/' + Authinfo.getOrgId() + '/actions/deregister/invoke?managementConnectorId=' + connectorId;
      return $http.post(url);
    }

    var hub = CsdmHubFactory.create();
    var clusterPoller = CsdmPoller.create(fetch, hub);

    return {
      fetch: fetch,
      deleteHost: deleteHost,
      getClusters: getClusters,
      getConnector: getConnector,
      deleteCluster: deleteCluster,
      setProperty: setProperty,
      defuseConnector: defuseConnector,
      getGroups: getGroups,
      updateGroupAssignment: updateGroupAssignment,
      removeGroupAssignment: removeGroupAssignment,
      createGroup: createGroup,
      deleteGroup: deleteGroup,
      changeRole: changeRole,
      subscribe: hub.on,
      getAggegatedClusters: getAggegatedClusters,
      getPropertySet: getPropertySet,
      setPropertySet: setPropertySet,
      getOrganization: getOrganization,
      getClusterList: getClusterList,
      getClustersV2: getClustersV2,
      createClusterV2: createClusterV2,
      addRedirectTarget: addRedirectTarget,
      get: get,
      getAll: getAll,
      deleteV2Cluster: deleteV2Cluster,
      updateV2Cluster: updateV2Cluster,
      defuseV2Connector: defuseV2Connector,
      moveV2Host: moveV2Host
    };
  }

  angular
    .module('Mediafusion')
    .service('MediaClusterServiceV2', MediaClusterServiceV2);

}());