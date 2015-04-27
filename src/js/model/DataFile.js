/* jshint browser: true */
/* global Backbone, _, girder */

(function (app, Papa) {
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
            console.log("yay");

            options = options || {};
            girder.restRequest({
                method: "GET",
                path: "/item/" + this.get("id") + "/download",
                dataType: "text",
                success: _.bind(function (contents) {
                    var data;

                    console.log(contents);

                    data = this.parseData(contents);

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

    app.model.DataFile.parseData = function (text) {
        var data;

        try {
            console.log("attempting json");
            data = JSON.parse(text);
        } catch (e) {
            return;
            console.log("attempting csv");
            data = Papa.parse(text, {
                header: true,
                dynamicTyping: true
            });

            console.log(data);
        }

        return data;
    };
}(window.app, window.Papa));
