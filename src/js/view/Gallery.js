/* jshint browser: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    // A preview gallery of the vis files in a VisFiles collection.  Made up of
    // GalleryItems, arranged in rows on the screen.
    app.view.Gallery = Backbone.View.extend({
        initialize: function (options) {
            options = options || {};

            if (!this.collection) {
                throw new Error("fatal: must specify 'collection'");
            }

            if (!this.el) {
                throw new Error("fatal: must specify 'el'");
            }

            d3.select(this.el)
                .classed("container", true);

            this.items = [];

            this.newvis = options.newvis || false;

            this.listenTo(this.collection, "sync", _.debounce(this.render, 500));

            this.collection.fetch();
        },

        render: function () {
            var that = this;

            this.$el.html(app.templates.gallery({
                items: this.collection.length + this.newvis,
                rowLength: 5
            }));

            d3.select(this.el)
                .selectAll(".col-md-2")
                .data((this.newvis ? ["newvis"] : []).concat(this.collection.models))
                .each(function (visfile) {
                    if (_.isString(visfile)) {
                        if (visfile === "newvis") {
                            var html = app.templates.galleryItem({
                                posterUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTUiIGhlaWdodD0iMTE4Ij48cmVjdCB3aWR0aD0iMTU1IiBoZWlnaHQ9IjExOCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9Ijc3LjUiIHk9IjU5IiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjQ4cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+KzwvdGV4dD48L3N2Zz4K",
                                title: "Create New Visualization",
                                description: ""
                            });

                            d3.select(this)
                                .html(html)
                                .on("click", function () {
                                    app.router.navigate("vis/new", {
                                        trigger: true
                                    });
                                });
                        }
                    } else {
                        that.items.push(new app.view.GalleryItem({
                            model: visfile,
                            el: this
                        }));
                    }
                });

            this.trigger("render");
        }
    });
}(window.app));
