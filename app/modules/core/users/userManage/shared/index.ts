import licenseSummaryModuleName from './license-summary';
import { UserManageService } from './user-manage.service';
import * as analyticsModuleName from 'modules/core/analytics';
import featureToggleModuleName from 'modules/core/featureToggle';
import usersSharedModuleName from 'modules/core/users/shared'; // TODO refactor into users/shared/auto-assign-template

export default angular
  .module('core.users.userManage.shared', [
    require('angular-ui-router'),
    require('@collabui/collab-ui-ng').default,
    analyticsModuleName,
    featureToggleModuleName,
    licenseSummaryModuleName,
    usersSharedModuleName,
  ])
  .service('UserManageService', UserManageService)
  .name;
