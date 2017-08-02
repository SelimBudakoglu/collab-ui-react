var testModule = require('./index').default;

describe('sunlightServices', function () {
  var TEST_ORG_ID = '5150';
  var TEST_TEMPLATE_ID = 'OU812';

  beforeEach(function () {
    this.initModules(testModule);
    this.injectDependencies('$httpBackend', 'ConfigTemplateService', 'VirtualAssistantConfigService', 'ConfigUserService');
    installPromiseMatchers();
  });

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('ConfigTemplateService', function () {
    it('should support update', function () {
      var url = new RegExp('.*/organization/' + TEST_ORG_ID + '/template/' + TEST_TEMPLATE_ID);
      this.$httpBackend.expectPUT(url).respond(200);
      var promise = this.ConfigTemplateService.update({ orgId: TEST_ORG_ID, templateId: TEST_TEMPLATE_ID }).$promise;
      this.$httpBackend.flush();
      expect(promise).toBeResolved();
    });

    it('should support delete', function () {
      var url = new RegExp('.*/organization/' + TEST_ORG_ID + '/template/' + TEST_TEMPLATE_ID);
      this.$httpBackend.expectDELETE(url).respond(204);
      var promise = this.ConfigTemplateService.delete({ orgId: TEST_ORG_ID, templateId: TEST_TEMPLATE_ID }).$promise;
      this.$httpBackend.flush();
      expect(promise).toBeResolved();
    });
  });

  describe('VirtualAssistantConfigService', function () {
    it('should support get', function () {
      var url = new RegExp('.*/organization/' + TEST_ORG_ID + '/botconfig');
      this.$httpBackend.expectGET(url).respond(200);
      var promise = this.VirtualAssistantConfigService.get({ orgId: TEST_ORG_ID }).$promise;
      this.$httpBackend.flush();
      expect(promise).toBeResolved();
    });

    it('should support delete', function () {
      var url = new RegExp('.*/organization/' + TEST_ORG_ID + '/botconfig/1');
      this.$httpBackend.expectDELETE(url).respond(200);
      var promise = this.VirtualAssistantConfigService.delete({ orgId: TEST_ORG_ID, configId: '1' }).$promise;
      this.$httpBackend.flush();
      expect(promise).toBeResolved();
    });
  });

  describe('ConfigUserService', function () {
    it('should support update', function () {
      var url = new RegExp('.*/user' + TEST_ORG_ID);
      this.$httpBackend.expectPUT(url).respond(200);
      var promise = this.ConfigUserService.update({ userId: TEST_ORG_ID }).$promise;
      this.$httpBackend.flush();
      expect(promise).toBeResolved();
    });
  });
});
