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
                app.radio.select("itemview");
                console.log(itemId);
            }
        })
    };
}(window.app));

