'use strict';

describe('Controller: Finish - Activate and Start Billing', function () {
  beforeEach(function () {
    this.initModules('Core');
    this.injectDependencies(
      '$controller',
      '$rootScope',
      '$scope',
      '$q',
      'Authinfo',
      'Notification',
      'SetupWizardService',
      'TrialWebexService'
    );

    this.$scope.wizard = { nextTab: jasmine.createSpy('nextTab') };
    spyOn(this.Authinfo, 'isCustomerLaunchedFromPartner').and.returnValue(false);
    spyOn(this.SetupWizardService, 'hasPendingLicenses').and.returnValue(false);
    spyOn(this.SetupWizardService, 'provisioningCallbacks').and.returnValue({});
    spyOn(this.SetupWizardService, 'addProvisioningCallbacks').and.callThrough();
    spyOn(this.TrialWebexService, 'setProvisioningWebexSendCustomerEmailFlag').and.callThrough();
    spyOn(this.SetupWizardService, 'getActingSubscriptionId').and.returnValue('abc/def/ghi/12345');

    installPromiseMatchers();

    this.initController = function () {
      this.controller = this.$controller('WizardFinishCtrl', {
        $scope: this.$scope,
        $rootScope: this.$rootScope,
        Authinfo: this.Authinfo,
      });
      this.$scope.$apply();
    };
  });

  describe('test pushBlankProvisioningCall function', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingLicenses.and.returnValue(true);
      this.initController();
    });

    it('should call addProvisioningCallbacks adding a provisioning callback to SetupWizardService', function () {
      expect(this.SetupWizardService.addProvisioningCallbacks).toHaveBeenCalled();
    });
  });

  describe('test setSendCustomerEmailFlag function', function () {
    beforeEach(function () {
      this.initController();
    });

    it('should reject and should not call TrialWebexService.setProvisioningWebexSendCustomerEmailFlag', function () {
      var promise = this.$scope.setSendCustomerEmailFlag();
      this.$scope.$apply();
      expect(promise).toBeRejectedWith('A boolean must be passed.');
    });

    it('should call TrialWebexService.setProvisioningWebexSendCustomerEmailFlag', function () {
      this.$scope.setSendCustomerEmailFlag(true);
      expect(this.TrialWebexService.setProvisioningWebexSendCustomerEmailFlag).toHaveBeenCalled();
    });
  });

  describe('test order details data', function () {
    beforeEach(function () {
      this.initController();
    });

    it('should format the subscription id string', function () {
      expect(this.$scope.orderDetails.subscriptionId).toBe('abc/def/ghi');
    });
  });
});