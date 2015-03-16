/* jshint browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    // A model of a logged-in user.  Girder requests will be done on behalf of
    // this user by passing the login token with each request.
    app.model.User = Backbone.Model.extend({
        idAttribute: "token",

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
                cont,
                token,
                fetcher,
                auth;

            // Look for a token in the cookies.  If there is none, the user must
            // log in.
            token = app.util.getGirderTokenCookie();

            options = options || {};

            success = options.success || Backbone.$.noop;
            error = options.error || Backbone.$.noop;

            fetcher = new app.util.DeferredChain(Backbone.$.Deferred());

            failure = Backbone.$.Deferred();
            failure.reject();

            cont = Backbone.$.Deferred();
            cont.resolve();

            this.attribs = {};

            // If there's a username/password, try to log in with that
            // (overwriting whatever credentials were in place already);
            // otherwise, see if there's a token available and try to validate
            // it; finally, just fail.
            if (options.username && options.password) {
                auth = "Basic " + window.btoa(options.username + ":" + options.password);
                fetcher.then(_.bind(function () {
                    return Backbone.ajax({
                        method: "GET",
                        url: app.girder + "/user/authentication",
                        headers: {
                            Authorization: auth
                        },
                        success: _.bind(function (response) {
                            _.extend(this.attribs, {
                                token: response.authToken.token,
                                user: response.user
                            });

                            this.girderRequest = app.util.girderRequester(app.girder, token);
                        }, this)
                    });
                }, this));
            } else if (token) {
                this.girderRequest = app.util.girderRequester(app.girder, token);

                fetcher.then(_.bind(function () {
                    return this.girderRequest({
                        method: "GET",
                        url: "/token/current",
                        success: _.bind(function (response) {
                            if (!response) {
                                delete this.girderRequest;
                            } else {
                                _.extend(this.attribs, {
                                    token: response && response._id || null
                                });
                            }
                        }, this)
                    });
                }, this));

                fetcher.then(_.bind(function () {
                    if (this.girderRequest) {
                        return this.girderRequest({
                            url: "/user/me",
                            success: _.bind(function (response) {
                                _.extend(this.attribs, {
                                    user: response
                                });
                            }, this)
                        });
                    } else {
                        return failure;
                    }
                }, this));
            } else {
                fetcher.then(function () {
                    return failure;
                });
            }

            fetcher.then(_.bind(function () {
                return this.girderRequest({
                    url: "/folder",
                    data: {
                        parentType: "user",
                        parentId: this.attribs.user._id,
                        text: "sitar"
                    }
                });
            }, this));

            fetcher.then(_.bind(function (home) {
                home = home && home[0] && home[0]._id;

                if (home) {
                    return Backbone.$.when(
                        this.girderRequest({
                            url: "/folder",
                            data: {
                                parentType: "folder",
                                parentId: home,
                                text: "visualizations"
                            }
                        }),

                        this.girderRequest({
                            url: "/folder",
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

            this.girderRequest({
                method: "DELETE",
                url: "/user/authentication",
                success: _.bind(function (r) {
                    this.set("name", "");
                    success(r);
                }, this),
                error: error
            });
        }
    });
}(window.app));
