/* jshint browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    // A model of a logged-in user.  Girder requests will be done on behalf of
    // this user by passing the login token with each request.
    app.model.User = Backbone.Model.extend({
        idAttribute: "token",

        initialize: function () {
            this.attribs = {};
        },

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
            return attribs;
        },

        readHandler: function (options) {
            var success,
                error,
                token,
                fetcher,
                auth;

            // Look for a token in the cookies.  If there is none, the user must
            // log in.
            token = app.util.getGirderTokenCookie();

            options = options || {};

            success = options.success || Backbone.$.noop;
            error = options.error || Backbone.$.noop;

            fetcher = new app.util.MonadicDeferredChain();

            // If there's a username/password, try to log in with that
            // (overwriting whatever credentials were in place already);
            // otherwise, see if there's a token available and try to validate
            // it; finally, just fail.
            if (options.username && options.password) {
                auth = "Basic " + window.btoa(options.username + ":" + options.password);
                fetcher.add({
                    deferred: Backbone.ajax({
                        method: "GET",
                        url: app.girder + "/user/authentication",
                        headers: {
                            Authorization: auth
                        }
                    }),

                    process: function (response) {
                        _.extend(this.attribs, {
                            token: response.authToken.token,
                            user: response.user
                        });

                        return response;
                    }
                });
            } else if (token) {
                this.girderRequest = app.util.girderRequester(app.girder, token);

                fetcher.add({
                    deferred: this.girderRequest({
                        method: "GET",
                        url: "/token/current"
                    }),

                    process: _.bind(function (response) {
                        _.extend(this.attribs, {
                            token: response && response._id || null
                        });

                        return response;
                    }, this)
                });

                fetcher.add({
                    deferred: _.bind(function () {
                        if (this.girderRequest) {
                            return this.girderRequest({
                                url: "/user/me"
                            });
                        } else {
                            return false;
                        }
                    }, this),

                    process: _.bind(function (response) {
                        _.extend(this.attribs, {
                            user: response
                        });

                        return response;
                    }, this)
                });
            } else {
                error(null);
                fetcher = undefined;
            }

            if (fetcher) {
                fetcher.add({
                    deferred: _.bind(function () {
                        return this.girderRequest({
                            url: "/folder",
                            data: {
                                parentType: "user",
                                parentId: this.attribs.user._id,
                                text: "sitar"
                            }
                        });
                    }, this)
                });

                fetcher.add({
                    deferred: _.bind(function (last) {
                        var home = last && last[0] && last[0]._id;

                        if (home) {
                            return [
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
                            ];
                        }
                    }, this),

                    process: _.bind(function (response) {
                        _.extend(this.attribs, {
                            visFolder: response[0][0]._id,
                            dataFolder: response[1][0]._id
                        });

                        return response;
                    }, this)
                });
            }

            return fetcher && fetcher.run(success, error);
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
