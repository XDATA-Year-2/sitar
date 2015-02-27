/* jshint browser: true, devel: true */
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
                    var view = new app.view.Login({
                        el: d3.select("#content").append("div").node()
                    });

                    view.render({
                        jumpback: app.jumpback
                    });

                    if (app.curview) {
                        app.curview.remove();
                    }

                    app.curview = view;
                }
            });
        },

        gallery: function () {
            app.user.fetch({
                success: function () {
                    var view;

                    view = new app.view.Gallery({
                        collection: new app.collection.Visualizations(),
                        el: d3.select("#content").append("div").node(),
                        user: app.user
                    });

                    if (app.curview) {
                        app.curview.remove();
                    }

                    app.curview = view;
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
                    var view,
                        model;

                    model = new app.model.VisFile({
                        id: itemId,
                        user: app.user
                    });

                    view = new app.view.Item({
                        el: d3.select("#content").append("div").node(),
                        model: model
                    });

                    model.fetch({
                        fetchVega: true
                    });

                    if (app.curview) {
                        app.curview.remove();
                    }

                    app.curview = view;
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
                    var view = new app.view.Item({
                        el: d3.select("#content").append("div").node(),
                        model: new app.model.VisFile({
                            user: app.user
                        })
                    });

                    view.render();

                    if (app.curview) {
                        app.curview.remove();
                    }

                    app.curview = view;
                },

                error: function () {
                    app.jumpback = "item/create";
                    app.router.navigate("", {trigger: true});
                }
            });
        }
    });
}(window.app));
