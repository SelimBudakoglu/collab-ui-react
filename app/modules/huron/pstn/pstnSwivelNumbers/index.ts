import { PstnSwivelNumbersComponent } from './pstnSwivelNumbers.component';
import notifications from 'modules/core/notifications';
require('bootstrap-tokenfield');

export { TokenMethods } from './tokenMethods';

export const TIMEOUT = 100;
export default angular
  .module('huron.pstn.pstn-swivelNumbers', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-timer'),
    require('angular-translate'),
    require('modules/huron/telephony/telephoneNumber.service'),
    notifications,
  ])
  .component('ucPstnSwivelNumbers', new PstnSwivelNumbersComponent())
  .name;
