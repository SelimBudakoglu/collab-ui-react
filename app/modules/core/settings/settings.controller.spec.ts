///<reference path="../../../../typings/tsd-testing.d.ts"/>
/// <reference path="settings.controller.ts"/>
namespace globalsettings {

  describe('SettingsCtrl', ()=> {

    let controller, $controller, Authinfo, FeatureToggleService, Orgservice, $q, $scope;

    beforeEach(angular.mock.module('Core'));
    beforeEach(angular.mock.module('Huron'));
    beforeEach(angular.mock.module('Sunlight'));

    function dependencies(_$controller_, $rootScope, _Authinfo_, _FeatureToggleService_, _Orgservice_, _$q_) {
      $controller = _$controller_;
      Authinfo = _Authinfo_;
      FeatureToggleService = _FeatureToggleService_;
      $q = _$q_;
      Orgservice = _Orgservice_;
      $scope = $rootScope.$new();
    }

    function initSpies() {
      spyOn(Orgservice, 'getOrg');
      spyOn(FeatureToggleService, 'supports');
      spyOn(FeatureToggleService, 'brandingWordingChangeGetStatus');
      spyOn(Authinfo, 'isPartner');
      spyOn(Authinfo, 'isPartnerUser');
      spyOn(Authinfo, 'isDirectCustomer');
    }

    function initController() {
      controller = $controller('SettingsCtrl', {
        $scope: $scope,
        hasFeatureToggle: true
      });

      $scope.$apply();
    }

    beforeEach(inject(dependencies));
    beforeEach(initSpies);
    beforeEach(setFeatureToggle);
    beforeEach(setBranding);

    describe('for partner admin', () => {

      beforeEach(setAuthinfoIsPartnerSpy(true));
      beforeEach(initController);

      it('should create the ctrl and add the partner setting sections', ()=> {
        expect(controller.security).toBeFalsy();
        expect(controller.domains).toBeFalsy();
        expect(controller.sipDomain).toBeFalsy();
        expect(controller.authentication).toBeFalsy();
        expect(controller.support).toBeTruthy();
        expect(controller.branding).toBeTruthy();
        expect(controller.privacy).toBeFalsy();
        expect(controller.retention).toBeFalsy();
      });
    });

    describe('for direct customer', () => {

      beforeEach(setAuthinfoIsDirectCustomerSpy(true));
      beforeEach(initController);

      it('should create the ctrl and add the direct customer setting sections', () => {
        expect(controller.security).toBeTruthy();
        expect(controller.domains).toBeTruthy();
        expect(controller.sipDomain).toBeTruthy();
        expect(controller.authentication).toBeTruthy();
        expect(controller.support).toBeTruthy();
        expect(controller.branding).toBeTruthy();
        expect(controller.privacy).toBeTruthy();
        expect(controller.retention).toBeTruthy();
      });
    });

    describe('for normal admin', () => {

      beforeEach(setAuthinfoIsPartnerSpy(false));
      beforeEach(setAuthinfoIsPartnerUserSpy(true));

      describe('with allowCustomerLogos set to true', () => {

        beforeEach(setGetOrgSpy(true));
        beforeEach(initController);

        it('should create the ctrl and add the normal setting sections', ()=> {
          expect(controller.security).toBeTruthy();
          expect(controller.domains).toBeTruthy();
          expect(controller.sipDomain).toBeTruthy();
          expect(controller.authentication).toBeTruthy();
          expect(controller.support).toBeTruthy();
          expect(controller.branding).toBeTruthy();
          expect(controller.privacy).toBeTruthy();
          expect(controller.retention).toBeTruthy();
        });
      });

      // direct customer also support branding log
    });

    function setAuthinfoIsPartnerSpy(isPartner) {
      return () => {
        Authinfo.isPartner.and.returnValue(isPartner);
      };
    }

    function setAuthinfoIsPartnerUserSpy(isPartnerUser) {
      return () => {
        Authinfo.isPartnerUser.and.returnValue(isPartnerUser);
      };
    }

    function setAuthinfoIsDirectCustomerSpy(isDirectCustomer) {
      return () => {
        Authinfo.isDirectCustomer.and.returnValue(isDirectCustomer);
      };
    }

    function setGetOrgSpy(allowBranding) {
      return () => {
        Orgservice.getOrg.and.returnValue($q.when({orgSettings: {allowCustomerLogos: allowBranding}}));
      };
    }

    function setFeatureToggle() {
      FeatureToggleService.supports.and.returnValue($q.when(true));
    }

    function setBranding() {
      FeatureToggleService.brandingWordingChangeGetStatus.and.returnValue($q.when(true));
    }
  });
}
