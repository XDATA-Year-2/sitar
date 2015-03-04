/* jshint browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    app.collection.Files = Backbone.Collection.extend({
        initialize: function (options) {
            options = options || {};

            if (!options.user) {
                throw new Error("'user' option is required");
            }

            if (!options.folderId) {
                throw new Error("'folderId' option is required");
            }

            this.user = options.user;
            this.girderRequest = app.util.girderRequester(app.girder, this.user.get("token"));

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
                    id: item._id,
                    user: this.user
                });
            }, this);
        },

        readHandler: function (options) {
            return this.girderRequest({
                url: "/item",
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

                if (!options.user) {
                    throw new Error("'user' option is required");
                }

                options.folderId = options.user.get(folderIdField);

                app.collection.Files.prototype.initialize.call(this, options);
            }
        });
    };

    app.collection.Visualizations = extendFiles(app.model.VisFile, "visFolder");
    app.collection.DataFiles = extendFiles(app.model.DataFile, "dataFolder");

    app.collection.Visualizations3 = app.collection.Files.extend({
        model: app.model.VisFile,

        initialize: function (options) {
            options = options || {};

            if (!options.user) {
                throw new Error("'user' option is required");
            }

            options.folderId = options.user.get("visFolder");

            app.collection.Files.prototype.initialize.call(this, options);
        }
    });
}(window.app));
