'use strict';

describe('Call Park Group Service', function () {

  var $httpBackend, callParkService, callParkId, getParkListUrl, deleteCPUrl, customerURL;
  var customerId = '123';

  var spiedAuthinfo = {
    getOrgId: jasmine.createSpy('getOrgId').and.returnValue(customerId)
  };
  var cpList = getJSONFixture('huron/json/features/callPark/cpList.json');
  var oneCp = getJSONFixture('huron/json/features/callPark/callParkData.json');
  var user = {
    "name": "Test Name"
  };

  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module(function ($provide) {
    $provide.value("Authinfo", spiedAuthinfo);
  }));

  beforeEach(inject(function (_$httpBackend_, _CallParkService_) {
    $httpBackend = _$httpBackend_;
    callParkService = _CallParkService_;
    callParkId = '456';

    getParkListUrl = new RegExp(".*/customers/" + customerId + "/features/callparks.*");
    deleteCPUrl = new RegExp(".*/customers/" + customerId + "/features/callparks/" + callParkId + ".*");
    customerURL = new RegExp(".*/customers/" + customerId + "/users");
  }));

  afterEach(function () {
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should return a properly formatted object when calling for a member', function () {
    $httpBackend.expectGET(customerURL).respond(200, user);
    callParkService.getCallParkMember(oneCp.members[0]).then(function (member) {
      expect(member.uuid).toEqual(oneCp.members[0].memberUuid);
      expect(member.user.name).toEqual(user.name);
    });
  });

  it('should be able to get list of call parks for a given customerId', function () {
    $httpBackend.expectGET(getParkListUrl).respond(200, cpList);
    callParkService.getListOfCallParks().then(function (list) {
      expect(angular.equals(list, cpList)).toBeTruthy();
    });
  });

  it('should fail to get list of callParks when server gives an error', function () {
    $httpBackend.expectGET(getParkListUrl).respond(500);
    callParkService.getListOfCallParks().then(function () {}, function (error) {
      expect(error.status).toEqual(500);
    });
  });

  it('should be able to delete a given callPark for a given customerId and callParkId', function () {
    $httpBackend.expectDELETE(deleteCPUrl).respond('OK');
    callParkService.deleteCallPark(callParkId).then(function (resp) {
      expect(resp[0]).toEqual('O');
      expect(resp[1]).toEqual('K');
    });
  });

  it('should fail to delete a given callPark when server gives an error', function () {
    $httpBackend.expectDELETE(deleteCPUrl).respond(500);
    callParkService.deleteCallPark(callParkId).then(function () {}, function (error) {
      expect(error.status).toEqual(500);
    });
  });
});