'use strict';

describe('Controller: AAMessageTypeCtrl', function () {
  var AAUiModelService, AutoAttendantCeMenuModelService, AACommonService;
  var $rootScope, $scope, $window;
  var menuEntry;

  var aaUiModel = {
    openHours: {},
    ceInfo: {
      name: 'AA2',
    },
  };

  var schedule = 'openHours';
  var index = '0';
  var dynamicElement;
  var scopeElement;

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$rootScope_, _AAUiModelService_, _AutoAttendantCeMenuModelService_, _AACommonService_, _$window_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    $window = _$window_;

    AAUiModelService = _AAUiModelService_;
    AACommonService = _AACommonService_;

    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;

    $scope.schedule = schedule;
    $scope.index = index;
  }));

  afterEach(function () {
    $rootScope = null;
    $scope = null;
    AAUiModelService = null;
    AutoAttendantCeMenuModelService = null;
  });

  describe('AAMessageType', function () {
    var controller;

    beforeEach(inject(function ($controller) {
      $scope = $rootScope;
      controller = $controller;
      spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);
    }));

    afterEach(function () {
      controller = null;
    });


    describe('dynamic functionality', function () {
      beforeEach(function () {
        scopeElement = {
          insertElement: function (string) {
            return string;
          },
        };
        dynamicElement = {
          scope: function () {
            return true;
          },
          focus: function () {},
        };
        var rangeGetter = function () {
          var range = {
            collapsed: true,
            endContainer: {
              ownerDocument: {
                activeElement: {
                  childNodes: [{
                    nodeName: '#text',
                    nodeValue: 'this is test say message',
                  }, {
                    nodeName: 'SPAN',
                    parentElement: {
                      attributes: [{
                        value: 'Test Attribute',
                      }, {
                        value: 'NUMBER',
                      }, {
                        value: 'dummyId',
                      }],
                    },
                  }],
                  className: 'dynamic-prompt aa-message-height',
                  id: 'messageTypeopenHours0',
                },
              },
            },
          };
          return range;
        };
        spyOn(angular, 'element').and.returnValue(dynamicElement);
        spyOn(dynamicElement, 'focus');
        spyOn(dynamicElement, 'scope').and.returnValue(scopeElement);
        spyOn(AACommonService, 'isDynAnnounceToggle').and.returnValue(true);
        spyOn(AACommonService, 'isMediaUploadToggle').and.returnValue(true);
        spyOn(scopeElement, 'insertElement');
        spyOn($window, 'getSelection').and.returnValue({
          getRangeAt: rangeGetter,
          rangeCount: true,
          removeAllRanges: function () {
            return true;
          },
          addRange: function () {
            return true;
          },
        });
      });

      it('should be able to create new AA entry', function () {
        var c;
        var action = AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', '');
        action.dynamicList = [{
          say: {
            value: 'dummy message',
            voice: '',
          },
          isDynamic: true,
          htmlModel: '',
        }];
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(action);

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        expect(c).toBeDefined();
        expect(c.dynamicValues[0].model).toEqual('dummy message');
      });

      it('should be able to create new AA entry with dynamicValues set to value', function () {
        var c;
        var action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
        action.dynamicList = [{
          say: {
            value: 'test message',
            voice: '',
          },
          isDynamic: true,
          htmlModel: '',
        }];
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(action);

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });
        expect(c.dynamicValues.length).toEqual(1);
        expect(c.dynamicValues[0].model).toEqual('test message');
      });

      it('should be able to switch play action to dynamic action', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('play', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.messageOption = c.messageOptions[1];

        c.actionEntry = menuEntry.actions[0];
        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('dynamic');
      });

      it('should be able to switch dynamic action to play action', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', ''));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.messageOption = c.messageOptions[0];

        c.actionEntry = menuEntry.actions[0];
        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('play');
      });

      it('should be able to create dynamicList', function () {
        var c;
        var action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
        action.dynamicList = [{
          say: {
            value: '',
            voice: '',
          },
          isDynamic: false,
          htmlModel: '',
        }];
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(action);

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.actionEntry = menuEntry.actions[0];
        expect(c.actionEntry.dynamicList[0].say.value).toEqual('');
        c.saveDynamicUi();
        expect(c.actionEntry.dynamicList[0].say.value).toEqual('this is test say message');
        expect(c.actionEntry.dynamicList[1].say.value).toEqual('Test Attribute');
        expect(c.actionEntry.dynamicList[1].isDynamic).toEqual(true);
      });
    });

    describe('activate', function () {
      it('should be able to create new AA entry', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', 'http://www.test.com'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        expect(c).toBeDefined();
        expect(c.menuEntry.actions[0].name).toEqual('runActionsOnInput');
        expect(c.menuEntry.actions[0].value).toEqual('http://www.test.com');
      });

      it('should be able to create new AA entry with messageInput set to value', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', 'Hello World'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        expect(c).toBeDefined();
        expect(c.messageInput).toEqual('Hello World');
      });


      it('should be able to create new AA entry with messageInput set to value', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.messageInput = 'Hello World';

        c.saveUiModel();

        expect(c.actionEntry.value).toEqual('Hello World');
      });
      it('should not set value to messageInput when action is upload', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.messageOption.value = 'uploadFile';

        c.messageInput = 'Hello World';

        c.saveUiModel();

        expect(c.actionEntry.value).toEqual('value for say message');
      });

      it('should be able to save and set Message Options', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.actionEntry = menuEntry.actions[0];
        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('value for say message');
      });
      it('should be able to switch say action to play action', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('say', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.messageOption = c.messageOptions[0];

        c.actionEntry = menuEntry.actions[0];
        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('play');
      });

      it('should be able to switch play action to say action', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('play', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.messageOption = c.messageOptions[1];

        c.actionEntry = menuEntry.actions[0];
        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('say');
      });
      it('should be able blank out old play action when record saved with save action', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('say', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.actionEntry = menuEntry.actions[0];

        c.messageOption = c.messageOptions[0];

        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('play');

        c.actionEntry.value = 'Play URL here';

        // back to SAY message

        c.messageOption = c.messageOptions[1];

        c.setMessageOptions();

        // now old play message info is in holding area

        // should clear this holding area
        $rootScope.$broadcast('CE Saved');

        // move back to play
        c.messageOption = c.messageOptions[0];

        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('play');
      });
      it('should be able blank out old say/dynamic action when record saved with Play action', function () {
        var c;
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('play', 'value for say message'));

        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);

        // setup the options menu
        c = controller('AAMessageTypeCtrl', {
          $scope: $scope,
        });

        c.actionEntry = menuEntry.actions[0];

        c.messageOption = c.messageOptions[1];

        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('say');

        c.actionEntry.value = 'My old Say Message';

        // back to Play message

        c.messageOption = c.messageOptions[0];

        c.setMessageOptions();

        // now old say message info is in holding area

        // should clear this holding area
        $rootScope.$broadcast('CE Saved');

        // move back to Say
        c.messageOption = c.messageOptions[1];

        c.setMessageOptions();

        expect(c.actionEntry.value).toEqual('');

        expect(c.actionEntry.name).toEqual('say');
      });
    });
    it('should be able to create new AA entry creating a say action for Menu Header', function () {
      var c;
      var action;

      $scope.isMenuHeader = 'true';

      menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();

      action = (AutoAttendantCeMenuModelService.newCeActionEntry('say', 'value for say message'));

      menuEntry.actions.push(action);

      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel.openHours.type = 'MENU_OPTION_ANNOUNCEMENT';

      aaUiModel.openHours.headers[0] = menuEntry;
      aaUiModel.openHours.headers[0].type = 'MENU_OPTION_ANNOUNCEMENT';

      spyOn(AutoAttendantCeMenuModelService, 'getCeMenu').and.returnValue(aaUiModel.openHours);

      // setup the options menu
      c = controller('AAMessageTypeCtrl', {
        $scope: $scope,
      });

      expect(c.actionEntry.name).toEqual('say');
    });

    it('should be able to create new AA entry creating a say action for Phone Menu type', function () {
      var c;
      var action;

      $scope.menuId = '001';
      $scope.menuKeyIndex = '0';

      menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();

      action = (AutoAttendantCeMenuModelService.newCeActionEntry('say', 'value for say message'));

      menuEntry.actions.push(action);

      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel.openHours.addEntryAt(0, menuEntry);

      spyOn(AutoAttendantCeMenuModelService, 'getCeMenu').and.returnValue(aaUiModel.openHours);

      // setup the options menu
      c = controller('AAMessageTypeCtrl', {
        $scope: $scope,
      });

      expect(c.actionEntry.name).toEqual('say');
    });

    it('should be able to create new AA entry creating a say action for Phone Menu type: sub menu', function () {
      var c;
      var action;

      $scope.menuId = '1';

      menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();

      action = (AutoAttendantCeMenuModelService.newCeActionEntry('say', 'value for say message'));

      menuEntry.actions.push(action);

      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel.openHours.type = 'MENU_OPTION_ANNOUNCEMENT';

      aaUiModel.openHours.headers[0] = menuEntry;
      aaUiModel.openHours.headers[0].type = 'MENU_OPTION_ANNOUNCEMENT';

      spyOn(AutoAttendantCeMenuModelService, 'getCeMenu').and.returnValue(aaUiModel.openHours);

      // setup the options menu
      c = controller('AAMessageTypeCtrl', {
        $scope: $scope,
      });

      expect(c.actionEntry.name).toEqual('say');
    });

    it('should be able to create new AA action entry Queue type', function () {
      var c;
      var action;
      var moh;

      $scope.menuId = '001';
      $scope.menuKeyIndex = '0';
      $scope.type = 'moh';
      menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();

      action = (AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', 'value for say message'));
      moh = {};

      moh.actions = [];

      moh.actions[0] = (AutoAttendantCeMenuModelService.newCeActionEntry('play', 'Music on hold'));

      action.queueSettings = {};
      action.queueSettings.moh = moh;

      menuEntry.addAction(action);

      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel.openHours.addEntryAt(0, menuEntry);

      spyOn(AutoAttendantCeMenuModelService, 'getCeMenu').and.returnValue(aaUiModel.openHours);

      // setup the options menu
      c = controller('AAMessageTypeCtrl', {
        $scope: $scope,
      });

      expect(c.actionEntry.name).toEqual('play');
    });
  });
});
