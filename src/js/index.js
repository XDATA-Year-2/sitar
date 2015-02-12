/* jshint browser: true, jquery: true */
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
            var sitar,
                startup,
                visfiles,
                datafiles;

            if (colls.length === 0) {
                throw new Error("fatal: no collection named 'sitar' was found");
            } else if (colls.length > 1) {
                throw new Error("fatal: multiple collections named 'sitar' were found");
            }

            sitar = colls[0];

            startup = _.after(2, function () {
                var visIds,
                    dataIds,
                    gallery;

                // Convert the list of file results into an id
                // object.
                visIds = _.map(visfiles, function (v) {
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

                // Convert the list of data file results into an id object.
                dataIds = _.map(datafiles, function (d) {
                    return {
                        id: d._id
                    };
                });

                // Create a collection of data files for use in the "set data"
                // menu.
                app.dataFiles = new app.collection.DataFiles(dataIds);
                app.dataFiles.each(function (m) {
                    m.fetch();
                });

                // Create a "radio button" abstraction over the various "pages"
                // that can appear in the main area - the gallery overview, and
                // an item view.
                app.radio = new app.util.RadioDisplay({
                    classes: {
                        remove: ["hidden"]
                    }
                });
                app.radio.addElement("welcome", "#welcome");
                app.radio.addElement("gallery", "#gallery");
                app.radio.addElement("itemview", "#itemview");

                // Start the router.
                app.router = new app.router.Router();
                Backbone.history.start();
            });

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
                        success: function (response) {
                            visfiles = response;
                            startup();
                        }
                    });
                }
            });

            $.ajax({
                method: "GET",
                url: app.girder + "/folder",
                data: {
                    parentType: "collection",
                    parentId: sitar._id,
                    text: "data"
                },
                dataType: "json",
                success: function (folders) {
                    if (folders.length === 0) {
                        throw new Error("fatal: no folder named 'data' was found");
                    } else if (folders.length > 1) {
                        throw new Error("fatal: multiple folders named 'data' were found");
                    }

                    app.dataFolder = folders[0];

                    $.ajax({
                        method: "GET",
                        url: app.girder + "/item",
                        data: {
                            folderId: app.dataFolder._id
                        },
                        dataType: "json",
                        success: function (response) {
                            datafiles = response;
                            startup();
                        }
                    });
                }
            });
        }
    });
});
