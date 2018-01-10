import { AccountLinkingWizardComponent } from './account-linking-wizard.component';
import accountLinkingWizardStatesModule from './states';

export default angular
  .module('account-linking.wizard', [
    require('@collabui/collab-ui-ng').default,
    require('angular-translate'),
    accountLinkingWizardStatesModule,
  ])
  .component('accountLinkingWizard', new AccountLinkingWizardComponent())
  .name;
