/* jshint browser: true, devel: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    app.view.NewVis = Backbone.View.extend({
        render: function () {
            var dataFiles;

            d3.select(this.el)
                .html(app.templates.new());

            this.$(".wizard").wizard();

            dataFiles = new app.collection.DataFiles();
            dataFiles.fetch({
                user: app.user,

                success: _.bind(function () {
                    var render,
                        view,
                        select;

                    select = d3.select(this.el)
                        .select("select.dataset")
                        .node();

                    view = new app.view.DataMenu({
                        collection: dataFiles,
                        el: select
                    });

                    render = _.after(dataFiles.models.length, _.bind(view.render, view));

                    _.each(dataFiles.models, function (m) {
                        // (The success callback is wrapped with
                        // _.after(), so the underlying function
                        // (view.render()) won't be called until the
                        // last model is fetched).
                        m.fetch({
                            success: render
                        });
                    });
                }, this)
            });
        }
    });
}(window.app));
