/* jshint browser: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    app.view.Name = Backbone.View.extend({
        initialize: function () {
            this.model.on("change:name", this.render, this);
        },

        render: function () {
            d3.select(this.el)
                .html(this.model.get("name") || "Ravi S.");
        }
    });
}(window.app));
