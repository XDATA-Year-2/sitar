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

            svgURL: function (callback) {
                // This creates a data URL reflecting the SVG representation of
                // the Vega spec.  This includes an XML header and a DOCTYPE
                // declaration, as needed to make the resulting file a
                // standalone SVG file that can, e.g., be rendered directly in a
                // web browser or other software.

                vg.parse.spec(this.vega, function (chart) {
                    var div,
                        svg,
                        xml = "<?xml version=\"1.0\" standalone=\"no\"?>",
                        doctype = "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">",
                        xmlns = "http://www.w3.org/2000/svg",
                        dataURL;

                    // Construct a div element.
                    div = document.createElement("div");

                    // Render the Vega spec to this
                    // free-floating div as an SVG
                    // visualization.
                    chart({
                        renderer: "svg",
                        el: div
                    }).update();

                    // Extract the HTML for the SVG element.
                    svg = d3.select(div)
                        .select("div")
                        .select("svg");

                    // Put some SVG-XML specific attributes in
                    // the SVG element.
                    svg.attr("class", null)
                        .attr("version", "1.1")
                        .attr("xmlns", xmlns);

                    // Construct a data URL.
                    dataURL = URL.createObjectURL(new Blob([xml, doctype, svg.node().outerHTML], {type: "text/svg+xml"}));

                    // Invoke the callback with the URL.
                    callback(dataURL);
                });
            },

            pngURL: function () {
                var canvas,
                    png,
                    arrayBuf,
                    intArray;

                // Grab the canvas element containing the painted visualization.
                canvas = d3.select(this.el)
                    .select("canvas")
                    .node();

                // Get the base64-encoded PNG data, and convert it to raw bytes.
                png = window.atob(canvas.toDataURL("image/png").split(",")[1]);

                // Stuff the PNG data into an ArrayBuffer - this step is
                // necessary to creating a Blob URL, which in turn is necessary
                // because using a raw data URI causes buggy behavior in some
                // versions of Chrome.  See
                // https://code.google.com/p/chromium/issues/detail?id=373182.
                arrayBuf = new ArrayBuffer(png.length);
                intArray = new Uint8Array(arrayBuf);
                _.each(intArray, function (_, i) {
                    intArray[i] = png.charCodeAt(i);
                });

                // Create a blob URL and return it.
                return URL.createObjectURL(new Blob([arrayBuf], {type: "image/png"}));
            },

            render: function () {
                var me = d3.select(this.el);

                // Populate the div with the template text.
                me.html(app.templates.item());

                // Retrieve the vega specification from Girder and render it
                // when it arrives.
                Backbone.ajax({
                    method: "GET",
                    url: app.girder + "/file/" + this.model.get("vegaId") + "/download",
                    dataType: "json",
                    success: _.bind(function (spec) {
                        // TODO: really the spec should be stored in a different
                        // kind of model, one that has a "save" action to push a
                        // changed Vega spec back to Girder in case in changes
                        // (via editing, or rebinding data to it).
                        this.vega = spec;

                        // Render the spec to the main canvas element.
                        vg.parse.spec(spec, function (chart) {
                            // TODO: cache "chart" so that the vega spec doesn't
                            // need to be rendered again in svgURL() above?
                            chart({
                                el: me.select(".vis").node(),
                                renderer: "canvas"
                            }).update();
                        });

                        // Attach some click handlers to deal with export
                        // requests in various formats.
                        //
                        // SVG export - call the SVG URL method and download via
                        // an anchor element and simulated click.
                        me.select("a.export-svg")
                            .on("click", _.bind(function () {
                                this.svgURL(_.bind(function (url) {
                                    var a;

                                    // Create a (non-DOM) anchor element with
                                    // the SVG data embedded in it, and simulate
                                    // a click action on it.
                                    a = document.createElement("a");
                                    a.setAttribute("download", this.model.get("title") + ".svg");
                                    a.setAttribute("href", url);
                                    a.click();
                                }, this));
                            }, this));

                        // PNG export - same as above but use the PNG URL method
                        // instead.
                        me.select("a.export-png")
                            .on("click", _.bind(function () {
                                var url,
                                    a;

                                // Get a URL encoding the PNG.
                                url = this.pngURL();

                                // Simulate a user click on an anchor tag that
                                // has the data embedded in it.
                                a = document.createElement("a");
                                a.setAttribute("download", this.model.get("title") + ".png");
                                a.setAttribute("href", url);
                                a.click();
                            }, this));
                    }, this)
                });
            }
        })
    };
}(window.app));
