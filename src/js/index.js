/* jshint browser: true, jquery: true */
/* global Backbone, girder */

$(function () {
    "use strict";

    var app = window.app;

    // Initialize Girder.
    girder.apiRoot = "/plugin/girder/girder/api/v1";

    // The logged in user.
    app.user = new app.model.User();

    // Girder user model.
    app.userModel = new girder.models.UserModel();
    girder.events.on("g:login.success", function (userData) {
        app.userModel.set(userData);
    });
    girder.events.on("g:logout.success", function () {
        app.userModel.clear();
    });

    // Check for a logged in user, and proceed from here.
    girder.fetchCurrentUser()
        .then(function (userData) {
            if (userData) {
                app.userModel.set(userData);
            }

            // A view for the navbar.
            app.navbar = new app.view.Navbar({
                model: app.userModel,
                el: "#navbar"
            });
            app.navbar.render();

            app.router = new app.router.Router();
            Backbone.history.start();
        });
});
