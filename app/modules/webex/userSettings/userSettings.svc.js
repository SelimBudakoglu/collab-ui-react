(function () {
  'use strict';

  angular.module('WebExUserSettings').factory('WebExUserSettingsSvc', [
    '$q',
    '$log',
    'XmlApiSvc',
    function (
      $q,
      $log,
      XmlApiSvc
    ) {
      var _self = this;

      return {
        getUserInfo: function (xmlApiAccessInfo) {
          var xmlData = XmlApiSvc.getUserInfo(xmlApiAccessInfo);

          return $q.all(xmlData);
        }, // getUserInfo()

        getSiteInfo: function (xmlApiAccessInfo) {
          var xmlData = XmlApiSvc.getSiteInfo(xmlApiAccessInfo);

          return $q.all(xmlData);
        }, // getSiteInfo()

        getMeetingTypeInfo: function (xmlApiAccessInfo) {
          var xmlData = XmlApiSvc.getMeetingTypeInfo(xmlApiAccessInfo);

          return $q.all(xmlData);
        }, // getMeetingTypeInfo()

        getUserSettingsInfo: function (xmlApiAccessInfo) {
          var userInfoXml = XmlApiSvc.getUserInfo(xmlApiAccessInfo);
          var siteInfoXml = XmlApiSvc.getSiteInfo(xmlApiAccessInfo);
          var meetingTypeXml = XmlApiSvc.getMeetingTypeInfo(xmlApiAccessInfo);;

          return $q.all([userInfoXml, siteInfoXml, meetingTypeXml]);
        }, // getUserSettingsInfo()

        xml2JsonConvert: function (commentText, xmlDataText, startOfBodyStr, endOfBodyStr) {
          return XmlApiSvc.xml2JsonConvert(commentText, xmlDataText, startOfBodyStr, endOfBodyStr);
        }, // xml2JsonConvert()
      }; // return
    } //WebExUserSettingsSvc
  ]); // angular
})();
