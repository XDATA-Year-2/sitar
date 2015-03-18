/* jshint browser: true */
/* global Backbone, _, girder */

(function (app) {
    "use strict";

    // A model of the locations Sitar looks for visualizations and data.
    app.model.SitarRoot = Backbone.Model.extend({
        initialize: function () {
            this.user = new girder.models.UserModel();
        },

        sync: function (method, model, options) {
            switch (method) {
                case "read": {
                    this.readHandler(options);
                    break;
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

            if (this.user.isNew()) {
                this.clear();
                return;
            }

            girder.restRequest({
                path: "/folder",
                data: {
                    parentType: "user",
                    parentId: this.user.get("_id"),
                    text: "sitar"
                }
            }).then(function (home) {
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
