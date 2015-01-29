/* jshint browser: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    // A preview gallery of the vis files in a VisFiles collection.  Made up of
    // GalleryItems, arranged in rows on the screen.
    app.view.Gallery = Backbone.View.extend({
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

            // Trigger a render whenever the collection changes.
            //
            // TODO: this is harder than it seems.  Really we want to know
            // if the *files* have changed on the server.  We may need to
            // listen to a different set of models, or somehow detect when
            // the title/description/poster have changed.  Commented out for
            // now as it's not really effective as is.
            //
            //this.collection.on("add remove reset change", this.render, this);
        },

        render: function () {
            var row,
                html;

            row = d3.select(this.el)
                .append("div")
                .classed("row", true);

            html = app.templates.galleryItem({
                posterUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTUiIGhlaWdodD0iMTE4Ij48cmVjdCB3aWR0aD0iMTU1IiBoZWlnaHQ9IjExOCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9Ijc3LjUiIHk9IjU5IiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjQ4cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+KzwvdGV4dD48L3N2Zz4K",
                title: "Create New Visualization",
                description: ""
            });

            row.append("div")
                .classed("col-md-2", true)
                .html(html)
                .select("a.thumbnail")
                .on("click", function () {
                    app.router.navigate("item/create", {trigger: true});
                });

            this.collection.each(function (visfile, i) {
                var view,
                    div;

                // Every five items, create a new row element.
                if (i + 1 % 5 === 0) {
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
            }, this);
        }
    });
}(window.app));
