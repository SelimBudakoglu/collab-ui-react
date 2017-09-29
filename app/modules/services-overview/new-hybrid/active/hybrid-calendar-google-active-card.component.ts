import { USSService, IStatusSummary } from 'modules/hercules/services/uss.service';

class HybridCalendarGoogleActiveCardController implements ng.IComponentController {
  private subscribeStatusesSummary: any;

  public userStatusesSummary: IStatusSummary[] | undefined;

  /* @ngInject */
  constructor(
    private USSService: USSService,
  ) {}

  public $onInit() {
    this.extractSummary();
    this.subscribeStatusesSummary = this.USSService.subscribeStatusesSummary('data', this.extractSummary.bind(this));
  }

  public $onDestroy() {
    this.subscribeStatusesSummary.cancel();
  }

  private extractSummary() {
    this.userStatusesSummary = this.USSService.extractSummaryForAService(['squared-fusion-gcal']);
  }
}

export class HybridCalendarGoogleActiveCardComponent implements ng.IComponentOptions {
  public controller = HybridCalendarGoogleActiveCardController;
  public template = `
    <article>
      <div class="active-card_header card_header--stretched">
        <h4 translate="servicesOverview.cards.hybridCalendar.title"></h4>
        <i class="icon icon-question-circle" tooltip="{{::'servicesOverview.cards.hybridCalendar.description' | translate}}" tooltip-placement="bottom-right"></i>
        <div class="active-card_logo active-card_logo--google"><img src="/images/hybrid-services/Google_Calendar_logo_small.png" alt="{{::'servicesOverview.cards.hybridCalendar.googleTitle' | translate}}"></div>
      </div>
      <div class="active-card_content">
        <div class="active-card_section">
          <div class="active-card_title" translate="servicesOverview.cards.shared.service"></div>
          <div class="active-card_action"><a ui-sref="google-calendar-service.settings" translate="servicesOverview.cards.shared.configure"></a></div>
        </div>
        <card-users-summary summary="$ctrl.userStatusesSummary"></card-users-summary>
      </div>
      <div class="active-card_footer">
        <a ui-sref="google-calendar-service.settings">
          <span translate="{{'servicesOverview.cardStatus.'+$ctrl.serviceStatus.status}}"></span>
          <cs-statusindicator ng-model="$ctrl.serviceStatus.cssClass"></cs-statusindicator>
        </a>
      </div>
    </article>
  `;
  public bindings = {
    serviceStatus: '<',
  };
}
