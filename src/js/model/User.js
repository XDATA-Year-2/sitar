/* jshint: browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    // A model of a logged-in user.  Girder requests will be done on behalf of
    // this user by passing the login token with each request.
    app.model.User = Backbone.Model.extend({
        sync: function (method, model, options) {
            switch (method) {
                case "create": {
                    throw new Error("action not allowed");
                }

                case "read": {
                    this.login(options);
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
            return _.extend(response, {id: response.user._id});
        },

        login: function (options) {
            var success = options && options.success || Backbone.$.noop,
                error = options && options.error || Backbone.$.noop,
                auth = "Basic " + window.btoa(options.username + ":" + options.password);

            Backbone.ajax({
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
                    "Girder-Token": this.get("authToken").token
                },
                success: success,
                error: error
            });
        }
    });

}(window.app));
