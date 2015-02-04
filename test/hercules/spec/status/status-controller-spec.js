describe('StatusController', function() {
  beforeEach(module('wx2AdminWebClientApp'));

  var $scope, service;

  beforeEach(inject(function(_$controller_){
    $scope = {
      $watch: sinon.stub()
    };
    service = {
      fetch: sinon.stub()
    }
    controller = _$controller_('StatusController', {
      $scope: $scope,
      ConnectorService: service
    });
  }));

  it('defaults some scope vars', function() {
    expect($scope.color).toEqual('gray');
    expect($scope.className).toEqual('fa fa-gear fa-spin');
  });

  it('fetches on load', function() {
    expect(service.fetch.callCount).toEqual(1);
  });

  it('calls fetch with squelchErrors flag set', function() {
    expect(service.fetch.callCount).toEqual(1);
    expect(service.fetch.args[0][1].squelchErrors).toEqual(true);
  });

  it('sets appropriate values when xhr fails', function() {
    service.fetch.callArgWith(0, {}, {});
    expect($scope.color).toEqual('red');
    expect($scope.className).toEqual('fa fa-circle');
  });

  it('sets appropriate values when there are clusters with errors', function() {
    service.fetch.callArgWith(0, null, [{needs_attention: true}, {needs_attention: true}, {needs_attention: false}]);
    expect($scope.color).toEqual('red');
    expect($scope.className).toEqual('fa fa-circle');
    expect($scope.needs_attention).toEqual(2);
  });

  it('sets appropriate values when there are no clusters with errors', function() {
    service.fetch.callArgWith(0, null, [{needs_attention: false}, {needs_attention: false}, {needs_attention: false}]);
    expect($scope.color).toEqual('green');
    expect($scope.className).toEqual('fa fa-circle');
    expect($scope.needs_attention).toEqual(0);
  });

});
