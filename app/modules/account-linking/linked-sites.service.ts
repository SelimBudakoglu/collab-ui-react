import { IACSiteInfo, IACLinkingStatus, IACWebexSiteinfoResponse, LinkingMode } from './account-linking.interface';

export class LinkedSitesService {

  private useMockSites: boolean = false;

  /* @ngInject */
  constructor(private $log: ng.ILogService,
              private Authinfo: any,
              private Userservice,
              private LinkedSitesWebExService,
              private LinkedSitesMockService,
              private FeatureToggleService) {
  }

  public init(): void {
  }

  public linkedSitesNotConfigured(): ng.IPromise<boolean> {
    return this.FeatureToggleService.supports(this.FeatureToggleService.features.atlasAccountLinkingPhase2)
      .then( (supports) => {
        if (supports === true) {
          const linkedSites = this.Authinfo.getConferenceServicesWithLinkedSiteUrl();
          return (!!linkedSites && linkedSites.length > 0);
        }
      }).catch( (error) => {
        this.$log.debug('Problems fetching feature toggle: ', error);
        return false;
      });
  }

  public filterSites(): ng.IPromise<IACSiteInfo[]> {
    const userId = this.Authinfo.getUserId();
    //TODO: Explore unhappy cases. Currently only handling happy cases !
    return this.Userservice.getUserAsPromise(userId).then((response) => {
      this.$log.debug('getUserAsPromise resolved', response);
      const adminTrainSiteNames =  response.data.adminTrainSiteNames;
      const conferenceServicesWithLinkedSiteUrl = this.Authinfo.getConferenceServicesWithLinkedSiteUrl();
      const sites: IACSiteInfo[] = _.map(conferenceServicesWithLinkedSiteUrl, (serviceFeature: any) => {
        return <IACSiteInfo>{
          linkedSiteUrl: serviceFeature.license.linkedSiteUrl,
          isSiteAdmin: _.includes(adminTrainSiteNames, serviceFeature.license.linkedSiteUrl),
          webexInfo: {
            siteInfoPromise: this.getSiteInfo(serviceFeature.license.linkedSiteUrl),
            ciAccountSyncPromise: this.getCiAccountSync(serviceFeature.license.linkedSiteUrl),
            domainsPromise: this.getDomains(serviceFeature.license.linkedSiteUrl),
          },
        };
      });
      this.$log.debug('return realSites', sites);
      if (this.useMockSites) {
        return sites.concat(this.LinkedSitesMockService.getMockSites());
      } else {
        return sites;
      }
    });
  }

  public setCiSiteLinking(linkedSiteUrl: string, mode: string, domains?: string[]) {
    return this.LinkedSitesWebExService.setCiSiteLinking(linkedSiteUrl, mode, domains);
  }

  public setLinkAllUsers(linkedSiteUrl: string, linkAllUsers: boolean) {
    return this.LinkedSitesWebExService.setLinkAllUsers(linkedSiteUrl, linkAllUsers);
  }

  // TODO Add interface for data returned
  private getSiteInfo(siteUrl: string): ng.IPromise<IACWebexSiteinfoResponse> {
    return this.LinkedSitesWebExService.getCiSiteLinking(siteUrl).then((si: IACWebexSiteinfoResponse) => {
      this.$log.debug('getSiteInfo', si);
      return si;
    }).catch((error) => {
      this.$log.debug('error', error);
      // 404 is interpreted as a v1 site
      if (error.status === 404) {
        this.$log.warn(siteUrl + ' does not support v2 API');
        const si: IACWebexSiteinfoResponse = {
          accountLinkingMode: LinkingMode.UNSET,
          enable: false,
          linkAllUsers: false,
          supportAgreementLinkingMode: false,
          trustedDomains: [],
        };
        return si;
      } else {
        this.$log.debug('getSiteInfo error', error);
        throw error;
      }
    });
  }

  private getCiAccountSync(siteUrl: string): ng.IPromise<IACLinkingStatus> {
    return this.LinkedSitesWebExService.getCiAccountSync(siteUrl).then((status: IACLinkingStatus) => {
      this.$log.debug('getCiAccountSync', status);
      return status;
    }).catch((error) => {
      if (error.status === 404) {
        this.$log.warn(siteUrl + ' does not support v2 API');
        return null;
      } else {
        this.$log.debug('getCiAccountSync error', error);
        throw error;
      }
    });
  }

  private getDomains(siteUrl: string): ng.IPromise<any> {
    return this.LinkedSitesWebExService.getDomainsWithRetry(siteUrl).then((domains) => {
      this.$log.debug('LinkedSitesService.getDomains', domains);
      return domains;
    }).catch((error) => {
      if (error.status === 404) {
        this.$log.warn(siteUrl + ' does not support v2 API');
        return null;
      } else {
        this.$log.debug('getDomains error', error);
        throw error;
      }
    });
  }
}
