/* jshint browser: true, devel: true */
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
            var hash = {};

            console.log(response);

            if (response) {
                hash = {token: app.util.maybeGet(response, "authToken", "token") || response._id};
            }

            return hash;
        },

        readHandler: function (options) {
            var success,
                error,
                token;

            // Look for a token in the cookies.  If there is none, the user must
            // log in.
            token = app.util.getGirderTokenCookie();

            options = options || {};

            success = options.success || Backbone.$.noop;
            error = options.error || Backbone.$.noop;

            // If no username/password provided, see if the token in hand is the
            // valid token.
            if (token && _.isUndefined(options.username) && _.isUndefined(options.password)) {
                Backbone.ajax({
                    method: "GET",
                    url: app.girder + "/token/current",
                    headers: {
                        "Girder-Token": token
                    },
                    success: success,
                    error: error
                });
            } else {
                return this.login(options);
            }
        },

        login: function (options) {
            var success = options && options.success || Backbone.$.noop,
                error = options && options.error || Backbone.$.noop,
                auth = "Basic " + window.btoa(options.username + ":" + options.password);

            return Backbone.ajax({
                method: "GET",
                url: "/plugin/girder/girder/api/v1/user/authentication",
                headers: {
                    Authorization: auth
                },
                success: success,
                error: error
            });
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
