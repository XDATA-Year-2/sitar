/* jshint browser: true, jquery: true */
/* global Backbone */

$(function () {
    "use strict";

    var app = window.app;

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
