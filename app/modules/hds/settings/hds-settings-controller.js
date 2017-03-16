(function () {
  'use strict';

  angular
    .module('HDS')
    .controller('HDSSettingsController', HDSSettingsController);

  /* @ngInject */
  function HDSSettingsController($modal, $state, $translate, Analytics, Authinfo, Orgservice, HDSService, FusionClusterService, Notification) {
    var vm = this;
    vm.PRE_TRIAL = 'pre_trial';    // service status Trial/Production mode
    vm.TRIAL = 'trial';
    vm.PRODUCTION = 'production';
    vm.NA_MODE = 'na_mode';
    vm.trialUserGroupId = null;
    vm.trialDomain = '';
    vm.prodDomain = 'Spark Default KMS';
    vm.numResourceNodes = 1;              // # of resource nodes, TODO: from backend when APIs ready
    vm.numTrialUsers = 10;
    vm.recoverPreTrial = recoverPreTrial; // set to trial mode, TODO: remove this when at the very late stage of HDS dev
    vm.startTrial = startTrial;
    vm.moveToProduction = moveToProduction;
    vm.addResource = addResource;
    vm.openAddTrialUsersModal = openAddTrialUsersModal;
    vm.openEditTrialUsersModal = openEditTrialUsersModal;
    vm.deactivateTrialMode = deactivateTrialMode;
    var localizedHdsModeError = $translate.instant('hds.resources.settings.hdsModeGetError');
    var trialKmsServer = '';
    var trialKmsServerMachineUUID = '';
    var trialAdrServer = '';
    var trialSecurityService = '';

    Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_HDS_SETTINGS);

    // TODO: below is the jason to recover initial state, remove it when at the very late stage of HDS dev
    var jsonTrialMode = {
      "altHdsServers": [
        {
          "type": "kms",
          "kmsServer": "customer.com",
          "kmsServerMachineUUID": "e336ae2b-7afb-4e90-a023-61103e06a861",
          "groupId": "755d989a-feef-404a-8669-085eb054afef",
          "active": false,
        },
        {
          "type": "adr",
          "adrServer": "5f40d7be-da6b-4a10-9c6c-8b061aee053a",
          "groupId": "755d989a-feef-404a-8669-085eb054afef",
          "active": false,
        },
        {
          "type": "sec",
          "securityService": "2d2bdeaf-3e63-4561-be2f-4ecc1a48dcd4",
          "groupId": "755d989a-feef-404a-8669-085eb054afef",
          "active": false,
        },
      ],
    };

    vm.servicestatus = {
      title: 'hds.resources.settings.servicestatusTitle',
    };
    vm.deactivate = {
      title: 'common.deactivate',
    };

    var DEFAULT_SERVICE_MODE = vm.NA_MODE;

    vm.model = {
      serviceMode: DEFAULT_SERVICE_MODE,
    };

    init();

    function init() {
      getOrgHdsInfo();
    }

    function getTrialUsersInfo() {
      HDSService.getHdsTrialUsers(Authinfo.getOrgId(), vm.trialUserGroupId)
        .then(function (data) {
          var trialUsers = _.isObject(data.members) ? data.members : {};
          vm.numTrialUsers = _.size(trialUsers);
        }).catch(function (error) {
          Notification.errorWithTrackingId(error, localizedHdsModeError);
        });
    }

    function getResourceInfo() {
      FusionClusterService.getAll()
        .then(function (clusters) {
          vm.numResourceNodes = _.reduce(clusters, function (total, cluster) {
            if (cluster.targetType === 'hds_app') {
              // TODO: we may need to check if the status is active
              return total + cluster.connectors.length;
            }
            return total;
          }, 0);
        }).catch(function (error) {
          Notification.errorWithTrackingId(error, localizedHdsModeError);
        });
    }
    function getOrgHdsInfo() {
      Orgservice.getOrg(function (data, status) {
        if (data.success || status === 200) {
          vm.orgSettings = data.orgSettings;
          vm.altHdsServers = data.orgSettings.altHdsServers;
          vm.prodDomain = vm.orgSettings.kmsServer;
          if (typeof vm.altHdsServers === 'undefined' || vm.altHdsServers.length === 1) {
            // prod info
            if (typeof vm.prodDomain === 'undefined') {
              vm.model.serviceMode = vm.NA_MODE;
            } else {
              vm.model.serviceMode = vm.PRODUCTION;
            }
          } else {
            // trial info
            if (_.size(vm.altHdsServers) > 0) {
              if (_.every(vm.altHdsServers, function (server) {
                return server.active;
              })) {
                vm.model.serviceMode = vm.TRIAL;
              } else {
                vm.model.serviceMode = vm.PRE_TRIAL;
              }
              _.forEach(vm.altHdsServers, function (server) {
                if (server.kmsServer) {
                  vm.trialDomain = server.kmsServer;
                  vm.trialUserGroupId = server.groupId;
                  trialKmsServer = server.kmsServer;
                  trialKmsServerMachineUUID = server.kmsServerMachineUUID;
                }
                if (server.adrServer) {
                  trialAdrServer = server.adrServer;
                }
                if (server.securityService) {
                  trialSecurityService = server.securityService;
                }
              });
              getTrialUsersInfo();
            } else {
              vm.model.serviceMode = vm.NA_MODE;
            }
          }
          getResourceInfo();
        } else {
          vm.model.serviceMode = vm.NA_MODE;
          Notification.error(localizedHdsModeError + status);
        }
      });
    }

    function recoverPreTrial() {
      Orgservice.setOrgAltHdsServersHds(Authinfo.getOrgId(), jsonTrialMode)
        .then(function () {
          vm.model.serviceMode = vm.PRE_TRIAL;
        }).catch(function (error) {
          Notification.error(localizedHdsModeError + error.statusText);
        });
    }

    function startTrial() {
      if (vm.model.serviceMode === vm.PRE_TRIAL) {
        if (typeof vm.altHdsServers !== 'undefined' || vm.altHdsServers.length > 0) {
          _.forEach(vm.altHdsServers, function (server) {
            if (typeof server.active !== 'undefined') {
              server['active'] = true;
            }
          });
        }
        var myJSON = {
          'altHdsServers': vm.altHdsServers,
        };
        Orgservice.setOrgAltHdsServersHds(Authinfo.getOrgId(), myJSON)
          .then(function () {
            vm.model.serviceMode = vm.TRIAL;
          }).catch(function (error) {
            Notification.errorWithTrackingId(error, localizedHdsModeError);
          });
      }
    }

    function moveToProduction() {
      if (vm.model.serviceMode === vm.TRIAL) {
        $modal.open({
          templateUrl: 'modules/hds/settings/confirm-move-to-production-dialog.html',
          type: 'dialog',
        })
          .result.then(function () {
            HDSService.moveToProductionMode(trialKmsServer, trialKmsServerMachineUUID, trialAdrServer, trialSecurityService)
              .then(function () {
                vm.model.serviceMode = vm.PRODUCTION;
                // TODO: add remove the CI Group for Trial Users after MVO or finish up e2e test
                Notification.success('hds.resources.settings.succeedMoveToProductionMode');
              }).catch(function (error) {
                Notification.errorWithTrackingId(error, localizedHdsModeError);
              });
          });
      }
    }

    function addResource() {
      $state.go('hds.list');
    }

    function openAddTrialUsersModal() {
      $modal.open({
        controller: 'AddTrialUsersController',
        controllerAs: 'addTrialUsersCtrl',
        templateUrl: 'modules/hds/settings/addtrialusers_modal/add-trial-users.html',
        type: 'small',
      })
        .result.then(function () {
          getTrialUsersInfo();
        });
    }

    function openEditTrialUsersModal() {
      $modal.open({
        controller: 'EditTrialUsersController',
        controllerAs: 'editTrialUsersCtrl',
        templateUrl: 'modules/hds/settings/edittrialusers_modal/edit-trial-users.html',
        type: 'small',
      })
        .result.then(function () {
          getTrialUsersInfo();
        });
    }
    function deactivateTrialMode() {
      if (vm.model.serviceMode === vm.TRIAL) {
        $modal.open({
          templateUrl: 'modules/hds/settings/confirm-deactivate-trialmode-dialog.html',
          type: 'dialog',
        })
          .result.then(function () {
            if (_.size(vm.altHdsServers) > 0) {
              _.forEach(vm.altHdsServers, function (server) {
                if (typeof server.active !== 'undefined') {
                  server['active'] = false;
                }
              });
            }
            var myJSON = {
              'altHdsServers': vm.altHdsServers,
            };
            Orgservice.setOrgAltHdsServersHds(Authinfo.getOrgId(), myJSON)
              .then(function () {
                vm.model.serviceMode = vm.PRE_TRIAL;
              }).catch(function (error) {
                Notification.errorWithTrackingId(error, localizedHdsModeError);
              });
          });
      }
    }
  }
}());
