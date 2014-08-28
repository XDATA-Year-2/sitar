/* jshint node: true */

module.exports = function (grunt) {
    "use strict";

    // Node modules.
    var path = require("path");

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jade: {
            static: {
                options: {
                    data: {
                        debug: false
                    }
                },
                files: {
                    "build/site/index.html": "jade/index.jade"
                }
            },
            template: {
                options: {
                    client: true,
                    namespace: "app.templates",
                    processName: function (filename) {
                        return path.basename(filename, ".jade");
                    }
                },
                files: {
                    "build/jade/templates.js": ["jade/templates/**/*.jade"]
                }
            }
        },
        stylus: {
            compile: {
                options: {},
                files: {
                    "build/site/index.css": "styl/index.styl"
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
            all: ["Gruntfile.js", "js/src/**/*.js"]
        },
        jscs: {
            src: "js/src/**/*.js",
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
                    "build/site/js/index.min.js": ["js/src/index.js"],
                    "build/site/js/lib.min.js": ["js/ext/jade-runtime.js",
                                                 "build/jade/templates.js",
                                                 "js/src/preamble.js",
                                                 "js/src/RadioDisplay.js",
                                                 "js/src/model/model.js",
                                                 "js/src/collection/collection.js",
                                                 "js/src/view/view.js",
                                                 "js/src/router/router.js"]
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
