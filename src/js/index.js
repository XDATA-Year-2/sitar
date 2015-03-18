/* jshint browser: true, jquery: true */
/* global Backbone, girder */

$(function () {
    "use strict";

    var app = window.app;

    // Initialize Girder.
    girder.apiRoot = "/plugin/girder/girder/api/v1";

    // A "sitar root", meaning a girder user coupled with folder ids for data
    // and visualizations belonging to that user.
    app.home = new app.model.SitarRoot();
    girder.events.on("g:login.success", function (userData) {
        app.home.user.set(userData);
    });
    girder.events.on("g:logout.success", app.home.user.clear, app.home.user);

    app.router = new app.router.Router();

    // Check for a logged in user, and proceed from here.
    girder.fetchCurrentUser()
        .then(function (userData) {
            if (userData) {
                app.home.user.set(userData);
                app.home.fetch({
                    success: function () {
                        Backbone.history.start();
                    }
                });
            }

            // A view for the navbar.
            app.navbar = new app.view.Navbar({
                model: app.home.user,
                el: "#navbar"
            });
            app.navbar.render();

            if (!userData) {
                Backbone.history.start();
            }
        });
});
