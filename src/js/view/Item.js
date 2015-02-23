/* jshint browser: true */
/* global Backbone, _, d3, vg */

(function (app) {
    "use strict";

    app.view.Item = Backbone.View.extend({
        events: {
            "click button.edit": "edit",
            "click a.export-svg": "exportSVG",
            "click a.export-png": "exportPNG",
            "click a.export-vega": "exportVega"
        },

        initialize: function () {
            if (!this.model) {
                throw new Error("fatal: must specify a model");
            }

            this.model.once("change:vega", function () {
                this.render();

                this.model.on("change:vega", function () {
                    this.render();
                    window.setTimeout(_.bind(function () {
                        this.model.set("png", window.atob(this.pngB64()));
                        this.model.save({
                            success: _.bind(function () {
                                app.router.navigate("item/" + this.model.get("id"), {
                                    trigger: false,
                                    replace: true
                                });
                            }, this)
                        });
                    }, this), 1000);
                }, this);
            }, this);
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

        pngB64: function () {
            var canvas;

            canvas = d3.select(this.el)
                .select("canvas")
                .node();

            return canvas.toDataURL("image/png").split(",")[1];
        },

        pngURL: function () {
            var png,
                arrayBuf,
                intArray;

            // Get the base64-encoded PNG data, and convert it to raw bytes.
            png = window.atob(this.pngB64());

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

        edit: function () {
            var lyra,
                handler;

            lyra = window.open("/lyra", "_blank");
            lyra.onload = _.bind(function () {
                var msg,
                    vega,
                    data;

                if (this.model.isNew()) {
                    data = this.model.getData();
                    msg = {
                        data: data
                    };
                } else {
                    vega = this.model.get("vega");
                    msg = {
                        data: this.model.getData()
                    };

                    if (this.timeline) {
                        msg.timeline = this.timeline;
                    } else {
                        msg.spec = vega;
                    }
                }

                lyra.postMessage(msg, window.location.origin);
            }, this);

            handler = _.bind(function (evt) {
                var msg = evt.data,
                    source = evt.source;

                // Check to make sure it was the lyra window
                // that sent this message.
                if (source !== lyra) {
                    throw new Error("suspicious message received: " + evt);
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

                // Save the model to the server.
                this.model.save();
            }, this);

            window.addEventListener("message", handler);
        },

        exportURL: function (url, savefile) {
            var a = document.createElement("a");
            a.setAttribute("download", savefile);
            a.setAttribute("href", url);
            a.click();
        },

        exportSVG: function () {
            this.svgURL(_.bind(function (url) {
                this.exportURL(url, this.model.get("title") + ".svg");
            }, this));
        },

        exportPNG: function () {
            this.exportURL(this.pngURL(), this.model.get("title") + ".png");
        },

        exportVega: function () {
            this.exportURL(this.vegaURL(), this.model.get("title") + ".json");
        },

        render: function () {
            var me = d3.select(this.el),
                vega,
                dataFiles = new app.collection.DataFiles();

            // Populate the div with the template text.
            me.html(app.templates.item());

            // Attach a handler to fill in the dataset menu whenever the dialog
            // box is invoked.
            Backbone.$("#set-data")
                .on("show.bs.modal", function () {
                    var select,
                        view;

                    select = d3.select(this)
                        .select("select");

                    select.selectAll("option")
                        .remove();

                    dataFiles.fetch({
                        user: app.user,

                        success: function () {
                            view = new app.view.DataMenu({
                                collection: dataFiles,
                                el: select.node()
                            });

                            _.each(dataFiles.models, function (m) {
                                m.fetch({
                                    success: _.after(dataFiles.models.length, _.bind(view.render, view))
                                });
                            });
                        }
                    });
                });

            d3.select("#set-data")
                .select("button.accept")
                .on("click", _.bind(function () {
                    var select,
                        dataId;

                    select = d3.select(this.el)
                        .select("select")
                        .node();

                    Backbone.$("#set-data")
                        .modal("hide");

                    dataId = select.selectedOptions[0].getAttribute("data-id");

                    dataFiles.get(dataId)
                        .fetchContents({
                            success: _.bind(function (model) {
                                var name = model.get("name").split(".")[0];

                                this.model.set("data", {
                                    name: name,
                                    values: model.get("contents")
                                });
                            }, this),

                            error: function (_, response) {
                                throw response;
                            }
                        });
                }, this));

            // Render the spec to the main canvas element.
            vega = this.model.get("vega");
            if (vega) {
                vg.parse.spec(vega, _.bind(function (chart) {
                    // Cache the chart function for later use.
                    this.chart = chart;

                    // Render the vega spec to the canvas element.
                    chart({
                        el: me.select(".vis").node(),
                        renderer: "canvas"
                    }).update();
                }, this));
            } else {
                me.select(".vis")
                    .html("<em>No visualization created yet - use the edit button to the right!</em>");
            }
        }
    });
}(window.app));
