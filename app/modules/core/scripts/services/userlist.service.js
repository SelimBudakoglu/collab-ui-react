(function () {
  'use strict';
  /* global $ */

  angular
    .module('Core')
    .factory('UserListService', UserListService);

  /* @ngInject */
  function UserListService($http, $rootScope, $location, $q, $filter, $compile, $timeout, $translate, Storage, Config, Authinfo, Log, Utils, Auth, pako) {
    var searchFilter = 'filter=active%20eq%20true%20and%20userName%20sw%20%22%s%22%20or%20name.givenName%20sw%20%22%s%22%20or%20name.familyName%20sw%20%22%s%22%20or%20displayName%20sw%20%22%s%22';
    var attributes = 'attributes=name,userName,userStatus,entitlements,displayName,photos,roles,active,trainSiteNames,licenseID';
    var scimUrl = Config.getScimUrl(Authinfo.getOrgId()) + '?' + '&' + attributes;
    var ciscoOrgId = '1eb65fdf-9643-417f-9974-ad72cae0e10f';

    var service = {
      'listUsers': listUsers,
      'generateUserReports': generateUserReports,
      'getUserReports': getUserReports,
      'extractUsers': extractUsers,
      'exportCSV': exportCSV,
      'listPartners': listPartners
    };

    return service;

    ////////////////

    function listUsers(startIndex, count, sortBy, sortOrder, callback, searchStr, getAdmins) {
      var listUrl = scimUrl;
      var filter;
      var entitlement;
      var scimSearchUrl = null;
      var encodedSearchStr = '';
      var adminFilter = '&filter=roles%20eq%20%22id_full_admin%22%20and%20active%20eq%20true';

      if (getAdmins && listUrl.indexOf(adminFilter) === -1) {
        listUrl = listUrl + adminFilter;
      } else {
        // US8552: For organizations with too many users, don't load the user list
        // searching a large org with too few characters 'xz' triggers an useful error.
        listUrl = listUrl + '&filter=active%20eq%20true%20or%20displayName%20sw%20%22xz%22';
      }

      if (!getAdmins) {
        if (typeof entitlement !== 'undefined' && entitlement !== null && searchStr !== '' && typeof (searchStr) !== 'undefined') {
          //It seems CI does not support 'ANDing' filters in this situation.
          filter = searchFilter + '%20and%20entitlements%20eq%20%22' + window.encodeURIComponent(entitlement) + '%22';
          scimSearchUrl = Config.getScimUrl(Authinfo.getOrgId()) + '?' + filter + '&' + attributes;
          encodedSearchStr = window.encodeURIComponent(searchStr);
          listUrl = Utils.sprintf(scimSearchUrl, [encodedSearchStr, encodedSearchStr, encodedSearchStr, encodedSearchStr]);
          searchStr = searchStr;
        } else if (searchStr !== '' && typeof (searchStr) !== 'undefined') {
          filter = searchFilter;
          scimSearchUrl = Config.getScimUrl(Authinfo.getOrgId()) + '?' + filter + '&' + attributes;
          encodedSearchStr = window.encodeURIComponent(searchStr);
          listUrl = Utils.sprintf(scimSearchUrl, [encodedSearchStr, encodedSearchStr, encodedSearchStr, encodedSearchStr]);

        } else if (typeof entitlement !== 'undefined' && entitlement !== null) {
          filter = 'filter=active%20eq%20%true%20and%20entitlements%20eq%20%22' + window.encodeURIComponent(entitlement);
          scimSearchUrl = Config.getScimUrl(Authinfo.getOrgId()) + '?' + filter + '&' + attributes;
          listUrl = scimSearchUrl;
        }
      }

      if (startIndex && startIndex > 0) {
        listUrl = listUrl + '&startIndex=' + startIndex;
      }

      if (count && count > 0) {
        listUrl = listUrl + '&count=' + count;
      }

      if (sortBy && sortBy.length > 0) {
        listUrl = listUrl + '&sortBy=' + sortBy;
      }

      if (sortOrder && sortOrder.length > 0) {
        listUrl = listUrl + '&sortOrder=' + sortOrder;
      }

      $http.get(listUrl)
        .success(function (data, status) {
          data = data || {};
          data.success = true;
          Log.debug('Callback with search=' + searchStr);
          callback(data, status, searchStr);
        })
        .error(function (data, status) {
          data = data || {};
          data.success = false;
          data.status = status;
          callback(data, status, searchStr);
          var description = null;
          var errors = data.Errors;
          if (errors) {
            description = errors[0].description;
          }
        });
    }

    // Call user reports REST api to request a user report be generated.
    function generateUserReports(sortBy, callback) {
      var generateUserReportsUrl = Config.getUserReportsUrl(Authinfo.getOrgId());
      var requestData = {
        "sortedBy": [sortBy],
        "attributes": ["name", "userName", "entitlements", "roles", "active"]
      };

      $http({
          method: 'POST',
          url: generateUserReportsUrl,
          data: requestData
        })
        .success(function (data, status) {
          data = data || {};
          data.success = true;
          Log.debug('UserListService.generateUserReport - executing callback...');
          callback(data, status);
        })
        .error(function (data, status) {
          data = data || {};
          data.success = false;
          data.status = status;
          callback(data, status);
        });
    }

    // Call user reports rest api to get the user report data based on the report id from the
    // generate user report request.
    function getUserReports(userReportsID, callback) {
      var userReportsUrl = Config.getUserReportsUrl(Authinfo.getOrgId()) + '/' + userReportsID;

      $http.get(userReportsUrl)
        .success(function (data, status) {
          if (data.status !== 'success') {
            // Set 3 second delay to limit the amount times we
            // continually hit the user reports REST api.
            $timeout(function () {
              getUserReports(userReportsID, callback);
            }, 3000);
          } else {
            data = data || {};
            data.success = true;
            Log.debug('UserListService.getUserReport - executing callback...');
            callback(data, status);
          }
        })
        .error(function (data, status) {
          data = data || {};
          data.success = false;
          data.status = status;
          callback(data, status);
        });
    }

    // Extract users from userReportData where it has been GZIP compressed
    // and then Base64 encoded. Also, apply appropriate filters to the list
    // of users.
    function extractUsers(userReportData, entitlementFilter) {
      // Workaround atob issue (InvalidCharacterError: DOM Exception 5
      // atob@[native code]) for Safari browser on how it handles
      // base64 encoded text string by removing all the whitespaces.
      userReportData = userReportData.replace(/\s/g, '');

      // Decode base64 (convert ascii phbinary)
      var binData = atob(userReportData);

      // Convert binary string to character-number array
      var charData = binData.split('').map(function (x) {
        return x.charCodeAt(0);
      });

      // Turn number array into byte-array
      var byteData = new Uint8Array(charData);

      // Pako magic
      var userReport = pako.inflate(byteData, {
        to: 'string'
      });

      // Filtering user report
      var users = _.filter(JSON.parse(userReport), {
        active: true
      });
      if (entitlementFilter) {
        users = _.filter(users, {
          roles: ['id_full_admin']
        });
      }

      return users;
    }

    // Return a list of users from calling the user reports REST
    // apis.
    function exportCSV(activeFilter) {
      var deferred = $q.defer();

      activeFilter = activeFilter || '';

      $rootScope.exporting = true;
      $rootScope.$broadcast('EXPORTING');

      var entitlementFilter = '';
      if (activeFilter === 'administrators') {
        entitlementFilter = 'webex-squared';
      }

      generateUserReports('userName', function (data, status) {
        if (data.success && data.id) {
          getUserReports(data.id, function (data, status) {
            if (data.success && data.report) {
              var users = extractUsers(data.report, entitlementFilter);
              var exportedUsers = [];
              if (users.length === 0) {
                Log.debug('No users found.');
              } else {
                // header line for CSV file
                var header = {};
                header.name = $translate.instant('usersPage.csvHeaderName');
                header.email = $translate.instant('usersPage.csvHeaderEmailAddress');
                header.entitlements = $translate.instant('usersPage.csvHeaderEntitlements');
                exportedUsers.push(header);

                //formatting the data for export
                for (var i = 0; i < users.length; i++) {
                  var exportedUser = {};
                  var entitlements = '';
                  if (users[i].hasOwnProperty('name') && users[i].name.familyName !== '' && users[i].name.givenName !== '') {
                    exportedUser.name = users[i].name.givenName + ' ' + users[i].name.familyName;
                  } else {
                    exportedUser.name = 'N/A';
                  }
                  exportedUser.email = users[i].userName;
                  for (var entitlement in users[i].entitlements) {
                    entitlements += users[i].entitlements[entitlement] + ' ';
                  }
                  exportedUser.entitlements = entitlements;
                  exportedUsers.push(exportedUser);
                }
              }

              $rootScope.exporting = false;
              $rootScope.$broadcast('EXPORT_FINISHED');

              deferred.resolve(exportedUsers);
            } else {
              Log.debug('Get user reports failed. Status ' + status);
              deferred.reject('Get user reports failed. Status ' + status);
            }
          });
        } else {
          Log.debug('Generate user reports failed. Status ' + status);
          deferred.reject('Generate user reports failed. Status ' + status);
        }
      });

      return deferred.promise;
    }

    function listPartners(orgId, callback) {

      var adminUrl = Config.getAdminServiceUrl() + 'organization/' + orgId + '/users/partneradmins';

      $http.get(adminUrl)
        .success(function (data, status) {
          data = data || {};
          data.success = true;
          callback(data, status);
        })
        .error(function (data, status) {
          data = data || {};
          data.success = false;
          data.status = status;
          callback(data, status);
          var description = null;
          var errors = data.Errors;
          if (errors) {
            description = errors[0].description;
          }
        });
    }
  }
})();
