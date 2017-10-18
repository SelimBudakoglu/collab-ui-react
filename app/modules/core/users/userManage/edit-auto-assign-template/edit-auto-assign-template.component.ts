interface IStateServiceWithModal extends ng.ui.IStateService {
  modal: {
    dismiss: Function,
  };
}

class EditAutoAssignTemplateController implements ng.IComponentController {

  private prevState: string;

  /* @ngInject */
  constructor(
    private $state: IStateServiceWithModal,
    private $stateParams,
    private Analytics,
  ) {
    this.prevState = _.get<string>(this.$stateParams, 'prevState', 'users.manage.picker');
  }

  public dismiss(): void {
    this.Analytics.trackAddUsers(this.Analytics.eventNames.CANCEL_MODAL);
    this.$state.modal.dismiss();
  }

  public back(): void {
    this.$state.go(this.prevState);
  }

  public next(): void {
    // TODO: f3745 - update with appropriate UI state
    // this.$state.go(...);
  }
}

export class EditAutoAssignTemplateComponent implements ng.IComponentOptions {
  public controller = EditAutoAssignTemplateController;
  public template = require('./edit-auto-assign-template.html');
}
