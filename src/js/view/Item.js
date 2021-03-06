/* jshint browser: true */
/* global Backbone, _, d3, vg */

(function (app) {
    "use strict";

    app.view.Item = Backbone.View.extend({
        events: {
            "click a.edit": "edit",
            "click a.delete": "delete",
            "click a.export-svg": "exportSVG",
            "click a.export-png": "exportPNG",
            "click a.export-vega": "exportVega"
        },

        initialize: function (options) {
            options = options || {};

            if (!this.model) {
                throw new Error("fatal: must specify a model");
            }

            this.allowEdit = options.allowEdit;

            this.tag = "sitar_" + _.times(16, function () {
                return _.sample("0123456789abcdef");
            }).join("");

            this.listenTo(this.model, "change:vega", this.render);

            if (!this.model.isNew()) {
                this.model.fetch({
                    fetchVega: true
                });
            }

            if (this.allowEdit) {
                this.on("edit_finished", function () {
                    this.render({
                        success: _.bind(function () {
                            this.model.set("png", window.atob(this.pngB64()));
                            this.model.save({}, {
                                folderId: app.home.get("visFolder"),
                                success: _.bind(function () {
                                    app.router.navigate("vis/" + this.model.get("id"), {
                                        trigger: false,
                                        replace: true
                                    });
                                }, this)
                            });
                        }, this)
                    });
                }, this);
            }
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
            var msg,
                handler;

            if (this.model.isNew()) {
                msg = {
                    data: this.model.getData()
                };
            } else {
                msg = {
                    data: this.model.getData(),
                    timeline: this.model.get("timeline"),
                    spec: this.model.get("vega")
                };
            }

            handler = _.bind(function () {
                var msg = JSON.parse(localStorage.getItem(this.tag));

                // Set the incoming vega spec on the model, as well as the
                // timeline object (to revive future editing sessions).
                this.model.set({
                    vega: msg.spec,
                    timeline: msg.timeline
                });

                this.trigger("edit_finished");

                window.removeEventListener("storage", handler);

                localStorage.removeItem(this.tag);
            }, this);

            localStorage.setItem(this.tag, JSON.stringify(msg));

            window.addEventListener("storage", handler);
        },

        delete: function () {
            this.model.destroy({
                success: function () {
                    app.router.navigate("gallery", {
                        trigger: true
                    });
                }
            });
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

        setupPlacard: function (placardSelector, headerTag, updateFunc) {
            var placard,
                header,
                text,
                edit,
                jqSel,
                d3Sel,
                hide,
                show;

            // Convenience functions for converting from one selection type to
            // the other.
            //
            // One for d3-to-jquery...
            jqSel = function (s) {
                return Backbone.$(s.node());
            };

            // ...and one for jquery-to-d3.
            d3Sel = function (s) {
                return d3.select(s.get(0));
            };

            // The top-level placard-bearing element.
            placard = this.$(placardSelector);

            // The actual title header for the placard.
            header = d3.select(this.el)
                .select(headerTag);

            // This contains the title text.
            text = header.select("span");

            // And this contains the link to initiate the edit.
            edit = header.select("a");

            // Convenience functions for showing/hiding the active placard.
            //
            // Hiding entails: hiding the placard itself, then making the
            // placard element invisible and the header element visible.
            hide = function () {
                placard.placard("hide");

                d3Sel(placard).classed("hidden", true);
                header.classed("hidden", false);
            };

            // Showing is just the opposite.
            show = function () {
                header.classed("hidden", true);
                d3Sel(placard).classed("hidden", false);

                placard.placard("show");
            };

            // Instantiate the placard with custom accept/cancel functions.
            placard.placard({
                externalClickAction: "",

                onAccept: _.bind(function (state) {
                    if (state.previousValue !== state.value) {
                        text.text(state.value);
                        updateFunc(state.value);
                    }

                    hide();
                }, this),

                onCancel: hide
            });

            // React to a click on the edit link.
            jqSel(edit).on("click", _.bind(function (e) {
                e.preventDefault();

                placard.placard("setValue", text.text());
                show();
            }, this));
        },

        render: function (options) {
            var me = d3.select(this.el),
                vega;

            // Populate the div with the template text.
            me.html(app.templates.item({
                title: this.model.get("title"),
                description: this.model.get("description"),
                tag: this.tag,
                allowEdit: this.allowEdit
            }));

            // Set up the editable placards.
            if (this.allowEdit) {
                this.setupPlacard(".title-placard", "h1", _.bind(this.model.updateTitle, this.model));
                this.setupPlacard(".description-placard", "h2", _.bind(this.model.updateDescription, this.model));
            }

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

                    if (options.success) {
                        _.bind(options.success, this)();
                    }
                }, this));
            } else {
                me.select(".vis")
                    .html("<em>No visualization created yet - use the edit button to the right!</em>");
            }
        }
    });
}(window.app));
