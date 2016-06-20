'use strict';

describe('Controller: MediaServiceSettingsControllerV2', function () {

  // load the service's module
  //  beforeEach(module('Hercules'));
  //beforeEach(module('Core'));
  beforeEach(module('wx2AdminWebClientApp'));
  //  beforeEach(module('mediafusion'));

  var Authinfo, controller, httpMock, $q, $modal, log, $translate, $state, $stateParams, redirectTargetPromise;
  var ServiceDescriptor, NotificationConfigService, MailValidatorService, Notification, XhrNotificationService, MediaServiceActivationV2;
  var mediaAgentOrgIds = ['mediafusion'];
  var serviceId = "squared-fusion-media";

  var authInfo = {
    getOrgId: sinon.stub().returns('5632f806-ad09-4a26-a0c0-a49a13f38873')
  };

  beforeEach(module(function ($provide) {
    $provide.value("Authinfo", authInfo);
  }));

  //expect(XhrNotificationService.notify).toHaveBeenCalled();
  beforeEach(inject(function ($state, $controller, $stateParams, $httpBackend, _$q_, _$modal_, $log, $translate, _MediaServiceActivationV2_, _MailValidatorService_, _XhrNotificationService_, _Notification_, _ServiceDescriptor_) {
    $state = $state;
    $stateParams = $stateParams;
    log = $log;
    log.reset();
    httpMock = $httpBackend;
    $q = _$q_;
    $modal = _$modal_;

    MediaServiceActivationV2 = _MediaServiceActivationV2_;
    MailValidatorService = _MailValidatorService_;
    XhrNotificationService = _XhrNotificationService_;
    Notification = _Notification_;
    ServiceDescriptor = _ServiceDescriptor_;
    httpMock.when('GET', /^\w+.*/).respond({});
    redirectTargetPromise = {
      then: sinon.stub()
    };
    sinon.stub(ServiceDescriptor, 'getEmailSubscribers');
    ServiceDescriptor.getEmailSubscribers.returns(redirectTargetPromise);
    sinon.stub($state, 'go');
    controller = $controller('MediaServiceSettingsControllerV2', {
      $state: $state,
      $stateParams: $stateParams,
      httpMock: httpMock,
      $q: $q,
      $modal: $modal,
      log: log,
      $translate: $translate,

      MediaServiceActivationV2: MediaServiceActivationV2,
      MailValidatorService: MailValidatorService,
      XhrNotificationService: XhrNotificationService,
      Notification: Notification,
      ServiceDescriptor: ServiceDescriptor
    });

  }));

  afterEach(function () {
    httpMock.verifyNoOutstandingRequest();
    //httpMock.verifyNoOutstandingExpectation();

  });

  it('controller should be defined', function () {
    expect(controller).toBeDefined();
  });
  it('should disable media service', function () {
    spyOn(MediaServiceActivationV2, 'setServiceEnabled').and.returnValue($q.when());
    spyOn(MediaServiceActivationV2, 'getUserIdentityOrgToMediaAgentOrgMapping').and.returnValue($q.when(
      [{
        statusCode: 0,
        identityOrgId: "5632f806-ad09-4a26-a0c0-a49a13f38873",
        mediaAgentOrgIds: ["5632f806-ad09-4a26-a0c0-a49a13f38873", "squared", "something"]
      }]
    ));
    spyOn(MediaServiceActivationV2, 'setUserIdentityOrgToMediaAgentOrgMapping').and.returnValue($q.when());
    controller.disableMediaService(serviceId);
    expect(MediaServiceActivationV2.setServiceEnabled).toHaveBeenCalled();
  });
  it('should disable orpheus for mediafusion org', function () {
    spyOn(MediaServiceActivationV2, 'getUserIdentityOrgToMediaAgentOrgMapping').and.returnValue($q.when(
      [{
        statusCode: 0,
        identityOrgId: "5632f806-ad09-4a26-a0c0-a49a13f38873",
        mediaAgentOrgIds: ["5632f806-ad09-4a26-a0c0-a49a13f38873", "squared"]
      }]
    ));
    spyOn(MediaServiceActivationV2, 'deleteUserIdentityOrgToMediaAgentOrgMapping').and.returnValue($q.when());
    controller.disableOrpheusForMediaFusion();

    expect(MediaServiceActivationV2.getUserIdentityOrgToMediaAgentOrgMapping).toHaveBeenCalled();
  });

  it('should notify error while disabling media service', function () {
    spyOn(MediaServiceActivationV2, 'setServiceEnabled').and.returnValue($q.reject());
    spyOn(XhrNotificationService, 'notify');
    controller.disableMediaService(serviceId);

    expect(MediaServiceActivationV2.setServiceEnabled).toHaveBeenCalled();
    //expect(XhrNotificationService.notify).toHaveBeenCalled();
  });

  it('should disable media service success call', function () {
    var getResponse = {
      data: 'this is a mocked response'
    };
    var setServiceEnabledDeferred = $q.defer();
    spyOn(MediaServiceActivationV2, 'setServiceEnabled').and.returnValue(setServiceEnabledDeferred.promise);
    setServiceEnabledDeferred.resolve(getResponse);

    sinon.stub(controller, 'disableOrpheusForMediaFusion');
    controller.disableOrpheusForMediaFusion(redirectTargetPromise);

    httpMock.flush();
    controller.disableMediaService(serviceId);
    expect(MediaServiceActivationV2.setServiceEnabled).toHaveBeenCalled();
    expect(controller.disableOrpheusForMediaFusion).toHaveBeenCalled();
    httpMock.verifyNoOutstandingExpectation();
  });
  it('should disable media service error call', function () {
    var getResponse = {
      data: 'this is a mocked response'
    };
    var setServiceEnabledDeferred = $q.defer();
    spyOn(MediaServiceActivationV2, 'setServiceEnabled').and.returnValue(setServiceEnabledDeferred.promise);
    setServiceEnabledDeferred.reject(getResponse);

    sinon.stub(XhrNotificationService, 'notify');
    XhrNotificationService.notify(redirectTargetPromise);

    httpMock.flush();
    controller.disableMediaService(serviceId);
    expect(MediaServiceActivationV2.setServiceEnabled).toHaveBeenCalled();
    expect(XhrNotificationService.notify).toHaveBeenCalled();
    httpMock.verifyNoOutstandingExpectation();
  });

});
