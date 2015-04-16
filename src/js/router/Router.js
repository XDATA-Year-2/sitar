/* jshint browser: true */
/* global Backbone, _, d3, girder */

(function (app) {
    "use strict";

    app.router.Router = Backbone.Router.extend({
        routes: {
            "": "login",
            "gallery(/:username)": "gallery",
            "browse": "browse",
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
            var contentNode,
                login,
                show,
                home;

            if (!username) {
                login = app.user.get("login");
                if (login) {
                    this.navigate("gallery/" + login, {
                        trigger: true
                    });
                } else {
                    this.navigate("browse", {
                        trigger: true
                    });
                }
            }

            home = new app.model.SitarRoot({
                login: username
            });

            show = _.bind(function (view) {
                app.navbar.show();
                this.replaceView(view);
            }, this);

            contentNode = d3.select("#content")
                .append("div")
                .node();

            home.fetch().then(_.bind(function () {
                var view = new app.view.Gallery({
                    collection: new app.collection.Visualizations({
                        home: home
                    }),
                    el: contentNode,
                    newvis: app.user.get("login") === home.login
                });

                show(view);
            }, this), _.bind(function () {
                var view = new app.view.GalleryNotFound({
                    el: contentNode,
                    username: username
                });

                view.render();
                show(view);
            }, this));
        },

        browse: function () {
            // Get a list of users on the system.
            girder.restRequest({
                method: "GET",
                path: "/user"
            }).then(_.bind(function (users) {
                var logins = _.pluck(users, "login"),
                    homes = [],
                    loggedIn = app.user.get("login"),
                    me,
                    view;

                _.each(logins, function (login) {
                    var home = new app.model.SitarRoot({
                        login: login
                    });

                    if (login === loggedIn) {
                        me = home;
                    } else {
                        homes.push(home);
                    }
                });

                view = new app.view.Browse({
                    el: d3.select("#content").append("div").node(),
                    focus: me,
                    homes: homes
                });

                view.render();
                app.navbar.show();
                this.replaceView(view);
            }, this));
        },

        item: function (itemId) {
            var view;

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
        },

        create: function () {
            var view,
                home;

            if (app.user.isNew()) {
                this.setjmp("vis/new");
            } else {
                home = new app.model.SitarRoot({
                    login: app.user.get("login")
                });

                home.fetch().then(_.bind(function () {
                    view = new app.view.NewVis({
                        el: d3.select("#content").append("div").node(),
                        model: new app.model.VisFile(),
                        home: home
                    });

                    view.render();

                    app.navbar.show();
                    this.replaceView(view);
                }, this));
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
