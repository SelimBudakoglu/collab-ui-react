import { IClusterV1 } from 'modules/hercules/herculesInterfaces';

interface ISchedule {
  dateTime: string;
  urgentScheduleTime: string;
  timeZone: string;
}

export class ScheduleInfoSectionComponentCtrl implements ng.IComponentController {

  private cluster: IClusterV1;

  public hasF237FeatureToggle: boolean = false;
  public releaseChannelName: string;
  public resourceGroupName: string;
  public schedule: ISchedule | {} = {};

  /* @ngInject */
  constructor(
    private $q: ng.IQService,
    private $translate: ng.translate.ITranslateService,
    private FusionClusterService,
    private ResourceGroupService,
  ) {}

  public $onInit() {}

  public $onChanges(changes: {[bindings: string]: ng.IChangesObject}) {

    const { cluster, hasF237FeatureToggle } = changes;
    if (hasF237FeatureToggle && hasF237FeatureToggle.currentValue) {
      this.hasF237FeatureToggle = hasF237FeatureToggle.currentValue;
    }

    if (cluster && cluster.currentValue) {
      this.cluster = cluster.currentValue;
      this.releaseChannelName = this.$translate.instant('hercules.fusion.add-resource-group.release-channel.' + this.cluster.releaseChannel);
      this.buildSchedule();
      if (this.hasF237FeatureToggle) {
        this.findResourceGroupName()
          .then(resourceGroupName => {
            this.resourceGroupName = resourceGroupName;
          });
      }
    }

  }

  private buildSchedule = () => {
    this.schedule = {
      dateTime: this.FusionClusterService.formatTimeAndDate(this.cluster.upgradeSchedule),
      urgentScheduleTime: this.FusionClusterService.formatTimeAndDate({
        scheduleTime: this.cluster.upgradeSchedule.urgentScheduleTime,
        // Simulate every day
        scheduleDays: { length: 7 },
      }),
      timeZone: this.cluster.upgradeSchedule.scheduleTimeZone,
    };
  }

  private findResourceGroupName = () => {
    if (!this.cluster.resourceGroupId) {
      return this.$q.resolve(undefined);
    }
    return this.ResourceGroupService.get(this.cluster.resourceGroupId)
      .then(group => group.name);
  }
}

export class ScheduleInfoSectionComponent implements ng.IComponentOptions {
  public controller = ScheduleInfoSectionComponentCtrl;
  public templateUrl = 'modules/hercules/cluster-sidepanel/schedule-info/schedule-info.html';
  public bindings = {
    cluster: '<',
    hasF237FeatureToggle: '<',
  };
}
