import './assignable-services-row.scss';

import { AssignableServicesRowComponent } from './assignable-services-row.component';
import assignableAdvancedMeetingsModuleName from './assignable-advanced-meetings';
import assignableItemCheckboxModuleName from './assignable-item-checkbox';
import assignableLicenseCheckboxModuleName from './assignable-license-checkbox';

export default angular.module('core.users.userAdd.assignable-services.assignable-services-row', [
  require('angular-translate'),
  require('collab-ui-ng').default,
  assignableAdvancedMeetingsModuleName,
  assignableItemCheckboxModuleName,
  assignableLicenseCheckboxModuleName,
])
  .component('assignableServicesRow', new AssignableServicesRowComponent())
  .name;
