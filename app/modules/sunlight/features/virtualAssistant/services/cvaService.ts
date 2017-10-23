import uuid = require('uuid');

export interface IConfigurationResource extends ng.resource.IResourceClass<any> {
  update(any): any;
}

export class CvaService {

  /* types of configurations supported by virtualAssistant
   as more are added they should be put here and used in the controller.
   and a new create<type>ConfigObject() func should be created to create its config object.
   */
  public configurationTypes = {
    apiai: 'apiai',
  };

  // Service Card definition. describes how to render the top-level virtual assistant 'card' for care.
  public cvaServiceCard = {
    id: 'customerVirtualAssistant',
    type: 'customerVirtualAssistant',
    mediaType: 'virtualAssistant', // for filter
    code: this.getCvaMessageKey('featureText.virtualAssistantCode'),
    label: this.getCvaMessageKey('featureText.customerVirtualAssistantType'),
    description: this.getCvaMessageKey('featureText.selectCVADesc'),
    icons: [],
    image: '/images/cvaIcon.png',
    color: 'feature-va-color',
    disabled: false,
    goToService: this.goToService.bind(this),
  };

  // Feature List definition. describes how to fetch and render list of existing virtual assistant configurations as
  // 'cards' for care.
  public featureList = {
    name: this.cvaServiceCard.id,
    getFeature: this.listConfigs.bind(this),
    formatter: this.formatVirtualAssistantConfigs.bind(this),
    i18n: 'careChatTpl.chatTemplate',
    isEmpty: false,
    color: 'cta',
    icons: this.cvaServiceCard.icons,
    data: [],
  };
  // Feature List Filter definition. describes how to filter this feature
  public featureFilter = {
    name: this.getCvaText('featureText.virtualAssistantMediaType'),
    filterValue: this.cvaServiceCard.mediaType,
  };


  /* @ngInject */
  constructor(
    private $http: ng.IHttpService,
    private $translate: ng.translate.ITranslateService,
    private $resource: ng.resource.IResourceService,
    private Authinfo,
    private UrlConfig,
    private $q: any,
  ) {
  }


  /**
   * Function to obtain translated string off virtual-assistant's area for strings
   * @param textIdExtension
   * @returns {string}
   */
  public getCvaText(textIdExtension: string): string {
    const featureName = this.$translate.instant('careChatTpl.virtualAssistant.cva.featureName');
    return this.$translate.instant('careChatTpl.virtualAssistant.cva.' + textIdExtension, { featureName });
  }

  /**
   * Function to obtain literal key for later lookup/translation.
   * @param textIdExtension
   * @returns {string}
   */
  public getCvaMessageKey(textIdExtension: string): string {
    return 'careChatTpl.virtualAssistant.cva.' + textIdExtension;
  }

  /** Functions used by service object **/
  /**
   * go to this Service's state
   * @param {Object} $state  current state object from controller.
   * @param {Object} params optional added parameters to pass
   * @returns {String} id of Service
   */
  private goToService($state: ng.ui.IStateService, params?: object): string {
    $state.go('care.assistant', (<any>Object).assign({
      type: params,
    }, params));
    return this.cvaServiceCard.id;
  }

  /**
   * obtain resource for Virtual Assistant configuration API Rest calls.
   * @param orgId
   * @param botServicesConfigId
   * @returns {*}
   */
  private getConfigResource(orgId: string, botServicesConfigId?: string): IConfigurationResource {
    const  baseUrl = this.UrlConfig.getCvaServiceUrl();
    return <IConfigurationResource>this.$resource(baseUrl + 'config/organization/:orgId/botconfig/:botServicesConfigId', {
      orgId: orgId,
      botServicesConfigId: botServicesConfigId,
    }, {
      update: {
        method: 'PUT',
      },
    });
  }

  /**
   * list all configurations for orgId
   * @param orgId
   * returns promise resolving to JSON array of configurations or empty array on error
   */
  public listConfigs(orgId: string): ng.IPromise<any> {
    return this.getConfigResource(orgId || this.Authinfo.getOrgId())
      .get().$promise;
  }

  /**
   * get a single identified configuration for orgId
   * @param botServicesConfigId
   * @param orgId
   * returns promise
   */
  public getConfig(botServicesConfigId: string, orgId: string): ng.IPromise<any> {
    return this.getConfigResource(orgId || this.Authinfo.getOrgId(), botServicesConfigId)
      .get().$promise;
  }

