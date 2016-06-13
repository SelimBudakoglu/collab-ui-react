(function () {
  'use strict';

  angular.module('Core')
    .service('WebExSiteRowService', WebExSiteRowService);

  /* @ngInject */
  function WebExSiteRowService($log, $interval, $translate, Authinfo, Userservice, FeatureToggleService, WebExUtilsFact, UrlConfig, WebExApiGatewayService, WebExApiGatewayConstsService) {

    var siteRows = {};

    siteRows.gridData = [];
    siteRows.showGridData = true;
    siteRows.gridOptions = {};
    siteRows.showCSVIconAndResults = false;
    siteRows.allSitesWebexLicensesArray = [];

    siteRows.addSiteRow = function (newSiteRow) {
      siteRows.gridData.push(newSiteRow);
    };

    siteRows.getSiteRows = function () {
      return siteRows.gridData;
    };

    siteRows.getGridOptions = function () {
      return siteRows.gridOptions;
    };

    siteRows.getShowGridData = function () {
      return siteRows.showGridData;
    };

    siteRows.getSiteRow = function (siteUrl) {
      var siteRow = _.findWhere(siteRows.gridData, {
        siteUrl: siteUrl
      });
      return siteRow;
    };

    siteRows.logSiteRows = function () {
      var funcName = "logSiteRows()";
      var logMsg = funcName + "\n" + JSON.stringify(siteRows.gridData);
      //$log.log(logMsg);
      //$log.log("siteRows.showGridData = " + siteRows.showGridData + "\n");
      //$log.log("siteRows.gridOptions = " + JSON.stringify(siteRows.gridOptions) + "\n");
      //$log.log("siteRows.showCSVIconAndResults = " + siteRows.showCSVIconAndResults + "\n");

    };

    siteRows.stopPolling = function () {
      siteRows.gridData.forEach(
        function cancelCsvPollInterval(siteRow) {
          var funcName = "cancelCsvPollInterval()";
          var logMsg = "";

          if (null != siteRow.csvPollIntervalObj) {
            logMsg = funcName + "\n" +
              "siteUrl=" + siteRow.license.siteUrl;
            // $log.log(logMsg);

            $interval.cancel(siteRow.csvPollIntervalObj);
          }
        } // cancelCsvPollInterval()
      ); // WebExSiteRowService.siteRows.gridData.forEach()
    };

    siteRows.configureGrid = function () {
      var funcName = "configureGrid()";
      var logMsg = "";
      //$log.log(logMsg);

      // Start of grid set up
      siteRows.gridOptions = {
        //data: $scope.gridData,
        data: siteRows.gridData,
        multiSelect: false,
        enableRowSelection: false,
        enableColumnMenus: false,
        rowHeight: 44,
        columnDefs: [],
      };

      siteRows.gridOptions.columnDefs.push({
        field: 'license.siteUrl',
        displayName: $translate.instant('siteList.siteName'),
        sortable: false,
        width: '25%'
      });

      siteRows.gridOptions.columnDefs.push({
        field: 'siteConfLicenses',
        displayName: $translate.instant('siteList.licenseTypes'),
        cellTemplate: 'modules/core/siteList/siteLicenseTypesColumn.tpl.html',
        sortable: false,
        width: '17%'
      });

      siteRows.gridOptions.columnDefs.push({
        field: 'siteActions',
        displayName: $translate.instant('siteList.siteActions'),
        cellTemplate: 'modules/core/siteList/siteActionsColumn.tpl.html',
        sortable: false,
      });

      //$log.log(JSON.stringify(funcName + "\n" +
      //JSON.stringify(siteRows.gridOptions)));

      siteRows.updateConferenceServices();
    }; //configureGrid

    siteRows.getConferenceServices = function () {
      var conferenceServices = Authinfo.getConferenceServicesWithoutSiteUrl();
      var funcName = "getConferenceServices()";
      var logMsg = funcName + "\n" +
        "conferenceServices=\n" + JSON.stringify(conferenceServices);
      //$log.log(logMsg);

      conferenceServices.forEach(
        function checkConferenceService(conferenceService) {
          var newSiteUrl = conferenceService.license.siteUrl;
          var isNewSiteUrl = true;

          siteRows.gridData.forEach(
            function checkGrid(siteRow) {
              if (newSiteUrl == siteRow.license.siteUrl) {
                isNewSiteUrl = false;

                logMsg = funcName + ": " + "\n" +
                  "Duplicate webex site url detected and skipped." + "\n" +
                  "newSiteUrl=" + newSiteUrl;
                //$log.log(logMsg);
              }
            }
          );

          if (isNewSiteUrl) {

            conferenceService.showCSVInfo = false;
            conferenceService.showAsyncErr = false;
            conferenceService.csvStatusObj = null;
            conferenceService.csvPollIntervalObj = null;

            conferenceService.showExportLink = false;
            conferenceService.showExportInProgressLink = false;
            conferenceService.grayedExportLink = false;
            conferenceService.showExportResultsLink = false;
            conferenceService.exportFinishedWithErrors = false;

            conferenceService.showImportLink = false;
            conferenceService.showImportInProgressLink = false;
            conferenceService.grayedImportLink = false;
            conferenceService.showImportResultsLink = false;
            conferenceService.importFinishedWithErrors = false;

            conferenceService.isIframeSupported = false;
            conferenceService.isAdminReportEnabled = false;
            conferenceService.showSiteLinks = false;
            conferenceService.isError = false;
            conferenceService.isWarn = false;
            conferenceService.isCSVSupported = false;
            conferenceService.adminEmailParam = null;
            conferenceService.userEmailParam = null;
            conferenceService.advancedSettings = null;
            conferenceService.webexAdvancedUrl = null;
            conferenceService.siteUrl = newSiteUrl;

            conferenceService.showLicenseTypes = false;
            conferenceService.multipleWebexServicesLicensed = false;
            conferenceService.licenseTypeContentDisplay = null;
            conferenceService.licenseTooltipDisplay = null;
            conferenceService.MCLicensed = false;
            conferenceService.ECLicensed = false;
            conferenceService.SCLicensed = false;
            conferenceService.TCLicensed = false;
            conferenceService.EELicensed = false;
            conferenceService.CMRLicensed = false;

            conferenceService.csvMock = {
              mockStatus: false,
              mockStatusStartIndex: 0,
              mockStatusEndIndex: 0,
              mockStatusCurrentIndex: null,
              mockExport: false,
              mockImport: false,
              mockFileDownload: false
            };

            siteRows.addSiteRow(conferenceService);
          }
        }
      );
    }; //getConferenceServices()

    siteRows.updateConferenceServices = function () {

      var funcName = "updateConferenceServices()";
      var logMsg = "";
      //$log.log(logMsg);

      if (!_.isUndefined(Authinfo.getPrimaryEmail())) {
        //SiteListService.updateGrid(vm);
        siteRows.checkAndUpdateGridOptions();
      } else {
        Userservice.getUser('me', function (data, status) {
          if (
            (data.success) &&
            (data.emails)
          ) {
            Authinfo.setEmails(data.emails);
            //SiteListService.updateGrid(vm);
            siteRows.checkAndUpdateGridOptions();
          }
        });
      }

    }; //updateConferenceServices()

    siteRows.checkAndUpdateGridOptions = function () {
      var funcName = "updateGrid()";
      var logMsg = "";

      logMsg = funcName + "\n" +
        "siteRows.gridData=" + JSON.stringify(siteRows.gridData);
      // $log.log(logMsg);

      // remove grid column(s) based on feature toggles
      FeatureToggleService.supports(FeatureToggleService.features.webexCSV).then(
        function checkWebExFeaturToggleSuccess(adminUserSupportCSV) {
          var funcName = "checkWebExFeaturToggleSuccess()";
          var logMsg = "";

          logMsg = funcName + "\n" +
            "adminUserSupportCSV=" + adminUserSupportCSV;
          // $log.log(logMsg);

          // Start of hide CSV info if admin user does not have feature toggle
          siteRows.gridData.forEach(
            function processSiteRow(siteRow) {
              var funcName = "checkWebExFeaturToggleSuccess().processSiteRow()";
              var logMsg = "";

              siteRow.showCSVIconAndResults = adminUserSupportCSV;
            } // processSiteRow()
          ); // gridData.forEach()

          /*
          // delete the Actions column if admin user does not have feature toggle
          if (!adminUserSupportCSV) {
            vm.gridOptions.columnDefs.splice(2, 1);
          }
          */

          siteRows.updateGridColumns();
        }, // checkWebExFeaturToggleSuccess()

        function checkWebExFeaturToggleError(response) {
          var funcName = "checkWebExFeaturToggleError()";
          var logMsg = "";

          //$log.log(funcName);

          siteRows.updateGridColumns();
        } // checkWebExFeaturToggleError()
      ); // FeatureToggleService.supports().then()

    }; //checkAndUpdateGridOptions

    siteRows.updateGridColumns = function () {
      var funcName = "updateGridColumns()";
      var logMsg = "";
      //$log.log(funcName);

      siteRows.updateLicenseTypesColumn();
      siteRows.updateWebExDataColumns();
    }; // updateGridColumns()

    siteRows.updateLicenseTypesColumn = function () {
      var funcName = "updateLicenseTypesColumn()";
      var logMsg = "";
      //$log.log(funcName);

      WebExUtilsFact.getAllSitesWebexLicenseInfo().then(
        function getWebexLicenseInfoSuccess(allSitesLicenseInfo) {
          var funcName = "getWebexLicenseInfoSuccess()";
          var logMsg = "";

          logMsg = funcName + ": " + "\n" +
            "allSitesLicenseInfo=" + JSON.stringify(allSitesLicenseInfo);
          //$log.log(logMsg);

          var allSitesWebexLicensesArray = allSitesLicenseInfo;

          siteRows.gridData.forEach(
            function processGridForLicense(siteRow) {
              var funcName = "processGridForLicense()";
              var logMsg = "";
              var siteUrl = siteRow.license.siteUrl;
              var count = 0;
              siteRow.licenseTooltipDisplay = "";

              //Get the site's MC, EC, SC, TC, CMR license information
              //MC
              var siteMC = _.where(allSitesWebexLicensesArray, {
                webexSite: siteUrl,
                offerCode: "MC"
              });

              if (siteMC != null && siteMC.length > 0) {
                siteRow.MCLicensed = true;

                siteMC.forEach(
                  function processDisplayText(mc) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + mc.offerCode, {
                      capacity: mc.capacity
                    });
                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + mc.offerCode, {
                      capacity: mc.capacity
                    });
                    count++;
                  }
                ); //siteMC.forEach

              } else {
                siteRow.MCLicensed = false;
              }

              //EE
              var siteEE = _.where(allSitesWebexLicensesArray, {
                webexSite: siteUrl,
                offerCode: "EE"
              });

              if (siteEE != null && siteEE.length > 0) {
                siteRow.EELicensed = true;

                siteEE.forEach(
                  function processDisplayText(ee) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + ee.offerCode, {
                      capacity: ee.capacity
                    });
                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + ee.offerCode, {
                      capacity: ee.capacity
                    });
                    count++;
                  }
                ); //siteEE.forEach

              } else {
                siteRow.EELicensed = false;
              }

              //CMR
              var siteCMR = _.where(allSitesWebexLicensesArray, {
                webexSite: siteUrl,
                offerCode: "CMR"
              });

              if (siteCMR != null && siteCMR.length > 0) {
                siteRow.CMRLicensed = true;

                siteCMR.forEach(
                  function processDisplayText(cmr) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + cmr.offerCode, {
                      capacity: cmr.capacity
                    });
                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + cmr.offerCode, {
                      capacity: cmr.capacity
                    });
                    count++;
                  }
                ); //siteCMR.forEach

              } else {
                siteRow.CMRLicensed = false;
              }

              //EC
              var siteEC = _.where(allSitesWebexLicensesArray, {
                webexSite: siteUrl,
                offerCode: "EC"
              });

              if (siteEC != null && siteEC.length > 0) {
                siteRow.ECLicensed = true;

                siteEC.forEach(
                  function processDisplayText(ec) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + ec.offerCode, {
                      capacity: ec.capacity
                    });
                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + ec.offerCode, {
                      capacity: ec.capacity
                    });
                    count++;
                  }
                ); //siteEC.forEach

              } else {
                siteRow.ECLicensed = false;
              }

              //SC
              var siteSC = _.where(allSitesWebexLicensesArray, {
                webexSite: siteUrl,
                offerCode: "SC"
              });

              if (siteSC != null && siteSC.length > 0) {
                siteRow.SCLicensed = true;

                siteSC.forEach(
                  function processDisplayText(sc) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + sc.offerCode, {
                      capacity: sc.capacity
                    });
                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + sc.offerCode, {
                      capacity: sc.capacity
                    });
                    count++;
                  }
                ); //siteSC.forEach

              } else {
                siteRow.SCLicensed = false;
              }

              //TC
              var siteTC = _.where(allSitesWebexLicensesArray, {
                webexSite: siteUrl,
                offerCode: "TC"
              });

              if (siteTC != null && siteTC.length > 0) {
                siteRow.TCLicensed = true;

                siteTC.forEach(
                  function processDisplayText(tc) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + tc.offerCode, {
                      capacity: tc.capacity
                    });
                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + tc.offerCode, {
                      capacity: tc.capacity
                    });
                    count++;
                  }
                ); //siteTC.forEach

              } else {
                siteRow.TCLicensed = false;
              }

              if (count > 1) {
                siteRow.multipleWebexServicesLicensed = true;
                siteRow.licenseTypeContentDisplay = $translate.instant('siteList.multipleLicenses');
                siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay.replace("<br>", "");

              } else {
                siteRow.multipleWebexServicesLicensed = false;
                siteRow.licenseTooltipDisplay = null;
              }

              logMsg = funcName + ": " + "\n" +
                "siteRow=" + JSON.stringify(siteRow);
              //$log.log(logMsg);

              siteRow.showLicenseTypes = true;
            } // processGridForLicense()
          ); // siteRows.gridData.forEach()

        }, // getWebexLicenseInfoSuccess()

        function getWebexLicenseInfoError(result) {
          var funcName = "getWebexLicenseInfoError()";
          var logMsg = "";

          logMsg = funcName + ": " + "\n" +
            "result=" + JSON.stringify(result);
          //$log.log(logMsg);
        } // getWebexLicenseInfoError()
      ); //getWebexLicenseInfo.then()

    }; // updateLicenseTypesColumn

    siteRows.updateWebExDataColumns = function () {
      var funcName = "updateWebExDataColumns()";
      var logMsg = "";
      //$log.log(funcName);

      siteRows.gridData.forEach(
        function processSiteRow(siteRow) {
          var funcName = "processSiteRow()";
          var logMsg = "";

          siteRows.updateWebExColumnsInRow(siteRow);
        } // processSiteRow()
      ); // gridData.forEach()

    }; // updateWebExDataColumns

    siteRows.updateWebExColumnsInRow = function (siteRow) {
      var funcName = "updateWebExColumnsInRow()";
      var logMsg = "";
      //$log.log(logMsg);

      //var siteUrl = siteRow.license.siteUrl;

      siteRow.adminEmailParam = Authinfo.getPrimaryEmail();
      siteRow.userEmailParam = Authinfo.getPrimaryEmail();
      siteRow.advancedSettings = UrlConfig.getWebexAdvancedEditUrl(siteRow.siteUrl);
      siteRow.webexAdvancedUrl = UrlConfig.getWebexAdvancedHomeUrl(siteRow.siteUrl);

      WebExApiGatewayService.isSiteSupportsIframe(siteRow.siteUrl).then(
        function isSiteSupportsIframeSuccess(result) {
          var funcName = "isSiteSupportsIframeSuccess()";
          var logMsg = "";

          logMsg = funcName + ": " + "\n" +
            "result=" + JSON.stringify(result);
          // $log.log(logMsg);

          siteRow.isIframeSupported = result.isIframeSupported;
          siteRow.isAdminReportEnabled = result.isAdminReportEnabled;
          siteRow.isCSVSupported = result.isCSVSupported;

          siteRow.showSiteLinks = true;

          logMsg = funcName + ": " + "\n" +
            "siteUrl=" + siteRow.siteUrl + "\n" +
            "siteRow.isCSVSupported=" + siteRow.isCSVSupported + "\n" +
            "siteRow.isIframeSupported=" + siteRow.isIframeSupported + "\n" +
            "siteRow.isAdminReportEnabled=" + siteRow.isAdminReportEnabled + "\n" +
            "siteRow.showSiteLinks=" + siteRow.showSiteLinks;
          //$log.log(logMsg);

          if (
            (!siteRow.isCSVSupported) ||
            (!siteRow.showCSVIconAndResults)
          ) {

            // no further data to get
            siteRow.showCSVInfo = true;
            return;
          }

          siteRows.updateCSVStatusInRow(siteRow.siteUrl);

          // start CSV status poll
          var pollInterval = 30000; // 30sec (15000 is 15sec; 3600000 is 1hr;) 
          siteRow.csvPollIntervalObj = $interval(
            function () {
              siteRows.updateCSVStatusInRow(siteRow.siteUrl);
            },

            pollInterval
          );
        }, // isSiteSupportsIframeSuccess()

        function isSiteSupportsIframeError(response) {
          var funcName = "isSiteSupportsIframeError()";
          var logMsg = "";

          siteRow.isIframeSupported = false;
          siteRow.isAdminReportEnabled = false;
          siteRow.showSiteLinks = true;
          siteRow.showCSVInfo = true;
          siteRow.isError = true;

          if (response.response.indexOf("030048") != -1) {
            siteRow.isWarn = true;
          }

          logMsg = funcName + ": " + "\n" +
            "response=" + JSON.stringify(response);
          //$log.log(logMsg);
        } // isSiteSupportsIframeError()
      ); // WebExApiGatewayService.isSiteSupportsIframe().then
    }; // updateWebExColumnsInRow()

    siteRows.updateCSVStatusInRow = function (siteUrl) {
      var funcName = "WebExSiteRowService.updateCSVStatusInRow()";
      var logMsg = "";

      var siteRow = siteRows.getSiteRow(siteUrl);
      logMsg = funcName + "\n" +
        "siteRow=" + "\n" + JSON.stringify(siteRow);
      //$log.log(logMsg);

      //var siteUrl = siteRow.siteUrl;
      var mockCsvStatusReq = null;

      if (
        (null != siteRow.csvMock) &&
        (siteRow.csvMock.mockStatus)
      ) {

        if (null == siteRow.csvMock.mockStatusCurrentIndex) {
          siteRow.csvMock.mockStatusCurrentIndex = siteRow.csvMock.mockStatusStartIndex;
        }

        mockCsvStatusReq = WebExApiGatewayConstsService.csvStatusTypes[siteRow.csvMock.mockStatusCurrentIndex];

        logMsg = funcName + "\n" +
          "mockStatusCurrentIndex=" + siteRow.csvMock.mockStatusCurrentIndex + "\n" +
          "mockCsvStatusReq=" + mockCsvStatusReq;
        // $log.log(logMsg);

        ++siteRow.csvMock.mockStatusCurrentIndex;

        if (
          (WebExApiGatewayConstsService.csvStatusTypes.length <= siteRow.csvMock.mockStatusCurrentIndex) ||
          (siteRow.csvMock.mockStatusEndIndex < siteRow.csvMock.mockStatusCurrentIndex)
        ) {

          siteRow.csvMock.mockStatusCurrentIndex = siteRow.csvMock.mockStatusStartIndex;
        }
      }

      WebExApiGatewayService.csvStatus(
        siteRow.siteUrl,
        siteRow.csvMock.mockStatus,
        mockCsvStatusReq
      ).then(

        function success(response) {
          var funcName = "WebExApiGatewayService.csvStatus.success()";
          var logMsg = "";

          logMsg = funcName + "\n" +
            "siteUrl=" + siteRow.siteUrl + "\n" +
            "response=" + JSON.stringify(response);
          //$log.log(logMsg);

          // save the response obj into the siteRow obj... when get result (for completed job) is clicked,
          // we will need  more information from the response obj
          siteRow.csvStatusObj = response;
          siteRow.asyncErr = false;

          siteRows.updateDisplayControlFlagsInRow(siteRow);
        }, // csvStatusSuccess()

        function error(response) {
          var funcName = "WebExApiGatewayService.csvStatus.error()";
          var logMsg = "";

          logMsg = funcName + "\n" +
            "siteUrl=" + siteRow.siteUrl + "\n" +
            "response=" + JSON.stringify(response);
          //$log.log(logMsg);

          siteRow.csvStatusObj = response;
          siteRow.asyncErr = true;

          siteRows.updateDisplayControlFlagsInRow(siteRow);

          siteRow.showCSVInfo = false;
        } // csvStatusError()
      ); // WebExApiGatewayService.csvStatus(siteRow.siteUrl).then()
    }; // updateCSVStatusInRow()

    siteRows.updateDisplayControlFlagsInRow = function (siteRow) {

      var funcName = "updateDisplayControlFlagsInRow()";
      var logMsg = "";

      logMsg = funcName + "\n" +
        "siteRow.csvStatusObj=" + "\n" + JSON.stringify(siteRow.csvStatusObj);
      // $log.log(logMsg);

      //initialize display control flags
      siteRow.showCSVInfo = true;

      siteRow.showExportLink = false;
      siteRow.showExportInProgressLink = false;
      siteRow.grayedExportLink = false;
      siteRow.showExportResultsLink = false;
      siteRow.exportFinishedWithErrors = false;

      siteRow.showImportLink = false;
      siteRow.showImportInProgressLink = false;
      siteRow.grayedImportLink = false;
      siteRow.showImportResultsLink = false;
      siteRow.importFinishedWithErrors = false;

      if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.none) {

        siteRow.showExportLink = true;

        siteRow.showImportLink = true;

      } else if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.exportInProgress) {

        siteRow.showExportInProgressLink = true;

        siteRow.grayedImportLink = true;

      } else if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.exportCompletedNoErr) {

        siteRow.showExportLink = true;
        siteRow.showExportResultsLink = true;

        siteRow.showImportLink = true;

      } else if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.exportCompletedWithErr) {

        siteRow.showExportLink = true;
        siteRow.showExportResultsLink = true;
        siteRow.exportFinishedWithErrors = true;

        siteRow.showImportLink = true;

      } else if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.importInProgress) {

        siteRow.showImportInProgressLink = true;

        siteRow.grayedExportLink = true;

      } else if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.importCompletedNoErr) {

        siteRow.showExportLink = true;

        siteRow.showImportLink = true;
        siteRow.showImportResultsLink = true;

      } else if (siteRow.csvStatusObj.status == WebExApiGatewayConstsService.csvStates.importCompletedWithErr) {

        siteRow.showExportLink = true;

        siteRow.showImportLink = true;
        siteRow.showImportResultsLink = true;
        siteRow.importFinishedWithErrors = true;

      }

      siteRow.showCSVInfo = true;
    }; //updateDisplayControlFlagsInRow()

    return siteRows;

  } // WebExSiteRowService
})();