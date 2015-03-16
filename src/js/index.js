/* jshint browser: true, jquery: true */
/* global Backbone, girder */

$(function () {
    "use strict";

    var app = window.app;

    // Initialize Girder.
    girder.apiRoot = "/plugin/girder/girder/api/v1";

    // The logged in user.
    app.user = new app.model.User();

    // A view for the navbar.
    app.navbar = new app.view.Navbar({
        model: app.user,
        el: "#navbar"
    });
    app.navbar.render();

    app.router = new app.router.Router();
    Backbone.history.start();
});
