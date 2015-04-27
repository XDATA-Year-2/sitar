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
                    "build/site/index.html": "src/jade/index.jade"
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
                    "build/jade/templates.js": ["src/jade/templates/**/*.jade"]
                }
            }
        },
        stylus: {
            compile: {
                options: {},
                files: {
                    "build/site/index.css": "src/styl/index.styl"
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
                browser: true,

                // Set this to true for debugging, false for release.
                devel: true
            },
            all: ["Gruntfile.js", "src/js/**/*.js"]
        },
        jscs: {
            src: "src/js/**/*.js",
            options: {
                validateIndentation: 4
            }
        },
        uglify: {
            index: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    beautify: false
                },
                files: {
                    "build/site/js/index.min.js": ["src/js/index.js"],
                    "build/site/js/lib.min.js": ["src/ext/js/jade-runtime.js",
                                                 "src/ext/js/papaparse.min.js",
                                                 "build/jade/templates.js",
                                                 "src/js/preamble.js",
                                                 "src/js/util.js",
                                                 "src/js/model/*.js",
                                                 "src/js/collection/*.js",
                                                 "src/js/view/*.js",
                                                 "src/js/router/Router.js"]
                }
            }
        },
        untar: {
            lyra: {
                files: {
                    "build/site": "src/ext/lyra.tar.gz"
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
    grunt.loadNpmTasks("grunt-untar");
    grunt.loadNpmTasks("grunt-contrib-clean");

    // Default task.
    grunt.registerTask("default", ["jade",
                                   "stylus",
                                   "jshint",
                                   "jscs",
                                   "uglify",
                                   "untar"]);
};
