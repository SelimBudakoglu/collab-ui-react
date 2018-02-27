import { HybridCallServiceAggregatedSectionComponent } from './hybrid-call-service-aggregated-section.component';
import hybridServiceUserSidepanelHelperServiceModuleName from 'modules/hercules/services/hybrid-services-user-sidepanel-helper.service';
import serviceDescriptorServiceModuleName from 'modules/hercules/services/service-descriptor.service';
import './_hybrid-call-service-aggregated-section.scss';
import userOverviewServiceModuleName from 'modules/core/users/userOverview';

export default angular
  .module('hercules.hybrid-call-service-aggregated-section', [
    require('angular-ui-router'),
    hybridServiceUserSidepanelHelperServiceModuleName,
    serviceDescriptorServiceModuleName,
    userOverviewServiceModuleName,
  ])
  .component('hybridCallServiceAggregatedSection', new HybridCallServiceAggregatedSectionComponent())
  .name;
