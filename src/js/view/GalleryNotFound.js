/* jshint browser: true */
/* global Backbone */

(function (app) {
    "use strict";

    app.view.GalleryNotFound = Backbone.View.extend({
        initialize: function (options) {
            options = options || {};

            this.username = options.username;
        },

        render: function () {
            this.$el.html(app.templates.galleryNotFound({
                username: this.username
            }));
        }
    });
}(window.app));
