/* jshint browser: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

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
        initialize: function () {
            if (!this.get("user")) {
                throw new Error("'user' property is required");
            }
        },

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

        girderRequest: function (options) {
            options.headers = _.extend(options.headers || {}, {
                "Girder-Token": this.get("user").get("token")
            });

            return Backbone.ajax(options);
        },

        upload: function (data, filename, options) {
            var uploadChunks,
                blob,
                nums,
                options2,
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
                var form;

                form = new window.FormData();
                form.append("offset", 0);
                form.append("uploadId", upload._id);
                form.append("chunk", blob);

                this.girderRequest({
                    url: app.girder + "/file/chunk",
                    type: "POST",
                    data: form,
                    contentType: false,
                    processData: false,
                    success: _.bind(function () {
                        if (options.idField) {
                            this.set(options.idField, upload._id);
                        }

                        if (options.success) {
                            options.success();
                        }
                    }, this)
                });
            }, this);

            if (_.isString(filename)) {
                options2 = {
                    url: app.girder + "/file",
                    type: "POST",
                    data: {
                        parentType: "item",
                        parentId: this.get("id"),
                        name: filename,
                        size: data.length
                    },
                    success: function (upload) {
                        uploadChunks(upload);
                    }
                };
            } else {
                options2 = {
                    url: app.girder + "/file/" + filename.id + "/contents",
                    type: "PUT",
                    data: {
                        size: data.length
                    },
                    success: function (upload) {
                        uploadChunks(upload);
                    }
                };
            }

            this.girderRequest(options2);
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
                    this.girderRequest({
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
                this.girderRequest({
                    method: "GET",
                    url: url,
                    dataType: "json",
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
            this.girderRequest({
                method: "POST",
                url: app.girder + "/item",
                data: {
                    folderId: options.folderId,
                    name: this.get("title") || "new vis",
                    description: this.get("description") || "new descriptionless vis!!"
                },
                headers: {
                    "Girder-Token": this.get("user").get("token")
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
            var successCount = 0,
                success,
                callback;

            callback = _.after(2, _.bind(function () {
                if (successCount === 2) {
                    _.bind(options.success || Backbone.$.noop, this)();
                } else {
                    _.bin(options.error || Backbone.$.noop, this)();
                }
            }, this));

            success = function () {
                successCount += 1;
                callback();
            };

            this.upload(JSON.stringify(this.get("vega"), null, 4), {id: this.get("vegaId")}, {
                success: success,
                error: callback
            });

            this.upload(this.get("png"), {id: this.get("posterId")}, {
                success: success,
                error: callback,
                binary: true,
                type: "application/octet-binary"
            });
        },

        deleteHandler: function (options) {
            var success = options && options.success || Backbone.$.noop,
                error = options && options.error || Backbone.$.noop;

            this.girderRequest({
                method: "DELETE",
                url: app.girder + "/item/" + this.get("id"),
                success: function () {
                    success(this, undefined, options);
                },
                error: function () {
                    error(this, undefined, options);
                }
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
