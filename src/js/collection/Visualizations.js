/* jshint browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    app.collection.Visualizations = Backbone.Collection.extend({
        model: app.model.VisFile,

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

        parse: function (responses) {
            var items = responses[2] || [];
            return _.map(items, function (item) {
                return new this.model({
                    id: item._id,
                    user: app.user
                });
            }, this);
        },

        readHandler: function (options) {
            var user,
                actions;

            options = options || {};

            user = options.user;
            if (!user) {
                throw new Error("option 'user' required");
            }

            // Start a new monadic callback chain.
            actions = new app.util.MonadicDeferredChain();

            // First, query Girder for the user's file listing, looking for a
            // directory named "sitar".
            actions.add({
                deferred: Backbone.ajax({
                    url: app.girder + "/folder",
                    data: {
                        parentType: "user",
                        parentId: user.get("user")._id,
                        text: "sitar"
                    },
                    headers: {
                        "Girder-Token": user.get("token")
                    }
                })
            });

            // Next, dive into the "sitar" folder (if it exists).
            actions.add({
                deferred: function (sitar) {
                    if (sitar.length === 0) {
                        return;
                    }

                    return Backbone.ajax({
                        url: app.girder + "/folder",
                        data: {
                            parentType: "folder",
                            parentId: sitar[0]._id,
                            text: "visualizations"
                        },
                        headers: {
                            "Girder-Token": user.get("token")
                        }
                    });
                }
            });

            // Finally, open up the "visualizations" subdirectory.
            actions.add({
                deferred: function (visfolder) {
                    if (visfolder.length === 0) {
                        return;
                    }

                    app.visFolder = visfolder[0]._id;

                    return Backbone.ajax({
                        url: app.girder + "/item",
                        data: {
                            folderId: visfolder[0]._id
                        },
                        headers: {
                            "Girder-Token": user.get("token")
                        }
                    });
                }
            });

            return actions.run(options.success || Backbone.$.noop, options.error || Backbone.$.noop);
        }
    });
}(window.app));
