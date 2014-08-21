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
            },

            svgURL: function (callback) {
                // This creates a data URL reflecting the SVG representation of
                // the Vega spec.  This includes an XML header and a DOCTYPE
                // declaration, as needed to make the resulting file a
                // standalone SVG file that can, e.g., be rendered directly in a
                // web browser or other software.
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
                this.chart({
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

            vegaURL: function () {
                var vegaText = JSON.stringify(this.model.get("vega"), null, 4);
                return URL.createObjectURL(new Blob([vegaText], {type: "application/json"}));
            },

            render: function () {
                var me = d3.select(this.el);

                // Populate the div with the template text.
                me.html(app.templates.item());

                // Render the spec to the main canvas element.
                vg.parse.spec(this.model.get("vega"), _.bind(function (chart) {
                    var exporter,
                        title;

                    // Cache the chart function for later use.
                    this.chart = chart;

                    // Render the vega spec to the canvas element.
                    chart({
                        el: me.select(".vis").node(),
                        renderer: "canvas"
                    }).update();

                    // A function generator to download a data- or blob-encoded
                    // URL.
                    exporter = function (url, savefile) {
                        return function () {
                            var a = document.createElement("a");
                            a.setAttribute("download", savefile);
                            a.setAttribute("href", url);
                            a.click();
                        };
                    };

                    // Attach a click handler to launch Lyra.
                    me.select("button.edit")
                        .on("click", _.bind(function () {
                            var lyra,
                                handler;

                            lyra = window.open("/lyra", "_blank");
                            lyra.onload = _.bind(function () {
                                var msg = {
                                    data: {
                                        name: this.model.get("vega").data[0].name,
                                        values: this.model.get("vega").data[0].values
                                    }
                                };

                                if (this.timeline) {
                                    msg.timeline = this.timeline;
                                } else {
                                    msg.spec = this.model.get("vega");
                                }

                                lyra.postMessage(msg, window.location.origin);
                            }, this);

                            handler = _.bind(function (evt) {
                                var msg = evt.data,
                                    source = evt.source;

                                // Check to make sure it was the lyra window
                                // that sent this message.
                                if (source !== lyra) {
                                    console.warn("suspicious message received");
                                    console.warn(evt);
                                    return;
                                }

                                // Ensure that the message reception was a
                                // one-shot deal.
                                window.removeEventListener("message", handler);

                                // Set the incoming vega spec on the model.
                                this.model.set({
                                    vega: msg.spec
                                });

                                // Save the timeline object for future editing
                                // usage in this session.
                                this.timeline = msg.timeline;
                            }, this);

                            window.addEventListener("message", handler);
                        }, this));

                    // Attach some click handlers to deal with export
                    // requests in various formats.
                    //
                    // SVG export - call the SVG URL method and download via
                    // an anchor element and simulated click.
                    title = this.model.get("title");
                    me.select("a.export-svg")
                        .on("click", _.bind(function () {
                            this.svgURL(function (url) {
                                exporter(url, title + ".svg")();
                            });
                        }, this));

                    // PNG export - same as above but use the PNG URL method
                    // instead.
                    me.select("a.export-png")
                        .on("click", exporter(this.pngURL(), title + ".png"));

                    // Vega export - use the Vega URL method this time.
                    me.select("a.export-vega")
                        .on("click", exporter(this.vegaURL(), title + ".json"));
                }, this));
            }
        })
    };
}(window.app));
