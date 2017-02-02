import { DialingType } from 'modules/huron/dialing/index';
import { DialingService } from 'modules/huron/dialing';
import { LineService, LineConsumerType, Line, LINE_CHANGE } from 'modules/huron/lines/services';
import { IActionItem } from 'modules/core/components/sectionTitle/sectionTitle.component';
import { IFeature } from 'modules/core/components/featureList/featureList.component';
import { Notification } from 'modules/core/notifications';
import { FeatureToggleService } from 'modules/core/featureToggle/featureToggle.service';
import { PlaceCallOverviewService } from './placeCallOverviewService.service';

class PlaceCallOverview implements ng.IComponentController {

  public currentPlace;
  public hasSparkCall: boolean;
  public actionList: IActionItem[];
  public features: IFeature[];

  public directoryNumbers: Line[];
  public preferredLanguageOptions: any[];
  public preferredLanguage: any;
  private placesPreferredLanguage: string;
  private defaultPreferredLanugage: string;
  public plIsLoaded: boolean = false;
  public placeCallOverviewSaveInProcess: boolean = false;
  public onPrefLanguageChange: boolean = false;
  public isUserLocaleFT2Enabled: boolean = false;

  /* @ngInject */
  constructor(
    private $scope: ng.IScope,
    private $state: ng.ui.IStateService,
    $stateParams: any,
    private $translate: ng.translate.ITranslateService,
    CsdmDataModelService: any,
    private LineService: LineService,
    private DialingService: DialingService,
    private Notification: Notification,
    private PlaceCallOverviewService: PlaceCallOverviewService,
    private FeatureToggleService: FeatureToggleService
  ) {

    this.displayPlace($stateParams.currentPlace);
    CsdmDataModelService.getPlacesMap().then((placesMap) => {
      //Replace the $stateParams clone with a real reference!
      this.displayPlace(placesMap[$stateParams.currentPlace.url]);
    });
    this.hasSparkCall = this.hasEntitlement('ciscouc');
    this.$scope.$on(DialingType.INTERNATIONAL, (_e, data) => {
      this.DialingService.setInternationalDialing(data, LineConsumerType.PLACES, this.currentPlace.cisUuid).then(() => {
        this.DialingService.initializeDialing(LineConsumerType.PLACES, this.currentPlace.cisUuid).then(() => {
          this.initFeatures();
        });
      }, (response) => {
        this.Notification.errorResponse(response, 'internationalDialingPanel.error');
      });
    });
    this.$scope.$on(DialingType.LOCAL, (_e, data) => {
      this.DialingService.setLocalDialing(data, LineConsumerType.PLACES, this.currentPlace.cisUuid).then(() => {
        this.DialingService.initializeDialing(LineConsumerType.PLACES, this.currentPlace.cisUuid).then(() => {
          this.initFeatures();
        });
      }, (response) => {
        this.Notification.errorResponse(response, 'internationalDialingPanel.error');
      });
    });
    this.$scope.$on(LINE_CHANGE, () => {
      this.initNumbers();
    });
  }

  public $onInit(): void {
    if (this.hasSparkCall) {
      this.initActions();
      this.DialingService.initializeDialing(LineConsumerType.PLACES, this.currentPlace.cisUuid).then(() => {
        this.initFeatures();
      });
      this.initNumbers();
      this.initPreferredLanguage();
    }
  }

  private displayPlace(newPlace) {
    this.currentPlace = newPlace;
  }

  private initActions(): void {
    if (this.currentPlace.type === 'huron') {
      this.actionList = [{
        actionKey: 'usersPreview.addNewLinePreview',
        actionFunction: () => {
          this.$state.go('place-overview.communication.line-overview');
        },
      }];
    }
  }

  private initFeatures(): void {
    this.features = [];
    let service: IFeature;
    if (this.currentPlace.type === 'huron') {
      service = {
        name: this.$translate.instant('telephonyPreview.speedDials'),
        state: 'speedDials',
        detail: undefined,
        actionAvailable: true,
      };
      this.features.push(service);
    }
    this.DialingService.isDisableInternationalDialing().then((isDisableInternationalDialing) => {
      if (!isDisableInternationalDialing) {
        service = {
          name: this.$translate.instant('telephonyPreview.internationalDialing'),
          state: 'internationalDialing',
          detail: this.DialingService.getInternationalDialing(LineConsumerType.PLACES),
          actionAvailable: true,
        };
        this.features.push(service);
      }
    });

    if (this.currentPlace.type === 'huron') {
      service = {
        name: this.$translate.instant('telephonyPreview.localDialing'),
        state: 'local',
        detail: this.DialingService.getLocalDialing(LineConsumerType.PLACES),
        actionAvailable: true,
      };
      this.features.push(service);
    }
  }

  private initNumbers(): void {
    this.LineService.getLineList(LineConsumerType.PLACES, this.currentPlace.cisUuid)
      .then(lines => this.directoryNumbers = lines);
  }

