import { ServicesOverviewHybridContextCard } from './hybridContextCard';
import { HybridServicesClusterStatesService } from 'modules/hercules/services/hybrid-services-cluster-states.service';

describe('ServicesOverviewHybridContextCard', () => {

  let HybridServicesClusterStatesService: HybridServicesClusterStatesService, card: ServicesOverviewHybridContextCard;
  let Authinfo;

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Hercules'));
  beforeEach(inject(dependencies));
  beforeEach(() => {
    spyOn(Authinfo, 'isContactCenterContext');
    Authinfo.isContactCenterContext.and.returnValue(false);
  });

  function dependencies(_Authinfo_, _HybridServicesClusterStatesService_) {
    Authinfo = _Authinfo_;
    HybridServicesClusterStatesService = _HybridServicesClusterStatesService_;
  }

  it('should have sane defaults', () => {
    card = new ServicesOverviewHybridContextCard(Authinfo, HybridServicesClusterStatesService);
    expect(Authinfo.isContactCenterContext).toHaveBeenCalled();
    expect(card.active).toBe(false);
    expect(card.display).toBe(false);
    expect(card.loading).toBe(true);
  });

  it('should be displayed if the context feature is authorized', () => {
    Authinfo.isContactCenterContext.and.returnValue(true);
    card = new ServicesOverviewHybridContextCard(Authinfo, HybridServicesClusterStatesService);
    expect(Authinfo.isContactCenterContext).toHaveBeenCalled();
    expect(card.display).toBe(true);
  });

  it('should stay not active if services statuses do not say it is setup', () => {
    Authinfo.isContactCenterContext.and.returnValue(true);
    card = new ServicesOverviewHybridContextCard(Authinfo, HybridServicesClusterStatesService);
    expect(Authinfo.isContactCenterContext).toHaveBeenCalled();
    card.hybridStatusEventHandler([{ serviceId: 'contact-center-context', setup: false, status: 'yolo' }]);
    expect(card.active).toBe(false);
  });

  it('should be active if services statuses say it is setup', () => {
    Authinfo.isContactCenterContext.and.returnValue(true);
    card = new ServicesOverviewHybridContextCard(Authinfo, HybridServicesClusterStatesService);
    expect(Authinfo.isContactCenterContext).toHaveBeenCalled();
    card.hybridStatusEventHandler([{ serviceId: 'contact-center-context', setup: true, status: 'yolo' }]);
    expect(card.active).toBe(true);
  });

  it('should stop loading once hybridStatusEventHandler is called', () => {
    Authinfo.isContactCenterContext.and.returnValue(true);
    card = new ServicesOverviewHybridContextCard(Authinfo, HybridServicesClusterStatesService);
    expect(Authinfo.isContactCenterContext).toHaveBeenCalled();
    expect(card.loading).toBe(true);
    card.hybridStatusEventHandler([]);
    expect(card.loading).toBe(false);
  });
});
