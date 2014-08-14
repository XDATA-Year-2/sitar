/* global module */

module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jade: {
            release: {
                options: {
                    data: {
                        debug: false
                    }
                },
                files: {
                    "build/index.html": "jade/index.jade"
                }
            }
        },
        stylus: {
            compile: {
                options: {},
                files: {
                    "build/index.css": "styl/index.styl"
                }
            }
        },
        jshint: {
            options: {
                // Enforcing options (for strict checking, should be true by
                // default; set to false indicates departure from this policy).
                bitwise: true,
                camelcase: true,
                curly: true,
                eqeqeq: true,
                forin: true,
                immed: true,
                indent: 4,
                latedef: true,
                newcap: true,
                noempty: false,
                nonbsp: true,
                nonew: true,
                plusplus: false,
                quotmark: "double",
                undef: true,
                unused: true,
                strict: true,
                maxparams: false,
                maxdepth: false,
                maxstatements: false,
                maxcomplexity: false,
                maxlen: false,

                // Relaxing options (for strict checking, should be false by
                // default; set to true indicates departure from this policy).
                eqnull: true,

                // Environment options.
                browser: true
            },
            all: ["Gruntfile.js", "js/**/*.js"]
        },
        jscs: {
            src: "js/**/*.js",
            options: {
                validateIndentation: 4
            }
        },
        uglify: {
            index: {
                options: {
                    sourceMap: true
                },
                files: {
                    "build/js/index.min.js": ["js/index.js"],
                    "build/js/lib.min.js": ["js/preamble.js",
                                            "js/backbone-ui.js"]
                }
            }
        },
        clean: ["build"]
    });

    // Load plugins.
    grunt.loadNpmTasks("grunt-contrib-jade");
    grunt.loadNpmTasks("grunt-contrib-stylus");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-clean");

    // Default task.
    grunt.registerTask("default", ["jade",
                                   "stylus",
                                   "jshint",
                                   "jscs",
                                   "uglify"]);
};
