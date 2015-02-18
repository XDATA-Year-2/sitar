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

        parse: function (response) {
            var hash = {},
                userObj;

            if (response) {
                hash = {token: app.util.maybeGet(response, "authToken", "token") || response._id};
                userObj = response.user;
            }

            if (userObj) {
                hash.name = app.util.formName(userObj);
            }

            return hash;
        },

        readHandler: function (options) {
            var success,
                error,
                token,
                auth;

            // Look for a token in the cookies.  If there is none, the user must
            // log in.
            token = app.util.getGirderTokenCookie();

            options = options || {};

            success = options.success || Backbone.$.noop;
            error = options.error || Backbone.$.noop;

            // If there's a username/password, try to log in with that
            // (overwriting whatever credentials were in place already);
            // otherwise, see if there's a token available and try to validate
            // it; finally, just fail.
            if (options.username && options.password) {
                auth = "Basic " + window.btoa(options.username + ":" + options.password);
                Backbone.ajax({
                    method: "GET",
                    url: app.girder + "/user/authentication",
                    headers: {
                        Authorization: auth
                    },
                    success: success,
                    error: error
                });
            } else if (token) {
                Backbone.ajax({
                    method: "GET",
                    url: app.girder + "/token/current",
                    headers: {
                        "Girder-Token": token
                    },
                    success: _.bind(function (response) {
                        if (response !== null) {
                            Backbone.ajax({
                                method: "GET",
                                url: app.girder + "/user/me",
                                headers: {
                                    "Girder-Token": token
                                },
                                success: _.bind(function (response) {
                                    this.set("name", app.util.formName(response));
                                }, this)
                            });

                            success.apply(this, arguments);
                        } else {
                            error.apply(this, arguments);
                        }
                    }, this),
                    error: error
                });
            } else {
                error(null);
            }
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
