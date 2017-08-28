import { ICmcUserData, ICmcOrgStatusResponse, ICmcUserStatusResponse, ICmcUser, ICmcIssue } from './cmc.interface';
import { Config } from 'modules/core/config/config';

export class CmcService {

  // TODO: Replace by proper entries in urlconfig !
  private cmcUrl: string = 'https://cmc-controller.intb1.ciscospark.com/api/v1';

  private useMock: boolean = false; // Only set to true for testing

  private timeout: number = 5000; // ms

  /* @ngInject */
  constructor(
    private $q: ng.IQService,
    private Orgservice,
    private Config: Config,
    private UrlConfig,
    private CmcServiceMock,
    private $http: ng.IHttpService,
    private $translate,
    private $timeout: ng.ITimeoutService,
  ) {
  }

  public setUserData(user: ICmcUser, data: ICmcUserData): ng.IPromise<any> {
    const mobileNumberSet: ng.IPromise<any> = this.setMobileNumber(user, data.mobileNumber);
    const entitlementSet: ng.IPromise<any> = this.setEntitlement(user, data.entitled);
    return this.$q.all(
      [
        mobileNumberSet,
        entitlementSet,
      ],
    );
  }

  public getUserData(user: ICmcUser): ICmcUserData {
    const entitled = this.hasCmcEntitlement(user);
    const mobileNumber = this.extractMobileNumber(user);
    return <ICmcUserData> {
      mobileNumber: mobileNumber,
      entitled: entitled,
    };
  }

  // TODO: Find out when cmc settings should be unavailable...
  public allowCmcSettings(orgId: string): ng.IPromise<boolean> {
    // based on org entitlements ?
    const deferred = this.$q.defer<boolean>();
    this.Orgservice.getOrg((data, success) => {
      if (success) {
        if (data.success) {
          deferred.resolve(this.hasCmcService(data.services));
        } else {
          deferred.reject(data);
        }
      } else {
        deferred.resolve(false);
      }
    }, orgId, {
      basicInfo: true,
    });
    return deferred.promise;
  }

  public preCheckOrg(orgId: string): ng.IPromise<ICmcOrgStatusResponse> {
    if (!this.useMock) {
      //let deferred: ng.IDeferred<any> = this.$q.defer();
      //this.requestTimeout(deferred);
      const url: string = this.cmcUrl + `/organizations/${orgId}/status`;
      return this.$http.get<ICmcOrgStatusResponse>(url, { timeout: this.requestTimeout() }).then((response) => {
        return response.data as ICmcOrgStatusResponse;
      });
    } else {
      return this.CmcServiceMock.mockOrgStatus(orgId);
    }
  }

  private requestTimeout(): ng.IPromise<any> {
    const deferred: ng.IDeferred<any> = this.$q.defer();
    this.$timeout(() => {
      deferred.resolve();
    }, this.timeout);
    return deferred.promise;
  }

  // TODO Change this preliminary poor mans user precheck
  public preCheckUser(user: ICmcUser): ng.IPromise<ICmcUserStatusResponse> {
    const status: string = this.hasCallAwareEntitlement(user) ? 'ok' : 'error';
    const issues: ICmcIssue[] = [];
    if (status === 'error') {
      issues.push({
        code: 5000, // TODO: Define 'official' code
        message: 'User is not entitled for call aware', // TODO: Translation
      });
    }

    const res: ICmcUserStatusResponse = {
      status: status,
      issues: issues,
    };
    return this.$q.resolve(res);
  }

  private hasCmcService(services: string[]): boolean {
    return !!_.find(services, (service) => {
      return service === this.Config.entitlements.cmc;
    });
  }

  private extractMobileNumber(user: ICmcUser): any {
    if (user.phoneNumbers) {
      const nbr = _.find<any>(user.phoneNumbers, (nbr) => {
        return nbr.type === 'mobile';
      });
      return nbr !== undefined ? nbr.value : null;
    } else {
      return null;
    }
  }

  private hasCmcEntitlement(user: ICmcUser): boolean {
    return _.includes(user.entitlements, this.Config.entitlements.cmc);
  }

  private hasCallAwareEntitlement(user: ICmcUser): boolean {
    return _.includes(user.entitlements, this.Config.entitlements.fusion_uc); //'squared-fusion-uc');
  }

  private setEntitlement(user: ICmcUser, entitle: boolean): IPromise<any> {
    let url = this.UrlConfig.getAdminServiceUrl() + 'organization/' + user.meta.organizationID + '/users/' + user.id + '/actions/onboardcmcuser/invoke';
    //let url = 'http://localhost:8080/atlas-server/admin/api/v1/' + 'organization/' + user.meta.organizationID + '/users/' + user.id + '/actions/onboardcmcuser/invoke';
    if (!entitle) {
      url += '?removeEntitlement=true';
    }
    return this.$http.post(url, {});
  }

  private setMobileNumber(user: ICmcUser, number: string): IPromise<any>  {
    return this.checkUniqueMobileNumber(user, number).then((existingUsername) => {
      if (existingUsername && user.userName !== existingUsername) {
        return this.$q.reject({
          data: {
            message: `${number} ` + this.$translate.instant('cmc.failures.alreadyRegisteredForAtLeastOneMoreUser') + ' ' + existingUsername,
          },
        });
      } else {
        return this.patchNumber(user, number);
      }
    });
  }

  public patchNumber(user: ICmcUser, number: string): IPromise<any> {
    const userMobileData = {
      schemas: this.Config.scimSchemas,
      phoneNumbers: [
        {
          type: 'mobile',
          value: number,
        },
      ],
    };

    const scimUrl = this.UrlConfig.getScimUrl(user.meta.organizationID) + '/' + user.id;
    return this.$http({
      method: 'PATCH',
      url: scimUrl,
      data: userMobileData,
    });
  }

  private checkUniqueMobileNumber(user: ICmcUser, mobileNbr: string): IPromise<String> {
    const filter: string = `phoneNumbers[type eq \"mobile\" and value eq \"${mobileNbr}\"]`;
    const scimUrl: string = this.UrlConfig.getScimUrl(user.meta.organizationID) + '?filter=' + filter;
    return this.$http.get(scimUrl).then((response: any) => {
      if (response.data.Resources.length > 0) {
        return response.data.Resources[0].userName;
      } else {
        return null;
      }
    });
  }

}
