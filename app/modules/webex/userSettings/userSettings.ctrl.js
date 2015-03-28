(function () {
  'use strict';

  angular.module('WebExUserSettings').controller('WebExUserSettingsCtrl', [
    '$scope',
    '$log',
    '$translate',
    '$filter',
    '$stateParams',
    'WebExUserSettingsFact',
    'Notification',
    function (
      $scope,
      $log,
      $translate,
      $filter,
      $stateParams,
      WebExUserSettingsFact,
      Notification
    ) {

      /**
       * If user does not have first and last names, use the email address as the display name
       */
      this.getGivenName = function () {
        if (!$stateParams.currentUser.name) {
          return $stateParams.currentUser.userName;
        }
        if ($stateParams.currentUser.name.givenName === "" && $stateParams.currentUser.name.familyName === "") {
          return $stateParams.currentUser.userName;
        }
        return $stateParams.currentUser.name.givenName;
      };

      this.getFamilyName = function () {
        if (!$stateParams.currentUser.name) {
          return "";
        }
        return $stateParams.currentUser.name.familyName;
      };

      this.getUserSettingsInfo = function () {
        var currView = this;

        angular.element('#reloadBtn').button('loading'); //show spinning icon in "Try again" button

        WebExUserSettingsFact.getUserSettingsInfo().then(
          function getUserSettingsInfoSuccess(getInfoResult) {
            var funcName = "getUserSettingsInfoSuccess()";
            var logMsg = "";

            var validateUserInfoResult = WebExUserSettingsFact.validateXmlData(
              "User Data",
              getInfoResult[0],
              "<use:",
              "</serv:bodyContent>"
            );

            currView.userInfoHeaderJson = validateUserInfoResult[0];
            currView.userInfoJson = validateUserInfoResult[1];
            currView.userInfoErrReason = validateUserInfoResult[2];

            var validateSiteInfoResult = WebExUserSettingsFact.validateXmlData(
              "Site Info",
              getInfoResult[1],
              "<ns1:",
              "</serv:bodyContent>"
            );

            currView.siteInfoHeaderJson = validateSiteInfoResult[0];
            currView.siteInfoJson = validateSiteInfoResult[1];
            currView.siteInfoErrReason = validateSiteInfoResult[2];
            currView.userInfoErrId = validateUserInfoResult[3];

            var validateMeetingTypesInfoResult = WebExUserSettingsFact.validateXmlData(
              "Meeting Types Info",
              getInfoResult[2],
              "<mtgtype:",
              "</serv:bodyContent>"
            );

            currView.meetingTypesInfoHeaderJson = validateMeetingTypesInfoResult[0];
            currView.meetingTypesInfoJson = validateMeetingTypesInfoResult[1];
            currView.meetingTypesErrReason = validateMeetingTypesInfoResult[2];

            if (
              ("" === currView.userInfoErrId) &&
              ("" === currView.siteInfoErrReason) &&
              ("" === currView.meetingTypesErrReason)
            ) {
              currView.userSettingsModel = WebExUserSettingsFact.updateUserSettingsModel(
                currView.userInfoJson,
                currView.siteInfoJson,
                currView.meetingTypesInfoJson
              );

              currView.viewReady = true;
              $("#webexUserSettingsPage").removeClass("hidden");
            } else { // xmlapi returns error
              var errorMessage = $translate.instant('webexUserSettingsAccessErrors.' + "errCode-" + currView.userInfoErrId);
              $log.log("Error message: " + errorMessage);
              if ("030001" == currView.userInfoErrId) {
                logMsg = funcName + ": " + "Corresponding User not found!!!";
                $log.log(logMsg);
              } else {
                // TODO
                //   handle all other errors
                logMsg = funcName + ": " + "OTHER ERROR!!!";
                $log.log(logMsg);
              }
            } // xmlapi returns error
            angular.element('#reloadBtn').button('reset'); //Reset "try again" button to normal state
          }, // getUserSettingsInfoSuccess()

          function getUserSettingsInfoError(getInfoResult) {
            var funcName = "getUserSettingsInfoError()";
            var logMsg = "";

            logMsg = funcName + ": " + "getInfoResult=" + JSON.stringify(getInfoResult);
            $log.log(logMsg);
            angular.element('#reloadBtn').button('reset'); //Reset "try again button" to normal state
          } // getUserSettingsInfoError()
        ); // WebExUserSettingsFact.getUserSettingsInfo()
      }; // getUserSettingsInfo()

      this.disableCmrSwitch = function () {
        var funcName = "disableCmrSwitch()";
        var logMsg = "";

        var disableSwitch = true;
        if (this.viewReady) {
          this.userSettingsModel.sessionTypes.forEach(function (sessionType) {
            var meetingCenterApplicable = sessionType.meetingCenterApplicable;
            var sessionEnabled = sessionType.sessionEnabled;

            if (meetingCenterApplicable && sessionEnabled) {
              disableSwitch = false;
            }
          }); // sessionTypes.forEach()
        }

        return disableSwitch;
      }; // disableCmrSwitch()

      this.updateUserSettings = function () {
        var funcName = "updateUserSettings()";
        var logMsg = "";

        logMsg = funcName + ": " + "START";
        // $log.log(logMsg);

        var userSettings = {
          meetingTypes: [],
          meetingCenter: this.userInfoJson.use_supportedServices.use_meetingCenter,
          trainingCenter: this.userInfoJson.use_supportedServices.use_trainingCenter,
          supportCenter: this.userInfoJson.use_supportedServices.use_supportCenter,
          eventCenter: this.userInfoJson.use_supportedServices.use_eventCenter,
          salesCenter: this.userInfoJson.use_supportedServices.use_salesCenter
        };

        // go through the session types
        this.userSettingsModel.sessionTypes.forEach(function (sessionType) {
          if (sessionType.sessionEnabled) {
            userSettings.meetingTypes.push(sessionType.sessionTypeId);
          }
        }); // userSettingsModel.sessionTypes.forEach()

        WebExUserSettingsFact.updateUserSettings(userSettings).then(
          function () {
            var successMsg = [];
            successMsg.push($filter('translate')('webexUserSettings.updateSuccess'));
            Notification.notify(['Session Enablement updated'], 'success');
          },
          function () {
            Notification.notify(['Session Enablement update failed'], 'error');
          }
        );

        logMsg = funcName + ": " + "END";
        $log.log(logMsg);
      }; // updateUserSettings()

      //----------------------------------------------------------------------//

      this.viewReady = false;

      this.userInfoHeaderJson = null;
      this.userInfoJson = null;
      this.userInfoErrReason = "";

      this.siteInfoHeaderJson = null;
      this.siteInfoJson = null;
      this.siteInfoErrReason = "";

      this.meetingTypesInfoHeaderJson = null;
      this.meetingTypesInfoJson = null;
      this.meetingTypesErrReason = "";

      this.userSettingsModel = WebExUserSettingsFact.initUserSettingsModel();

      var _self = this;
      var webexSiteUrl = WebExUserSettingsFact.getSiteUrl();
      var webexSiteName = WebExUserSettingsFact.getSiteName(webexSiteUrl);

      WebExUserSettingsFact.getSessionTicket(webexSiteUrl).then(
        function getSessionTicketSuccess(webexAdminSessionTicket) {
          WebExUserSettingsFact.initXmlApiInfo(
            webexSiteUrl,
            webexSiteName,
            webexAdminSessionTicket
          );

          _self.getUserSettingsInfo();
        }, // getSessionTicketSuccess()

        function getSessionTicketError(reason) {
          $log.log("WebExUserSettingsCtrl(): failed to get session ticket");
        } // getSessionTicketError
      );
    } // WebExUserSettingsCtrl()
  ]);
})();
