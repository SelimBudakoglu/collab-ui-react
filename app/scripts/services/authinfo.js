'use strict';

angular.module('wx2AdminWebClientApp')
  .service('Authinfo', ['$rootScope', '$location',
    function Authinfo($rootScope, $location) {
      // AngularJS will instantiate a singleton by calling "new" on this function
      var authData = {
        'username': null,
        'orgname': null,
        'orgid': null,
        'addUserEnabled': null,
        'services': null,
        'tabs': null
      };

      return {
        initialize: function(data) {
          authData.username = data.name;
          authData.orgname = data.orgName;
          authData.orgid = data.orgId;
          authData.addUserEnabled = data.addUserEnabled;
          authData.services = data.services;
          authData.roles = data.roles;
          $rootScope.services = data.services;
          $rootScope.$broadcast('AuthinfoUpdated');
        },

        clear: function() {
          authData.username = null;
          authData.orgname = null;
          authData.orgid = null;
          authData.addUserEnabled = null;
          authData.services = null;
        },

        getOrgName: function() {
          return authData.orgname;
        },

        getOrgId: function() {
          return authData.orgid;
        },

        getUserName: function() {
          return authData.username;
        },

        isAddUserEnabled: function() {
          return authData.addUserEnabled;
        },

        getServices: function() {
          return authData.services;
        },

        getRoles: function() {
          return authData.roles;
        },

        setTabs: function(allowedTabs) {
          authData.tabs = allowedTabs;
          $rootScope.$broadcast('AllowedTabsUpdated');
        },

        isAllowedTab: function() {
          var curPath = $location.path();
          var flag = false;
          for (var idx in authData.tabs) {
            var tab = authData.tabs[idx];
            if (tab.path === curPath) {
              flag = true;
              break;
            }
          }
          return flag;
        },

        isEmpty: function() {
          for (var datakey in authData) {
            if (authData[datakey] !== null) {
              return false;
            }
          }
          return true;
        }

      };
    }
  ]);
