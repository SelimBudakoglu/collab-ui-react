import { LocalStorageService } from 'modules/core/storage/localStorage.service';

interface IRoleStates {
  Application: string[];
  Compliance_User: string[];
  CUSTOMER_PARTNER: string[];
  Full_Admin: string[];
  Help_Desk: string[];
  Readonly_Admin?: string[];
  PARTNER_ADMIN: string[];
  Partner_Management: string[];
  PARTNER_READ_ONLY_ADMIN?: string[];
  PARTNER_SALES_ADMIN: string[];
  Site_Admin: string[];
  Support: string[];
  Tech_Support: string[];
  User: string[];
  WX2_SquaredInviter: string[];
  WX2_Support: string[];
  WX2_User: string[];
}

type EnvType = 'dev' | 'cfe' | 'integration' | 'prod';

export class Config {
  /* @ngInject */
  constructor(
    private $location: ng.ILocationService,
    private $window: ng.IWindowService,
    private LocalStorage: LocalStorageService,
  ) {
    if (this.isDev()) {
      // only allow feature toggle editor in Development mode
      this.roleStates.Full_Admin.push('edit-featuretoggles');
    }
    this.roleStates.Readonly_Admin = _.clone(this.roleStates.Full_Admin);
    this.roleStates.PARTNER_READ_ONLY_ADMIN = _.clone(this.roleStates.PARTNER_ADMIN);
  }

  public readonly ciscoOrgId = '1eb65fdf-9643-417f-9974-ad72cae0e10f';
  public readonly ciscoMockOrgId = 'd30a6828-dc35-4753-bab4-f9b468828688';
  public readonly consumerOrgId = 'consumer';
  public readonly consumerMockOrgId = '584cf4cd-eea7-4c8c-83ee-67d88fc6eab5';

  public readonly scimSchemas = [
    'urn:scim:schemas:core:1.0',
    'urn:scim:schemas:extension:cisco:commonidentity:1.0',
  ];

  public readonly feedbackUrl = 'https://conv-a.wbx2.com/conversation/api/v1/users/deskFeedbackUrl';
  public readonly helpUrl = 'https://collaborationhelp.cisco.com';
  public readonly ssoUrl = 'https://collaborationhelp.cisco.com';
  public readonly rolesUrl = 'https://collaborationhelp.cisco.com';
  public readonly supportUrl = 'https://collaborationhelp.cisco.com';
  public readonly webexSiteMigrationUrl = 'http://try.webex.com/mk/get/ciscowebexmigration';
  public readonly partnerSupportUrl = 'https://collaborationhelp.cisco.com';

  public readonly usersperpage = 100;
  public readonly orgsPerPage = 100;
  public readonly meetingsPerPage = 50;
  public readonly alarmsPerPage = 50;
  public readonly eventsPerPage = 50;
  public readonly trialGracePeriod = -30; // equal to the number of days left in a trial when it passes grace period

  public readonly tokenTimers = {
    timeoutTimer: 3000000, // 50 mins
    refreshTimer: 6600000, // 1 hour 50 mins (Access token expires in 120 mins)
    refreshDelay: 540000, // 9 mins
  };
  public readonly idleTabTimeout = 1200000; //20 mins
  public readonly idleTabKeepAliveEvent = 'IDLE_TIMEOUT_KEEP_ALIVE';

  public readonly oauthError = {
    unauthorizedClient: 'unauthorized_client',
    invalidScope: 'invalid_scope',
    unsupportedResponseType: 'unsupported_response_type',
    accessDenied: 'access_denied',
    serverError: 'server_error',
    temporarilyUnavailable: 'temporarily_unavailable',
    serviceUnavailable: 'service_unavailable', //Customized state, not in OAuth Spec.
  };

  public readonly siteDomainUrl = {
    webexUrl: '.webex.com',
  };

  public readonly commerceRelation = {
    partner: 'Partner',
  };

  public readonly customerTypes = {
    enterprise: 'Enterprise',
    pending: 'Pending',
  };

  public readonly entitlements = {
    huron: 'ciscouc',
    squared: 'webex-squared',
    fusion_uc: 'squared-fusion-uc',
    fusion_cal: 'squared-fusion-cal',
    fusion_gcal: 'squared-fusion-gcal',
    mediafusion: 'squared-fusion-media',
    hds: 'spark-hybrid-datasecurity',
    fusion_mgmt: 'squared-fusion-mgmt',
    room_system: 'spark-room-system',
    fusion_ec: 'squared-fusion-ec',
    messenger_interop: 'messenger-interop',
    messenger: 'webex-messenger',
    care: 'cloud-contact-center',
    care_digital: 'cloud-contact-center-digital',
    care_inbound_voice: 'cloud-contact-center-inbound-voice',
    context: 'contact-center-context',
    fusion_khaos: 'squared-fusion-khaos',
    message: 'squared-room-moderation',
    imp: 'spark-hybrid-impinterop',
    cmc: 'cmc',
  };

