// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
  'use strict';

  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine', 'sinon'],

    /**
     * This is the list of file patterns to load into the browser during testing.
     */
    files: [ <% scripts.forEach(function (file) { %> '<%= file %>', <%
      }); %>
      'build/scripts/**/*.js',
      'build/templates-app.js',
      'build/modules/**/*.js',
      'test/global.spec.js',
      'test/**/spec/**/*.js', {
        pattern: 'test/fixtures/**/*.json',
        watched: true,
        served: true,
        included: false
      }
    ],

    preprocessors: {
      'build/scripts/**/*.js': ['coverage'],
      'build/templates-app.js': ['coverage'],
      'build/modules/**/*.js': ['coverage']
    },

    coverageReporter: {
      dir: 'coverage/unit',
      type: 'cobertura'
    },

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],
    // browsers: ['Chrome'],

    // Which plugins to enable
    plugins: [
      'karma-coverage',
      'karma-phantomjs-launcher',
      // 'karma-chrome-launcher',
      'karma-jasmine',
      'karma-sinon',
      'karma-junit-reporter'
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    reporters: ['dots', 'junit', 'coverage'],

    junitReporter: {
      outputFile: 'test/unit-test-results.xml',
      suite: ''
    },

    // Increasing timeout to fix issues seen in the Oslo Jenkins
    // Related? https://github.com/karma-runner/karma/issues/598
    browserNoActivityTimeout: 60000
  });
};
