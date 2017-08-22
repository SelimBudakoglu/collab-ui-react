import subscriptionModule from './index';
import { IProdInst } from 'modules/online/upgrade/upgrade.service';

describe('Controller: MySubscriptionCtrl', function () {
  const onlineIntSubId: string = 'intSubId';
  const trialUrlResponse: string = 'trialUrlResponse';
  const drUrlResponse: string = 'drUrlResponse';
  const ccwTrialSubId: string = 'Trial';
  const productInstanceId: string = 'productInstanceId';
  const productName: string = 'productName';
  const productInstanceResponse: IProdInst[] = [{
    productInstanceId: productInstanceId,
    subscriptionId: onlineIntSubId,
    name: productName,
    autoBilling: false,
  }];
  const mockBmmpAttr = {
    subscriptionId: onlineIntSubId,
    productInstanceId: productInstanceId,
    changeplanOverride: '',
  };

  beforeEach(function () {
    this.initModules(subscriptionModule);
    this.injectDependencies('$controller',
      '$rootScope',
      '$scope',
      '$translate',
      '$window',
      '$q',
      'Authinfo',
      'Config',
      'DigitalRiverService',
      'FeatureToggleService',
      'OnlineUpgradeService',
      'Orgservice',
      'ProPackService',
      'ServiceDescriptorService',
      'SharedMeetingsReportService',
      'WebExUtilsFact');

    this.data = _.cloneDeep(getJSONFixture('core/json/myCompany/subscriptionData.json'));
    this.siteUrl = 'siteUrl';

    spyOn(this.ServiceDescriptorService, 'getServices').and.returnValue(this.$q.resolve(this.data.servicesResponse));
    spyOn(this.FeatureToggleService, 'atlasSharedMeetingsReportsGetStatus').and.returnValue(this.$q.resolve(false));
    spyOn(this.OnlineUpgradeService, 'getProductInstances').and.returnValue(this.$q.resolve(productInstanceResponse));
    spyOn(this.ProPackService, 'hasProPackEnabled').and.returnValue(this.$q.resolve(false));
    spyOn(this.ProPackService, 'hasProPackPurchased').and.returnValue(this.$q.resolve(false));
    spyOn(this.Authinfo, 'getUserId').and.returnValue('12345');
    spyOn(this.DigitalRiverService, 'getDigitalRiverToken');
    spyOn(this.DigitalRiverService, 'getDigitalRiverUpgradeTrialUrl').and.returnValue(this.$q.resolve({ data: trialUrlResponse }));
    spyOn(this.DigitalRiverService, 'getSubscriptionsUrl').and.returnValue(this.$q.resolve(drUrlResponse));
    spyOn(this.$rootScope, '$broadcast').and.callThrough();

    spyOn(this.SharedMeetingsReportService, 'openModal');
    spyOn(this.WebExUtilsFact, 'getSiteAdminUrl').and.returnValue(this.siteUrl);
    spyOn(this.$window, 'open');

    this.startController = (): void => {
      this.controller = this.$controller('MySubscriptionCtrl', {
        $scope: this.$scope,
        $rootScope: this.$rootScope,
        $translate: this.$translate,
        $window: this.$window,
        Orgservice: this.Orgservice,
        ServiceDescriptorService: this.ServiceDescriptorService,
        Authinfo: this.Authinfo,
        WebExUtilsFact: this.WebExUtilsFact,
      });
      this.$scope.$apply();
    };
  });

  it('should initialize with expected data for ccw orgs', function () {
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.subscriptionsResponse));
    this.startController();

    expect(this.controller.hybridServices).toEqual(this.data.servicesFormatted);
    expect(this.controller.licenseCategory).toEqual(this.data.licensesFormatted);
    expect(this.controller.subscriptionDetails).toEqual(this.data.subscriptionsFormatted);
    expect(this.controller.visibleSubscriptions).toBeTruthy();
    expect(this.controller.licenseSummary).toBeUndefined();
    expect(this.$rootScope.$broadcast).toHaveBeenCalled();
  });

  it('should skip initializing subscriptions with messenger license', function () {
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.multiSubsOneWithMessengerLicense));
    // two subscriptions present:
    // - one with messaging license (offerName: 'MS')
    // - one with messenger license (offerName: 'MSGR')
    const responseSubscriptions = this.data.multiSubsOneWithMessengerLicense;
    expect(responseSubscriptions.length).toBe(2);
    expect(_.get(responseSubscriptions, '[0].subscriptionId')).toBe('fake-sub-id-0');
    expect(_.get(responseSubscriptions, '[1].subscriptionId')).toBe('fake-sub-id-1');

    this.startController();

    // the one with (offerName: 'MSGR') is skipped
    const controllerSubDetails = this.controller.subscriptionDetails;
    expect(controllerSubDetails.length).toBe(1);
    expect(_.get(controllerSubDetails, '[0].subscriptionId')).toBe('fake-sub-id-1');
  });

  it('should initialize with expected data for online orgs', function () {
    this.data.subscriptionsResponse[0].internalSubscriptionId = onlineIntSubId;
    this.data.subscriptionsResponse[0].endDate = 'subEndDate';
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.subscriptionsResponse));
    this.data.subscriptionsFormatted[0].isOnline = true;
    this.data.subscriptionsFormatted[0].productInstanceId = productInstanceId;
    this.data.subscriptionsFormatted[0].name = productName;
    this.data.subscriptionsFormatted[0].changeplanOverride = '';
    this.data.subscriptionsFormatted[0].internalSubscriptionId = onlineIntSubId;
    this.data.subscriptionsFormatted[0].quantity = 100;
    this.data.subscriptionsFormatted[0].endDate = 'subscriptions.expired';
    this.data.subscriptionsFormatted[0].badge = 'alert';
    this.data.subscriptionsFormatted[0].bmmpAttr = mockBmmpAttr;
    this.startController();

    expect(this.controller.hybridServices).toEqual(this.data.servicesFormatted);
    expect(this.controller.licenseCategory).toEqual(this.data.licensesFormatted);
    expect(this.controller.subscriptionDetails).toEqual(this.data.subscriptionsFormatted);

    expect(this.controller.visibleSubscriptions).toBeTruthy();
    expect(this.DigitalRiverService.getDigitalRiverToken).toHaveBeenCalled();
    expect(this.controller.licenseSummary).toEqual('subscriptions.licenseSummaryOnline');
    expect(this.$rootScope.$broadcast).toHaveBeenCalled();
  });

  it('should initialize with expected data for ccw trial orgs', function () {
    this.data.subscriptionsTrialResponse[0].internalSubscriptionId = ccwTrialSubId;
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.subscriptionsTrialResponse));
    this.data.trialSubscriptionData[0].name = 'subscriptions.enterpriseTrial';
    this.data.trialSubscriptionData[0].internalSubscriptionId = ccwTrialSubId;
    this.startController();

    expect(this.controller.hybridServices).toEqual(this.data.servicesFormatted);
    expect(this.controller.licenseCategory).toEqual(this.data.trialLicenseData);
    expect(this.controller.subscriptionDetails).toEqual(this.data.trialSubscriptionData);
    expect(this.controller.visibleSubscriptions).toBeTruthy();
    expect(this.controller.licenseSummary).toBeUndefined();
    expect(this.$rootScope.$broadcast).toHaveBeenCalled();
  });

  it('should initialize with expected data for online trial orgs', function () {
    this.data.subscriptionsTrialResponse[0].internalSubscriptionId = onlineIntSubId;
    this.data.subscriptionsTrialResponse[0].endDate = 'subEndDate';
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.subscriptionsTrialResponse));
    this.data.trialSubscriptionData[0].isOnline = true;
    this.data.trialSubscriptionData[0].upgradeTrialUrl = trialUrlResponse;
    this.data.trialSubscriptionData[0].productInstanceId = productInstanceId;
    this.data.trialSubscriptionData[0].name = productName;
    this.data.trialSubscriptionData[0].internalSubscriptionId = onlineIntSubId;
    this.data.trialSubscriptionData[0].quantity = 100;
    this.data.trialSubscriptionData[0].endDate = 'subscriptions.expired';
    this.data.trialSubscriptionData[0].badge = 'alert';
    this.data.trialSubscriptionData[0].bmmpAttr = mockBmmpAttr;

    this.startController();

    expect(this.controller.hybridServices).toEqual(this.data.servicesFormatted);
    expect(this.controller.licenseCategory).toEqual(this.data.trialLicenseData);
    expect(this.controller.subscriptionDetails).toEqual(this.data.trialSubscriptionData);
    expect(this.controller.visibleSubscriptions).toBeTruthy();
    expect(this.$rootScope.$broadcast).toHaveBeenCalled();
    expect(this.controller.licenseSummary).toEqual(this.$translate.instant('subscriptions.licenseSummaryOnline'));
    expect(this.DigitalRiverService.getDigitalRiverToken).toHaveBeenCalled();
  });

  describe('Tests for Shared Meeting Licenses : ', function () {
    it('The isSharedMeetingsLicense should return false for a service that does not have shared Licenses ', function () {
      spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.subscriptionsTrialResponse));
      this.startController();
      expect(this.controller.isSharedMeetingsLicense).toBeFalsy();
    });

    it('The isSharedMeetingsLicense should return true for a service that has shared licenses', function () {
      const subscriptionsTrialResponse = _.cloneDeep(this.data.subscriptionsTrialResponse);
      subscriptionsTrialResponse[0].licenses[0].licenseModel = this.Config.licenseModel.cloudSharedMeeting;
      spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(subscriptionsTrialResponse));
      this.startController();
      expect(this.controller.isSharedMeetingsLicense).toBeTruthy();
    });
  });

  describe('Helper Functions - ', function () {
    beforeEach(function () {
      spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.data.subscriptionsTrialResponse));
      this.startController();
    });

    it('showCategory - should only display a licenseCategory that has offers', function () {
      expect(this.controller.showCategory(this.data.trialLicenseData[0])).toBeTruthy();
      expect(this.controller.showCategory(this.data.licensesFormatted[1])).toBeTruthy();
      expect(this.controller.showCategory(this.data.trialLicenseData[1])).toBeFalsy();
    });

    it('isUsageDefined - should return true only if usage is a number', function () {
      expect(this.controller.isUsageDefined(5)).toBeTruthy();
      expect(this.controller.isUsageDefined(undefined)).toBeFalsy();
    });
  });
});