  public readonly licenseModel = {
    cloudSharedMeeting: 'cloud shared meeting',
    hosts: 'hosts',
  };

  public readonly offerTypes = {
    collab: 'COLLAB', //to be deprecated; use message && meeting
    spark1: 'SPARK1', //to be deprecated; use message
    webex: 'WEBEX', // to be deprecated; use meetings
    squaredUC: 'SQUAREDUC', // to be deprecated; use call
    message: 'MESSAGE',
    meetings: 'MEETINGS', // to be deprecated; use meeting && webex
    meeting: 'MEETING',
    management: 'MANAGEMENT',
    call: 'CALL',
    roomSystems: 'ROOMSYSTEMS',
    sparkBoard: 'SPARKBOARDS',
    pstn: 'PSTN',
    care: 'CARE',
    advanceCare: 'CAREVOICE',
    context: 'CONTEXT',
  };

  public readonly shallowValidationSourceTypes = {
    serviceSetup: 'ATLAS_SERVICE_SETUP',
  };

  // These can be used to access object properties for trials
  public readonly licenseObjectNames = [
    'messaging',
    'communications',
    'care',
    'advanceCare',
    'roomSystems',
    'conferencing',
    'webexCMR',
    'webexEEConferencing',
    'webexEventCenter',
    'webexMeetingCenter',
    'webexTrainingCenter',
    'webexSupportCenter',
  ];

  public readonly webexTypes = [
    'webexCMR',
    'webexEEConferencing',
    'webexEventCenter',
    'webexMeetingCenter',
    'webexTrainingCenter',
    'webexSupportCenter',
  ];

  public readonly freeLicenses = [
    'messaging',
    'communications',
    'conferencing',
  ];

  //WARNING: Deprecated, use offerTypes
  // These were how trials used to be mapped
  public readonly trials = {
    message: 'COLLAB',
    meeting: 'WEBEX',
    call: 'SQUAREDUC',
    roomSystems: 'ROOMSYSTEMS',
  };

  //TODO: Revisit whether or not this is still needed or need to be modified now that there is offerTypes.
  public readonly organizations = {
    collab: 'COLLAB',
    squaredUC: 'SQUAREDUC',
  };

  public readonly backend_roles = { // as stored in the ci
    full_admin: 'id_full_admin',
    all: 'atlas-portal.all',
    billing: 'atlas-portal.billing',
    support: 'atlas-portal.support',
    application: 'atlas-portal.application',
    reports: 'atlas-portal.reports',
    sales: 'atlas-portal.partner.salesadmin',
    helpdesk: 'atlas-portal.partner.helpdesk',
    orderadmin: 'atlas-portal.partner.orderadmin',
    partner_management: 'atlas-portal.cisco.partnermgmt',
    spark_synckms: 'spark.synckms',
    ciscouc_ces: 'ciscouc.ces',
    readonly_admin: 'id_readonly_admin',
    tech_support: 'atlas-portal.cisco.techsupport',
  };

  public readonly roles = {
    full_admin: 'Full_Admin',
    all: 'All',
    billing: 'Billing',
    support: 'Support',
    application: 'Application',
    reports: 'Reports',
    sales: 'Sales_Admin',
    helpdesk: 'Help_Desk',
    orderadmin: 'Order_Admin',
    partner_management: 'Partner_Management',
    spark_synckms: 'Spark_SyncKms',
    readonly_admin: 'Readonly_Admin',
    compliance_user: 'Compliance_User',
    tech_support: 'Tech_Support',
  };

  public readonly roleState = {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
  };

  public readonly subscriptionState = {
    trial: 'Trial',
  };

  public readonly confMap = {
    MS: 'onboardModal.paidMsg',
    CF: 'onboardModal.paidConf',
    EE: 'onboardModal.enterpriseEdition',
    MC: 'onboardModal.meetingCenter',
    SC: 'onboardModal.supportCenter',
    TC: 'onboardModal.trainingCenter',
    EC: 'onboardModal.eventCenter',
    CO: 'onboardModal.communication',
  };

