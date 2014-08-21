/* jshint browser: true, devel: true */
/* global Backbone */

(function (app) {
    "use strict";

    app.router = {
        Router: Backbone.Router.extend({
            routes: {
                "": "gallery",
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
                }, {
                    fetchVega: true
                });

                view = new app.view.Item({
                    el: "#itemview",
                    model: model
                });
            }
        })
    };
}(window.app));

