/*global module:false*/
module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    bowercopy: {
        options: {
            clean: false
        },
        libs: {
            options: {
              destPrefix: 'public/js/vendor'
            },
            files: {
              "jquery/jquery.min.js": "jquery/dist/jquery.min.js",
              "jquery/jquery.min.map": "jquery/dist/jquery.min.map",
              "requirejs/require.js": "requirejs/require.js",
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-bowercopy');

  grunt.registerTask('default', ['bowercopy']);
};