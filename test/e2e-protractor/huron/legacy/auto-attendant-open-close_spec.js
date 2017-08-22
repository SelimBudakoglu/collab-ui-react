'use strict';

/*eslint-disable */

describe('Huron Auto Attendant', function () {
  var testAAName;
  var testCardClick;
  var testCardClose;

  beforeAll(function () {
    deleteUtils.testAAName = deleteUtils.testAAName + "_" + Date.now();

    testAAName = element(by.css('p[title="' + deleteUtils.testAAName + '"]'));
    testCardClick = testAAName.element(by.xpath('ancestor::article')).element(by.css('.card-body'));
    testCardClose = testAAName.element(by.xpath('ancestor::article')).element(by.css('.header-with-right-icon')).element(by.css('.card-icon-div')).element(by.css('.close'));

    login.login('aa-admin', autoattendant.callFeature);

  }, 120000);

  afterAll(function () {
    var flow = protractor.promise.controlFlow();
    return flow.execute(deleteUtils.findAndDeleteTestAA);
  });

  describe('Create and Delete AA', function () {

    // TEST CASES
    it('should navigate to AA landing page and create AA', function () {

      // click new feature
      utils.click(autoattendant.newFeatureButton);

      // select AA
      utils.wait(autoattendant.featureTypeAA, 12000);
      utils.click(autoattendant.featureTypeAA);

      utils.wait(autoattendant.openClosedAA, 12000);
      utils.click(autoattendant.openClosedAA);

      // enter AA name
      utils.sendKeys(autoattendant.newAAname, deleteUtils.testAAName);
      utils.sendKeys(autoattendant.newAAname, protractor.Key.ENTER);

      // assert we see the create successful message
      autoattendant.assertCreateSuccess(deleteUtils.testAAName);
    }, 60000);

    it('should create an open hours and a closed hours lanes', function () {

      autoattendant.scrollIntoView(autoattendant.schedule);

      // expect to see an open hours lane
      utils.expectIsDisplayed(autoattendant.openHoursLane);
      utils.expectIsNotPresent(autoattendant.openHoursSayMessage);
      utils.expectIsNotPresent(autoattendant.openHoursPhoneMenu);
      utils.expectIsDisplayed(autoattendant.openHoursEndCall);

      // expect to see closed hours lane
      utils.expectIsDisplayed(autoattendant.closedHoursLane);
      utils.expectIsNotPresent(autoattendant.closedHoursSayMessage);
      utils.expectIsNotPresent(autoattendant.closedHoursPhoneMenu);
      utils.expectIsDisplayed(autoattendant.closedHoursEndCall);

    }, 60000);
    it('should create a 8am to 5pm, Monday to Friday open hours schedule', function () {

      autoattendant.scrollIntoView(autoattendant.schedule);
      utils.click(autoattendant.schedule);
      utils.expectCheckbox(autoattendant.day1, true);
      utils.expectCheckbox(autoattendant.day2, true);
      utils.expectCheckbox(autoattendant.day3, true);
      utils.expectCheckbox(autoattendant.day4, true);
      utils.expectCheckbox(autoattendant.day5, true);
      utils.expectCheckbox(autoattendant.day6, false);
      utils.expectCheckbox(autoattendant.day7, false);
      utils.expectValueToContain(autoattendant.starttime, '08:00 AM');
      utils.expectValueToContain(autoattendant.endtime, '05:00 PM');
      utils.wait(autoattendant.modalcancel, 12000);
      utils.click(autoattendant.modalcancel);

    }, 60000);
/*
    it('should add a second phone number to the new auto attendant named "' + deleteUtils.testAAName + '"', function () {

      autoattendant.scrollIntoView(autoattendant.lanesWrapper);
      utils.click(autoattendant.numberDropDownArrow);

      // we are going to arbitrarily select the last one
      utils.click(autoattendant.numberDropDownOptions.last());

      // save and assert we see successful save message and save is disabled
      utils.click(autoattendant.saveButton);
      autoattendant.assertUpdateSuccess(deleteUtils.testAAName);
      utils.expectIsDisabled(autoattendant.saveButton);

    }, 60000);
*/
    it('should close AA edit and return to landing page', function () {

      utils.click(autoattendant.closeEditButton);

    });

    it('should find new AA named "' + deleteUtils.testAAName + '" on the landing page', function () {

      utils.expectIsEnabled(testAAName);

    });

    it('should delete new AA named "' + deleteUtils.testAAName + '" on the landing page', function () {

      // click delete X on the AA card for e2e test AA
      utils.click(testCardClose);

      // confirm dialog with e2e AA test name in it is there, then agree to delete
      utils.expectText(autoattendant.deleteModalConfirmText, 'Are you sure you want to delete the ' + deleteUtils.testAAName + ' Auto Attendant?').then(function () {
        utils.click(autoattendant.deleteModalConfirmButton);
        autoattendant.assertDeleteSuccess(deleteUtils.testAAName);
      });

    }, 60000);

  });

});
