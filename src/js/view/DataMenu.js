/* jshint browser: true */
/* global Backbone, _, d3 */

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
                .text(_.bind(function (d) {
                    return this.collection.get(d).get("name");
                }, this));
        }
    });

}(window.app));
