/* jshint browser: true */
/* global Backbone, _, girder */

(function (app) {
    "use strict";

    // A model of a logged-in user.
    app.model.User = Backbone.Model.extend({
        sync: function (method, model, options) {
            switch (method) {
                case "create": {
                    throw new Error("action not allowed");
                }

                case "read": {
                    this.readHandler(options);
                    break;
                }

                case "update": {
                    throw new Error("action not allowed");
                }

                case "delete": {
                    this.logout(options);
                    break;
                }

                default: {
                    throw new Error("illegal condition: sync method was '" + method + "'");
                }
            }
        },

        parse: function () {
            var attribs = this.attribs;
            delete this.attribs;
            return _.extend(attribs, {
                name: app.util.formName(attribs.user)
            });
        },

        readHandler: function (options) {
            var success,
                error,
                failure,
                fetcher,
                auth;

            options = options || {};

            success = options.success || Backbone.$.noop;
            error = options.error || Backbone.$.noop;

            fetcher = new app.util.DeferredChain(Backbone.$.Deferred());

            failure = Backbone.$.Deferred();
            failure.reject();

            this.attribs = {};

            // If there's a username/password, try to log in with that
            // (overwriting whatever credentials were in place already);
            // otherwise, see if a user is logged in already and, if so, proceed
            // with that one.
            if (options.username && options.password) {
                auth = "Basic " + window.btoa(options.username + ":" + options.password);
                fetcher.then(_.bind(function () {
                    return girder.restRequest({
                        method: "GET",
                        path: "/user/authentication",
                        headers: {
                            Authorization: auth
                        },
                        success: _.bind(function (response) {
                            _.extend(this.attribs, {
                                id: response.user._id,
                                user: response.user
                            });
                        }, this)
                    });
                }, this));
            } else {
                fetcher.then(_.bind(function () {
                    return girder.restRequest({
                        method: "GET",
                        path: "/user/me",
                        success: _.bind(function (response) {
                            _.extend(this.attribs, {
                                user: response
                            });
                        }, this)
                    });
                }, this));
            }

            fetcher.then(_.bind(function () {
                if (this.attribs.user) {
                    return girder.restRequest({
                        path: "/folder",
                        data: {
                            parentType: "user",
                            parentId: this.attribs.user._id,
                            text: "sitar"
                        }
                    });
                } else {
                    return failure;
                }
            }, this));

            fetcher.then(_.bind(function (home) {
                home = home && home[0] && home[0]._id;

                if (home) {
                    return Backbone.$.when(
                        girder.restRequest({
                            path: "/folder",
                            data: {
                                parentType: "folder",
                                parentId: home,
                                text: "visualizations"
                            }
                        }),

                        girder.restRequest({
                            path: "/folder",
                            data: {
                                parentType: "folder",
                                parentId: home,
                                text: "data"
                            }
                        })
                    );
                } else {
                    return failure;
                }
            }, this));

            fetcher.then(_.bind(function (visFolder, dataFolder) {
                _.extend(this.attribs, {
                    visFolder: visFolder[0][0]._id,
                    dataFolder: dataFolder[0][0]._id
                });
                success();
            }, this), error);

            fetcher.resolve();
        },

        logout: function (options) {
            var success = options && options.success || Backbone.$.noop,
                error = options && options.error || Backbone.$.noop;

            girder.restRequest({
                method: "DELETE",
                path: "/user/authentication",
                success: _.bind(function (r) {
                    this.set("name", "");
                    success(r);
                }, this),
                error: error
            });
        }
    });
}(window.app));
