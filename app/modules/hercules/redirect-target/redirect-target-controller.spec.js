'use strict';

fdescribe('RedirectTargetController', function () {
  beforeEach(module('wx2AdminWebClientApp'));
  var controller, redirectTargetServiceMock, modalInstanceMock, redirectTargetPromise, windowMock;

  beforeEach(inject(function ($controller) {
    redirectTargetPromise = {
      then: sinon.stub()
    };

    redirectTargetServiceMock = {
      addRedirectTarget: sinon.stub().returns(redirectTargetPromise)
    };
    modalInstanceMock = {
      close: sinon.stub()
    };
    windowMock = {
      open: sinon.stub()
    };

    controller = $controller('RedirectTargetController', {
      RedirectTargetService: redirectTargetServiceMock,
      $modalInstance: modalInstanceMock,
      $window: windowMock
    });
  }));

  it('should call the redirect service with hostname', function () {
    controller.addRedirectTargetClicked("hostname");
    expect(redirectTargetServiceMock.addRedirectTarget.callCount).toBe(1);
  });

  it('should close the popup after having done the redirect', function () {
    controller.redirectToTargetAndCloseWindowClicked("hostname");
    expect(modalInstanceMock.close.callCount).toBe(1);
  });

  it('should open a new window with hostname address', function () {
    controller.redirectToTargetAndCloseWindowClicked("hostname");
    expect(windowMock.open.callCount).toBe(1);
    expect(windowMock.open.getCall(0).args[0]).toBe("https://hostname?action=register");
  });
});
