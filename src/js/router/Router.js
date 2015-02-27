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

        replaceView: function (view) {
            if (app.curview) {
                app.curview.remove();
            }

            app.curview = view;
        },

        login: function () {
            app.user.fetch({
                success: function () {
                    var target = app.jumpback || "gallery";
                    app.jumpback = null;

                    app.router.navigate(target, {trigger: true});
                },

                error: _.bind(function () {
                    var view = new app.view.Login({
                        el: d3.select("#content").append("div").node()
                    });

                    view.render({
                        jumpback: app.jumpback
                    });

                    this.replaceView(view);
                }, this)
            });
        },

        gallery: function () {
            app.user.fetch({
                success: _.bind(function () {
                    var view;

                    view = new app.view.Gallery({
                        collection: new app.collection.Visualizations(),
                        el: d3.select("#content").append("div").node(),
                        user: app.user
                    });

                    this.replaceView(view);
                }, this),

                error: function () {
                    app.jumpback = "gallery";
                    app.router.navigate("", {trigger: true});
                }
            });
        },

        item: function (itemId) {
            app.user.fetch({
                success: _.bind(function () {
                    var view;

                    view = new app.view.Item({
                        el: d3.select("#content").append("div").node(),
                        model: new app.model.VisFile({
                            id: itemId,
                            user: app.user
                        })
                    });

                    this.replaceView(view);
                }, this),

                error: function () {
                    app.jumpback = "item/" + itemId;
                    app.router.navigate("", {trigger: true});
                }
            });
        },

        create: function () {
            app.user.fetch({
                success: _.bind(function () {
                    var view = new app.view.Item({
                        el: d3.select("#content").append("div").node(),
                        model: new app.model.VisFile({
                            user: app.user
                        })
                    });

                    view.render();

                    this.replaceView(view);
                }, this),

                error: function () {
                    app.jumpback = "item/create";
                    app.router.navigate("", {trigger: true});
                }
            });
        }
    });
}(window.app));
