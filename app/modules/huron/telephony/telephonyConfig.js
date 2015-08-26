(function () {
  'use strict';

  angular
    .module('Huron')
    .factory('HuronConfig', ['Config',
      function (Config) {
        var config = {
          cmiUrl: {
            dev: 'https://cmi.hptx1.huron-dev.com/api/v1',
            integration: 'https://cmi.hptx1.huron-dev.com/api/v1',
            prod: 'https://cmi.sc-tx2.huron-dev.com/api/v1'
          },
          cmiV2Url: {
            dev: 'https://cmi.hptx1.huron-dev.com/api/v2',
            integration: 'https://cmi.hptx1.huron-dev.com/api/v2',
            prod: 'https://cmi.sc-tx2.huron-dev.com/api/v2'
          },

          cesUrl: {
            dev: 'https://ces.hptx1.huron-dev.com/api/v1',
            integration: 'https://ces.hptx1.huron-dev.com/api/v1',
            prod: 'https://ces.sc-tx2.huron-dev.com/api/v1'
          },

          emailUrl: {
            dev: 'https://hermes.hptx1.huron-dev.com/api/v1',
            integration: 'https://hermes.hptx1.huron-dev.com/api/v1',
            prod: 'https://hermes.sc-tx2.huron-dev.com/api/v1'
          },

          terminusUrl: {
            dev: 'https://terminus.hptx1.huron-dev.com/api/v1',
            integration: 'https://terminus.hptx1.huron-dev.com/api/v1',
            prod: 'https://terminus.sc-tx2.huron-dev.com/api/v1'
          },

          // TODO: Point to Ocelot micro service when it's ready.
          ocelotUrl: {
            dev: 'https://hermes.hptx1.huron-dev.com/api/v1',
            integration: 'https://hermes.hptx1.huron-dev.com/api/v1',
            prod: 'https://hermes.sc-tx2.huron-dev.com/api/v1'
          },

          getCmiUrl: function () {
            if (Config.isDev()) {
              return this.cmiUrl.dev;
            } else if (Config.isIntegration()) {
              return this.cmiUrl.integration;
            } else {
              return this.cmiUrl.prod;
            }
          },

          getCmiV2Url: function () {
            if (Config.isDev()) {
              return this.cmiV2Url.dev;
            } else if (Config.isIntegration()) {
              return this.cmiV2Url.integration;
            } else {
              return this.cmiV2Url.prod;
            }
          },

          getCesUrl: function () {
            if (Config.isDev()) {
              return this.cesUrl.dev;
            } else if (Config.isIntegration()) {
              return this.cesUrl.integration;
            } else {
              return this.cesUrl.prod;
            }
          },

          getEmailUrl: function () {
            if (Config.isDev()) {
              return this.emailUrl.dev;
            } else if (Config.isIntegration()) {
              return this.emailUrl.integration;
            } else {
              return this.emailUrl.prod;
            }
          },

          getTerminusUrl: function () {
            if (Config.isDev()) {
              return this.terminusUrl.dev;
            } else if (Config.isIntegration()) {
              return this.terminusUrl.integration;
            } else {
              return this.terminusUrl.prod;
            }
          },

          getOcelotUrl: function () {
            if (Config.isDev()) {
              return this.ocelotUrl.dev;
            } else if (Config.isIntegration()) {
              return this.ocelotUrl.integration;
            } else {
              return this.ocelotUrl.prod;
            }
          }

        };
        return config;
      }
    ]);
})();
