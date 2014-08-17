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
                    var visFolder;

                    if (folders.length === 0) {
                        throw new Error("fatal: no folder named 'visualizations' was found");
                    } else if (folders.length > 1) {
                        throw new Error("fatal: multiple folders named 'visualizations' were found");
                    }

                    visFolder = folders[0];

                    $.ajax({
                        method: "GET",
                        url: app.girder + "/item",
                        data: {
                            folderId: visFolder._id
                        },
                        dataType: "json",
                        success: function (vis) {
                            var visIds,
                                gallery;

                            // Start the router.
                            app.router = new app.routers.Router();
                            Backbone.history.start();

                            // Convert the list of file results into an id
                            // object.
                            visIds = _.map(vis, function (v) {
                                return {
                                    id: v._id
                                };
                            });

                            // Create a collection of vis files, and a gallery
                            // view to work with that collection.
                            app.files = new app.collections.VisFiles(visIds);
                            gallery = new app.views.Gallery({
                                collection: app.files,
                                el: "#gallery"
                            });

                            // Trigger a gallery re-render whenever the
                            // collection changes.
                            app.files.on("add remove reset change", function () {
                                gallery.render();
                            });
                        }
                    });
                }
            });
        }
    });
});
