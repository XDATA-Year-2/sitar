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
            console.log("login");
            app.user.fetch({
                success: function () {
                    console.log("success");
                    var target = app.jumpback || "gallery";
                    app.jumpback = null;

                    app.router.navigate(target, {trigger: true});
                },

                error: function () {
                    console.log("error");
                    app.radio.select("welcome");

                    if (app.jumpback) {
                        d3.select("#jumpback")
                            .classed("hidden", false);
                    }
                }
            });
        },

        gallery: function () {
            console.log("gallery");
            app.user.fetch({
                success: function () {
                    app.radio.select("gallery");
                },

                error: function () {
                    console.log("error2");
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

                    app.radio.select("itemview");

                    model = new app.model.VisFile({
                        id: itemId
                    });

                    app.roni = view = new app.view.Item({
                        el: "#itemview",
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
                        model: new app.model.VisFile()
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
