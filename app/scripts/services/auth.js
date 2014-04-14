'use strict';

angular.module('wx2AdminWebClientApp')
  .factory('Auth', function($http, $location, $q, Config, Authinfo) {

    var auth = {
      authorizeUrl: Config.adminServiceUrl.prod + 'orgadmininfo'
    };

    auth.authorize = function(token, scope) {
      var deferred = $q.defer();
      $http.defaults.headers.common.Authorization = 'Bearer ' + token;
      $http.get(auth.authorizeUrl)
        .success(function(data) {
          Authinfo.initialize(data);
          scope.isAuthorized = true;
          deferred.resolve();
        })
        .error(function(data, status) {
          Authinfo.clear();
          scope.isAuthorized = false;
          scope.data = data || 'Authorization failed.';
          if (status === 403) {
            scope.result = 'Authorization failed. You do not have administrator priviledges.';
          } else if (status === 401) {
            scope.result = 'Authorization failed. Server unable to process authorization token.';
          } else {
            scope.result = 'Authorization failed with status ' + status + '.  Server may be down, please contact system administrator.';
          }
          deferred.reject();
        });

      return deferred.promise;

    };

    auth.getFromGetParams = function(url) {
      var result = {};
      var cleanUrlA = url.split('#');
      var cleanUrl = cleanUrlA[1];
      for (var i = 2; i < cleanUrlA.length; i++) {
        cleanUrl += '#' + cleanUrlA[i];
      }
      var params = cleanUrl.split('&');
      for (i = 0; i < params.length; i++) {
        var param = params[i];
        result[param.split('=')[0]] = param.split('=')[1];
      }
      return result;
    };

    auth.getFromStandardGetParams = function(url) {
      var result = {};
      var cleanUrlA = url.split('?');
      var cleanUrl = cleanUrlA[1];
      var params = cleanUrl.split('&');
      for (var i = 0; i < params.length; i++) {
        var param = params[i];
        result[param.split('=')[0]] = param.split('=')[1];
      }
      return result;
    };

    return auth;
  });
