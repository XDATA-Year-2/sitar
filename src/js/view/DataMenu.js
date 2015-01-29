/* jshint browser: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    app.view.DataMenu = Backbone.View.extend({
        render: function () {
            var me = d3.select(this.el);

            me.selectAll("*")
                .remove();

            me.selectAll("option")
                .data(this.collection.pluck("id"))
                .enter()
                .append("option")
                .attr("data-id", function (d) {
                    return d;
                })
                .text(function (d) {
                    return app.dataFiles.get(d).get("name");
                });
        }
    });

}(window.app));
