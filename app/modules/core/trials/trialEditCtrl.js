(function () {
  'use strict';

  angular.module('Core')
    .controller('TrialEditCtrl', TrialEditCtrl);

  /* @ngInject */
  function TrialEditCtrl($q, $state, $scope, $stateParams, $translate, Authinfo, TrialService, Notification, Config, HuronCustomer, ValidationService, FeatureToggleService) {
    var vm = this;

    vm.currentTrial = angular.copy($stateParams.currentTrial);
    vm.showPartnerEdit = $stateParams.showPartnerEdit;

    vm.editTerms = true;
    vm.disableSquaredUCCheckBox = false;
    $scope.offers = {};
    vm.showWebex = false;
    vm.showRoomSystems = false;
    vm.model = {
      roomSystems: 0,
    };

    FeatureToggleService.supports(FeatureToggleService.features.atlasCloudberryTrials).then(function (result) {
      vm.showRoomSystems = result;
    });

    FeatureToggleService.supports(FeatureToggleService.features.atlasWebexTrials).then(function (result) {
      vm.showWebex = result;
      if (result) {
        vm.individualServices.splice(2, 0, webexField);
      }
    });

    var webexField = {
      key: 'WEBEXTRIALS',
      type: 'checkbox',
      model: $scope.offers,
      templateOptions: {
        label: $translate.instant('trials.meet'),
        id: 'webexTrialCB',
        class: 'small-offset-1 columns',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return vm.isSquaredUCEnabled() || vm.isRoomSystemsTrialsEnabled();
        },
      },
    };

    vm.roomSystemOptions = [5, 10, 15, 20, 25];
    vm.individualServices = [{
      key: 'licenseCount',
      type: 'input',
      defaultValue: vm.currentTrial.licenses,
      templateOptions: {
        label: $translate.instant('siteList.licenseCount'),
        labelClass: 'small-4 columns',
        inputClass: 'small-4 columns left',
        type: 'number',
        required: true,
      },
      validators: {
        count: {
          expression: function ($viewValue, $modelValue) {
            return ValidationService.trialLicenseCount($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialLicenseCount');
          },
        },
      },
    }, {
      key: 'COLLAB',
      type: 'checkbox',
      model: $scope.offers,
      defaultValue: _.get(vm, 'currentTrial.communications.status') === 'ACTIVE',
      templateOptions: {
        label: $translate.instant('trials.collab'),
        id: 'squaredTrial',
        class: 'small-offset-1 columns'
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return vm.isSquaredUCEnabled() || vm.isRoomSystemsTrialsEnabled() || _.get(vm, 'currentTrial.communications.status') === 'ACTIVE';
        },
        'templateOptions.label': function () {
          return FeatureToggleService.supports(FeatureToggleService.features.atlasStormBranding).then(function (result) {
            return result ? $translate.instant('partnerHomePage.message') : $translate.instant('trials.collab');
          });
        },
      },
    }, {
      key: 'SQUAREDUC',
      type: 'checkbox',
      model: $scope.offers,
      templateOptions: {
        label: $translate.instant('trials.squaredUC'),
        id: 'squaredUCTrial',
        class: 'small-offset-1 columns'
      },
      expressionProperties: {
        'hide': function () {
          return !vm.isSquaredUC();
        },
        'templateOptions.label': function () {
          return FeatureToggleService.supports(FeatureToggleService.features.atlasStormBranding).then(function (result) {
            return result ? $translate.instant('partnerHomePage.call') : $translate.instant('trials.squaredUC');
          });
        },
      },
    }];

    vm.trialTermsFields = [{
      key: 'licenseDuration',
      type: 'select',
      defaultValue: 30,
      templateOptions: {
        labelfield: 'label',
        required: true,
        label: $translate.instant('partnerHomePage.duration'),
        secondaryLabel: $translate.instant('partnerHomePage.durationHelp'),
        labelClass: 'small-4 columns',
        inputClass: 'small-4 columns left',
        options: [30, 60, 90],
      },
    }];

    vm.isSquaredUC = Authinfo.isSquaredUC;
    vm.getDaysLeft = getDaysLeft;
    vm.editTrial = editTrial;
    vm.squaredUCOfferID = Config.trials.squaredUC;
    vm.isSquaredUCEnabled = isSquaredUCEnabled;
    vm.isRoomSystemsTrialsEnabled = isRoomSystemsTrialsEnabled;
    vm.gotoAddNumber = gotoAddNumber;
    vm.clickUpdateButton = clickUpdateButton;

    $scope.$watchCollection('offers', function (newOffers) {
      if (newOffers[Config.trials.cloudberry] || newOffers[Config.trials.squaredUC]) {
        $scope.offers[Config.trials.collab] = true;
        if (vm.showWebex) {
          $scope.offers[Config.trials.webex] = true;
        }
      }
    });

    initializeOffers();

    /////////////////

    function initializeOffers() {
      if (vm.currentTrial && vm.currentTrial.offers) {
        for (var i in vm.currentTrial.offers) {
          var offer = vm.currentTrial.offers[i];
          if (offer && offer.id) {
            $scope.offers[offer.id] = true;
            if (offer.id === vm.squaredUCOfferID) {
              vm.disableSquaredUCCheckBox = true;
            }
          }
        }
      }
    }

    function isSquaredUCEnabled() {
      return $scope.offers[Config.trials.squaredUC] || false;
    }

    function isRoomSystemsTrialsEnabled() {
      return $scope.offers[Config.trials.cloudberry] || false;
    }

    vm.roomSystemsChecked = function () {
      vm.model.roomSystems = vm.model.roomSystemsEnabled ? vm.roomSystemOptions[0] : 0;
      $scope.offers[Config.trials.cloudberry] = vm.model.roomSystemsEnabled;
    };

    function clickUpdateButton() {
      if (isSquaredUCEnabled() && !vm.disableSquaredUCCheckBox) {
        FeatureToggleService.supportsPstnSetup().then(function (isSupported) {
          if (isSupported) {
            editTrial();
          } else {
            gotoAddNumber();
          }
        });
      } else {
        editTrial();
      }
    }

    function gotoAddNumber() {
      $state.go('trialEdit.addNumbers', {
        fromEditTrial: true,
        currentOrg: vm.currentTrial
      });
    }

    function getDaysLeft(daysLeft) {
      if (daysLeft < 0) {
        return $translate.instant('customerPage.expired');
      } else if (daysLeft === 0) {
        return $translate.instant('customerPage.expiresToday');
      } else {
        return daysLeft;
      }
    }

    function editTrial(keepModal) {
      vm.saveUpdateButtonLoad = true;

      var offersList = [];
      for (var i in $scope.offers) {
        if ($scope.offers[i]) {
          offersList.push(i);
        }
      }

      return TrialService.editTrial(vm.currentTrial.trialId, vm.currentTrial.duration, vm.currentTrial.licenses, vm.currentTrial.usage, vm.model.roomSystems, vm.currentTrial.customerOrgId, offersList)
        .catch(function (response) {
          vm.saveUpdateButtonLoad = false;
          Notification.notify([response.data.message], 'error');
          return $q.reject();
        })
        .then(function (response) {
          vm.customerOrgId = response.data.customerOrgId;
          if ((offersList.indexOf(Config.trials.squaredUC) !== -1) && !vm.disableSquaredUCCheckBox) {
            return HuronCustomer.create(response.data.customerOrgId, response.data.customerName, response.data.customerEmail)
              .catch(function () {
                vm.saveUpdateButtonLoad = false;
                Notification.errorResponse(response, 'trialModal.squareducError');
                return $q.reject();
              });
          }
        })
        .then(function () {
          vm.saveUpdateButtonLoad = false;
          angular.extend($stateParams.currentTrial, vm.currentTrial);
          var successMessage = [$translate.instant('trialModal.editSuccess', {
            customerName: vm.currentTrial.customerName,
            licenseCount: vm.currentTrial.licenses,
            licenseDuration: vm.currentTrial.duration
          })];
          Notification.notify(successMessage, 'success');
          if (!keepModal) {
            $state.modal.close();
          }
        });
    }
  }
})();
