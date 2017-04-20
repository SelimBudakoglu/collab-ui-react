interface IHeaderTab {
  title: string;
  state: string;
}

class HuronDetailsHeaderComponentCtrl implements ng.IComponentController {
  public tabs: Array<IHeaderTab> = [];
  public title: string = 'huronDetails.title';
  public back: boolean = false;

  /* @ngInject */
  constructor(
    private Authinfo,
    private Config,
    private FeatureToggleService,
  ) { }

  public $onInit(): void {
    this.tabs.push({
      title: 'huronDetails.linesTitle',
      state: 'huronlines',
    });
    if (this.showFeatureTab()) {
      this.tabs.push({
        title: 'huronDetails.featuresTitle',
        state: 'huronfeatures',
      });
    }
    this.FeatureToggleService.sparkCallTenDigitExtGetStatus()
      .then(enabled => {
        if (enabled) {
          this.tabs.push({
            title: 'huronDetails.settingsTitle',
            state: 'huronsettingsnew',
          });
        } else {
          this.tabs.push({
            title: 'huronDetails.settingsTitle',
            state: 'huronsettings',
          });
        }
      });
  }

  private showFeatureTab(): boolean {
    return this.Authinfo.getLicenses().filter(license => {
      return license.licenseType === this.Config.licenseTypes.COMMUNICATION;
    }).length > 0;
  }
}

export class HuronDetailsHeaderComponent implements ng.IComponentOptions {
  public controller = HuronDetailsHeaderComponentCtrl;
  public templateUrl = 'modules/huron/details/huronDetailsHeader.html';
  public bindings = { };
}