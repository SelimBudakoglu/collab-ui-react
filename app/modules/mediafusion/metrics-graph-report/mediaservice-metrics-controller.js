(function () {
  'use strict';
  angular.module('Mediafusion').controller('MediaServiceMetricsContoller', MediaServiceMetricsContoller);
  /* @ngInject */
  function MediaServiceMetricsContoller($timeout, $translate, MediaClusterServiceV2, $q, MetricsReportService, XhrNotificationService, MetricsGraphService, DummyMetricsReportService, $interval, $scope) {
    var vm = this;
    vm.ABORT = 'ABORT';
    vm.REFRESH = 'refresh';
    vm.SET = 'set';
    vm.EMPTY = 'empty';
    vm.clusterFilter = null;
    vm.timeFilter = null;
    vm.callVolumeChart = null;
    vm.availabilityChart = null;
    vm.utilizationChart = null;
    vm.clusterUpdate = clusterUpdate;
    vm.timeUpdate = timeUpdate;
    vm.isRefresh = isRefresh;
    vm.isEmpty = isEmpty;
    vm.setAllGraphs = setAllGraphs;
    vm.setCallVolumeData = setCallVolumeData;
    vm.setAvailabilityData = setAvailabilityData;
    vm.setUtilizationData = setUtilizationData;
    vm.setCPUUtilizationData = setCPUUtilizationData;
    vm.setTotalCallsData = setTotalCallsData;
    vm.setClusterAvailability = setClusterAvailability;
    vm.resizeCards = resizeCards;
    vm.delayedResize = delayedResize;
    vm.setDummyData = setDummyData;
    vm.callVolumeStatus = vm.REFRESH;
    vm.availabilityStatus = vm.REFRESH;
    vm.utilizationStatus = vm.REFRESH;
    vm.allClusters = $translate.instant('mediaFusion.metrics.allclusters');
    vm.noData = $translate.instant('mediaFusion.metrics.nodata');
    vm.percentage = $translate.instant('mediaFusion.metrics.percentage');
    vm.utilization = $translate.instant('mediaFusion.metrics.utilization');
    vm.average_utilzation = $translate.instant('mediaFusion.metrics.avgutilization');
    vm.errorData = $translate.instant('mediaFusion.metrics.errordata');
    vm.clusterOptions = [vm.allClusters];
    vm.clusterSelected = vm.clusterOptions[0];
    vm.clusterId = vm.clusterOptions[0];
    vm.Map = {};
    var deferred = $q.defer();
    vm.timeOptions = [{
      value: 0,
      label: $translate.instant('mediaFusion.metrics.today'),
      description: $translate.instant('mediaFusion.metrics.today2')
    }, {
      value: 1,
      label: $translate.instant('mediaFusion.metrics.week'),
      description: $translate.instant('mediaFusion.metrics.week2')
    }, {
      value: 2,
      label: $translate.instant('mediaFusion.metrics.month'),
      description: $translate.instant('mediaFusion.metrics.month2')
    }, {
      value: 3,
      label: $translate.instant('mediaFusion.metrics.threeMonths'),
      description: $translate.instant('mediaFusion.metrics.threeMonths2')
    }];
    vm.timeSelected = vm.timeOptions[0];
    vm.displayDate = displayDate;

    displayDate();

    function displayDate() {
      var date1 = new Date();
      var date2 = new Date();
      var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      if (vm.timeSelected.value === 0) {

        vm.label = vm.timeSelected.label;
        vm.date = date1.getHours() + ':' + (date1.getMinutes() < 10 ? '0' : '') + date1.getMinutes() + ' ' + month[date1.getMonth()] + ' ' + date1.getDate() + ',' + date1.getFullYear();
        vm.date = $translate.instant('mediaFusion.metrics.lastRefresh') + ' ' + vm.date;

      } else if (vm.timeSelected.value === 1) {

        vm.label = vm.timeSelected.label;
        date1.setDate(date1.getDate() - 7);
        var prevdate = new Date(date1);
        vm.date = month[prevdate.getMonth()] + ' ' + prevdate.getDate() + ',' + ' ' + prevdate.getFullYear() + ' ' + '-' + ' ' + month[date2.getMonth()] + ' ' + date2.getDate() + ',' + ' ' + date2.getFullYear();

      } else if (vm.timeSelected.value === 2) {

        vm.label = vm.timeSelected.label;
        date1.setMonth(date1.getMonth() - 1);
        prevdate = new Date(date1);
        vm.date = month[prevdate.getMonth()] + ' ' + prevdate.getDate() + ',' + ' ' + prevdate.getFullYear() + ' ' + '-' + ' ' + month[date2.getMonth()] + ' ' + date2.getDate() + ',' + ' ' + date2.getFullYear();

      } else {

        vm.label = vm.timeSelected.label;
        date1.setMonth(date1.getMonth() - 3);
        prevdate = new Date(date1);
        vm.date = month[prevdate.getMonth()] + ' ' + prevdate.getDate() + ',' + ' ' + prevdate.getFullYear() + ' ' + '-' + ' ' + month[date2.getMonth()] + ' ' + date2.getDate() + ',' + ' ' + date2.getFullYear();

      }
    }

    function getCluster() {
      MediaClusterServiceV2.getAll()
        .then(function (clusters) {
          vm.clusters = _.filter(clusters, { targetType: 'mf_mgmt' });
          _.each(clusters, function (cluster) {
            if (cluster.targetType === "mf_mgmt") {
              vm.clusterOptions.push(cluster.name);
              vm.Map[cluster.name] = cluster.id;
            }
          });
          deferred.resolve(vm.Map);
          vm.clusterId = vm.clusterOptions[0];
          vm.clusterSelected = vm.clusterOptions[0];

        }).catch(function () {
          XhrNotificationService.notify(vm.errorData);
        });
      return deferred.promise;
    }

    function getClusterName(graphs) {
      vm.tempData = [];
      _.forEach(graphs, function (value) {
        var clusterName = _.findKey(vm.Map, function (val) {
          return val === value.valueField;
        });
        if (angular.isDefined(clusterName)) {
          value.title = clusterName;
          if (vm.allClusters !== vm.clusterId && vm.clusterSelected !== value.title) {
            value.lineAlpha = 0.2;
          }
          value.balloonText = '<span class="graph-text">' + value.title + ' ' + vm.utilization + ' <span class="graph-number">[[value]]</span></span>';
          value.lineThickness = 3;
        }
        if (value.valueField === 'average_util') {
          value.title = vm.average_utilzation;
          value.lineColor = '#4E5051';
          value.dashLength = 4;
          value.balloonText = '<span class="graph-text">' + value.title + ' <span class="graph-number">[[value]]</span></span>';
          value.lineThickness = 2;
        }
        if (value.title !== value.valueField) {
          vm.tempData.push(value);
        }
      });
      return vm.tempData;
    }

    function clusterUpdate() {
      displayDate();
      vm.callVolumeStatus = vm.REFRESH;
      vm.availabilityStatus = vm.REFRESH;
      vm.utilizationStatus = vm.REFRESH;
      if (vm.clusterSelected !== vm.allClusters) {
        vm.clusterId = vm.Map[vm.clusterSelected];
      } else {
        vm.clusterId = vm.allClusters;
      }
      setDummyData();
      setAllGraphs();
    }

    function timeUpdate() {
      displayDate();
      vm.callVolumeStatus = vm.REFRESH;
      vm.availabilityStatus = vm.REFRESH;
      vm.utilizationStatus = vm.REFRESH;
      setDummyData();
      setAllGraphs();
    }

    function loadDatas() {
      getCluster();
      clusterUpdate();
    }

    loadDatas();

    // Code for auto reload the rest calls every 5 minutes
    var interval = $interval(clusterUpdate, 300000);
    $scope.$on('$destroy', function () {
      $interval.cancel(interval);
    });

    // Graph data status checks
    function isRefresh(tab) {
      return tab === vm.REFRESH;
    }

    function isEmpty(tab) {
      return tab === vm.EMPTY;
    }

    function setAllGraphs() {
      setTotalCallsData();
      setUtilizationData();
      setAvailabilityData();
      setCallVolumeData();
      setClusterAvailability();
      setCPUUtilizationData();
    }

    function resizeCards() {
      $timeout(function () {
        $('.cs-card-layout').masonry('destroy');
        $('.cs-card-layout').masonry({
          itemSelector: '.cs-card',
          columnWidth: '.cs-card',
          isResizable: true,
          percentPosition: true
        });
      }, 0);
    }

    function delayedResize() {
      // delayed resize necessary to fix any overlapping cards on smaller screens
      $timeout(function () {
        $('.cs-card-layout').masonry('layout');
      }, 500);
    }

    function setDummyData() {
      setCallVolumeGraph(DummyMetricsReportService.dummyCallVolumeData(vm.timeSelected));
      setAvailabilityGraph(DummyMetricsReportService.dummyAvailabilityData(vm.timeSelected));
      setUtilizationGraph(DummyMetricsReportService.dummyUtilizationData(vm.timeSelected), DummyMetricsReportService.dummyUtilizationGraph());
      resizeCards();
    }

    function setCallVolumeGraph(data) {
      var tempCallVolumeChart = MetricsGraphService.setCallVolumeGraph(data, vm.callVolumeChart, vm.clusterSelected, vm.timeSelected.label);
      if (tempCallVolumeChart !== null && angular.isDefined(tempCallVolumeChart)) {
        vm.callVolumeChart = tempCallVolumeChart;
      }
    }

    function setCallVolumeData() {
      MetricsReportService.getCallVolumeData(vm.timeSelected, vm.clusterId).then(function (response) {
        if (response === vm.ABORT) {
          return;
        } else if (response.graphData.length === 0) {
          vm.callVolumeStatus = vm.EMPTY;
        } else {
          setCallVolumeGraph(response.graphData);
          vm.callVolumeStatus = vm.SET;
        }
        resizeCards();
      }).catch(function () {
        XhrNotificationService.notify(vm.errorData);
      });
    }

    function setAvailabilityGraph(data) {
      var tempData = angular.copy(data);
      if (!angular.isDefined(data.data[0].isDummy)) {
        var availabilityData = [];
        if (vm.clusterId === vm.allClusters) {
          _.forEach(data.data[0].clusterCategories, function (clusterCategory) {
            var clusterName = _.findKey(vm.Map, function (val) {
              return val === clusterCategory.category;
            });
            if (angular.isDefined(clusterName)) {
              clusterCategory.category = clusterName;
              availabilityData.push(clusterCategory);
            }
          });
          if (availabilityData.length === 0) {
            return false;
          }
          tempData.data[0].clusterCategories = availabilityData;
        }
      }
      var tempAvailabilityChart = MetricsGraphService.setAvailabilityGraph(tempData, vm.availabilityChart, vm.clusterId, vm.clusterSelected, vm.timeSelected.label);
      if (tempAvailabilityChart !== null && angular.isDefined(tempAvailabilityChart)) {
        vm.availabilityChart = tempAvailabilityChart;
      }
      return true;
    }

    function setAvailabilityData() {
      MetricsReportService.getAvailabilityData(vm.timeSelected, vm.clusterId).then(function (response) {
        if (response === vm.ABORT) {
          return;
        } else if (!angular.isDefined(response.data) || !angular.isArray(response.data) || response.data.length === 0 || !angular.isDefined(response.data[0].clusterCategories) || response.data[0].clusterCategories.length === 0) {
          vm.availabilityStatus = vm.EMPTY;
        } else {
          deferred.promise.then(function () {
            if (!setAvailabilityGraph(response)) {
              vm.availabilityStatus = vm.EMPTY;
              setAvailabilityGraph(DummyMetricsReportService.dummyAvailabilityData(vm.timeSelected));
            } else {
              vm.availabilityStatus = vm.SET;
            }
          }, //when promise of clusterid to name is a reject this gets executed
            function () {
              setAvailabilityGraph(DummyMetricsReportService.dummyAvailabilityData(vm.timeSelected));
              vm.availabilityStatus = vm.EMPTY;
            });
        }
        resizeCards();
      }).catch(function () {
        XhrNotificationService.notify(vm.errorData);
      });
    }

    function setUtilizationGraph(data, graphs) {
      var tempUtilizationChart = MetricsGraphService.setUtilizationGraph(data, graphs, vm.utilizationChart, vm.clusterSelected, vm.timeSelected.label);
      if (tempUtilizationChart !== null && angular.isDefined(tempUtilizationChart)) {
        vm.UtilizationChart = tempUtilizationChart;
      }
    }

    function setUtilizationData() {
      if (vm.clusterId === vm.allClusters) {
        MetricsReportService.getUtilizationData(vm.timeSelected, vm.allClusters).then(function (response) {
          if (response === vm.ABORT) {
            return;
          } else if (!angular.isDefined(response.graphData) || !angular.isDefined(response.graphs) || response.graphData.length === 0) {
            vm.utilizationStatus = vm.EMPTY;
          } else {
            deferred.promise.then(function () {
              vm.utilizationClusterName = getClusterName(response.graphs);
              setUtilizationGraph(response.graphData, vm.utilizationClusterName);
              vm.card = '';
              vm.utilizationStatus = vm.SET;
            },  //when promise of clusterid to name is a reject this gets executed
            function () {
              setUtilizationGraph(DummyMetricsReportService.dummyUtilizationData(vm.timeSelected), DummyMetricsReportService.dummyUtilizationGraph());
              vm.utilizationStatus = vm.EMPTY;
            });
          }
          resizeCards();
        }).catch(function () {
          XhrNotificationService.notify(vm.errorData);
        });
      } else {
        MetricsReportService.getUtilizationData(vm.timeSelected, vm.allClusters).then(function (response) {
          if (response === vm.ABORT) {
            return;
          } else if (!angular.isDefined(response.graphData) || !angular.isDefined(response.graphs) || response.graphData.length === 0) {
            vm.utilizationStatus = vm.EMPTY;
          } else {
            for (var i = 0; i <= response.graphs.length; i++) {
              if (response.graphs[i].valueField !== vm.clusterId) {
                vm.utilizationStatus = vm.EMPTY;
              } else {
                vm.utilizationClusterName = getClusterName(response.graphs);
                setUtilizationGraph(response.graphData, vm.utilizationClusterName);
                vm.card = '';
                vm.utilizationStatus = vm.SET;
                break;
              }
            }
          }
          resizeCards();
        }).catch(function () {
          XhrNotificationService.notify(vm.errorData);
        });
      }
    }

    function setTotalCallsData() {
      //changing the cluster ID to clister name and this should be changed back to cluster ID in future
      MetricsReportService.getTotalCallsData(vm.timeSelected, vm.clusterSelected).then(function (response) {
        if (vm.clusterId === vm.allClusters) {
          if (response === vm.ABORT) {
            return;
          } else if (!angular.isDefined(response.data) || response.data.length === 0) {
            vm.onprem = vm.noData;
            vm.cloud = vm.noData;
            vm.total = vm.noData;
          } else if (!angular.isDefined(response.data.callsOnPremise) && angular.isDefined(response.data.callsOverflow)) {
            vm.onprem = vm.noData;
            vm.cloud = response.data.callsOverflow;
            vm.total = vm.cloud;
          } else if (angular.isDefined(response.data.callsOnPremise) && !angular.isDefined(response.data.callsOverflow)) {
            vm.onprem = response.data.callsOnPremise;
            vm.cloud = vm.noData;
            vm.total = vm.onprem;
          } else if (!angular.isDefined(response.data.callsOnPremise) && !angular.isDefined(response.data.callsOverflow)) {
            vm.onprem = vm.noData;
            vm.cloud = vm.noData;
            vm.total = vm.noData;
          } else {
            vm.onprem = response.data.callsOnPremise;
            vm.cloud = response.data.callsOverflow;
            vm.total = vm.onprem + vm.cloud;
          }

        } else {
          if (response === vm.ABORT) {
            return;
          } else if (!angular.isDefined(response.data) || response.data.length === 0) {
            vm.onprem = vm.noData;
            vm.cloud = vm.noData;
            vm.total = vm.noData;
          } else if (!angular.isDefined(response.data.callsOnPremise) && angular.isDefined(response.data.callsRedirect)) {
            vm.onprem = vm.noData;
            vm.cloud = response.data.callsRedirect;
            vm.total = vm.cloud;
          } else if (angular.isDefined(response.data.callsOnPremise) && !angular.isDefined(response.data.callsRedirect)) {
            vm.onprem = response.data.callsOnPremise;
            vm.cloud = vm.noData;
            vm.total = vm.onprem;
          } else if (!angular.isDefined(response.data.callsOnPremise) && !angular.isDefined(response.data.callsRedirect)) {
            vm.onprem = vm.noData;
            vm.cloud = vm.noData;
            vm.total = vm.noData;
          } else {
            vm.onprem = response.data.callsOnPremise;
            vm.cloud = response.data.callsRedirect;
            vm.total = vm.onprem + vm.cloud;
          }
        }
        resizeCards();
      }).catch(function () {
        XhrNotificationService.notify(vm.errorData);
      });

    }

    function setCPUUtilizationData() {
      MetricsReportService.getCPUUtilizationData(vm.timeSelected, vm.clusterId).then(function (response) {
        if (response === vm.ABORT) {
          return;
        } else if (!angular.isDefined(response.data) || response.data.length === 0 || !angular.isDefined(response.data.avgCpu) || !angular.isDefined(response.data.peakCpu)) {
          vm.averageUtilization = vm.EMPTY;
          vm.peakUtilization = vm.EMPTY;
          vm.averageUtilization = vm.noData;
          vm.peakUtilization = vm.noData;
        } else {
          vm.averageUtilization = response.data.avgCpu + vm.percentage;
          vm.peakUtilization = response.data.peakCpu + vm.percentage;
        }
        resizeCards();
      }).catch(function () {
        XhrNotificationService.notify(vm.errorData);
      });
    }

    function setClusterAvailability() {
      MetricsReportService.getClusterAvailabilityData(vm.timeSelected, vm.clusterId).then(function (response) {
        if (response === vm.ABORT) {
          return;
        } else if (!angular.isDefined(response.data) || response.data.length === 0 || !angular.isDefined(response.data.availabilityPercent)) {
          vm.clusterAvailability = vm.EMPTY;
          vm.clusterAvailability = vm.noData;
        } else {
          vm.clusterAvailability = response.data.availabilityPercent + vm.percentage;
        }
        resizeCards();
      }).catch(function () {
        XhrNotificationService.notify(vm.errorData);
      });
    }

  }
})();