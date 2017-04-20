import testModule from '../index';

describe('Component: gmImportTd', () => {
  beforeEach(function () {
    this.initModules(testModule);
    this.injectDependencies('$q', '$scope', 'gemService', 'Notification', 'TelephonyDomainService');

    initSpies.apply(this);
  });

  beforeAll(function () {
    this.currentTelephonyDomain = {
      ccaDomainId: '',
      action: 'newAdd',
      customerId: 'ff808081527ccb3f0153116a3531041e',
      region: { regionId: 'EMEA', regionName: 'EMEA' },
    };

    this.regions = [
      { domainName: 'testD', ccaDomainId: 'ff808081527ccb3f0153116a3531152d' },
      { domainName: 'testC', ccaDomainId: 'ff808081527ccb3f0153116a3640263c' },
      { domainName: 'testB', ccaDomainId: 'ff808081527ccb3f0153116a3752374b' },
    ];

    this.numbers = [
      { dnisId: '8a607bdb5b21f550015b2353f4850026', countryId: 1, tollType: 'CCA Toll', phone: '111111111', label: 'a', dnisNumber: '11111111', dnisNumberFormat: '11111111', phoneType: 'International', defaultDialInLanguage: '', firstAltChoice: '', secondAltChoice: '', compareToSuperadminPhoneNumberStatus: '0', superAdminCallInNumberDto: null, spCustomerId: 'ff808081527ccb3f0153116a3531041e', defaultNumber: '0', globalListDisplay: '1', ccaDomainId: '8a607bdb5b1280d3015b1353f92800cd', isHidden: 'true' },
      { dnisId: '8a607bdb5b21f550015b2353f492002a', countryId: 2, tollType: 'CCA Toll', phone: '55555555', label: 'a', dnisNumber: '1111111', dnisNumberFormat: '1111111', phoneType: 'Domestic', defaultDialInLanguage: '', firstAltChoice: '', secondAltChoice: '', compareToSuperadminPhoneNumberStatus: '0', superAdminCallInNumberDto: null, spCustomerId: 'ff808081527ccb3f0153116a3531041e', defaultNumber: '0', globalListDisplay: '1', ccaDomainId: '8a607bdb5b1280d3015b1353f92800cd', isHidden: 'false' },
    ];

    this.countries = [ { countryId: 1, countryName: 'Albania' }, { countryId: 2, countryName: 'Algeria' } ];

    this.box = '.dropdown-menu ul li a';
    this.button = '[name="importButton"]';
    this.select = '.csSelect-container[name="customerName"]';
    this.selectGrid = '.ui-grid-selection-row-header-buttons';
  });

  function initSpies() {
    spyOn(this.Notification, 'errorResponse');
    this.$scope.close = jasmine.createSpy('close');
    this.$scope.dismiss = jasmine.createSpy('dismiss');
    spyOn(this.gemService, 'getCountries').and.returnValue(this.$q.resolve());
    spyOn(this.gemService, 'getStorage').and.returnValue(this.currentTelephonyDomain);
    spyOn(this.TelephonyDomainService, 'getNumbers').and.returnValue(this.$q.resolve());
    spyOn(this.TelephonyDomainService, 'getRegionDomains').and.returnValue(this.$q.resolve());
  }

  function initComponent() {
    const bindings = { dismiss: 'dismiss()', close: 'close()' };
    this.compileComponent('gmImportTd', bindings);
    this.$scope.$apply();
  }

  function setParameter(key, value) {
    let preData = {
      links: [],
      content: {
        health: { code: 200, status: 'OK' },
        data: { body: [], returnCode: 0, trackId: '' },
      },
    };
    _.set(preData, key, value);
    return preData;
  }

  describe('$onInit', () => {
    it('should call Notification.errorResponse when the http status is 404', function () {
      this.TelephonyDomainService.getRegionDomains.and.returnValue(this.$q.reject({ status: 404 }));

      initComponent.apply(this);
      expect(this.Notification.errorResponse).toHaveBeenCalled();
    });

    it('should return correct data when call TelephonyDomainService.getRegionDomains', function () {
      let data = setParameter.call(this, 'content.data.body', this.regions);
      this.TelephonyDomainService.getRegionDomains.and.returnValue(this.$q.resolve(data));

      initComponent.apply(this);
      expect(this.controller.options.length).toBe(3);
    });
  });

  describe('View: ', () => {
    it('should show grid data when selected one option and click select all checkbox then the Import button should be availabe', function () {
      let domains, countries, numbers;
      countries = setParameter.call(this, 'content.data', this.countries);
      numbers = setParameter.call(this, 'content.data.body', this.numbers);
      domains = setParameter.call(this, 'content.data.body', this.regions);

      this.gemService.getCountries.and.returnValue(this.$q.resolve(countries));
      this.TelephonyDomainService.getNumbers.and.returnValue(this.$q.resolve(numbers));
      this.TelephonyDomainService.getRegionDomains.and.returnValue(this.$q.resolve(domains));
      initComponent.call(this);

      expect(this.view.find(this.button)).toBeDisabled();

      this.view.find(this.select).find(this.box).get(0).click();
      this.view.find(this.selectGrid).get(0).click();
      this.view.find(this.selectGrid).get(1).click();
      this.view.find(this.button).click();

      expect(this.view.find(this.button)).not.toBeDisabled();
      expect(this.controller.selectedGridLinesLength).toBe(1);
      expect(this.controller.selected.value).toBe('ff808081527ccb3f0153116a3531152d');
    });
  });
});