/* jshint browser: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    app.router.Router = Backbone.Router.extend({
        routes: {
            "": "login",
            gallery: "gallery",
            "vis/new": "create",
            "vis/:itemId": "item"
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
            var view;

            if (app.user.isNew()) {
                view = new app.view.Login({
                    el: d3.select("#content").append("div").classed("down", true).node()
                });

                view.render({
                    jumpback: this.jumpback
                });

                app.navbar.hide();
                this.replaceView(view);

                this.longjmp("gallery");
            }
        },

        gallery: function (username) {
            var view,
                home;

            username = username || app.user.get("login");

            home = new app.model.SitarRoot({
                login: username
            });

            home.fetch().then(_.bind(function () {
                view = new app.view.Gallery({
                    collection: new app.collection.Visualizations({
                        home: home
                    }),
                    el: d3.select("#content").append("div").node()
                });

                app.navbar.show();
                this.replaceView(view);
            }, this));
        },

        item: function (itemId) {
            var view;

            if (app.home.user.isNew()) {
                this.setjmp("vis/" + itemId);
            } else if (!app.home.isValid()) {
                app.home.fetch({
                    success: _.bind(function () {
                        this.item(itemId);
                        return;
                    }, this)
                });
            } else {
                view = new app.view.Item({
                    el: d3.select("#content").append("div").node(),
                    model: new app.model.VisFile({
                        id: itemId
                    })
                });

                app.navbar.show();
                this.replaceView(view);
            }
        },

        create: function () {
            var view;

            if (app.home.user.isNew()) {
                this.setjmp("vis/new");
            } else {
                view = new app.view.NewVis({
                    el: d3.select("#content").append("div").node(),
                    model: new app.model.VisFile()
                });

                view.render();

                app.navbar.show();
                this.replaceView(view);
            }
        },

        showItem: function (visfile) {
            var view = new app.view.Item({
                el: d3.select("#content").append("div").node(),
                model: visfile
            });

            view.render();
            view.edit();

            app.navbar.show();
            this.replaceView(view);

            return view.tag;
        }
    });
}(window.app));
