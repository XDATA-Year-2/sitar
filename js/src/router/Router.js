/* jshint browser: true */
/* global Backbone */

(function (app) {
    "use strict";

    app.router.Router = Backbone.Router.extend({
        routes: {
            "": "gallery",
            "item/create": "create",
            "item/:itemId": "item"
        },

        gallery: function () {
            app.radio.select("gallery");
        },

        item: function (itemId) {
            var view,
                model;

            app.radio.select("itemview");

            model = new app.model.VisFile({
                id: itemId
            });

            app.roni = view = new app.view.Item({
                el: "#itemview",
                model: model
            });

            model.fetch({
                fetchVega: true
            });
        },

        create: function () {
            var view;

            Backbone.$("#itemview")
                .empty();

            app.radio.select("itemview");

            view = new app.view.Item({
                el: "#itemview",
                model: new app.model.VisFile()
            });

            view.render();
        }
    });
}(window.app));
