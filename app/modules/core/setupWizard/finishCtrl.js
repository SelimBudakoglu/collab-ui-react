'use strict';

angular.module('Core')
  .controller('WizardFinishCtrl', ['$scope', '$q', '$translate', 'Notification',
    function ($scope, $q, $translate, Notification) {

      $scope.initNext = function () {
        var deferred = $q.defer();
        if (angular.isFunction($scope.getRequiredTabs)) {
          var required = $scope.getRequiredTabs();
          if (angular.isArray(required) && required.length > 0) {
            var errors = [];
            for (var i = 0; i < required.length; i++) {
              errors.push($translate.instant('firstTimeWizard.completeRequired', {
                name: required[i]
              }));
            }
            Notification.notify(errors, 'error');
            deferred.reject();
          }
        }
        deferred.resolve();
        return deferred.promise;
      }
    }
  ]);
