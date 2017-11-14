import module from './index';
describe('Component: WebexAddSiteModalComponent', function () {

  const TRANSFER_SCREEN = 'webex-site-transfer';
  const SUBSCRIPTION_SCREEN = 'webex-site-subscription';
  const ADD_SITE_SCREEN = 'webex-site-new';
  const licenses = getJSONFixture('core/json/authInfo/complexCustomerCases/customerWithCCASPActiveLicenses.json');
  const confServices = licenses.confLicenses;
  const confServicesSub100448 = _.filter(confServices, { billingServiceId: 'Sub100448' });

  beforeEach(function () {
    this.initModules(module);
    this.injectDependencies('$componentController', '$q', '$rootScope', '$scope', 'Authinfo', 'Config', 'SetupWizardService', 'WebExSiteService');
    this.$scope.fixtures = {
    };

    initSpies.apply(this);

    this.compileComponent('webexAddSiteModal', {
      modalTitle: 'myModal',
    });
  });

  function initSpies() {
    spyOn(this.Authinfo, 'isEnterpriseCustomer').and.returnValue(true);
    spyOn(this.SetupWizardService, 'getNonTrialWebexLicenses').and.returnValue(confServices);
    spyOn(this.SetupWizardService, 'getConferenceLicensesBySubscriptionId').and.returnValue(confServicesSub100448);
    spyOn(this.WebExSiteService, 'constructWebexLicensesPayload').and.returnValue({});
    spyOn(this.WebExSiteService, 'getAudioPackageInfo').and.returnValue({ audioPackage: 'VoIPOnly' });
    spyOn(this.$rootScope, '$broadcast').and.callThrough();
  }

  describe('When first opened', () => {
    it('should go straight to transfer site screen if there is only one subscription', function () {
      const licenses = _.filter(confServices, { billingServiceId: 'Sub100448' });
      this.SetupWizardService.getNonTrialWebexLicenses.and.returnValue(licenses);
      this.compileComponent('webexAddSiteModal');
      expect(this.view.find(TRANSFER_SCREEN).length).toBe(1);
      expect(this.view.find(SUBSCRIPTION_SCREEN).length).toBe(0);
    });

    it('should have the next button enabled', function () {
      expect(this.view.find('button.btn-primary')[0].disabled).toBe(false);
    });

    it('should go to subscription selection screen if there are multiple subscriptions', function () {
      this.compileComponent('webexAddSiteModal');
      expect(this.view.find(SUBSCRIPTION_SCREEN).length).toBe(1);
      expect(this.view.find(TRANSFER_SCREEN).length).toBe(0);
      expect(this.view.find('button.btn-primary').length).toBe(1);
      expect(this.view.find('button.btn-primary')[0].innerText.trim()).toBe('common.next');
    });

    it('should go to a specified screen when singleStep is true and display a save button instead of next', function () {
      this.compileComponent('webexAddSiteModal', {
        singleStep: '2',
      });
      expect(this.view.find(ADD_SITE_SCREEN).length).toBe(1);
      expect(this.view.find(TRANSFER_SCREEN).length).toBe(0);
      expect(this.view.find(SUBSCRIPTION_SCREEN).length).toBe(0);
      expect(this.view.find('button.btn-primary').length).toBe(1);
      expect(this.view.find('button.btn-primary')[0].innerText.trim()).toBe('common.save');
    });

    it('should have audioPackage but not audioPartnerName ccaspSubscriptionId if VoiP', function () {
      expect(this.controller.audioPartnerName).toBeUndefined();
      expect(this.controller.ccaspSubscriptionId).toBeUndefined();
      expect(this.controller.audioPackage).toBe('VoIPOnly');
    });
    it('should have both audioPartnerName and ccaspSubscriptionId if CCASP', function () {
      const ccaspPackage = {
        audioPackage: 'CCASP',
        audioPartnerName: 'partnerName',
        ccaspSubscriptionId: '123',
      };
      this.WebExSiteService.getAudioPackageInfo.and.returnValue(ccaspPackage);
      this.compileComponent('webexAddSiteModal');
      expect(this.controller.audioPartnerName).toBe('partnerName');
      expect(this.controller.audioPackage).toBe('CCASP');
      expect(this.controller.ccaspSubscriptionId).toBe('123');
    });

    it('should not throw if there is no audio licenses in subscription', function () {
      expect(() => {
        this.controller.changeCurrentSubscription('noSubIdLikeThis');
      }).not.toThrow();
    });

    it('should populate the sites with the first subscription on the list', function () {
      const expectedSites_48 = [
        {
          siteUrl: 'cognizanttraining',
          quantity: 0,
          centerType: '',
        },
        {
          siteUrl: 'trizettotraining',
          quantity: 0,
          centerType: '',
        },
      ];
      expect(this.controller.subscriptionList).toEqual([{ id: 'Sub100448', isPending: false }, { id: 'Sub100449', isPending: false }]);
      expect(this.controller.currentSubscriptionId).toBe('Sub100448');
      expect(this.controller.sitesArray).toEqual(expectedSites_48);
    });
    it('should not throw if there are no webex subscriptions', function () {
      this.SetupWizardService.getNonTrialWebexLicenses.and.returnValue([]);
      this.compileComponent('webexAddSiteModal');
      expect(() => {
        this.controller.$onInit();
      }).not.toThrow();
      expect(this.controller.currentSubscriptionId).toBe('');
      expect(this.controller.isCanProceed).toBeFalsy();
      expect(this.controller.totalSteps).toBe(1);
    });
  });

  describe('Callback functions handling', () => {
    it('should, on change subscription callback, change the subscription id and repopulateInfo with new subscription id if ! needsSetup', function () {
      this.controller.currentSubscriptionId = '123';
      this.controller.changeCurrentSubscription('345');
      expect(this.controller.currentSubscriptionId).toBe('345');
      expect(this.SetupWizardService.getConferenceLicensesBySubscriptionId).toHaveBeenCalledWith('345');
    });

    it('should, on change subscription callback, broadcast EventNames.LAUNCH_MEETING_SETUP', function () {
      this.controller.currentSubscriptionId = '123';
      this.controller.changeCurrentSubscription('', true);
      expect(this.controller.currentSubscriptionId).toBe('123');
      expect(this.$rootScope.$broadcast).toHaveBeenCalledWith('core::launchMeetingSetup');
    });

    it('should, on tranfer site callback, add the site to the sites array and enable the next button and go to add sites if last argument is true', function () {
      const sites = [{
        siteUrl: 'abc.dmz.webex.com',
        timezone: '1',
      }];
      this.controller.currentStep = 1;
      const numberOfSites = this.controller.sitesArray.length;
      this.controller.addTransferredSites(sites, '123', true);
      expect(this.controller.sitesArray).toContain(jasmine.objectContaining({ siteUrl: 'abc.dmz.webex.com' }));
      expect(this.controller.sitesArray.length).toBe(numberOfSites + 1);
      expect(this.controller.currentStep).toBe(2);
      expect(this.controller.transferCode).toBe('123');
    });

    it('should, on tranfer site callback NOT add the site to the sites array and NOT go to add sites if last argument is false', function () {
      this.controller.currentStep = 1;
      const numberOfSites = this.controller.sitesArray.length;
      this.controller.addTransferredSites(null, null, false);
      expect(this.controller.sitesArray.length).toBe(numberOfSites);
      expect(this.controller.transferCode).toBeUndefined();
    });
  });

  describe('Saving site data', function () {
    beforeEach(function () {
      this.controller.currentStep = 3;
      this.controller.totalSteps = 3;
    });

    it('should call the payload creation function with \'ADD\' action when in add sites mode', function () {
      this.singleStep = null;
      this.controller.next();
      expect(this.WebExSiteService.constructWebexLicensesPayload).toHaveBeenCalled();
      expect(this.WebExSiteService.constructWebexLicensesPayload.calls.mostRecent().args[2]).toBe('ADD');
    });

    it('should call the payload creation function with \'REDISTRIBUTE\' action when in license redistribution  mode', function () {
      this.controller.singleStep = 3;
      this.controller.next();
      expect(this.WebExSiteService.constructWebexLicensesPayload).toHaveBeenCalled();
      expect(this.WebExSiteService.constructWebexLicensesPayload.calls.mostRecent().args[2]).toBe('REDISTRIBUTE');
    });
  });
});

