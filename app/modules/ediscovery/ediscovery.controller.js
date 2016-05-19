(function () {
  'use strict';

  /* @ngInject */
  function EdiscoveryController($timeout, $window, $scope, $translate, $modal, EdiscoveryService) {
    $scope.$on('$viewContentLoaded', function () {
      //setSearchFieldFocus();
      $window.document.title = $translate.instant("ediscovery.browserTabHeaderTitle");
    });
    var vm = this;

    vm.createReport = createReport;
    vm.deleteReports = deleteReports;
    vm.showSearchHelp = showSearchHelp;
    $scope.downloadReport = downloadReport;
    $scope.cancelReport = cancelReport;

    vm.searchCriteria = {
      "searchString": "36de9c50-8410-11e5-8b9b-9d7d6ad1ac82",
      "startDate": moment()
    };
    vm.reports = [];

    pollAvalonReport();

    function getStartDate() {
      return vm.searchCriteria.startDate;
    }

    function getEndDate() {
      return vm.searchCriteria.endDate;
    }

    function setEndDate(endDate) {
      vm.searchCriteria.endDate = endDate;
    }

    function validDuration() {
      if (getEndDate() < getStartDate()) {
        //alert("Oh no!   End date is before start date !!!!");
        $modal.open({
          templateUrl: "modules/ediscovery/dateValidationDialog.html"
        });
        return false;
      } else {
        return true;
      }
    }

    $scope.$watch(getStartDate, function (startDate) {
      var endDate = moment(startDate).add(1, 'days');
      setEndDate(endDate);
    });

    $scope.$watch(getEndDate, function (endDate) {
      validDuration();
    });

    function downloadReport() {
      //console.log("Download not implemented");
    }

    function cancelReport() {
      //console.log("Cancel not implemented");
    }

    vm.gridOptions = {
      data: 'ediscoveryCtrl.reports',
      multiSelect: false,
      rowHeight: 40,
      enableRowHeaderSelection: false,
      enableColumnResize: true,
      enableColumnMenus: false,
      enableHorizontalScrollbar: 0,

      columnDefs: [{
        field: 'displayName',
        displayName: 'Report Name',
        sortable: true
      }, {
        field: 'id',
        displayName: 'Id',
        sortable: false
      }, {
        field: 'createdTime',
        displayName: 'Date Generated',
        sortable: false,
      }, {
        field: 'createdByUserId',
        displayName: 'Generated By',
        sortable: false
      }, {
        field: 'state',
        displayName: 'State',
        sortable: false,
      }, {
        field: 'failureReason',
        displayName: 'Reason',
        sortable: false,
      }, {
        field: 'sizeInBytes',
        displayName: 'Size (bytes)',
        sortable: false,
      }, {
        field: 'actions',
        displayName: 'Actions',
        sortable: false,
        cellTemplate: 'modules/ediscovery/cell-template-action.html'
      }]
    };

    function randomString() {
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      return _.sample(possible, 5).join('');
    }

    function createReport() {
      //console.log("createReport, searchCriteria", vm.searchCriteria)
      EdiscoveryService.createReport("whatever_" + randomString()).then(function (res) {
        //console.log("create result", res)
        pollAvalonReport();
      });
    }

    function deleteReports() {
      EdiscoveryService.deleteReports().then(function (res) {
        //console.log("deleted reports result", res)
      });
    }

    function pollAvalonReport() {
      EdiscoveryService.getReport().then(function (res) {
        //console.log("Response from poll reports", res)
        vm.reports = res;
      }).finally(function (res) {
        $timeout(pollAvalonReport, 5000);
      });
    }

    function setSearchFieldFocus() {
      angular.element('#searchInput').focus();
    }

    function showSearchHelp() {
      var searchHelpUrl = "modules/ediscovery/search-help-dialog.html";
      $modal.open({
        templateUrl: searchHelpUrl
      }).result.finally(function () {
        setSearchFieldFocus();
      });
    }
  }

  angular
    .module('Ediscovery')
    .controller('EdiscoveryController', EdiscoveryController);
}());