  public readonly offerCodes = {
    MS: 'MS', // Messaging
    CF: 'CF', // Conferencing
    EE: 'EE', // Enterprise Edition (WebEx)
    MC: 'MC', // Meeting Center (WebEx)
    SC: 'SC', // Support Center (WebEx)
    TC: 'TC', // Training Center (WebEx)
    EC: 'EC', // Event Center (WebEx)
    CO: 'CO', // Communication
    SD: 'SD', // Spark Room System
    SB: 'SB', // Spark Board
    CMR: 'CMR', // Collaboration Meeting Room (WebEx)
    CDC: 'CDC', // Care Digital Channel
    CVC: 'CVC', // Care Voice Channel
    MSGR: 'MSGR', // WebEx Messenger (as of 2017-05-17, managed externally and not managed by Atlas)
    MGMTPRO: 'MGMTPRO', // IT Pro Pack
    TSP: 'TSP', // Telephony Service Provider
    CCASP: 'CCASP', //Cloud Connected Audio - Service Partners
  };

  public readonly orderingTool = {
    online: 'CISCO_ONLINE_OPC',
    digitalRiver: 'DIGITAL_RIVER',
  };

  public readonly licenseStatus = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
    SUSPENDED: 'SUSPENDED',
    INITIALIZED: 'INITIALIZED',
  };

  public readonly subscriptionStatus = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    CANCELLED: 'CANCELLED',
    SUSPENDED: 'SUSPENDED',
    INITIALIZED: 'INITIALIZED',
  };

  public readonly licenseTypes = {
    AUDIO: 'AUDIO',
    MESSAGING: 'MESSAGING',
    CONFERENCING: 'CONFERENCING',
    COMMUNICATION: 'COMMUNICATION',
    STORAGE: 'STORAGE',
    SHARED_DEVICES: 'SHARED_DEVICES',
    CMR: 'CMR',
    CARE: 'CARE',
    ADVANCE_CARE: 'ADVANCE_CARE',
  };

  public readonly setupTypes = {
    transfer: 'TRANSFER',
    trialConvert: 'TRIALCONVERT',
    legacy: 'LEGACY',
  };

  public readonly messageErrors = {
    userExistsError: '400081',
    userPatchError: '400084',
    claimedDomainError: '400091',
    userExistsInDiffOrgError: '400090',
    notSetupForManUserAddError: '400110',
    userExistsDomainClaimError: '400108',
    unknownCreateUserError: '400096',
    unableToMigrateError: '400109',
    insufficientEntitlementsError: '400111',
    hybridServicesError: '400087',
    hybridServicesComboError: '400094',
  };

  public readonly timeFormat = {
    HOUR_12: '12-hour',
    HOUR_24: '24-hour',
  };

  public readonly dateFormat = {
    MDY_H: 'M-D-Y',
    DMY_H: 'D-M-Y',
    YMD_H: 'Y-M-D',
    MDY_P: 'M.D.Y',
    DMY_P: 'D.M.Y',
    YMD_P: 'Y.M.D',
    MDY_S: 'M/D/Y',
    DMY_S: 'D/M/Y',
    YMD_S: 'Y/M/D',
  };

  public readonly webexSiteStatus = {
    RECEIVED: 'RECEIVED',
    PENDING_PARM: 'PENDING_PARM',
    PROV_READY: 'PROV_READY',
    PROVISIONING: 'PROVISIONING',
    PROVISIONED: 'PROVISIONED',
    REJECTED: 'REJECTED',
    ERROR: 'ERROR',
    PARTIAL: 'PARTIAL',
    ABORTED: 'ABORTED',
    TIMEOUT: 'TIMEOUT',
    NA: 'NA',
  };

  public readonly batchSize = 10;

  public readonly serviceStates = {
    ciscouc: [
      'addDeviceFlow',
      'autoattendant',
      'callpark',
      'callparkedit',
      'callPickupSetupAssistant',
      'callpickupedit',
      'device-overview',
      'devices',
      'devices-redux',
      'didadd',
      'huntgroups',
      'huronCallPark',
      'hurondetails',
      'huronfeatures',
      'huronHuntGroup',
      'huronPagingGroup',
      'huronCallPickup',
      'huronPagingGroupEdit',
      'huronlines',
      'huronsettings',
      'huronrecords',
      'huronsettingslocation',
      'huntgroupedit',
      'intercomgroups',
      'mediaonhold',
      'paginggroups',
      'pickupGroups',
      'place-overview',
      'places',
      'services-overview',
      'private-trunk-overview',
      'private-trunk-domain',
      'private-trunk-sidepanel',
      'private-trunk-settings',
      'private-trunk-redirect',
      'customerPstnOrdersOverview',
      'externalNumberDelete',
      'pstnSetup',
      'pstnWizard',
      'call-locations',
      'call-locations-add',
      'call-locations-edit',
    ],
    'squared-fusion-mgmt': [
      'expressway-cluster-sidepanel',
      'services-overview',
      'resource-group-settings',
      'cluster-list',
      'expressway-cluster',
      'hybrid-services-connector-sidepanel',
      'cucm-cluster', // Remove when squared-fusion-khaos entitlement is returned by Atlas backend
    ],
    'spark-room-system': [
      'addDeviceFlow',
      'device-overview',
      'devices',
      'place-overview',
      'places',
      'huronsettings',
      'huronlines',
    ],
    'squared-fusion-uc': [
      'add-resource',
      'call-service',
      'cluster-list',
      'expressway-cluster',
      'hybrid-services-connector-sidepanel',
      'services-overview',
    ],
    'squared-fusion-cal': [
      'add-resource',
      'calendar-service',
      'cluster-list',
      'expressway-cluster',
      'hybrid-services-connector-sidepanel',
      'services-overview',
      'office-365-service',
    ],
    'squared-fusion-gcal': [
      'add-resource',
      'google-calendar-service',
      'cluster-list',
      'services-overview',
    ],
    'squared-team-member': [
      'organization',
    ],
    'spark-hybrid-datasecurity': [
      'hds',
      'hds.list',
      'hds.settings',
      'hds-cluster-details',
      'hds-cluster',
    ],
    'squared-fusion-media': [
      'add-resource',
      'media-service-v2',
      'mediafusion-cluster',
      'metrics',
      'reports.metrics',
      'reports.media',
      'reports.mediaservice',
      'services-overview',
      'cluster-list',
      'media-cluster-details',
    ],
    'webex-messenger': [
      'messenger',
      'services-overview',
    ],
    'cloud-contact-center': [
      'care',
    ],
    'contact-center-context': [
      'context-settings',
      'context-fields',
      'context-fieldsets',
      'context-fieldset-modal',
      'context-fieldsets-sidepanel',
      'context-resources',
      'context-cluster-sidepanel',
      'add-resource',
      'context-fields-sidepanel',
      'context-field-modal',
    ],
    'squared-fusion-khaos': [
      'cucm-cluster',
    ],
    cmc: [
      'cmc',
      'cmc.status',
      'cmc.settings',
    ],
    'spark-hybrid-impinterop': [
      'imp-service',
    ],
  };

  // These states are not allowed in specific views
  // (i.e. devices are not allowed in partner)
  public readonly restrictedStates = {
    customer: [
      'partneroverview',
      'partnerreports',
    ],
    partner: [
      'calendar-service',
      'call-service',
      'cluster-list',
      'devices',
      'places',
      'expressway-cluster',
      'hybrid-services-connector-sidepanel',
      'fusion',
      'hurondetails',
      'huronsettings',
      'media-service',
      'media-service-v2',
      'mediafusion-cluster',
      'overview',
      'reports',
      'services-overview',
    ],
  };

  // These states do not require a role/service check
  public readonly publicStates = ['unauthorized', '404', 'csadmin'];
  public readonly ciscoOnly = ['billing'];

  // rolestates are modified in the constructor and can't be readonly
  public roleStates: IRoleStates = {
    // Customer Admin
    Full_Admin: [
      'activateProduct',
      'cdr-overview',
      'cdrladderdiagram',
      'cdrsupport',
      'customerprofile',
      'domainmanagement',
      'dr-login-forward',
      'editService',
      'firsttimewizard',
      'my-company',
      'overview',
      'profile',
      'reports',
      'webexReportsPanel',
      'settings',
      'setupwizardmodal',
      'support',
      'trialExtInterest',
      'user-overview',
      'userRedirect',
      'userprofile',
      'users',
      'customerPstnOrdersOverview',
    ],
    Support: ['support', 'reports', 'billing', 'cdrsupport', 'cdr-overview', 'cdrladderdiagram'],
    Tech_Support: ['gss'],
    WX2_User: ['overview', 'support', 'activateProduct'],
    WX2_Support: ['overview', 'reports', 'support'],
    WX2_SquaredInviter: [],
    PARTNER_ADMIN: ['partneroverview', 'partnercustomers', 'gem', 'gemOverview', 'gemReports', 'gemCbgDetails', 'gmTdDetails', 'gmTdNumbersRequest', 'customer-overview', 'partnerreports', 'trial', 'trialAdd', 'trialEdit', 'profile', 'pstn', 'pstnSetup', 'pstnWizard', 'video', 'settings'],
    PARTNER_SALES_ADMIN: ['overview', 'partneroverview', 'customer-overview', 'partnercustomers', 'partnerreports', 'trial', 'trialAdd', 'trialEdit', 'pstn', 'pstnSetup', 'pstnWizard', 'video'],
    CUSTOMER_PARTNER: ['overview', 'partnercustomers', 'customer-overview'],
    //TODO User role is used by Online Ordering UI. The dr* states will be removed once the Online UI is separated from Atlas.
    User: ['drLoginReturn', 'drOnboard', 'drConfirmAdminOrg', 'drOnboardQuestion', 'drOnboardEnterAdminEmail', 'drOrgName', 'drAdminChoices'],
    Site_Admin: [
      'site-list',
      'site-csv-import',
      'site-csv',
      'site-csv-results',
      'site-settings',
      'site-setting',
      'reports.webex',
      'webex-reports-iframe',
      'services-overview',
    ],
    Application: ['organizations', 'organization-overview'],
    Help_Desk: ['helpdesk', 'helpdesk.search', 'helpdesk.user', 'helpdesk.org', 'helpdesklaunch', 'provisioning', 'order-details'],
    Compliance_User: ['ediscovery', 'ediscovery.search', 'ediscovery.reports'],
    Partner_Management: ['partnerManagement'],
  };

  private readonly TEST_ENV_CONFIG: string = 'TEST_ENV_CONFIG';
  private readonly defaultEntitlements = ['webex-squared', 'squared-call-initiation'];
  private readonly hostnameConfig = require('config/hostname.config');

  // public functions
  public isDevHostName(hostName: string): boolean {
    const whitelistDevHosts = [
      '0.0.0.0',
      this.hostnameConfig.LOCAL,
      'localhost',
      'server',
      'dev-admin.ciscospark.com',
    ];
    return _.includes(whitelistDevHosts, hostName);
  }

  public canUseAbsUrlForDevLogin (absUrl: string): boolean {
    const whitelistAbsUrls = [
      'http://127.0.0.1:8000',
      'http://dev-admin.ciscospark.com:8000',
    ];
    return _.includes(whitelistAbsUrls, absUrl);
  }

  public getAbsUrlAtRootContext (): string {
    const portSuffix = (this.$location.port()) ? ':' + this.$location.port() : '';
    return `${this.$location.protocol()}://${this.$location.host()}${portSuffix}`;
  }

  public forceProdForE2E(): boolean {
    return this.LocalStorage.get(this.TEST_ENV_CONFIG) === 'e2e-prod';
  }

  public forceIntegrationForE2E(): boolean {
    return this.LocalStorage.get(this.TEST_ENV_CONFIG) === 'e2e-integration';
  }

  public isCfe(): boolean {
    return !this.forceProdForE2E() && this.getCurrentHostname() === this.hostnameConfig.CFE;
  }

  public isDev(): boolean {
    const currentHostname = this.getCurrentHostname();
    return !this.forceProdForE2E() && this.isDevHostName(currentHostname);
  }

  public isE2E(): boolean {
    const storage = this.LocalStorage.get(this.TEST_ENV_CONFIG);
    if (storage) {
      return _.includes(storage, 'e2e');
    } else {
      return false;
    }
  }

  public isIntegration(): boolean {
    return !this.forceProdForE2E() && (this.getCurrentHostname() === this.hostnameConfig.INTEGRATION || this.forceIntegrationForE2E());
  }

  public isProd(): boolean {
    return this.forceProdForE2E() || this.getCurrentHostname() === this.hostnameConfig.PRODUCTION;
  }

  public isUserAgent(userAgentString: string): boolean {
    return this.$window.navigator.userAgent.indexOf(userAgentString) > -1;
  }

  public getEnv(): EnvType {
    if (this.isDev()) {
      return 'dev';
    } else if (this.isCfe()) {
      return 'cfe';
    } else if (this.isIntegration()) {
      return 'integration';
    } else {
      return 'prod';
    }
  }

  public getDefaultEntitlements() {
    return this.defaultEntitlements;
  }

  public setTestEnvConfig(testEnv?: string): void {
    if (testEnv) {
      this.LocalStorage.put(this.TEST_ENV_CONFIG, testEnv); // Store in localStorage so new windows pick up the value, will be cleared on logout
    }
  }

  // private functions
  private getCurrentHostname(): string {
    return this.$location.host() || '';
  }
}

export default angular
  .module('core.config', [
    require('modules/core/storage').default,
  ])
  .service('Config', Config)
  .name;