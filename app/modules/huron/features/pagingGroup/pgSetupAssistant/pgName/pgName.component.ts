class PagingGroupNameCtrl implements ng.IComponentController {
  public pagingGroupName: string;
  public errorNameInput: boolean = false;
  public pgNameErrorMassage: string;
  private onUpdate: Function;

  /*@ngInject*/
  constructor(private $translate: ng.translate.ITranslateService) {}

  public onChange(): void {
    const reg = /[;"'&^></\\]/;
    let invalidChar: Array<string> | null = this.pagingGroupName.match(reg);
    this.errorNameInput = reg.test(this.pagingGroupName);
    if (this.errorNameInput) {
      this.pgNameErrorMassage = this.$translate.instant('pagingGroup.sayInvalidChar', { char: invalidChar }).replace('\\', '');
    }
    this.onUpdate({
      name: this.pagingGroupName,
      isValid: !this.errorNameInput,
    });
  }
}

export class PgNameComponent implements ng.IComponentOptions {
  public controller = PagingGroupNameCtrl;
  public templateUrl = 'modules/huron/features/pagingGroup/pgSetupAssistant/pgName/pgName.html';
  public bindings = {
    onUpdate: '&',
    pagingGroupName: '<',
  };
}
