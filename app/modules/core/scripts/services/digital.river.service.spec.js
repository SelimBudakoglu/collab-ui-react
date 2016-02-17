(function () {
  'use strict';

  describe('Service: DigitalRiver', function () {
    var DigitalRiverService, httpBackend, Config;

    beforeEach(module('Core'));

    beforeEach(
      inject(function (_DigitalRiverService_, _$httpBackend_, _Config_) {
        DigitalRiverService = _DigitalRiverService_;
        httpBackend = _$httpBackend_;
        Config = _Config_;
      })
    );

    describe('getDrReferrer', function () {
      it('should return correct value', function () {
        expect(DigitalRiverService.getDrReferrer()).toEqual('digitalriver-ZGlnaXRhbHJpdmVy');
      });
    });

    describe('http methods', function () {
      it('getUserFromEmail', function () {
        httpBackend.expectPOST('https://idbroker.webex.com/idb/oauth2/v1/access_token').respond('');
        httpBackend.expectGET(Config.getAdminServiceUrl() + 'ordertranslator/digitalriver/user/foo@bar.com/exists').respond(200);
        DigitalRiverService.getUserFromEmail('foo@bar.com');
        httpBackend.flush();
      });
      it('addDrUser', function () {
        httpBackend.expectPOST('https://idbroker.webex.com/idb/oauth2/v1/access_token').respond('');
        httpBackend.expectPOST(Config.getAdminServiceUrl() + 'ordertranslator/digitalriver/user', 'emailPassword').respond(201);
        DigitalRiverService.addDrUser('emailPassword');
        httpBackend.flush();
      });
      it('activateUser', function () {
        var uuid = '0b17b44a-4fea-48d4-9660-3da55df5d782';
        httpBackend.expectPOST('https://idbroker.webex.com/idb/oauth2/v1/access_token').respond('');
        httpBackend.expectPATCH(Config.getAdminServiceUrl() + 'ordertranslator/online/accountstatus/' + uuid + '?accountStatus=active').respond(200);
        DigitalRiverService.activateUser(uuid);
        httpBackend.flush();
      });
    });

  });
})();
