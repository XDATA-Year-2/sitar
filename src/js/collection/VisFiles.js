/* jshint browser: true */
/* global Backbone */

(function (app) {
    "use strict";

    // A simple collection that triggers the formation of VisFile models when
    // handed their Girder item ids.
    app.collection.VisFiles = Backbone.Collection.extend({
        model: app.model.VisFile
    });
}(window.app));
