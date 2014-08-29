/* jshint browser: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    app.view.GalleryItem = Backbone.View.extend({
        initialize: function () {
            this.posterUrl = this.attributes && this.attributes.posterUrl;

            if (!this.model) {
                throw new Error("fatal: must supply 'model' property");
            }

            this.model.on("change", this.render, this);
            this.model.fetch();
        },

        openItemView: function () {
            app.router.navigate("item/" + this.model.get("id"), {trigger: true});
        },

        render: function () {
            var html = app.templates.galleryItem({
                posterUrl: app.girder + "/file/" + this.model.get("posterId") + "/download",
                title: this.model.get("title"),
                description: this.model.get("description")
            });

            d3.select(this.el)
                .html(html);

            // Attach a click handler to the thumbnail image.
            d3.select(this.el)
                .select("a.thumbnail")
                .on("click", _.bind(this.openItemView, this));
        }
    });
}(window.app));

