/* jshint browser: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    app.router.Router = Backbone.Router.extend({
        routes: {
            "": "login",
            gallery: "gallery",
            "item/create": "create",
            "item/:itemId": "item"
        },

        login: function () {
            app.user.fetch({
                success: function () {
                    var target = app.jumpback || "gallery";
                    app.jumpback = null;

                    app.router.navigate(target, {trigger: true});
                },

                error: function () {
                    app.radio.select("welcome");

                    if (app.jumpback) {
                        d3.select("#jumpback")
                            .classed("hidden", false);
                    }
                }
            });
        },

        gallery: function () {
            app.user.fetch({
                success: function () {
                    app.radio.select("gallery");
                    if (app.curview) {
                        app.curview.remove();
                    }
                },

                error: function () {
                    app.jumpback = "gallery";
                    app.router.navigate("", {trigger: true});
                }
            });
        },

        item: function (itemId) {
            app.user.fetch({
                success: function () {
                    var model;

                    app.radio.select("itemview");

                    model = new app.model.VisFile({
                        id: itemId,
                        user: app.user
                    });

                    if (app.curview) {
                        app.curview.remove();
                    }

                    app.curview = new app.view.Item({
                        el: d3.select("#itemview").append("div").node(),
                        model: model
                    });

                    model.fetch({
                        fetchVega: true
                    });
                },

                error: function () {
                    app.jumpback = "item/" + itemId;
                    app.router.navigate("", {trigger: true});
                }
            });
        },

        create: function () {
            app.user.fetch({
                success: function () {
                    var view;

                    Backbone.$("#itemview")
                        .empty();

                    app.radio.select("itemview");

                    view = new app.view.Item({
                        el: "#itemview",
                        model: new app.model.VisFile({
                            user: app.user
                        })
                    });

                    view.render();
                },

                error: function () {
                    app.jumpback = "item/create";
                    app.router.navigate("", {trigger: true});
                }
            });
        }
    });
}(window.app));
