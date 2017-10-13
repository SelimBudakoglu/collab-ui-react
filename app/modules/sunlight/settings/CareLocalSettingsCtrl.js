var HttpStatus = require('http-status-codes');
(function () {
  'use strict';

  angular
    .module('Sunlight')
    .controller('CareLocalSettingsCtrl', CareLocalSettingsCtrl);

  /* @ngInject */
  function CareLocalSettingsCtrl($location, $interval, $q, $scope, $translate, Authinfo, HydraService, Log, Notification, SunlightConfigService, ModalService, FeatureToggleService, UrlConfig, URService) {
    var vm = this;

    vm.ONBOARDED = 'onboarded';
    vm.NOT_ONBOARDED = 'notOnboarded';
    vm.IN_PROGRESS = 'inProgress';


    vm.status = {
      UNKNOWN: 'Unknown',
      PENDING: 'Pending',
      SUCCESS: 'Success',
      FAILURE: 'Failure',
    };

    vm.defaultQueueStatus = vm.status.UNKNOWN;
    vm.csOnboardingStatus = vm.status.UNKNOWN;
    vm.aaOnboardingStatus = vm.status.UNKNOWN;
    vm.appOnboardingStatus = vm.status.UNKNOWN;

    vm.defaultQueueId = Authinfo.getOrgId();
    vm.careSetupDoneByOrgAdmin = (Authinfo.getOrgId() === Authinfo.getUserOrgId());

    vm.state = vm.ONBOARDED;
    vm.errorCount = 0;

    vm.RoutingType = {
      PICK: 'pick',
      PUSH: 'push',
    };

    vm.routingTypes = [
      {
        Header: $translate.instant('sunlightDetails.settings.routing.pick.Header'),
        Label: $translate.instant('sunlightDetails.settings.routing.pick.Label'),
        Value: vm.RoutingType.PICK,
      },
      {
        Header: $translate.instant('sunlightDetails.settings.routing.automated.Header'),
        Label: $translate.instant('sunlightDetails.settings.routing.automated.Label'),
        Value: vm.RoutingType.PUSH,
      },
    ];

    vm.featureToggles = {
      showRouterToggle: false,
      chatToVideoFeatureToggle: false,
    };

    var maxChatCount = 5;
    vm.orgChatConfigDataModel = {
      routingType: vm.RoutingType.PICK,
      chatCount: maxChatCount,
      videoInChatToggle: true,
    };

    vm.enableRoutingMechanism = function () {
      return !vm.orgChatConfig.selectedRouting;
    };

    vm.orgChatConfig = {
      selectedRouting: vm.RoutingType.PICK,
      selectedChatCount: maxChatCount,
      selectedVideoInChatToggle: true,
    };

    vm.chatCountOptions = _.range(1, 6);

    $scope.$on('$locationChangeStart', function (event, next) {
      if ($scope.orgConfigForm.$dirty) {
        event.preventDefault();
        var message = 'sunlightDetails.settings.saveModal.BodyMsg2';
        vm.openSaveModal(message).result.then(function () {
          vm.saveOrgChatConfigurations();
          gotoSelectedPage(next);
        }, function () {
          gotoSelectedPage(next);
        });
      }
    });

    function gotoSelectedPage(next) {
      $scope.$$listeners.$locationChangeStart = [];
      var destination = next.substr(next.indexOf('#') + 1, next.length).trim();
      $location.path(destination);
    }

    vm.openModal = function () {
      var message = 'sunlightDetails.settings.saveModal.BodyMsg1';
      vm.openSaveModal(message).result.then(vm.saveOrgChatConfigurations);
    };

    vm.openSaveModal = function (message) {
      return ModalService.open({
        title: $translate.instant('sunlightDetails.settings.saveModal.Header'),
        message: $translate.instant(message),
        close: $translate.instant('common.yes'),
        dismiss: $translate.instant('common.no'),
      });
    };

    function createOrUpdateQueue(orgChatConfig) {
      URService.getQueue(vm.defaultQueueId).then(function () {
        var updateQueueRequest = {
          queueName: 'DEFAULT',
          notificationUrls: orgChatConfig.notificationUrls,
          routingType: orgChatConfig.routingType,
        };
        URService.updateQueue(vm.defaultQueueId, updateQueueRequest).then(function () {
          vm.defaultQueueStatus = vm.status.SUCCESS;
          var rr = onboardingStatusDoneByAdminOrPartner();
          setViewModelState(rr);
        }, function () {
          vm.defaultQueueStatus = vm.status.UNKNOWN;
        });
      }, function (err) {
        if (err.status === 404) {
          var createQueueRequest = {
            queueId: Authinfo.getOrgId(),
            queueName: 'DEFAULT',
            notificationUrls: orgChatConfig.notificationUrls,
            routingType: orgChatConfig.routingType,
          };
          URService.createQueue(createQueueRequest).then(function () {
            vm.defaultQueueStatus = vm.status.SUCCESS;
            var rr = onboardingStatusDoneByAdminOrPartner();
            setViewModelState(rr);
          }, function () {
            vm.defaultQueueStatus = vm.status.UNKNOWN;
          });
        }
      });
    }

    vm.saveOrgChatConfigurations = function () {
      vm.isProcessing = true;
      var orgChatConfig = getOrgChatConfigFromView();
      SunlightConfigService.updateChatConfig(orgChatConfig).then(function (results) {
        Log.debug('Care settings: Org chat configurations updated successfully', results);
        Notification.success($translate.instant('sunlightDetails.settings.setUpCareSuccess'));
        vm.isProcessing = false;
        updateSavedConfiguration();
        createOrUpdateQueue(orgChatConfig);
      }, function (error) {
        vm.isProcessing = false;
        vm.cancelEdit();
        Log.error('Care settings: Org chat configurations update is a failure', error);
        Notification.errorWithTrackingId(error, $translate.instant('firstTimeWizard.careSettingsUpdateFailed'));
      });
    };

    function updateSavedConfiguration() {
      vm.orgChatConfigDataModel.routingType = vm.orgChatConfig.selectedRouting;
      vm.orgChatConfigDataModel.chatCount = vm.orgChatConfig.selectedChatCount;
      vm.orgChatConfigDataModel.videoInChatToggle = vm.orgChatConfig.selectedVideoInChatToggle;
      resetForm();
    }

    vm.cancelEdit = function () {
      vm.orgChatConfig.selectedRouting = vm.orgChatConfigDataModel.routingType;
      vm.orgChatConfig.selectedChatCount = vm.orgChatConfigDataModel.chatCount;
      vm.orgChatConfig.selectedVideoInChatToggle = vm.orgChatConfigDataModel.videoInChatToggle;
      resetForm();
    };

    function resetForm() {
      if ($scope.orgConfigForm) {
        $scope.orgConfigForm.$setPristine();
        $scope.orgConfigForm.$setUntouched();
      }
    }

    function getOrgChatConfigFromView() {
      var orgChatConfig = {};
      orgChatConfig.routingType = vm.orgChatConfig.selectedRouting;
      if (vm.orgChatConfig.selectedRouting === vm.RoutingType.PUSH) {
        orgChatConfig.notificationUrls = [UrlConfig.getSunlightPushNotificationUrl()];
      } else {
        orgChatConfig.notificationUrls = [UrlConfig.getSunlightPickNotificationUrl()];
      }
      orgChatConfig.videoCallEnabled = vm.orgChatConfig.selectedVideoInChatToggle;
      orgChatConfig.maxChatCount = parseInt(vm.orgChatConfig.selectedChatCount, 10);
      return orgChatConfig;
    }

    function populateOrgChatConfigViewModel(result, isCalledOnInit) {
      vm.csOnboardingStatus = _.get(result, 'data.csOnboardingStatus');
      vm.aaOnboardingStatus = _.get(result, 'data.aaOnboardingStatus');
      vm.appOnboardingStatus = _.get(result, 'data.appOnboardStatus');

      if (isCalledOnInit) {
        vm.orgChatConfigDataModel.routingType = _.get(result, 'data.routingType', vm.RoutingType.PICK);
        vm.orgChatConfig.selectedRouting = vm.orgChatConfigDataModel.routingType;

        vm.orgChatConfigDataModel.chatCount = _.get(result, 'data.maxChatCount', maxChatCount);
        vm.orgChatConfig.selectedChatCount = vm.orgChatConfigDataModel.chatCount;

        vm.orgChatConfigDataModel.videoInChatToggle = _.get(result, 'data.videoCallEnabled', true);
        vm.orgChatConfig.selectedVideoInChatToggle = vm.orgChatConfigDataModel.videoInChatToggle;
      }
    }

    function onboardCsAaAppToCare() {
      var promises = {};
      if (vm.csOnboardingStatus !== vm.status.SUCCESS) {
        promises.onBoardCS = SunlightConfigService.onBoardCare();
        promises.onBoardCS.then(function (result) {
          if (result.status === HttpStatus.ACCEPTED) {
            vm.csOnboardingStatus = vm.status.SUCCESS;
          }
        });
      }
      if (Authinfo.isCareVoice() && vm.aaOnboardingStatus !== vm.status.SUCCESS) {
        promises.onBoardAA = SunlightConfigService.aaOnboard();
        promises.onBoardAA.then(function (result) {
          if (result.status === HttpStatus.NO_CONTENT) {
            vm.aaOnboardingStatus = vm.status.SUCCESS;
          }
        });
      }
      if (vm.careSetupDoneByOrgAdmin && vm.appOnboardingStatus !== vm.status.SUCCESS) {
        promises.onBoardBotApp = SunlightConfigService.onboardCareBot();
        promises.onBoardBotApp.then(function (result) {
          if (result.status === HttpStatus.NO_CONTENT) {
            vm.appOnboardingStatus = vm.status.SUCCESS;
          }
        });
      }
      $q.all(promises).then(function (results) {
        Log.debug('Care onboarding is success', results);
        startPolling();
      }, function (error) {
        vm.state = vm.NOT_ONBOARDED;
        Log.error('Care onboarding failed with error', error);
        Notification.errorWithTrackingId(error, $translate.instant('firstTimeWizard.setUpCareFailure'));
      });
    }

    vm.onboardToCare = function () {
      vm.state = vm.IN_PROGRESS;

      if (vm.defaultQueueStatus !== vm.status.SUCCESS) {
        var createQueueRequest = {
          queueId: Authinfo.getOrgId(),
          queueName: 'DEFAULT',
          notificationUrls: [UrlConfig.getSunlightPickNotificationUrl()],
          routingType: 'pick',
        };

        URService.createQueue(createQueueRequest).then(function () {
          vm.defaultQueueStatus = vm.status.SUCCESS;
          onboardCsAaAppToCare();
        })
          .catch(function (error) {
            Log.debug('default queue creation is unsuccessful,' + error);
          });
      } else {
        onboardCsAaAppToCare();
      }
    };

    var poller;
    var pollInterval = 10000;
    var pollRetryCount = 30;
    var pollErrorCount = 3;
    $scope.$on('$destroy', function () {
      $interval.cancel(poller);
      poller = undefined;
    });

    function startPolling() {
      if (!_.isUndefined(poller)) return;

      vm.errorCount = 0;
      poller = $interval(processOnboardStatus, pollInterval, pollRetryCount);
      poller.then(processTimeout);
    }

    function stopPolling() {
      if (!_.isUndefined(poller)) {
        $interval.cancel(poller);
        poller = undefined;
      }
    }

    function setViewModelState(onboardingStatus) {
      switch (onboardingStatus) {
        case vm.status.SUCCESS:
          vm.state = vm.ONBOARDED;
          break;
        case vm.status.PENDING:
          vm.state = vm.IN_PROGRESS;
          startPolling();
          break;
        default:
          vm.state = vm.NOT_ONBOARDED;
      }
    }

    function processOnboardStatus() {
      SunlightConfigService.getChatConfig().then(function (result) {
        populateOrgChatConfigViewModel(result);
        var onboardingStatus = getOnboardingStatus(result);
        switch (onboardingStatus) {
          case vm.status.SUCCESS:
            Notification.success($translate.instant('sunlightDetails.settings.setUpCareSuccess'));
            vm.state = vm.ONBOARDED;
            stopPolling();
            break;
          case vm.status.FAILURE:
            Notification.errorWithTrackingId(result, $translate.instant('sunlightDetails.settings.setUpCareFailure'));
            vm.state = vm.NOT_ONBOARDED;
            stopPolling();
            break;
          default:
            Log.debug('Care setup status is not Success: ', result);
        }
      })
        .catch(function (error) {
          if (error.status !== 404) {
            Log.debug('Fetching Care setup status failed: ', error);
            if (vm.errorCount++ >= pollErrorCount) {
              vm.state = vm.NOT_ONBOARDED;
              Notification.errorWithTrackingId(error, $translate.instant('sunlightDetails.settings.setUpCareFailure'));
              stopPolling();
            }
          }
        });
    }

    function processTimeout(pollerResult) {
      Log.debug('Poll timed out after ' + pollerResult + ' attempts.');
      vm.state = vm.NOT_ONBOARDED;
      Notification.error($translate.instant('sunlightDetails.settings.setUpCareFailure'));
    }

    function getOnboardingStatus(result) {
      var onboardingStatus = vm.status.UNKNOWN;
      vm.csOnboardingStatus = _.get(result, 'data.csOnboardingStatus');
      vm.aaOnboardingStatus = _.get(result, 'data.aaOnboardingStatus');
      onboardingStatus = onboardingStatusDoneByAdminOrPartner();
      return onboardingStatus;
    }

    function onboardingStatusDoneByAdminOrPartner() {
      var onboardingStatus = vm.status.UNKNOWN;
      if (vm.careSetupDoneByOrgAdmin) {
        onboardingStatus = onboardingDoneByAdminStatus();
      } else {
        onboardingStatus = onboardingDoneByPartnerStatus();
      }
      return onboardingStatus;
    }

    function onboardingDoneByAdminStatus() {
      var onboardingDoneByAdminStatus = vm.status.UNKNOWN;
      if (vm.defaultQueueStatus !== vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = vm.defaultQueueStatus;
      } else if (vm.csOnboardingStatus === vm.status.SUCCESS && vm.appOnboardingStatus === vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = onboardingStatusWhenCareVoiceEnabled();
      } else if (vm.csOnboardingStatus !== vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = vm.csOnboardingStatus;
      } else if (vm.appOnboardingStatus !== vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = vm.appOnboardingStatus;
      } else {
        onboardingDoneByAdminStatus = vm.status.UNKNOWN;
      }
      return onboardingDoneByAdminStatus;
    }

    function onboardingDoneByPartnerStatus() {
      var onboardingDoneByPartnerStatus = vm.status.UNKNOWN;
      if (vm.defaultQueueStatus !== vm.status.SUCCESS) {
        onboardingDoneByPartnerStatus = vm.defaultQueueStatus;
      } else if (vm.csOnboardingStatus === vm.status.SUCCESS) {
        onboardingDoneByPartnerStatus = onboardingStatusWhenCareVoiceEnabled();
      } else if (vm.csOnboardingStatus !== vm.status.SUCCESS) {
        onboardingDoneByPartnerStatus = vm.csOnboardingStatus;
      }
      return onboardingDoneByPartnerStatus;
    }

    function onboardingStatusWhenCareVoiceEnabled() {
      var status;
      if (Authinfo.isCareVoice()) {
        status = vm.aaOnboardingStatus;
      } else {
        status = vm.status.SUCCESS;
      }
      return status;
    }

    function setAppOnboardingStatus(status) {
      vm.appOnboardingStatus = status;
    }

    function getOnboardStatusAndUpdateConfigIfRequired(result) {
      var onboardingStatus = getOnboardingStatus(result);
      setViewModelState(onboardingStatus);
      if (result.data.orgName === '' || !(_.get(result, 'data.orgName'))) {
        result.data.orgName = Authinfo.getOrgName();
        SunlightConfigService.updateChatConfig(result.data).then(function (result) {
          Log.debug('Successfully updated org config with org name', result);
        });
      }
    }

    function enableSetupButtonForAppOnboarding(orgConfigResponse) {
      var onboardingStatus = getOnboardingStatus(orgConfigResponse);
      setViewModelState(onboardingStatus);
      var requestPayload = _.cloneDeep(orgConfigResponse);
      requestPayload.data.appOnboardStatus = vm.status.UNKNOWN;
      SunlightConfigService.updateChatConfig(requestPayload.data).then(function (response) {
        Log.debug('Successfully updated org config with appOnboardStatus as Unknown', response);
      });
    }

    function getCsAaAppOnboardingStatus(result) {
      if (result.data && result.data.appOnboardStatus === vm.status.SUCCESS && vm.careSetupDoneByOrgAdmin) {
        HydraService.getHydraApplicationDetails(result.data.hydraAppId).then(function () {
          setAppOnboardingStatus(vm.status.SUCCESS);
          getOnboardStatusAndUpdateConfigIfRequired(result);
        })
          .catch(function (error) {
            if (error.status === 403) {
              setAppOnboardingStatus(vm.status.UNKNOWN);
              enableSetupButtonForAppOnboarding(result);
            }
          });
      } else {
        getOnboardStatusAndUpdateConfigIfRequired(result);
      }
    }

    function getOnboardingStatusFromOrgChatConfig() {
      SunlightConfigService.getChatConfig().then(function (result) {
        populateOrgChatConfigViewModel(result, true);
        getCsAaAppOnboardingStatus(result);
      }, function (error) {
        if (error.status === 404) {
          vm.state = vm.NOT_ONBOARDED;
        } else {
          Log.debug('Fetching Care setup status, on load, failed: ', error);
        }
      });
    }

    function init() {
      FeatureToggleService.atlasCareAutomatedRouteTrialsGetStatus().then(function (result) {
        vm.featureToggles.showRouterToggle = result;
      });

      FeatureToggleService.atlasCareChatToVideoTrialsGetStatus().then(function (result) {
        vm.featureToggles.chatToVideoFeatureToggle = result && Authinfo.isCare();
      });
      URService.getQueue(vm.defaultQueueId).then(function () {
        vm.defaultQueueStatus = vm.status.SUCCESS;
        getOnboardingStatusFromOrgChatConfig();
      }, function (error) {
        getOnboardingStatusFromOrgChatConfig();
        if (error.status === 404) {
          vm.state = vm.NOT_ONBOARDED;
        } else {
          Log.debug('Fetching default Queue status status, on load, failed: ', error);
        }
      });
    }
    init();
  }
})();
