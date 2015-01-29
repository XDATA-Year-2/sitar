/* jshint browser: true */
/* global Backbone */

(function (app) {
    "use strict";

    // A simple collection that triggers the formation of VisFile models when
    // handed their Girder item ids.
    app.collection.DataFiles = Backbone.Collection.extend({
        model: app.model.DataFile
    });
}(window.app));
