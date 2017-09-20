class HybridMediaActiveCardController implements ng.IComponentController {
  /* @ngInject */
  constructor(
  ) {}
}

export class HybridMediaActiveCardComponent implements ng.IComponentOptions {
  public controller = HybridMediaActiveCardController;
  public template = `
    <article>
      <div class="active-card_header">
        <h4 translate="servicesOverview.cards.hybridMedia.title"></h4>
      </div>
      <div class="active-card_content">
        <p translate="servicesOverview.cards.hybridMedia.description"></p>
        <p><span>Service</span></p>
        <p><a ui-sref="media-service-v2.settings">Configure</a></p>
        <p><span>Resources</span></p>
        <p><a ui-sref="media-service-v2.list">View all</a></p>
      </div>
      <div class="active-card_footer">
        <a ui-sref="media-service-v2.list">
          <cs-statusindicator ng-model="$ctrl.serviceStatus.cssClass"></cs-statusindicator>
          <span translate="{{'servicesOverview.cardStatus.'+$ctrl.serviceStatus.status}}"></span>
        </a>
      </div>
    </article>
  `;
  public bindings = {
    serviceStatus: '<',
  };
}