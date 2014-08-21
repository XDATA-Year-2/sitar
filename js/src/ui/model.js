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
            initialize: function () {
                if (!this.id) {
                    throw new Error("must supply 'id' attribute");
                }

                this.baseUrl = app.girder + "/item/" + this.id;
            },

            sync: function (method, model, options) {
                switch (method) {
                    case "create":
                        Backbone.sync.apply(this, arguments);
                        break;

                    case "read":
                        this.fetchHandler(options);
                        break;

                    case "update":
                        Backbone.sync.apply(this, arguments);
                        break;

                    case "delete":
                        Backbone.sync.apply(this, arguments);
                        break;

                    default:
                        throw new Error("illegal condition: sync method was '" + method + "'");
                }
            },

            fetchHandler: function (options) {
                var urls = [this.baseUrl, this.baseUrl + "/files"],
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
                            }, this)
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
                _.each(urls, function (url) {
                    Backbone.ajax({
                        method: "GET",
                        url: url,
                        dataType: "json",
                        success: callback
                    });
                });
            }
        })
    };
}(window.app));
