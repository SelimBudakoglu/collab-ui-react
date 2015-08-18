(function () {
  'use strict';

  angular.module('Core')
    .service('DummyReportService', DummyReportService);

  /* @ngInject */
  function DummyReportService($translate, Config) {
    var dayFormat = "MMM DD";
    var monthFormat = "MMMM";
    var dummyPopulation = null;
    var customers = null;

    return {
      dummyActiveUserData: dummyActiveUserData,
      dummyActivePopulationData: dummyActivePopulationData,
      dummyMediaQualityData: dummyMediaQualityData,
      dummyCallMetricsData: dummyCallMetricsData,
      dummyEndpointData: dummyEndpointData
    };

    function dummyActiveUserData(time) {
      var dummyGraph = [];
      var abs = 0;

      if (time.value === 0) {
        for (var i = 7; i >= 1; i--) {
          abs = 7 - i;
          dummyGraph.push({
            modifiedDate: moment().subtract(i, 'day').format(dayFormat),
            totalRegisteredUsers: 25 + (25 * abs),
            activeUsers: 25 * abs,
            percentage: Math.round(((25 * abs) / (25 + (25 * abs))) * 100),
            colorOne: Config.chartColors.dummyGrayLight,
            colorTwo: Config.chartColors.dummyGray,
            balloon: false
          });
        }
      } else if (time.value === 1) {
        for (var x = 3; x >= 0; x--) {
          abs = 3 - x;
          dummyGraph.push({
            modifiedDate: moment().startOf('week').subtract(1 + (x * 7), 'day').format(dayFormat),
            totalRegisteredUsers: 25 + (25 * abs),
            activeUsers: 25 * abs,
            percentage: Math.round(((25 * abs) / (25 + (25 * abs))) * 100),
            colorOne: Config.chartColors.dummyGrayLight,
            colorTwo: Config.chartColors.dummyGray,
            balloon: false
          });
        }
      } else {
        for (var y = 2; y >= 0; y--) {
          abs = 2 - y;
          dummyGraph.push({
            modifiedDate: moment().subtract(y, 'month').format(monthFormat),
            totalRegisteredUsers: 25 + (25 * abs),
            activeUsers: 25 * abs,
            percentage: Math.round(((25 * abs) / (25 + (25 * abs))) * 100),
            colorOne: Config.chartColors.dummyGrayLight,
            colorTwo: Config.chartColors.dummyGray,
            balloon: false
          });
        }
      }

      return dummyGraph;
    }

    function dummyActivePopulationData(customer, overallPopulation) {
      return [{
        customerName: customer.label,
        customerId: customer.value,
        percentage: 85,
        colorOne: Config.chartColors.dummyGrayLight,
        colorTwo: Config.chartColors.dummyGray,
        balloon: false
      }];
    }

    function dummyMediaQualityData(time) {
      var dummyGraph = [];
      var abs = 0;

      if (time.value === 0) {
        for (var i = 7; i >= 1; i--) {
          abs = 7 - i;
          dummyGraph.push({
            modifiedDate: moment().subtract(i, 'day').format(dayFormat),
            totalDurationSum: (25 + (15 * abs)) + (15 + (10 * abs)) + (5 + (5 * abs)),
            goodQualityDurationSum: 25 + (15 * abs),
            fairQualityDurationSum: 15 + (10 * abs),
            poorQualityDurationSum: 5 + (5 * abs),
            colorOne: Config.chartColors.dummyGray,
            colorTwo: Config.chartColors.dummyGrayLight,
            colorThree: Config.chartColors.dummyGrayLighter,
            balloon: false
          });
        }
      } else if (time.value === 1) {
        for (var x = 3; x >= 0; x--) {
          abs = 3 - x;
          dummyGraph.push({
            modifiedDate: moment().startOf('week').subtract(1 + (x * 7), 'day').format(dayFormat),
            totalDurationSum: (25 + (15 * abs)) + (15 + (10 * abs)) + (5 + (5 * abs)),
            goodQualityDurationSum: 25 + (15 * abs),
            fairQualityDurationSum: 15 + (10 * abs),
            poorQualityDurationSum: 5 + (5 * abs),
            colorOne: Config.chartColors.dummyGray,
            colorTwo: Config.chartColors.dummyGrayLight,
            colorThree: Config.chartColors.dummyGrayLighter,
            balloon: false
          });
        }
      } else {
        for (var y = 2; y >= 0; y--) {
          abs = 2 - y;
          dummyGraph.push({
            modifiedDate: moment().subtract(y, 'month').format(monthFormat),
            totalDurationSum: (25 + (15 * abs)) + (15 + (10 * abs)) + (5 + (5 * abs)),
            goodQualityDurationSum: 25 + (15 * abs),
            fairQualityDurationSum: 15 + (10 * abs),
            poorQualityDurationSum: 5 + (5 * abs),
            colorOne: Config.chartColors.dummyGray,
            colorTwo: Config.chartColors.dummyGrayLight,
            colorThree: Config.chartColors.dummyGrayLighter,
            balloon: false
          });
        }
      }

      return dummyGraph;
    }

    function dummyCallMetricsData() {
      return {
        dataProvider: [{
          callCondition: "Fail",
          numCalls: "200"
        }, {
          callCondition: "Successful",
          numCalls: "800"
        }],
        labelData: {
          numTotalCalls: 1000,
          numTotalMinutes: 1800
        },
        dummy: true
      };
    }

    function dummyEndpointData(customer) {
      return [{
        customer: customer.label,
        deviceRegistrationCountTrend: "0",
        yesterdaysDeviceRegistrationCount: "0",
        registeredDevicesTrend: "0",
        yesterdaysRegisteredDevices: "0",
        maxRegisteredDevices: "0",
        minRegisteredDevices: "0",
        direction: "positive"
      }];
    }
  }
})();
