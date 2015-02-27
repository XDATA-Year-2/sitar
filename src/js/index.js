/* jshint browser: true, jquery: true */
/* global Backbone, d3 */

$(function () {
    "use strict";

    var app = window.app;

    app.user = new app.model.User();

    // Attach a name view to the navbar name slot.
    app.name = new app.view.Name({
        model: app.user,
        el: "#name"
    });

    // Attach action to the "logout" dropdown item.
    d3.select("#logout")
        .on("click", function () {
            app.user.destroy({
                success: function () {
                    app.jumpback = null;
                    app.router.navigate("", {trigger: true});
                },

                error: function () {
                    throw new Error("the impossible has happened");
                }
            });
        });

    app.router = new app.router.Router();
    Backbone.history.start();
});
