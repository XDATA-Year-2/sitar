/* jshint browser: true, devel: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    app.view.Login = Backbone.View.extend({
        events: {
            "submit form": "submit",
            "click button.register": "register"
        },

        render: function (options) {
            options = options || {};

            d3.select(this.el)
                .html(app.templates.login({
                    jumpback: options.jumpback
                }));
        },

        submit: function (evt) {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");

            // Attempt to log the user in if not already logged in.
            app.user.fetch({
                username: username,
                password: password,
                success: function () {
                    app.jumpback = null;

                    d3.select("#jumpback")
                        .classed("hidden", true);

                    d3.select("#failed")
                        .classed("hidden", true);

                    d3.select("#username")
                        .property("value", "");

                    d3.select("#password")
                        .property("value", "");

                    app.router.longjmp("gallery");
                },
                error: function () {
                    d3.select("#failed")
                        .classed("hidden", false);
                }
            });

            evt.preventDefault();
        },

        register: function () {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");
        }
    });
}(window.app));
