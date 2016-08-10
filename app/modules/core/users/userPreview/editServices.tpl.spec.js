'use strict';

describe('Template: editServices', function () {

  var SAVE_BUTTON = '#btnSaveEnt';
  var userId = 'dbca1001-ab12-cd34-de56-abcdef123454';

  function init() {
    this.initModules('Core', 'Hercules', 'Huron', 'Messenger', 'Sunlight', 'WebExApp');
    this.injectDependencies('$httpBackend', '$q', '$previousState', 'CsvDownloadService', 'FeatureToggleService', 'Orgservice', 'UrlConfig', 'WebExUtilsFact');
    initDependencySpies.apply(this);
    this.compileView('OnboardCtrl', 'modules/core/users/userPreview/editServices.tpl.html');
  }

  function initDependencySpies() {
    this.mock = {};
    this.mock.fusionServices = getJSONFixture('core/json/authInfo/fusionServices.json');
    this.mock.headers = getJSONFixture('core/json/users/headers.json');
    this.mock.getLicensesUsage = getJSONFixture('core/json/organizations/usage.json');

    spyOn(this.CsvDownloadService, 'getCsv').and.callFake(function (type) {
      if (type === 'headers') {
        return this.$q.when(this.mock.headers);
      } else {
        return this.$q.when({});
      }
    }.bind(this));
    spyOn(this.FeatureToggleService, 'supportsDirSync').and.returnValue(this.$q.when(false));
    spyOn(this.FeatureToggleService, 'atlasCareTrialsGetStatus').and.returnValue(this.$q.when(true));
    spyOn(this.FeatureToggleService, 'supports').and.returnValue(this.$q.when(true));
    spyOn(this.Orgservice, 'getHybridServiceAcknowledged').and.returnValue(this.$q.when(this.mock.fusionServices));
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.when(this.mock.getLicensesUsage));
    spyOn(this.Orgservice, 'getUnlicensedUsers');
    spyOn(this.$previousState, 'get').and.returnValue({
      state: {
        name: 'test.state'
      }
    });
    this.$httpBackend.expectGET(this.UrlConfig.getSunlightConfigServiceUrl() + '/user' + '/' + userId).respond(200);
  }

  function initSpies() {
    spyOn(this.$scope, 'editServicesSave');
  }

  beforeEach(init);
  beforeEach(initSpies);

  describe('Save button', function () {
    it('should call editServicesSave() on click', function () {
      this.view.find(SAVE_BUTTON).click();
      this.$httpBackend.flush();
      expect(this.$scope.editServicesSave).toHaveBeenCalled();
    });
  });
});
