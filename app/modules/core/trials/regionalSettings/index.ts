import { TrialRegionalSettingsComponent } from './trialRegionalSettings.component';
import HuronCountryService from 'modules/huron/countries';
import FeatureToggleServices from 'modules/core/featureToggle';

export default angular
  .module('trial.regionalSettings', [
    require('modules/core/trials/trial.module'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    HuronCountryService,
    FeatureToggleServices,
  ])
  .component('trialRegionalSettings', new TrialRegionalSettingsComponent())
  .name;
