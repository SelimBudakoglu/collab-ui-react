import { IUSSOrg, USSService } from 'modules/hercules/services/uss.service';
import { Notification } from 'modules/core/notifications/notification.service';
import { IFormattedResult } from 'modules/hercules/services/l2sip-service';
import { IToolkitModalService } from 'modules/core/modal/index';

interface ITestResultSet {
  succeeded: boolean;
  resultSet: IFormattedResult[];
}

class SipDestinationSettingsSectionComponentCtrl implements ng.IComponentController {

  public showSIPTestTool: boolean = false;
  public savingSip: boolean = false;
  public sipDomain: string;
  public sipDestinationTestSucceeded: boolean | undefined;
  public sipDestinationTestResultSet: ITestResultSet;

  /* @ngInject */
  constructor(
    private $modal: IToolkitModalService,
    private Authinfo,
    private FeatureToggleService,
    private Notification: Notification,
    private Orgservice,
    private USSService: USSService,
  ) {}

  public $onInit() {
    this.showSIPTestToolCheck();
    this.getUSSData();
  }

  private showSIPTestToolCheck(): void {
    this.FeatureToggleService.supports(this.FeatureToggleService.features.atlasHybridCallDiagnosticTool)
      .then((isFeatureToggled) => {
        return this.Orgservice.isTestOrg()
          .then((isTestOrg) => {
            this.showSIPTestTool = isTestOrg || isFeatureToggled;
          });
      });
  }

  private getUSSData(): void {
    this.USSService.getOrg(this.Authinfo.getOrgId())
      .then((org: IUSSOrg) => {
        this.sipDomain = org.sipDomain;
      });
  }

  public updateSipDomain(): void {
    this.savingSip = true;
    const orgInfo: IUSSOrg = {
      id: this.Authinfo.getOrgId(),
      sipDomain: this.sipDomain,
    };
    this.USSService.updateOrg(orgInfo)
      .then(() => {
        this.Notification.success('hercules.errors.sipDomainSaved');
      })
      .catch((error) => {
        this.Notification.errorWithTrackingId(error, 'hercules.errors.sipDomainInvalid');
      })
      .finally(() => {
        this.savingSip = false;
      });
  }

  /* Callback from the verify-sip-destination component  */
  public onDestinationSave = () => {
    this.updateSipDomain();
  }

  /* Callback from the verify-sip-destination component  */
  public onResultReady = (succeeded: boolean, resultSet: ITestResultSet) => {
    this.sipDestinationTestSucceeded = succeeded;
    this.sipDestinationTestResultSet = resultSet;
  }

  /* Callback from the verify-sip-destination component  */
  public onTestStarted = () => {
    this.sipDestinationTestSucceeded = undefined;
  }

  public openSipTestResults(): void {
    this.$modal.open({
      resolve: {
        resultSet: () => this.sipDestinationTestResultSet,
      },
      controller: 'VerifySipDestinationModalController',
      controllerAs: 'vm',
      template: require('modules/hercules/service-settings/verify-sip-destination/verify-sip-destination-modal.html'),
      type: 'full',
    });
  }

  public warnSipDestination(): boolean {
    return this.sipDestinationTestSucceeded !== undefined && !this.sipDestinationTestSucceeded;
  }

}

export class SipDestinationSettingsSectionComponent implements ng.IComponentOptions {
  public controller = SipDestinationSettingsSectionComponentCtrl;
  public template = require('./sip-destination-settings-section.component.html');
}