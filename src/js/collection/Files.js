/* jshint browser: true */
/* global Backbone, _, girder */

(function (app) {
    "use strict";

    app.collection.Files = Backbone.Collection.extend({
        initialize: function (options) {
            options = options || {};

            if (!options.folderId) {
                throw new Error("'folderId' option is required");
            }

            this.folderId = options.folderId;
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
                    id: item._id
                });
            }, this);
        },

        readHandler: function (options) {
            return girder.restRequest({
                path: "/item",
                data: {
                    folderId: this.folderId
                },
                success: options.success || Backbone.$.noop,
                error: options.error || Backbone.$.noop
            });
        }
    });

    var extendFiles = function (model, folderIdField) {
        return app.collection.Files.extend({
            model: model,

            initialize: function (options) {
                options = options || {};

                if (!options.home) {
                    throw new Error("option 'home' is required");
                }

                options.folderId = options.home.get(folderIdField);

                app.collection.Files.prototype.initialize.call(this, options);
            }
        });
    };

    app.collection.Visualizations = extendFiles(app.model.VisFile, "visFolder");
    app.collection.DataFiles = extendFiles(app.model.DataFile, "dataFolder");
}(window.app));
