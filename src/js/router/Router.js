/* jshint browser: true, devel: true */
/* global Backbone, _, d3 */

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

                    if (app.curview) {
                        app.curview.remove();
                    }

                    app.curview = new app.view.Login({
                        el: d3.select("#welcome").append("div").node()
                    });

                    app.curview.render({
                        jumpback: app.jumpback
                    });
                }
            });
        },

        gallery: function () {
            app.user.fetch({
                success: function () {
                    var gallery,
                        vises;

                    app.radio.select("gallery");

                    if (app.curview) {
                        app.curview.remove();
                    }

                    vises = new app.collection.Visualizations();
                    gallery = new app.view.Gallery({
                        collection: vises,
                        el: d3.select("#gallery").append("div").node()
                    });
                    gallery.listenTo(vises, "sync", _.debounce(gallery.render, 500));
                    gallery.listenTo(app.user, "destroy", gallery.clear);

                    vises.fetch({
                        user: app.user
                    });

                    app.curview = gallery;
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
