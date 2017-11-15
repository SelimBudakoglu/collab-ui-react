import module from './index';
describe('Component: WebexSiteTransferComponent', function () {
  const transferCodeResponse = {
    siteList: [{
      siteUrl: 'abc.dmz.webex.com',
      timezone: '1',
    }],
  };

  beforeEach(function () {
    this.initModules(module);
    this.injectDependencies('$componentController', '$q', '$rootScope', '$scope', 'SetupWizardService');
    this.$scope.fixtures = {
    };

    initSpies.apply(this);

    this.compileComponent('webexSiteTransfer', {
      currentSubscription: 'sub123',
      onValidationStatusChange: 'onValidationChangedFn(isValid)',
      onSitesReceived: 'onSitesReceivedFn(sites, transferCode, isValid)',
    });
  });


  function initSpies() {
    this.$scope.onValidationChangedFn = jasmine.createSpy('onValidationChangedFn');
    this.$scope.onSitesReceivedFn = jasmine.createSpy('onSitesReceivedFn');
    spyOn(this.SetupWizardService, 'validateTransferCodeBySubscriptionId').and.returnValue(this.$q.resolve({ data: transferCodeResponse } ));
  }

  describe('When first opened', () => {
    it('shoud have unchecked transfer code input and other hidden', function () {
      expect(this.view.find('input#has-transfer-code')[0].checked).toBeFalsy();
      expect(this.view.find('input').length).toBe(1);
    });

    it('should display transfer code inputs when transfer code checkbox checked', function () {
      $(this.view.find('input#has-transfer-code')).click().trigger('change');
      this.$scope.$digest();
      expect(this.view.find('input').length).toBe(3);
    });
  });

  describe('data validation', () => {
    beforeEach(function () {
      $(this.view.find('input#has-transfer-code')).click().trigger('change');
      this.$scope.$digest();
    });

    it('should send the validation callback with FALSE if either transferSiteUrl or transferSiteCode is not empty and TRUE if both are filled in or empty', function () {
      this.controller.transferSiteCode = '123';
      this.controller.siteTransferUrl = '';
      this.controller.checkValidTransferData();
      expect(this.$scope.onValidationChangedFn).toHaveBeenCalledWith(false);
      this.controller.transferSiteCode = '';
      this.controller.checkValidTransferData();
      expect(this.$scope.onValidationChangedFn).toHaveBeenCalledWith(true);
      this.controller.siteTransferUrl = 'www';
      this.controller.transferSiteCode = '123';
      this.controller.checkValidTransferData();
      expect(this.$scope.onValidationChangedFn).toHaveBeenCalledWith(true);
    });
  });

  describe('when validation function is called', () => {
    beforeEach(function () {
      this.controller.showTransferCodeInput = true;
      this.controller.transferSiteUrl = 'mywebexsite.webex.com';
      this.controller.transferSiteCode = '12345678';
      this.controller.currentSubscription = 'sub123';
      this.$scope.$apply();
      this.controller.sitesArray = [];
    });

    it('should pass the returned sites in the callback function when the code is valid', function () {
      this.controller.processNext();
      this.$scope.$digest();
      expect(this.SetupWizardService.validateTransferCodeBySubscriptionId).toHaveBeenCalledWith('mywebexsite.webex.com',
        '12345678', 'sub123');
      expect(this.controller.sitesArray.length).toBe(1);
      expect(this.controller.sitesArray[0].setupType).toBe('TRANSFER');
      expect(this.$scope.onSitesReceivedFn).toHaveBeenCalledWith(this.controller.sitesArray, this.controller.transferSiteCode, true);
    });

    it('should call the callback function with no sites and the last argument false when code is invalid', function () {
      this.SetupWizardService.validateTransferCodeBySubscriptionId.and.returnValue(this.$q.resolve({ data: { status: 'INVALID' } }));
      this.controller.processNext();
      this.$scope.$digest();
      expect(this.SetupWizardService.validateTransferCodeBySubscriptionId).toHaveBeenCalledWith('mywebexsite.webex.com',
        '12345678', 'sub123');
      expect(this.controller.sitesArray.length).toBe(0);
      expect(this.$scope.onSitesReceivedFn).toHaveBeenCalledWith(null, null, false);
    });
  });
});

