/* jshint browser: true, jquery: true, devel: true */
/* global _, Backbone, d3 */

$(function () {
    "use strict";

    var app = window.app;

    app.user = new app.model.User();

    // Attach a name view to the navbar name slot.
    app.name = new app.view.Name({
        model: app.user,
        el: "#name"
    });

    // Attach login actions to the "log in" button.
    d3.select("#login")
        .on("submit", function () {
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
                    var target = app.jumpback || "gallery";
                    app.jumpback = null;

                    d3.select("#jumpback")
                        .classed("hidden", true);

                    d3.select("#failed")
                        .classed("hidden", true);

                    d3.select("#username")
                        .property("value", "");

                    d3.select("#password")
                        .property("value", "");

                    app.router.navigate(target, {trigger: true});
                },
                error: function () {
                    d3.select("#failed")
                        .classed("hidden", false);
                }
            });

            d3.event.preventDefault();
        });

    // Attach action to the "register" button.
    d3.select("#register")
        .on("click", function () {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");
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

    var vises, gallery;

    vises = new app.collection.Visualizations();
    vises.listenTo(app.user, "change:user", _.partial(vises.fetch, {user: app.user}));

    gallery = new app.view.Gallery({
        collection: vises,
        el: "#gallery"
    });
    gallery.listenTo(vises, "sync", _.debounce(gallery.render, 500));
    gallery.listenTo(app.user, "destroy", gallery.clear);

    app.radio = new app.util.RadioDisplay({
        classes: {
            remove: ["hidden"]
        },

        onSelect: function (name) {
            d3.select("#navbar")
                .classed("hidden", name === "welcome");
        }
    });
    app.radio.addElement("welcome", "#welcome");
    app.radio.addElement("gallery", "#gallery");
    app.radio.addElement("itemview", "#itemview");

    app.router = new app.router.Router();
    Backbone.history.start();
});
