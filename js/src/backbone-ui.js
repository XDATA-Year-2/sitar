/* jshint browser: true, devel: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    // A "global" reference to the Girder API path.
    //
    // TODO: make this dependent on either configuration, or a utility in
    // Tangelo that tells what this path is.
    app.girder = "/girder/api/v1";

    // Some namespaces for Backbone stuff.
    app.models = {};
    app.collections = {};
    app.views = {};
    app.routers = {};

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
    // 3. A vega spec file - this corresponds to the file id of the file
    // "vega.json", which should be the other file in the item in Girder.
    //
    // This information can be used to render a preview of the Vega spec within
    // the Gallery view, and also a more detailed view for an individual item,
    // which will also enable editing/saving/etc.
    app.models.VisFile = Backbone.Model.extend({
        initialize: function () {
            if (!this.id) {
                throw new Error("must supply 'id' attribute");
            }

            this.baseUrl = app.girder + "/item/" + this.id;
            this.fetch();
        },

        fetch: function () {
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

                // Set the attributes on the model.
                this.set(attrib);
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
                Backbone.$.ajax({
                    method: "GET",
                    url: url,
                    dataType: "json",
                    success: callback
                });
            });
        }
    });

    // A simple collection that triggers the formation of VisFile models when
    // handed their Girder item ids.
    app.collections.VisFiles = Backbone.Collection.extend({
        model: app.models.VisFile
    });

    // A preview gallery of the vis files in a VisFiles collection.  Made up of
    // GalleryItems, arranged in rows on the screen.
    app.views.Gallery = Backbone.View.extend({
        tagName: "verbatim",

        initialize: function () {
            if (!this.collection) {
                throw new Error("fatal: must specify 'collection'");
            }

            if (!this.el) {
                throw new Error("fatal: must specify 'el'");
            }

            d3.select(this.el)
                .classed("container", true);

            this.items = [];
        },

        render: function () {
            var row;

            this.collection.each(_.bind(function (visfile, i) {
                var view,
                    div;

                // Every five items, create a new row element.
                if (i % 5 === 0) {
                    row = d3.select(this.el)
                        .append("div")
                        .classed("row", true);
                }

                // Create a GalleryItem and attach it to a new div.
                div = row.append("div")
                    .classed("col-md-2", true)
                    .node();

                view = new app.views.GalleryItem({
                    model: visfile,
                    el: div
                });

                this.items.push(view);
                view.render();
            }, this));
        }
    });

    app.views.GalleryItem = Backbone.View.extend({
        initialize: function () {
            this.posterUrl = this.attributes && this.attributes.posterUrl;

            if (!this.model) {
                throw new Error("fatal: must supply 'model' property");
            }

            this.listenTo(this.model, "change", this.render);
        },

        openItemView: function () {
            app.router.navigate("item/" + this.model.get("id"), {trigger: true});
        },

        render: function () {
            var html = app.templates.galleryItem({
                posterUrl: app.girder + "/file/" + this.model.get("posterId") + "/download",
                title: this.model.get("title"),
                description: this.model.get("description")
            });

            d3.select(this.el)
                .html(html);

            // Attach a click handler to the thumbnail image.
            d3.select(this.el)
                .select("a.thumbnail")
                .on("click", _.bind(this.openItemView, this));
        }
    });

    app.routers.Router = Backbone.Router.extend({
        routes: {
            "": "gallery",
            "item/:itemId": "item"
        },

        gallery: function () {
            console.log("back to gallery!");
        },

        item: function (itemId) {
            console.log("viewing item " + itemId);
        }
    });
}(window.app));
