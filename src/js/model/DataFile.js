/* jshint browser: true */
/* global Backbone, _, girder */

(function (app) {
    "use strict";

    app.model.DataFile = Backbone.Model.extend({
        sync: function (method, model, options) {
            var error;

            error = function () {
                return new Error("cannot issue '" + method + "' action");
            };

            switch (method) {
                case "create": {
                    this.createHandler(options);
                    break;
                }

                case "read": {
                    this.fetchHandler(options);
                    break;
                }

                case "update": {
                    throw error();
                }

                case "delete": {
                    throw error();
                }
            }
        },

        fetchHandler: function (options) {
            options = options || {};
            girder.restRequest({
                method: "GET",
                path: "/item/" + this.get("id"),
                success: _.bind(function (info) {
                    this.set({
                        name: info.name
                    });

                    if (options.fetchContents) {
                        this.fetchContents(options, info);
                    } else if (options.success) {
                        options.success(this, info, options);
                    }
                }, this),
                error: _.bind(function (jqxhr) {
                    if (options.error) {
                        options.error(this, jqxhr, options);
                    }
                }, this)
            });
        },

        fetchContents: function (options) {
            options = options || {};
            girder.restRequest({
                method: "GET",
                path: "/item/" + this.get("id") + "/download",
                dataType: "json",
                success: _.bind(function (contents) {
                    this.set("contents", contents);
                    if (options.success) {
                        options.success(this, undefined, options);
                    }
                }, this),
                error: _.bind(function (jqxhr) {
                    if (options.error) {
                        options.error(this, jqxhr, options);
                    }
                }, this)
            });
        }
    });
}(window.app));
