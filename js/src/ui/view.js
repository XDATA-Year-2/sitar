/* jshint browser: true, devel: true */
/* global Backbone, _, d3, vg */

(function (app) {
    "use strict";

    app.view = {
        // A preview gallery of the vis files in a VisFiles collection.  Made up
        // of GalleryItems, arranged in rows on the screen.
        Gallery: Backbone.View.extend({
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
                var row;

                this.collection.each(function (visfile, i) {
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
                }, this);
            }
        }),

        GalleryItem: Backbone.View.extend({
            initialize: function () {
                this.posterUrl = this.attributes && this.attributes.posterUrl;

                if (!this.model) {
                    throw new Error("fatal: must supply 'model' property");
                }

                this.model.on("change", this.render, this);
                this.model.fetch();
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

        Item: Backbone.View.extend({
            initialize: function () {
                if (!this.model) {
                    throw new Error("fatal: must specify a model");
                }

                this.model.on("change", this.render, this);
                this.model.fetch();
            },

            render: function () {
                var elt;

                // Populate the div with the template text.
                d3.select(this.el)
                    .html(app.templates.item());

                elt = d3.select(this.el)
                    .select(".vis")
                    .node();

                // Retrieve the vega specification from Girder and render it
                // when it arrives.
                Backbone.ajax({
                    method: "GET",
                    url: app.girder + "/file/" + this.model.get("vegaId") + "/download",
                    dataType: "json",
                    success: function (spec) {
                        vg.parse.spec(spec, function (chart) {
                            chart({
                                el: elt,
                                renderer: "svg"
                            }).update();
                        });
                    }
                });
            }
        })
    };
}(window.app));
