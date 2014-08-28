/* jshint browser: true, devel: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    app.model = {
        // A model of a "vis file".  This is conceptualized as the following
        // list of information:
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
        // This information can be used to render a preview of the Vega spec within
        // the Gallery view, and also a more detailed view for an individual item,
        // which will also enable editing/saving/etc.
        VisFile: Backbone.Model.extend({
            sync: function (method, model, options) {
                switch (method) {
                    case "create":
                        this.createHandler(options);
                        break;

                    case "read":
                        this.fetchHandler(options);
                        break;

                    case "update":
                        this.updateHandler(options);
                        break;

                    case "delete":
                        this.deleteHandler(options);
                        break;

                    default:
                        throw new Error("illegal condition: sync method was '" + method + "'");
                }
            },

            upload: function (data, filename, options) {
                var uploadChunks,
                    blob,
                    nums,
                    bdata;

                options = options || {};
                options.type = options.type || "";

                if (options.binary) {
                    nums = new Array(data.length);
                    _.each(data, function (_, i) {
                        nums[i] = data.charCodeAt(i);
                    });

                    bdata = new Uint8Array(nums);
                } else {
                    bdata = data;
                }

                blob = new window.Blob([bdata], {type: options.type});

                uploadChunks = _.bind(function (upload) {
                    var uploadChunk = _.bind(function (start, maxChunkSize) {
                        var end,
                            form;

                        form = new window.FormData();
                        form.append("offset", start);
                        form.append("uploadId", upload._id);
                        form.append("chunk", blob);

                        Backbone.ajax({
                            url: app.girder + "/file/chunk",
                            type: "POST",
                            data: form,
                            contentType: false,
                            processData: false,
                            success: _.bind(function (upload) {
                                if (end < data.length) {
                                    uploadChunk(end, maxChunkSize);
                                } else {
                                    if (options.idField) {
                                        this.set(options.idField, upload._id);
                                    }

                                    if (options.success) {
                                        options.success(this, undefined, options);
                                    }
                                }
                            }, this)
                        });
                    }, this);

                    uploadChunk(0, 64 * 1024 * 1024);
                }, this);

                Backbone.ajax({
                    url: app.girder + "/file",
                    type: "POST",
                    data: {
                        "parentType": "item",
                        "parentId": this.get("id"),
                        "name": filename,
                        "size": data.length
                    },
                    success: uploadChunks
                });
            },

            errorHandler: function (options) {
                return _.bind(function (jqxhr) {
                    var error = options.error || Backbone.$.noop;
                    error(this, jqxhr, options);
                }, this);
            },

            fetchHandler: function (options) {
                var baseUrl = app.girder + "/item/" + this.id,
                    urls = [baseUrl, baseUrl + "/files"],
                    results = [],
                    callback,
                    finalize;

                finalize = _.after(urls.length, _.bind(function () {
                    var attrib = {},
                        item,
                        posterFile,
                        vegaFile;

                    // 'results' should contain two entries - the first is an object
                    // with the overall item properties; the second is an array of
                    // two objects containing information about the "poster" and the
                    // vega spec.
                    item = results[0];
                    posterFile = results[1][0];
                    vegaFile = results[1][1];

                    // Extract and collect the necessary properties from the
                    // results.
                    attrib.title = item.name;
                    attrib.description = item.description;
                    attrib.posterId = posterFile._id;
                    attrib.vegaId = vegaFile._id;

                    // If requested, retrieve the Vega spec itself, then set the
                    // attributes; otherwise, just set the attributes.
                    if (options.fetchVega) {
                        Backbone.ajax({
                            method: "GET",
                            url: app.girder + "/file/" + vegaFile._id + "/download",
                            dataType: "json",
                            success: _.bind(function (vega) {
                                attrib.vega = vega;
                                this.set(attrib);

                                if (options.success) {
                                    options.success(this, undefined, options);
                                }
                            }, this),
                            error: this.errorHandler(options)
                        });
                    } else {
                        this.set(attrib);
                    }
                }, this));

                callback = function (json) {
                    results.push(json);
                    finalize();
                };

                // To construct the model we need to make two GET requests - one for
                // the item attributes (name and description, for example), and one
                // for the files contained within (the poster image and the actual
                // vega spec).
                _.each(urls, _.bind(function (url) {
                    Backbone.ajax({
                        method: "GET",
                        url: url,
                        dataType: "json",
                        success: callback,
                        error: this.errorHandler(options)
                    });
                }, this));
            },

            createHandler: function (options) {
                // Create an item.
                Backbone.ajax({
                    method: "POST",
                    url: app.girder + "/item",
                    data: {
                        folderId: app.visFolder._id,
                        name: this.get("title"),
                        description: this.get("description")
                    },
                    dataType: "json",
                    success: _.bind(function (item) {
                        var finalize;

                        // Set the id *again* here to cause a change event to be
                        // emitted - this is so that if the gallery is listening
                        // for id changes, it doesn't try to re-render a
                        // GalleryItem until after the uploads are complete.
                        finalize = _.bind(function () {
                            this.set("id", item._id);

                            if (options.success) {
                                options.success(this, undefined, options);
                            }
                        }, this);

                        // Set the id just before the upload phase, but
                        // "silently", so as not to trigger re-renders based on
                        // data that hasn't been uploaded yet.
                        this.set("id", item._id, {
                            silent: true
                        });

                        this.upload(JSON.stringify(this.get("vega"), null, 4), "vega.json", {
                            success: finalize,
                            idField: "vegaId"
                        });

                        this.upload(this.get("png"), "poster.png", {
                            success: finalize,
                            idField: "posterId",
                            binary: true,
                            type: "application/octet-binary"
                        });
                    }, this)
                });
            },

            updateHandler: function (options) {
                // Currently, to "update" an item in Girder, you have to delete
                // it and reupload with the same location, name, description,
                // and new content.  This will cause the IDs in the model to
                // change, so be sure to emit a signal to indicate that a
                // refresh may be needed elsewhere.
                this.deleteHandler({
                    success: _.bind(function () {
                        this.createHandler(options);
                    }, this),
                    error: this.errorHandler(options)
                });
            },

            deleteHandler: function (options) {
                var success = options && options.success || Backbone.$.noop,
                    error = options && options.error || Backbone.$.noop;

                Backbone.ajax({
                    method: "DELETE",
                    url: app.girder + "/item/" + this.get("id"),
                    success: function () {
                        success(this, undefined, options);
                    },
                    error: function () {
                        error(this, undefined, options);
                    }
                });
            }
        })
    };
}(window.app));
