(function () {
  'use strict';

  angular
    .module('Sunlight')
    .controller('CareChatSetupAssistantCtrl', CareChatSetupAssistantCtrl);

  /* @ngInject */
  function CareChatSetupAssistantCtrl($modal, $timeout) {
    var vm = this;

    vm.cancelModal = cancelModal;
    vm.evalKeyPress = evalKeyPress;

    // Setup assistant controller functions
    vm.nextPage = nextPage;
    vm.previousPage = previousPage;
    vm.nextButton = nextButton;
    vm.previousButton = previousButton;
    vm.getPageIndex = getPageIndex;
    vm.animation = 'slide-left';

    // Setup Assistant pages with index
    vm.states = ['name',
      'profile',
      'overview',
      'customer',
      'feedback',
      'agentUnavailable',
      'offHours',
      'chatStrings',
      'embedCode'
    ];

    vm.currentState = vm.states[0];

    vm.animationTimeout = 10;

    vm.escapeKey = 27;
    vm.leftArrow = 37;
    vm.rightArrow = 39;

    vm.template = {
      name: '',
      mediaType: 'chat',
      configuration: {
        pages: {
          customerInformation: {
            enabled: true
          },
          agentUnavailable: {
            enabled: true
          },
          offHours: {
            enabled: true
          },
          feedback: {
            enabled: true
          }
        }
      }
    };

    vm.overview = {
      customerInformation: 'circle-user',
      agentUnavailable: 'circle-comp-negative',
      offHours: 'circle-clock-hands',
      feedback: 'circle-star'
    };

    function cancelModal() {
      $modal.open({
        templateUrl: 'modules/sunlight/features/chat/ctCancelModal.tpl.html'
      });
    }

    function evalKeyPress(keyCode) {
      switch (keyCode) {
      case vm.escapeKey:
        cancelModal();
        break;
      case vm.rightArrow:
        if (nextButton(vm.currentState) === true) {
          nextPage();
        }
        break;
      case vm.leftArrow:
        if (previousButton(vm.currentState) === true) {
          previousPage();
        }
        break;
      default:
        break;
      }
    }

    function getPageIndex() {
      return vm.states.indexOf(vm.currentState);
    }

    function validatePageName() {
      if (vm.template.name === '') {
        return false;
      }
      return true;
    }

    function nextButton() {
      var retVal = true;

      switch (vm.currentState) {
      case 'name':
        retVal = validatePageName();
        break;
      case 'embedCode':
        retVal = 'hidden';
        break;
      default:
        break;
      }
      return retVal;
    }

    function previousButton() {
      if (vm.currentState === vm.states[0]) {
        return 'hidden';
      }
      return true;
    }

    function nextPage() {
      vm.animation = 'slide-left';
      $timeout(function () {
        vm.currentState = vm.states[getPageIndex() + 1];
      }, vm.animationTimeout);
    }

    function previousPage() {
      vm.animation = 'slide-right';
      $timeout(function () {
        vm.currentState = vm.states[getPageIndex() - 1];
      }, vm.animationTimeout);
    }

  }
})();