  private initPreferredLanguage(): void {
    this.isUserLocaleFT2Enabled = false;
    this.FeatureToggleService.supports(
      this.FeatureToggleService.features.huronUserLocale2
    ).then( isUserLocaleFT2Enabled => {
      this.isUserLocaleFT2Enabled = isUserLocaleFT2Enabled;
      if (isUserLocaleFT2Enabled) {
        this.PlaceCallOverviewService.getSiteLevelLanguage().then(result => {
          this.initPlacesPreferredLanguage(result);
        })
        .catch((error) => {
          this.Notification.errorResponse(error, 'placesPage.failedToFetchSiteLevelLanguage');
        });
      }
    });
  }

  private initPlacesPreferredLanguage(sitePreferredLanguage): void {
    this.preferredLanguageOptions = [];
    this.PlaceCallOverviewService.getSiteLanguages().then(languages => {
      this.PlaceCallOverviewService.getCmiPlaceInfo(this.currentPlace.cisUuid).then(result => {
        let organizationLanguage = this.getPreferredLanguage(languages, sitePreferredLanguage);
        this.defaultPreferredLanugage = this.defaultPreferredLanguage(organizationLanguage['label']);
        this.preferredLanguageOptions.push(this.defaultPreferredLanugage);
        this.preferredLanguageOptions = this.preferredLanguageOptions.concat(languages);
        this.placesPreferredLanguage = result['preferredLanguage'];
        this.preferredLanguage = this.placesPreferredLanguage ? this.getPreferredLanguage(languages, this.placesPreferredLanguage) : this.defaultPreferredLanugage;
        this.plIsLoaded = true;
      })
      .catch((error) => {
        this.Notification.errorResponse(error, 'placesPage.failedToFetchCmiPlacesInfo');
      });
    })
    .catch((error) => {
      this.Notification.errorResponse(error, 'placesPage.failedToFetchSiteLanguages');
    });
  }

  private defaultPreferredLanguage(organizationLevelLanguage): any {
    let defaultPrefix: string = this.$translate.instant('directoryNumberPanel.organizationSetting');
    let translatedLanguageLabel: string = organizationLevelLanguage ?
                                          this.$translate.instant(organizationLevelLanguage) :
                                          'languages.englishAmerican';
    let defaultLanguage = {
      label: defaultPrefix + translatedLanguageLabel,
      value: '',
    };
    return defaultLanguage;
  }

  private getPreferredLanguage(languages, language_code): any {
    return _.find(languages, function (language) {
      return language['value'] === language_code;
    });
  }

  public savePlaceCallOverview(): void {
    this.placeCallOverviewSaveInProcess = true;
    if (!_.isEqual(this.preferredLanguage.value, this.placesPreferredLanguage)) {
      let prefLang = this.preferredLanguage.value ? this.preferredLanguage.value : null;
      this.PlaceCallOverviewService.updateCmiPlaceInfo(this.currentPlace.cisUuid, prefLang)
        .then(() => {
          this.placesPreferredLanguage = prefLang;
          this.Notification.success('placesPage.placesCallOverviewSaveSuccess');
        })
        .catch(error => {
          this.Notification.errorResponse(error, 'placesPage.failedToSaveChanges');
      }).finally(() => {
        this.placeCallOverviewSaveInProcess = false;
        this.onPrefLanguageChange = false;
      });
    }
  }

  public onCancelPlaceCallOverview(): void {
    if (!_.isEqual(this.preferredLanguage.value, this.placesPreferredLanguage)) {
      this.preferredLanguage = this.placesPreferredLanguage ?
                                this.getPreferredLanguage(this.preferredLanguageOptions, this.placesPreferredLanguage) :
                                this.defaultPreferredLanugage;
    }
    this.onPrefLanguageChange = false;
  }

  private hasEntitlement(entitlement: string): boolean {
    let hasEntitlement = false;
    if (this.currentPlace.entitlements) {
      this.currentPlace.entitlements.forEach(element => {
        if (element === entitlement) {
          hasEntitlement = true;
        }
      });
    }
    return hasEntitlement;
  }

  public clickFeature(feature: IFeature) {
    this.$state.go('place-overview.communication.' + feature.state, {
      watcher: feature.state === 'local' ? DialingType.LOCAL : DialingType.INTERNATIONAL,
      selected: feature.state === 'local' ? this.DialingService.getLocalDialing(LineConsumerType.PLACES) : this.DialingService.getInternationalDialing(LineConsumerType.PLACES),
      currentPlace: this.currentPlace,
    });
    this.onCancelPlaceCallOverview();
  }
}

export class PlaceCallOverviewComponent implements ng.IComponentOptions {
  public controller = PlaceCallOverview;
  public templateUrl = 'modules/squared/places/callOverview/placeCallOverview.html';
}
