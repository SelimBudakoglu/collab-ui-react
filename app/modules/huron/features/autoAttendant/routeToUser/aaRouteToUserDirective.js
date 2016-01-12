'use strict';

angular
  .module('uc.autoattendant')
  .directive('aaRouteToUser', [
    function () {
      return {
        restrict: 'E',
        scope: {
          schedule: '@aaSchedule',
          index: '=aaIndex',
          keyIndex: '@aaKeyIndex'
        },
        controller: 'AARouteToUserCtrl',
        controllerAs: 'aaRouteUser',
        templateUrl: 'modules/huron/features/autoAttendant/routeToUser/aaRouteToUser.tpl.html'
      };
    }
  ]);
