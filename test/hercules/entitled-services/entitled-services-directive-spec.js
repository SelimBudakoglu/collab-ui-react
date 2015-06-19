'use strict';

describe('EntitledServicesDirective', function () {
  beforeEach(module('wx2AdminWebClientApp'));

  var $compile, $rootScope;
  beforeEach(inject(function ($injector, _$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $injector.get('$httpBackend').when('GET', 'l10n/en_US.json').respond({});
    $injector.get('$httpBackend').when('GET', 'https://hercules-integration.wbx2.com/v1/services').respond({});
  }));

  it('replaces the element with the appropriate content', function () {
    var element = $compile("<hercules-entitled-services/>")($rootScope);
    $rootScope.$digest();

    expect(element.html()).toContain("entitled-services");
  });
});
