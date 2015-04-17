/* jshint browser: true */
/* global Backbone, girder */

Backbone.$(function () {
    "use strict";

    var app = window.app;

    // Initialize Girder.
    girder.apiRoot = "/plugin/girder/girder/api/v1";

    // The logged in Girder user.
    app.user = new girder.models.UserModel();

    // A router to control the URL and page content.
    app.router = new app.router.Router();

    // Check for a logged in user, and proceed from here.
    girder.fetchCurrentUser()
        .then(function (userData) {
            if (userData) {
                app.user.set(userData);
            }

            // A view for the navbar.
            app.navbar = new app.view.Navbar({
                model: app.user,
                el: "#navbar"
            });
            app.navbar.render();

            Backbone.history.start();
        });
});
