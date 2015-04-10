/* jshint browser: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    // A preview gallery of the vis files in a VisFiles collection.  Made up of
    // GalleryItems, arranged in rows on the screen.
    app.view.Browse = Backbone.View.extend({
        render: function () {
            d3.select(this.el)
                .html("<h1>Hello</h1>");
        }
    });
}(window.app));
