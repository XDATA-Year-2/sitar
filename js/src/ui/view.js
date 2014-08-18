/* jshint browser: true, devel: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    app.view = {
        // A preview gallery of the vis files in a VisFiles collection.  Made up
        // of GalleryItems, arranged in rows on the screen.
        Gallery: Backbone.View.extend({
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

                    view = new app.view.GalleryItem({
                        model: visfile,
                        el: div
                    });

                    this.items.push(view);
                    view.render();
                }, this));
            }
        }),

        GalleryItem: Backbone.View.extend({
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
        }),
    };
}(window.app));

