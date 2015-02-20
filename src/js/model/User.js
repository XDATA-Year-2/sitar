/* jshint browser: true, devel: true */
/* global Backbone */

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

        parse: function (response) {
            var user;

            if (response.length === 0) {
                return;
            } else if (response.length === 1) {
                if (response[0]) {
                    user = response[0].user;

                    return {
                        token: response[0].token,
                        user: user,
                        name: user.firstName + " " + user.lastName[0] + "."
                    };
                }
            } else if (response.length === 2) {
                user = response[1];

                return {
                    token: response[0],
                    user: user,
                    name: user.firstName + " " + user.lastName[0] + "."
                };
            } else {
                throw new Error("response should not be longer than 2 elements", response);
            }
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
                        return {
                            token: response.authToken.token,
                            user: response.user
                        };
                    }
                });
            } else if (token) {
                fetcher.add({
                    deferred: Backbone.ajax({
                        method: "GET",
                        url: app.girder + "/token/current",
                        headers: {
                            "Girder-Token": token
                        },
                    }),

                    process: function (response) {
                        return response && response._id || null;
                    }
                });

                fetcher.add({
                    deferred: function (token) {
                        return !!token && Backbone.ajax({
                            method: "GET",
                            url: app.girder + "/user/me",
                            headers: {
                                "Girder-Token": token
                            }
                        });
                    }
                });
            } else {
                error(null);
                fetcher = undefined;
            }

            return fetcher && fetcher.run(success, error);
        },

        logout: function (options) {
            var success = options && options.success || Backbone.$.noop,
                error = options && options.error || Backbone.$.noop;

            Backbone.ajax({
                method: "DELETE",
                url: "/plugin/girder/girder/api/v1/user/authentication",
                headers: {
                    "Girder-Token": this.get("token")
                },
                success: success,
                error: error
            });
        }
    });
}(window.app));
