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

        setjmp: function (target) {
            this.jumpback = target;
            this.navigate("", {
                trigger: true
            });
        },

        longjmp: function (fallback) {
            var target = this.jumpback || fallback;
            this.jumpback = null;
            this.navigate(target, {
                trigger: true
            });
        },

        login: function () {
            app.user.fetch({
                success: _.bind(function () {
                    this.longjmp("gallery");
                }, this),

                error: _.bind(function () {
                    var view = new app.view.Login({
                        el: d3.select("#content").append("div").node()
                    });

                    view.render({
                        jumpback: this.jumpback
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
                        collection: new app.collection.Visualizations({
                            user: app.user
                        }),
                        el: d3.select("#content").append("div").node()
                    });

                    this.replaceView(view);
                }, this),

                error: _.bind(function () {
                    this.setjmp("gallery");
                }, this)
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

                error: _.bind(function () {
                    this.setjmp("item/" + itemId);
                }, this)
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

                error: _.bind(function () {
                    this.setjmp("item/create");
                }, this)
            });
        }
    });
}(window.app));
