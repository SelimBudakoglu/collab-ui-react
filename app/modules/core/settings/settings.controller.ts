/// <reference path="domainsSetting.component.ts"/>
/// <reference path="sipDomainSetting.component.ts"/>
namespace globalsettings {

  export class SettingsCtrl {

    public security:SettingSection;
    public privacy:SettingSection;
    public domains:SettingSection;
    public sipDomain:SettingSection;
    public authentication:SettingSection;
    public branding:SettingSection;
    public support:SettingSection;
    public dataPolicy:SettingSection;

    /* @ngInject */
    constructor(Authinfo) {

      if (Authinfo.isPartner()) {
        //Add setting sections for partner admins here.
      } else {
        this.domains = new DomainsSetting();
        this.sipDomain = new SipDomainSetting();
      }
    }
  }
  angular
    .module('Core')
    .controller('SettingsCtrl', SettingsCtrl);
}
