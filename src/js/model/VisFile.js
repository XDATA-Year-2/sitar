/* jshint browser: true */
/* global Backbone, _, girder */

(function (app) {
    "use strict";

    var binData = function (data) {
        var nums = new Array(data.length);
        _.each(data, function (_, i) {
            nums[i] = data.charCodeAt(i);
        });

        return new Uint8Array(nums);
    };

    // A model of a "vis file".  This is conceptualized as the following list of
    // information:
    //
    // 1. A name - this corresponds to the item name in Girder.
    //
    // 2. A description - this corresponds to the item description in Girder.
    //
    // 3. A poster file - this corresponds to the file id of the file
    // "poster.png", which should be one of the files in the item in Girder.
    //
    // 4. A vega spec file - this corresponds to the file id of the file
    // "vega.json", which should be the other file in the item in Girder.
    //
    // 5. The vega spec itself - this corresponds to the *contents* of the
    // vega.json file.  Changes in this file mean that the save() action will
    // have an effect on the server.
    //
    // 6. A data object currently associated with the visualization.
    //
    // This information can be used to render a preview of the Vega spec within
    // the Gallery view, and also a more detailed view for an individual item,
    // which will also enable editing/saving/etc.
    app.model.VisFile = Backbone.Model.extend({
        sync: function (method, model, options) {
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
                    this.updateHandler(options);
                    break;
                }

                case "delete": {
                    this.deleteHandler(options);
                    break;
                }

                default: {
                    throw new Error("illegal condition: sync method was '" + method + "'");
                }
            }
        },

        errorHandler: function (options) {
            return _.bind(function (jqxhr) {
                var error = options.error || Backbone.$.noop;
                error(this, jqxhr, options);
            }, this);
        },

        fetchHandler: function (options) {
            var baseUrl = "/item/" + this.id,
                urls = [baseUrl, baseUrl + "/files"],
                results = [],
                callback,
                finalize;

            finalize = _.after(urls.length, _.bind(function () {
                var attrib = {},
                    item,
                    posterFile,
                    timelineFile,
                    vegaFile,
                    finalize2;

                // 'results' should contain two entries - the first is an object
                // with the overall item properties; the second is an array of
                // three objects containing information about the "poster", the
                // vega spec, and the timeline object (used by Lyra to record
                // editing history, etc.).
                item = results[0];
                posterFile = results[1][0];
                timelineFile = results[1][1];
                vegaFile = results[1][2];

                // Extract and collect the necessary properties from the
                // results.
                attrib.title = item.name;
                attrib.description = item.description;
                attrib.posterId = posterFile._id;
                attrib.vegaId = vegaFile._id;
                attrib.timelineId = timelineFile._id;

                // If requested, retrieve the Vega spec and timeline data, then
                // set the attributes; otherwise, just set the attributes.
                if (options.fetchVega) {
                    finalize2 = _.after(2, _.bind(function () {
                        this.set(attrib);

                        if (options.success) {
                            options.success(this, undefined, options);
                        }
                    }, this));

                    girder.restRequest({
                        method: "GET",
                        path: "/file/" + vegaFile._id + "/download",
                        success: _.bind(function (vega) {
                            attrib.vega = vega;
                            finalize2();
                        }, this),
                        error: this.errorHandler(options)
                    });

                    girder.restRequest({
                        method: "GET",
                        path: "/file/" + timelineFile._id + "/download",
                        success: _.bind(function (timeline) {
                            attrib.timeline = timeline;
                            finalize2();
                        }, this),
                        error: this.errorHandler(options)
                    });
                } else {
                    this.set(attrib);
                }
            }, this));

            callback = function (slot) {
                return function (json) {
                    results[slot] = json;
                    finalize();
                };
            };

            // To construct the model we need to make two GET requests - one for
            // the item attributes (name and description, for example), and one
            // for the files contained within (the poster image and the actual
            // vega spec).
            _.each(urls, _.bind(function (url, i) {
                girder.restRequest({
                    method: "GET",
                    path: url,
                    success: callback(i),
                    error: this.errorHandler(options)
                });
            }, this));
        },

        createHandler: function (options) {
            options = options || {};

            if (!options.folderId) {
                throw new Error("'folderId' option required");
            }

            // Create an item.
            girder.restRequest({
                method: "POST",
                path: "/item",
                data: {
                    folderId: options.folderId,
                    name: this.get("title") || "new vis",
                    description: this.get("description") || "new descriptionless vis!!"
                },
                success: _.bind(function (item) {
                    var finalize,
                        file;

                    // Set the id *again* here to cause a change event to be
                    // emitted - this is so that if the gallery is listening
                    // for id changes, it doesn't try to re-render a
                    // GalleryItem until after the uploads are complete.
                    finalize = _.after(3, _.bind(function () {
                        this.set("id", item._id);

                        if (options.success) {
                            options.success(this, undefined, options);
                        }
                    }, this));

                    // Set the id just before the upload phase, but
                    // "silently", so as not to trigger re-renders based on
                    // data that hasn't been uploaded yet.
                    this.set("id", item._id, {
                        silent: true
                    });

                    // Upload the vega spec into our item.
                    file = new girder.models.FileModel();
                    file.uploadToItem(item._id, JSON.stringify(this.get("vega"), null, 4), "vega.json");
                    file.on("g:upload.complete", _.bind(function () {
                        this.set("vegaId", file.get("_id"));
                        finalize();
                    }, this));

                    // Upload the timeline.
                    file = new girder.models.FileModel();
                    file.uploadToItem(item._id, JSON.stringify(this.get("timeline"), null, 4), "timeline.json");
                    file.on("g:upload.complete", _.bind(function () {
                        this.set("timelineId", file.get("_id"));
                        finalize();
                    }, this));

                    // Upload the poster image too.
                    file = new girder.models.FileModel();
                    file.uploadToItem(item._id, binData(this.get("png")), "poster.png", "application/octet-binary");
                    file.on("g:upload.complete", _.bind(function () {
                        this.set("posterId", file.get("_id"));
                        finalize();
                    }, this));
                }, this)
            });
        },

        updateHandler: function (options) {
            var successCount = 0,
                file,
                success,
                callback;

            callback = _.after(3, _.bind(function () {
                if (successCount === 3) {
                    this.trigger("edit");
                    _.bind(options.success || Backbone.$.noop, this)();
                } else {
                    _.bind(options.error || Backbone.$.noop, this)();
                }
            }, this));

            success = function () {
                successCount += 1;
                callback();
            };

            // Update the vega spec in-place.
            file = new girder.models.FileModel({
                _id: this.get("vegaId")
            });
            file.updateContents(JSON.stringify(this.get("vega"), null, 4));
            file.on("g:upload.complete", success);
            file.on("g:upload.error", callback);

            // Update the timeline data.
            file = new girder.models.FileModel({
                _id: this.get("timelineId")
            });
            file.updateContents(JSON.stringify(this.get("timeline"), null, 4));
            file.on("g:upload.complete", success);
            file.on("g:upload.error", callback);

            // And also the poster image.
            file = new girder.models.FileModel({
                _id: this.get("posterId")
            });
            file.updateContents(binData(this.get("png")));
            file.on("g:upload.complete", success);
            file.on("g:upload.error", callback);
        },

        deleteHandler: function (options) {
            var success = options && options.success || Backbone.$.noop,
                error = options && options.error || Backbone.$.noop;

            girder.restRequest({
                method: "DELETE",
                path: "/item/" + this.get("id"),
                success: function () {
                    success(this, undefined, options);
                },
                error: function () {
                    error(this, undefined, options);
                }
            });
        },

        setData: function (datafile, options) {
            datafile.fetch({
                fetchContents: true,
                success: _.bind(function () {
                    var name = datafile.get("name").split(".")[0];

                    this.set("data", {
                        name: name,
                        values: datafile.get("contents")
                    });

                    if (options && options.success) {
                        _.bind(options.success, this)();
                    }
                }, this)
            });
        },

        getData: function () {
            if (this.get("data")) {
                return this.get("data");
            } else if (app.util.maybeGet(this.get("vega"), "data", 0)) {
                return this.get("vega").data[0];
            } else {
                return undefined;
            }
        }
    });
}(window.app));
