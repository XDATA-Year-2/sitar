/* jshint browser: true, jquery: true, devel: true */
/* global _, Backbone, d3 */

$(function () {
    "use strict";

    var app = window.app;

    app.user = new app.model.User();

    // Attach a name view to the navbar name slot.
    app.name = new app.view.Name({
        model: app.user,
        el: "#name"
    });

    // Attach login actions to the "log in" button.
    d3.select("#login")
        .on("submit", function () {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");

            // Attempt to log the user in if not already logged in.
            app.user.fetch({
                username: username,
                password: password,
                success: function () {
                    var target = app.jumpback || "gallery";
                    app.jumpback = null;

                    d3.select("#jumpback")
                        .classed("hidden", true);

                    d3.select("#failed")
                        .classed("hidden", true);

                    d3.select("#username")
                        .property("value", "");

                    d3.select("#password")
                        .property("value", "");

                    app.router.navigate(target, {trigger: true});
                },
                error: function () {
                    d3.select("#failed")
                        .classed("hidden", false);
                }
            });

            d3.event.preventDefault();
        });

    // Attach action to the "register" button.
    d3.select("#register")
        .on("click", function () {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");
        });

    // Attach action to the "logout" dropdown item.
    d3.select("#logout")
        .on("click", function () {
            app.user.destroy({
                success: function () {
                    app.jumpback = null;
                    app.router.navigate("", {trigger: true});
                },

                error: function () {
                    throw new Error("the impossible has happened");
                }
            });
        });

    var vises, gallery;

    vises = new app.collection.Visualizations();
    vises.listenTo(app.user, "change:user", _.partial(vises.fetch, {user: app.user}));

    gallery = new app.view.Gallery({
        collection: vises,
        el: "#gallery"
    });
    gallery.listenTo(vises, "sync", _.debounce(gallery.render, 500));
    gallery.listenTo(app.user, "destroy", gallery.clear);

    app.radio = new app.util.RadioDisplay({
        classes: {
            remove: ["hidden"]
        },

        onSelect: function (name) {
            d3.select("#navbar")
                .classed("hidden", name === "welcome");
        }
    });
    app.radio.addElement("welcome", "#welcome");
    app.radio.addElement("gallery", "#gallery");
    app.radio.addElement("itemview", "#itemview");

    app.router = new app.router.Router();
    Backbone.history.start();
 
    // Get a list of visualizations.
/*    $.ajax({*/
        //method: "GET",
        //url: app.girder + "/collection",
        //data: {
            //text: "sitar"
        //},
        //dataType: "json",
        //success: function (colls) {
            //var sitar,
                //startup,
                //visfiles,
                //datafiles;

            //if (colls.length === 0) {
                //throw new Error("fatal: no collection named 'sitar' was found");
            //} else if (colls.length > 1) {
                //throw new Error("fatal: multiple collections named 'sitar' were found");
            //}

            //sitar = colls[0];

            //startup = _.after(2, function () {
                //var visIds,
                    //dataIds,
                    //gallery;

                //// Convert the list of file results into an id
                //// object.
                //visIds = _.map(visfiles, function (v) {
                    //return {
                        //id: v._id
                    //};
                //});

                //// Create a gallery view to work with the vis files.
                //gallery = new app.view.Gallery({
                    //collection: new app.collection.VisFiles(visIds),
                    //el: "#gallery"
                //});
                //gallery.render();

                //// Convert the list of data file results into an id object.
                //dataIds = _.map(datafiles, function (d) {
                    //return {
                        //id: d._id
                    //};
                //});

                //// Create a collection of data files for use in the "set data"
                //// menu.
                //app.dataFiles = new app.collection.DataFiles(dataIds);
                //app.dataFiles.each(function (m) {
                    //m.fetch();
                //});

                //// Create a "radio button" abstraction over the various "pages"
                //// that can appear in the main area - the gallery overview, and
                //// an item view.
                //app.radio = new app.util.RadioDisplay({
                    //classes: {
                        //remove: ["hidden"]
                    //},

                    //onSelect: function (name) {
                        //d3.select("#navbar")
                            //.classed("hidden", name === "welcome");
                    //}
                //});
                //app.radio.addElement("welcome", "#welcome");
                //app.radio.addElement("gallery", "#gallery");
                //app.radio.addElement("itemview", "#itemview");

                //// Start the router.
                //app.router = new app.router.Router();
                //Backbone.history.start();
            //});

            //$.ajax({
                //method: "GET",
                //url: app.girder + "/folder",
                //data: {
                    //parentType: "collection",
                    //parentId: sitar._id,
                    //text: "visualizations"
                //},
                //dataType: "json",
                //success: function (folders) {
                    //if (folders.length === 0) {
                        //throw new Error("fatal: no folder named 'visualizations' was found");
                    //} else if (folders.length > 1) {
                        //throw new Error("fatal: multiple folders named 'visualizations' were found");
                    //}

                    //app.visFolder = folders[0];

                    //$.ajax({
                        //method: "GET",
                        //url: app.girder + "/item",
                        //data: {
                            //folderId: app.visFolder._id
                        //},
                        //dataType: "json",
                        //success: function (response) {
                            //visfiles = response;
                            //startup();
                        //}
                    //});
                //}
            //});

            //$.ajax({
                //method: "GET",
                //url: app.girder + "/folder",
                //data: {
                    //parentType: "collection",
                    //parentId: sitar._id,
                    //text: "data"
                //},
                //dataType: "json",
                //success: function (folders) {
                    //if (folders.length === 0) {
                        //throw new Error("fatal: no folder named 'data' was found");
                    //} else if (folders.length > 1) {
                        //throw new Error("fatal: multiple folders named 'data' were found");
                    //}

                    //app.dataFolder = folders[0];

                    //$.ajax({
                        //method: "GET",
                        //url: app.girder + "/item",
                        //data: {
                            //folderId: app.dataFolder._id
                        //},
                        //dataType: "json",
                        //success: function (response) {
                            //datafiles = response;
                            //startup();
                        //}
                    //});
                //}
            //});
        //}
    /*});*/
});
