/* jshint browser: true, devel: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    app.view.NewVis = Backbone.View.extend({
        render: function () {
            var dataFiles,
                validateName,
                validateNameDebounced;

            d3.select(this.el)
                .html(app.templates.new());

            this.$(".wizard").wizard();

            validateName = _.bind(function () {
                var name,
                    desc,
                    me;

                me = d3.select(this.el);

                name = me.select(".vis-name")
                    .property("value");

                desc = me.select(".vis-description")
                    .property("value");

                if (name && desc) {
                    this.enableNext();
                } else {
                    this.disableNext();
                }
            }, this);

            validateNameDebounced = _.debounce(validateName, 150);

            this.$(".wizard")
                .on("changed.fu.wizard", _.bind(function (evt, data) {
                    switch (data.step) {
                        case 1: {
                            this.enableNext();
                            break;
                        }

                        case 2: {
                            validateName();
                            this.nextButton();
                            break;
                        }

                        case 3: {
                            this.enableNext();
                            this.okButton();
                            break;
                        }
                    }
                }, this));

            this.$(".wizard")
                .on("finished.fu.wizard", function () {
                    console.log("finished");
                });

            d3.select(this.el)
                .select(".wizard")
                .select("input.vis-name")
                .on("keyup", validateNameDebounced);

            d3.select(this.el)
                .select(".wizard")
                .select("textarea.vis-description")
                .on("keyup", validateNameDebounced);

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
        },

        enableNext: function () {
            d3.select(this.el)
                .select(".btn-next")
                .attr("disabled", null);
        },

        disableNext: function () {
            d3.select(this.el)
                .select(".btn-next")
                .attr("disabled", true);
        },

        okButton: function () {
            d3.select(this.el)
                .select(".btn-next")
                .text("OK");
        },

        nextButton: function () {
            d3.select(this.el)
                .select(".btn-next")
                .html("Next <span class=\"glyphicon glyphicon-arrow-right\"></span>");
        }
    });
}(window.app));
