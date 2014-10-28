'use strict';

angular.module('Huron')
  .controller('TelephonyInfoCtrl', ['$scope', '$q', '$http', '$state','UserDirectoryNumberService', 'UserServiceCommon', 'RemoteDestinationService', 'TelephonyInfoService','Log', 'Config', 'Notification',
    function($scope, $q, $http, $state, UserDirectoryNumberService, UserServiceCommon, RemoteDestinationService, TelephonyInfoService, Log, Config, Notification) {

      $scope.telephonyInfo = TelephonyInfoService.getTelephonyInfo();

      $scope.$on('telephonyInfoUpdated', function() {
        $scope.telephonyInfo = TelephonyInfoService.getTelephonyInfo();
      });

      $scope.getUserDnInfo = function(user) {
        var deferred = $q.defer();
        // TODO: Remove the following line when we are authenticating with CMI
        delete $http.defaults.headers.common.Authorization;
        UserDirectoryNumberService.get({customerId: user.meta.organizationID, userId: user.id},
          function(data) {
            deferred.resolve(data);
          },function(error) {
            Log.debug('getUserDnInfo failed.  Status: ' + error.status + ' Response: ' + error.data);
            deferred.reject(error);
          });
        return deferred.promise;
      };

      $scope.getTelephonyUserInfo = function(user) {
        var deferred = $q.defer();
        // TODO: Remove the following line when we are authenticating with CMI
        delete $http.defaults.headers.common.Authorization;
        UserServiceCommon.get({customerId: user.meta.organizationID, userId: user.id},
          function(data) {
            deferred.resolve(data);
          },function(error) {
            Log.debug('getTelephonyUserInfo failed.  Status: ' + error.status + ' Response: ' + error.data);
            deferred.reject(error);
          });
        return deferred.promise;
      };

      $scope.processTelephonyUserInfo = function(telephonyUserInfo) {
        if (telephonyUserInfo) {
          TelephonyInfoService.updateUserServices(telephonyUserInfo.services);
        }
      };

      /**
        Function to inspect dnUsage from Huron and change the display
        value to what UX team wants.
      **/
      var getDnType = function(dnUsage) {
        return (dnUsage === 'Primary') ? 'Main' : '';
      };

      $scope.processUserDnInfo = function(userDnInfo) {
        if (userDnInfo) {
          var userDnList = [];
          for (var i = 0; i < userDnInfo.length; i++) {
            var userLine = {
              'dnUsage': getDnType(userDnInfo[i].dnUsage),
              'uuid': userDnInfo[i].directoryNumber.uuid,
              'pattern': userDnInfo[i].directoryNumber.pattern.replace(/\\/g,'')
            };
            userDnList.push(userLine);
          }
          TelephonyInfoService.updateDirectoryNumbers(userDnList);
        }
      };

      $scope.$watch('currentUser', function(newVal, oldVal) {
        if (newVal) {
          if ($scope.isHuronEnabled()) {
            $scope.getTelephonyUserInfo(newVal)
              .then(function(response) {$scope.processTelephonyUserInfo(response);})
              .catch(function(response) {$scope.processTelephonyUserInfo(null);});
            $scope.getUserDnInfo(newVal)
              .then(function (response) { $scope.processUserDnInfo(response); })
              .catch(function(response) { $scope.processUserDnInfo(null); });
            TelephonyInfoService.getRemoteDestinationInfo(newVal)
              .then(function(response) {TelephonyInfoService.processRemoteDestinationInfo(response);})
              .catch(function(response) {TelephonyInfoService.processRemoteDestinationInfo(null);});
          }
        }
      });

      $scope.isHuronEnabled = function() {
        return isEntitled(Config.entitlements.huron);
      };

      $scope.showDirectoryNumberPanel = function (value) {
        TelephonyInfoService.updateCurrentDirectoryNumber(value);
        $state.go('users.list.preview.directorynumber');
      };

      var isEntitled = function(ent) {
        if ($scope.currentUser && $scope.currentUser.entitlements) {
          for (var i=0;i<$scope.currentUser.entitlements.length;i++) {
            var svc = $scope.currentUser.entitlements[i];

            if (svc === ent) {
              return true;
            }
          }
        }
        return false;
      };

    }
  ]);
