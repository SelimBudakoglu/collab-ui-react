(function () {
  'use strict';

  angular.module('Core')
    .service('PartnerService', PartnerService);

  /* @ngInject */
  function PartnerService($http, $rootScope, $q, $translate, $filter, Config, Log, Authinfo, Auth, FeatureToggleService) {

    var trialsUrl = Config.getAdminServiceUrl() + 'organization/' + Authinfo.getOrgId() + '/trials';
    var managedOrgsUrl = Config.getAdminServiceUrl() + 'organizations/' + Authinfo.getOrgId() + '/managedOrgs';

    var customerStatus = {
      FREE: 0,
      TRIAL: 1,
      ACTIVE: 2,
      CANCELED: 99,
      NO_LICENSE: -1,
      NOTE_EXPIRED: 0,
      NOTE_EXPIRE_TODAY: 0,
      NOTE_NO_LICENSE: 0,
      NOTE_CANCELED: 0,
      NOTE_NOT_EXPIRED: 99
    };

    var factory = {
      trialsUrl: trialsUrl,
      managedOrgsUrl: managedOrgsUrl,
      customerStatus: customerStatus,
      getTrialsList: getTrialsList,
      getManagedOrgsList: getManagedOrgsList,
      isLicenseATrial: isLicenseATrial,
      isLicenseActive: isLicenseActive,
      isLicenseFree: isLicenseFree,
      getLicense: getLicense,
      isLicenseInfoAvailable: isLicenseInfoAvailable,
      setServiceSortOrder: setServiceSortOrder,
      setNotesSortOrder: setNotesSortOrder,
      loadRetrievedDataToList: loadRetrievedDataToList,
      exportCSV: exportCSV
    };

    return factory;

    function getTrialsList(callback) {
      $http.get(trialsUrl)
        .success(function (data, status) {
          data = data || {};
          data.success = true;
          Log.debug('Retrieved trials list');
          callback(data, status);
        })
        .error(function (data, status) {
          data = data || {};
          data.success = false;
          data.status = status;
          callback(data, status);
        });
    }

    function getManagedOrgsList(callback) {
      $http.get(managedOrgsUrl)
        .success(function (data, status) {
          data = data || {};
          data.success = true;
          Log.debug('Retrieved managed orgs list');
          callback(data, status);
        })
        .error(function (data, status) {
          data = data || {};
          data.success = false;
          data.status = status;
          callback(data, status);
        });
    }

    function isLicenseATrial(license) {
      return license && license.isTrial === true;
    }

    function isLicenseActive(license) {
      return license && license.isTrial === false;
    }

    function isLicenseFree(license) {
      return angular.isUndefined(license.isTrial);
    }

    function getLicense(licenses, licenseTypeField) {
      var offerNames;
      if (licenseTypeField === 'messaging') {
        offerNames = ['MS'];
      } else if (licenseTypeField === 'conferencing') {
        offerNames = ['MC', 'CF', 'EE', 'TC', 'SC'];
      } else if (licenseTypeField === 'communications') {
        offerNames = ['CO'];
      } else if (licenseTypeField === 'shared_devices') {
        offerNames = ['SD'];
      }

      if (angular.isDefined(licenses) && angular.isDefined(licenses.length)) {
        return _.find(licenses, function (license) {
          return offerNames.indexOf(license.offerName) !== -1;
        }) || {};
      }
      return {};
    }

    function isLicenseInfoAvailable(licenses) {
      return angular.isArray(licenses);
    }

    function setServiceSortOrder(license) {
      if (_.isEmpty(license)) {
        license.sortOrder = customerStatus.NO_LICENSE;
      } else if (license.status === 'CANCELED') {
        license.sortOrder = customerStatus.CANCELED;
      } else if (isLicenseFree(license)) {
        license.sortOrder = customerStatus.FREE;
      } else if (isLicenseATrial(license)) {
        license.sortOrder = customerStatus.TRIAL;
      } else if (isLicenseActive(license)) {
        license.sortOrder = customerStatus.ACTIVE;
      } else {
        license.sortOrder = customerStatus.NO_LICENSE;
      }
    }

    function setNotesSortOrder(rowData) {
      rowData.notes = {};
      if (isLicenseInfoAvailable(rowData.licenseList)) {
        if (rowData.status === 'CANCELED') {
          rowData.notes.sortOrder = customerStatus.NOTE_CANCELED;
          rowData.notes.text = $translate.instant('customerPage.suspended');
        } else if (rowData.status === 'ACTIVE' && rowData.daysLeft > 0) {
          rowData.notes.sortOrder = customerStatus.NOTE_NOT_EXPIRED;
          rowData.notes.daysLeft = rowData.daysLeft;
          rowData.notes.text = $translate.instant('customerPage.daysRemaining', {
            count: rowData.daysLeft
          });
        } else if (rowData.isTrial && rowData.status === 'ACTIVE' && rowData.daysLeft === 0) {
          rowData.notes.sortOrder = customerStatus.NOTE_EXPIRE_TODAY;
          rowData.notes.daysLeft = 0;
          rowData.notes.text = $translate.instant('customerPage.expiringToday');
        } else if (rowData.status === 'ACTIVE' && rowData.daysLeft < 0) {
          rowData.notes.sortOrder = customerStatus.NOTE_EXPIRED;
          rowData.notes.daysLeft = -1;
          rowData.notes.text = $translate.instant('customerPage.expired');
        } else {
          rowData.notes.sortOrder = customerStatus.NOTE_NO_LICENSE;
          rowData.notes.text = $translate.instant('customerPage.licenseInfoNotAvailable');
        }
      } else {
        rowData.notes.sortOrder = customerStatus.NOTE_NO_LICENSE;
        rowData.notes.text = $translate.instant('customerPage.licenseInfoNotAvailable');
      }
    }

    function loadRetrievedDataToList(retrievedData, basicList, isTrialData) {
      var list = basicList || [];

      var isAtlasStormBranding = false;

      FeatureToggleService.supports(FeatureToggleService.features.atlasStormBranding).then(function (result) {
        isAtlasStormBranding = result;
      });

      for (var index in retrievedData) {
        var data = retrievedData[index];
        var edate = moment(data.startDate).add(data.trialPeriod, 'days').format('MMM D, YYYY');
        var dataObj = {
          trialId: data.trialId,
          customerOrgId: data.customerOrgId || data.id,
          customerName: data.customerName || data.displayName,
          customerEmail: data.customerEmail || data.email,
          endDate: edate,
          numUsers: data.licenseCount,
          daysLeft: 0,
          usage: 0,
          licenses: 0,
          deviceLicenses: 0,
          licenseList: [],
          messaging: null,
          conferencing: null,
          communications: null,
          daysUsed: 0,
          percentUsed: 0,
          duration: data.trialPeriod,
          offer: '',
          status: data.state,
          state: data.state,
          isAllowedToManage: true,
          isSquaredUcOffer: false
        };

        dataObj.isAllowedToManage = isTrialData || data.isAllowedToManage;

        if (data.offers) {
          dataObj.offers = data.offers;
          var offerNames = [];
          for (var cnt in data.offers) {
            var offer = data.offers[cnt];
            if (!offer) {
              continue;
            }
            switch (offer.id) {
            case Config.trials.message:
              if (isAtlasStormBranding) {
                offerNames.push($translate.instant('customerPage.message'));
              } else {
                offerNames.push($translate.instant('trials.collab'));
              }
              break;
            case Config.trials.call:
              dataObj.isSquaredUcOffer = true;
              if (isAtlasStormBranding) {
                offerNames.push($translate.instant('customerPage.call'));
              } else {
                offerNames.push($translate.instant('trials.squaredUC'));
              }
              break;
            case Config.trials.roomSystems:
              offerNames.push($translate.instant('customerPage.roomSystem'));
              break;
            }
            dataObj.usage = offer.usageCount;
            if (offer.id === Config.trials.roomSystems) {
              dataObj.deviceLicenses = offer.licenseCount;
            } else {
              dataObj.licenses = offer.licenseCount;
            }
          }
          dataObj.offer = offerNames.sort().join(', ');
        }

        dataObj.unmodifiedLicenses = _.cloneDeep(data.licenses);
        dataObj.licenseList = data.licenses;
        dataObj.messaging = getLicense(data.licenses, 'messaging');
        dataObj.conferencing = getLicense(data.licenses, 'conferencing');
        dataObj.communications = getLicense(data.licenses, 'communications');
        dataObj.roomSystems = getLicense(data.licenses, 'shared_devices');

        var now = moment().format('MMM D, YYYY');
        var then = edate;
        var start = moment(data.startDate).format('MMM D, YYYY');

        var daysDone = moment(now).diff(start, 'days');
        dataObj.daysUsed = daysDone;
        dataObj.percentUsed = Math.round((daysDone / data.trialPeriod) * 100);

        var daysLeft = moment(then).diff(now, 'days');
        dataObj.daysLeft = daysLeft;
        if (isTrialData) {
          if (daysLeft < 0) {
            dataObj.status = $translate.instant('customerPage.expired');
            dataObj.state = "EXPIRED";
          }
        }

        var tmpServiceObj = {
          status: dataObj.status,
          daysLeft: daysLeft,
          customerName: dataObj.customerName
        };
        angular.extend(dataObj.messaging, tmpServiceObj);
        angular.extend(dataObj.conferencing, tmpServiceObj);
        angular.extend(dataObj.communications, tmpServiceObj);
        angular.extend(dataObj.roomSystems, tmpServiceObj);
        setServiceSortOrder(dataObj.messaging);
        setServiceSortOrder(dataObj.conferencing);
        setServiceSortOrder(dataObj.communications);
        setServiceSortOrder(dataObj.roomSystems);

        dataObj.notes = {};
        setNotesSortOrder(dataObj);
        list.push(dataObj);
      }

      return list;
    }

    function exportCSV() {
      var deferred = $q.defer();

      var customers = [];

      $rootScope.exporting = true;
      $rootScope.$broadcast('EXPORTING');

      getManagedOrgsList(function (data, status) {
        if (data.success && data.organizations) {
          if (data.organizations.length > 0) {
            customers = data.organizations;
            Log.debug('total managed orgs records found:' + customers.length);
          } else {
            Log.debug('No managed orgs records found');
          }

          //var exportedCustomers = formatCustomerList(customerList);
          var exportedCustomers = [];

          if (customers.length === 0) {
            Log.debug('No lines found.');
          } else {
            // header line for CSV file
            var header = {};
            header.customerName = $translate.instant('customerPage.csvHeaderCustomerName');
            header.adminEmail = $translate.instant('customerPage.csvHeaderAdminEmail');
            header.messagingEntitlements = $translate.instant('customerPage.csvHeaderMessagingEntitlements');
            header.conferencingEntitlements = $translate.instant('customerPage.csvHeaderConferencingEntitlements');
            header.communicationsEntitlements = $translate.instant('customerPage.csvHeaderCommunicationsEntitlements');
            header.roomSystemsEntitlements = $translate.instant('customerPage.csvHeaderRoomSystemsEntitlements');
            exportedCustomers.push(header);

            // data to export for CSV file customer.conferencing.features[j]
            for (var i = 0; i < customers.length; i++) {
              var exportedCustomer = {};

              exportedCustomer.customerName = customers[i].customerName;
              exportedCustomer.adminEmail = customers[i].customerEmail;
              exportedCustomer.messagingEntitlements = '';
              exportedCustomer.conferenceEntitlements = '';
              exportedCustomer.communicationsEntitlements = '';
              exportedCustomer.roomSystemsEntitlements = '';

              var messagingLicense = _.find(customers[i].licenses, {
                licenseType: "MESSAGING"
              });
              var conferenceLicense = _.find(customers[i].licenses, {
                licenseType: "CONFERENCING"
              });
              var communicationsLicense = _.find(customers[i].licenses, {
                licenseType: "COMMUNICATIONS"
              });
              var roomSystemsLicense = _.find(customers[i].licenses, {
                licenseType: "SHARED_DEVICES"
              });
              if (messagingLicense && angular.isArray(messagingLicense.features)) {
                exportedCustomer.messagingEntitlements = messagingLicense.features.join(' ');
              }
              if (conferenceLicense && angular.isArray(conferenceLicense.features)) {
                exportedCustomer.conferenceEntitlements = conferenceLicense.features.join(' ');
              }
              if (communicationsLicense && angular.isArray(communicationsLicense.features)) {
                exportedCustomer.communicationsEntitlements = communicationsLicense.features.join(' ');
              }
              if (roomSystemsLicense && angular.isArray(roomSystemsLicense.features)) {
                exportedCustomer.roomSystemsEntitlements = roomSystemsLicense.features.join(' ');
              }
              exportedCustomers.push(exportedCustomer);
            }
          }

          deferred.resolve(exportedCustomers);
        } else {
          deferred.reject('Failed to retrieve managed orgs information. Status: ' + status);
        }
      });

      return deferred.promise;
    }
  }
})();
