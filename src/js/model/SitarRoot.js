/* jshint browser: true */
/* global Backbone, _, girder */

(function (app) {
    "use strict";

    // A model of the locations Sitar looks for visualizations and data.
    app.model.SitarRoot = Backbone.Model.extend({
        initialize: function (options) {
            options = options || {};
            this.login = options.login;

            if (!this.login) {
                throw new Error("option 'login' is required");
            }
        },

        sync: function (method, model, options) {
            switch (method) {
                case "read": {
                    return this.readHandler(options);
                }

                default: {
                    throw new Error("action '" + method + "' not allowed");
                }
            }
        },

        validate: function (attr) {
            if (!attr.visFolder) {
                return "visFolder missing";
            } else if (!attr.dataFolder) {
                return "dataFolder missing";
            }
        },

        readHandler: function (options) {
            var success,
                error,
                failure;

            options = options || {};

            success = options.success || Backbone.$.noop;
            error = options.error || Backbone.$.noop;

            failure = Backbone.$.Deferred();
            failure.reject();

            return girder.restRequest({
                method: "GET",
                path: "/user",
                data: {
                    text: this.login
                }
            }).then(_.bind(function (users) {
                users = _.where(users, {
                    login: this.login
                });

                if (users.length === 0) {
                    return failure;
                }

                return girder.restRequest({
                    path: "/folder",
                    data: {
                        parentType: "user",
                        parentId: users[0]._id,
                        text: "sitar"
                    }
                });
            }, this)).then(function (home) {
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
            }).then(_.bind(function (visFolder, dataFolder) {
                this.set("visFolder", visFolder[0][0]._id);
                this.set("dataFolder", dataFolder[0][0]._id);

                success();
            }, this), error);
        }
    });
}(window.app));
