'use strict';

describe('Service: OtpService', function () {
  var $httpBackend, $rootScope, OtpService, HuronConfig;

  beforeEach(module('uc.device'));
  beforeEach(module('ui.router'));
  beforeEach(module('Huron'));
  beforeEach(module('ngResource'));

  var authInfo = {
    getOrgId: sinon.stub().returns('1')
  };

  beforeEach(module(function ($provide) {
    $provide.value("Authinfo", authInfo);
  }));

  beforeEach(
    inject(
      function (_$httpBackend_, _$rootScope_, $resource, _OtpService_, _UserOTPService_, _HuronUser_, _HuronConfig_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        OtpService = _OtpService_;
        HuronConfig = _HuronConfig_;
      }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should be registered', function () {
    expect(OtpService).toBeDefined();
  });

  describe('loadOtps function', function () {
    it('should exist', function () {
      expect(OtpService.loadOtps).toBeDefined();
    });

    it('should return 1 OTP', function () {
      $httpBackend.whenGET(HuronConfig.getCmiUrl() + '/common/customers/1/users/1/otp').respond(200, getJSONFixture('huron/json/device/otps.json'));
      OtpService.loadOtps('1').then(function (data) {
        expect(data.length).toEqual(1);
      });
      $httpBackend.flush();
    });

    it('should not return invalid OTPs', function () {
      $httpBackend.whenGET(HuronConfig.getCmiUrl() + '/common/customers/1/users/1/otp').respond(200, getJSONFixture('huron/json/device/invalidOtps.json'));
      OtpService.loadOtps('1').then(function (data) {
        expect(data.length).toEqual(0);
      });
      $httpBackend.flush();
    });
  });

  describe('generateOtp function', function () {
    it('should exist', function () {
      expect(OtpService.generateOtp).toBeDefined();
    });

    it('should generate an OTP', function () {
      $httpBackend.whenPOST(HuronConfig.getCmiUrl() + '/identity/users/otp', {
        'userName': 'someUser'
      }).respond(200, getJSONFixture('huron/json/device/otps/0001000200030004.json'));
      OtpService.generateOtp('someUser').then(function (data) {
        expect(data.code).toEqual('0001000200030004');
        expect(data.friendlyCode).toEqual('0001-0002-0003-0004');
      });
      $httpBackend.flush();
    });
  });

  describe('hyphenateOtp function', function () {
    it('should exist', function () {
      expect(OtpService.hyphenateOtp).toBeDefined();
    });

    it('should return a hyphenated OTP', function () {
      expect(OtpService.hyphenateOtp('0001000200030004')).toEqual('0001-0002-0003-0004');
    });

    it('should return what is passed in if otp is null or undefined', function () {
      var otp;
      expect(OtpService.hyphenateOtp(otp)).toEqual(otp);
    });
  });

  describe('convertExpiryTime function', function () {
    it('should exist', function () {
      expect(OtpService.convertExpiryTime).toBeDefined();
    });

    it('should return the correct time zone conversion (America/Los_Angeles)', function () {
      expect(OtpService.convertExpiryTime('2015-01-23 03:16:43.327', 'America/Los_Angeles')).toEqual('01/23/15 3:16AM');
    });
  });

  describe('getQrCodeUrl function', function () {
    it('should exist', function () {
      expect(OtpService.getQrCodeUrl).toBeDefined();
    });

    it('should return the correct url', function () {
      expect(OtpService.getQrCodeUrl('0001000200030004')).toEqual(HuronConfig.getOcelotUrl() + '/getqrimage?oneTimePassword=0001000200030004');
    });
  });

});
