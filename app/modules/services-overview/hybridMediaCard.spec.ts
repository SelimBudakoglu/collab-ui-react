import { ServicesOverviewHybridMediaCard } from './hybridMediaCard';

describe('ServicesOverviewHybridMediaCard', () => {

  let Authinfo, Config;
  let card: ServicesOverviewHybridMediaCard;

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Hercules'));
  beforeEach(inject(dependencies));
  beforeEach(initSpies);

  function dependencies(_Authinfo_, _Config_, _HybridServicesClusterStatesService_) {
    Authinfo = _Authinfo_;
    Config = _Config_;
  }

  function initSpies() {
    spyOn(Authinfo, 'isFusionMedia').and.returnValue(false);
    spyOn(Authinfo, 'getRoles').and.returnValue([]);
  }

  it('should have sane defaults', () => {
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    expect(card.active).toBe(false);
    expect(card.display).toBe(false);
    expect(card.loading).toBe(true);
  });

  it('should stay hidden if the user is missing the entitlement', () => {
    Authinfo.isFusionMedia.and.returnValue(true);
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    expect(card.display).toBe(false);
  });

  it('should stay hidden if the user is missing one of the acceptable role', () => {
    Authinfo.getRoles.and.returnValue([Config.roles.full_admin]);
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    expect(card.display).toBe(false);
  });

  it('should be displayed if we have roles + entitlement', () => {
    Authinfo.isFusionMedia.and.returnValue(true);
    Authinfo.getRoles.and.returnValue([Config.roles.full_admin]);
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    expect(card.display).toBe(true);
  });

  it('should stay not active if services statuses do not say it is setup', () => {
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    card.hybridStatusEventHandler([{ serviceId: 'squared-fusion-media', setup: false, status: 'outage', cssClass: 'danger' }]);
    expect(card.active).toBe(false);
  });

  it('should be active if services statuses say it is setup', () => {
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    card.hybridStatusEventHandler([{ serviceId: 'squared-fusion-media', setup: true, status: 'operational', cssClass: 'success' }]);
    expect(card.active).toBe(true);
  });

  it('should stop loading once it received the hybrid statuses event', () => {
    card = new ServicesOverviewHybridMediaCard(Authinfo, Config);
    card.hybridStatusEventHandler([]);
    expect(card.loading).toBe(false);
  });
});
