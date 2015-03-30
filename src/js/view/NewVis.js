/* jshint browser: true */
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
                    me;

                me = d3.select(this.el);

                name = me.select(".vis-name")
                    .property("value");

                if (name) {
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
                .on("finished.fu.wizard", _.bind(function () {
                    var me,
                        select;

                    me = d3.select(this.el);

                    select = me.select("select")
                        .node();

                    this.model.set("title", me.select(".vis-name").property("value"));
                    this.model.set("description", me.select(".vis-description").property("value"));

                    this.model.setData(dataFiles.get(select.selectedOptions[0].getAttribute("data-id")), {
                        success: _.bind(function () {
                            var tag = app.router.showItem(this.model);
                            this.other.location = "/lyra/?editormode=" + tag;
                            delete this.other;
                        }, this)
                    });
                }, this));

            d3.select(this.el)
                .select(".wizard")
                .select("input.vis-name")
                .on("keyup", validateNameDebounced);

            d3.select(this.el)
                .select(".wizard")
                .select("textarea.vis-description")
                .on("keyup", validateNameDebounced);

            dataFiles = new app.collection.DataFiles({
                home: app.home
            });

            dataFiles.fetch({
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

            this.delegateEvents({
                // NOTE: the "after" is needed because this callback reacts to
                // the mouse click release that leads to calling okButton() in
                // the first place - we mask that instance and allow the actual
                // thing to happen when the user clicks on the button "for
                // real".
                "click .btn-next": _.after(2, function () {
                    this.other = window.open("", "_blank");
                })
            });
        },

        nextButton: function () {
            d3.select(this.el)
                .select(".btn-next")
                .html("Next <span class=\"glyphicon glyphicon-arrow-right\"></span>");

            this.delegateEvents({
                "click .btn-next": null
            });
        }
    });
}(window.app));