  /**
   * delete a single identified configuration for orgId
   * @param botServicesConfigId
   * @param orgId
   * returns promise
   */
  public deleteConfig(botServicesConfigId: string, orgId: string): ng.IPromise<void>  {
    return this.getConfigResource(orgId || this.Authinfo.getOrgId(), botServicesConfigId)
      .delete().$promise;
  }

  /**
   * add a new configuration
   * @param type
   * @param name
   * @param config
   * @param orgId
   * @param iconURL URL to avatar icon file
   * returns promise
   */
  public addConfig(type: string, name: string, config: object, orgId: string, iconURL?: string): ng.IPromise<any> {
    return this.getConfigResource(orgId || this.Authinfo.getOrgId())
      .save({
        type: type,
        name: name,
        config: config,
        icon: iconURL,
      }, function (data, headers) {
        data.botServicesConfigId = headers('location').split('/').pop();
        return data;
      }).$promise;
  }

  /**
   * update an identified APIAI configuration
   * @param botServicesConfigId
   * @param type
   * @param name
   * @param config
   * @param orgId
   * @param iconURL URL to avatar icon file
   * returns promise
   */
  public updateConfig(botServicesConfigId: string, type: string, name: string, config: object, orgId: string, iconURL?: string): ng.IPromise<void> {
    return this.getConfigResource(orgId || this.Authinfo.getOrgId(), botServicesConfigId)
      .update({
        type: type,
        name: name,
        config: config,
        icon: iconURL,
      }).$promise;
  }
  /**
   * test the apiai client access token to see if it works.
   * @param token
   * returns promise resolving true on success, false on failure
   */
  public isAPIAITokenValid(token: string): ng.IPromise<boolean> {
    const result = this.$q.defer();
    const request = {
      method: 'POST',
      url: 'https://api.api.ai/v1/query?v=20150910',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json; charset=utf-8',
      },
      data: {
        lang: 'en',
        sessionId: uuid.v4(),
        query: 'Hello',
      },
    };
    this.$http(request)
      .then(function (response: any) {
        const statusCode = (response.data.statusCode || response.data.status.code || 426); //Upgrade of code required
        if (200 <= statusCode && statusCode < 300) {
          result.resolve(true);
        } else {
          result.reject(false);
        }
      }, function () {
        result.reject(false);
      });
    return result.promise;
  }

  /**
   * obtain resource for Virtual Assistant configuration API Rest calls.
   * @param orgId
   * @param botServicesConfigId
   * @returns {*}
   */
  private getValidateResource(orgId?: string): IConfigurationResource {
    const baseUrl = this.UrlConfig.getCvaServiceUrl();
    return <IConfigurationResource>this.$resource(baseUrl + 'validateIcon', {
      orgId: orgId,
    }, {
      update: {
        method: 'POST',
      },
    });
  }

  /**
   * Test the avatar file to see if it is within expected boundaries: PNG file, 1MB max
   *
   * @param orgId
   * @param botServicesConfigId
   * @param iconURL
   * returns promise resolving true on success, false on failure
   */
  public isAvatarFileValid(orgId: string, iconURL: string): ng.IPromise<void> {
    return this.getValidateResource(orgId || this.Authinfo.getOrgId())
      .update({
        icon: iconURL,
      }).$promise;
  }

  /**
   * Return formatted list to render as cards on CareFeatures page
   * @param list
   * @param feature
   * @returns {any}
     */
  private formatVirtualAssistantConfigs(list: any, feature: any): any[] {
    const service = this;
    const formattedList = _.map(list.items, function (item: any) {
      item.templateId = item.id;
      if (!item.name) {
        item.name = item.templateId;
      }
      item.mediaType = service.cvaServiceCard.mediaType;
      // CA-115: indicates that item.status should not be visible until UX defines the value to be set when "In use"
      // item.status = 'Not in use';
      item.featureType = feature.name;
      item.color = feature.color;
      item.icons = feature.icons;
      return item;
    });
    return _.sortBy(formattedList, function (item: any) {
      //converting cardName to lower case as _.sortBy by default does a case sensitive sorting
      return item.name.toLowerCase();
    });
  }

  /**
   * Get the data url from file object
   * @param fileObject
   * @returns {Promise<String>} promise resolving to the data url on success; otherwise promise rejected
   */
  public getFileDataUrl(fileObject: any): ng.IPromise<String> {
    return this.$q((resolve, reject) => {
      if (!fileObject) {
        return reject('');
      }
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = () => {
        reject('');
      };
      fileReader.readAsDataURL(fileObject);
    });
  }
}
export default angular
  .module('Sunlight')
  .service('CvaService', CvaService)
  .name;