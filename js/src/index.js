/* jshint browser: true, jquery: true, devel: true */
/* global _, Backbone */

$(function () {
    "use strict";

    var app = window.app;

    // Get a list of visualizations.
    $.ajax({
        method: "GET",
        url: app.girder + "/collection",
        data: {
            text: "sitar"
        },
        dataType: "json",
        success: function (colls) {
            var sitar;

            if (colls.length === 0) {
                throw new Error("fatal: no collection named 'sitar' was found");
            } else if (colls.length > 1) {
                throw new Error("fatal: multiple collections named 'sitar' were found");
            }

            sitar = colls[0];

            $.ajax({
                method: "GET",
                url: app.girder + "/folder",
                data: {
                    parentType: "collection",
                    parentId: sitar._id,
                    text: "visualizations"
                },
                dataType: "json",
                success: function (folders) {
                    if (folders.length === 0) {
                        throw new Error("fatal: no folder named 'visualizations' was found");
                    } else if (folders.length > 1) {
                        throw new Error("fatal: multiple folders named 'visualizations' were found");
                    }

                    app.visFolder = folders[0];

                    $.ajax({
                        method: "GET",
                        url: app.girder + "/item",
                        data: {
                            folderId: app.visFolder._id
                        },
                        dataType: "json",
                        success: function (vis) {
                            var visIds,
                                gallery;

                            // Convert the list of file results into an id
                            // object.
                            visIds = _.map(vis, function (v) {
                                return {
                                    id: v._id
                                };
                            });

                            // Create a gallery view to work with the vis files.
                            gallery = new app.view.Gallery({
                                collection: new app.collection.VisFiles(visIds),
                                el: "#gallery"
                            });
                            gallery.render();

                            // Create a "radio button" abstraction over the
                            // various "pages" that can appear in the main area
                            // - the gallery overview, and an item view.
                            app.radio = new app.util.RadioDisplay({
                                classes: {
                                    remove: ["hidden"]
                                }
                            });
                            app.radio.addElement("gallery", "#gallery");
                            app.radio.addElement("itemview", "#itemview");

                            // Start the router.
                            app.router = new app.router.Router();
                            Backbone.history.start();
                        }
                    });
                }
            });
        }
    });
});
