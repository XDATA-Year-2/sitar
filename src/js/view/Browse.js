/* jshint browser: true */
/* global Backbone, _, d3 */

(function (app) {
    "use strict";

    // A preview gallery of the vis files in a VisFiles collection.  Made up of
    // Galleries, one per user.
    app.view.Browse = Backbone.View.extend({
        initialize: function (options) {
            options = options || {};

            this.focus = options.focus;
            this.homes = options.homes;

            if (!this.homes) {
                throw new Error("option 'homes' is required");
            }
        },

        render: function () {
            var allHomes = (this.focus ? [this.focus] : []).concat(this.homes),
                that = this,
                cullEmpty;

            this.$el.html(app.templates.browse({
                users: _.pluck(allHomes, "login")
            }));

            // Examine the subselections of vis items in each panel; remove from
            // the DOM the panels that don't contain any.
            cullEmpty = _.after(allHomes.length, function () {
                var panels = d3.selectAll(".panel-body"),
                    itemGroups = panels.selectAll(".item");

                _.each(_.range(itemGroups.length), function (i) {
                    if (itemGroups[i].length === 0) {
                        d3.select(panels[0][i].parentElement)
                            .remove();
                    }
                });
            });

            d3.select(this.el)
                .selectAll(".gallery")
                .data(allHomes)
                .each(function (home, i) {
                    home.fetch().then(_.bind(function () {
                        var view = new app.view.Gallery({
                            el: this,
                            collection: new app.collection.Visualizations({
                                home: home
                            }),
                            newvis: that.focus && (i === 0)
                        });

                        that.listenTo(view, "render", cullEmpty);
                    }, this));
                });
        }
    });
}(window.app));
