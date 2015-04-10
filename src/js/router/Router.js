/* jshint browser: true */
/* global Backbone, _, d3, girder */

(function (app) {
    "use strict";

    app.router.Router = Backbone.Router.extend({
        routes: {
            "": "login",
            "gallery(/:username)": "gallery",
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
            } else {
                this.navigate("gallery", {
                    trigger: true
                });
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
                    el: d3.select("#content").append("div").node(),
                    newvis: app.user.get("login") === home.login
                });

                app.navbar.show();
                this.replaceView(view);
            }, this));
        },

        item: function (itemId) {
            var view;

            if (app.user.isNew()) {
                this.setjmp("vis/" + itemId);
            } else {
                // Learn who the owner of the vis is.
                girder.restRequest({
                    method: "GET",
                    path: "/item/" + itemId + "/rootpath"
                }).then(_.bind(function (path) {
                    var owner = path[0].object.login;

                    view = new app.view.Item({
                        el: d3.select("#content").append("div").node(),
                        model: new app.model.VisFile({
                            id: itemId
                        }),
                        allowEdit: app.user.get("login") === owner
                    });

                    app.navbar.show();
                    this.replaceView(view);
                }, this));
            }
        },

        create: function () {
            var view;

            if (app.user.isNew()) {
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
