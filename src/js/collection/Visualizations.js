/* jshint browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    app.collection.Visualizations = Backbone.Collection.extend({
        model: app.model.VisFile,

        initialize: function (options) {
            options = options || {};

            if (!options.user) {
                throw new Error("'user' option is required");
            }

            this.user = options.user;
            this.girderRequest = app.util.girderRequester(app.girder, this.user.get("token"));
        },

        sync: function (method, collection, options) {
            switch (method) {
                case "read": {
                    this.readHandler(options);
                    break;
                }

                default: {
                    throw new Error("method '" + method + "' not allowed");
                }
            }
        },

        parse: function (items) {
            return _.map(items, function (item) {
                return new this.model({
                    id: item._id,
                    user: this.user
                });
            }, this);
        },

        readHandler: function (options) {
            return this.girderRequest({
                url: "/item",
                data: {
                    folderId: this.user.get("visFolder")
                },
                success: options.success || Backbone.$.noop,
                error: options.error || Backbone.$.noop
            });
        }
    });
}(window.app));
