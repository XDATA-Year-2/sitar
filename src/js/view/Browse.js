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
                that = this;

            this.$el.html(app.templates.browse({
                users: _.pluck(allHomes, "login")
            }));

            console.log(this.focus);

            d3.select(this.el)
                .selectAll(".panel-body")
                .data(allHomes)
                .each(function (home, i) {
                    home.fetch().then(_.bind(function () {
                        console.log("i", i);
                        console.log("focus", that.focus);
                        console.log("cond", that.focus && (i === 0));
                        var view = new app.view.Gallery({
                            el: this,
                            collection: new app.collection.Visualizations({
                                home: home
                            }),
                            newvis: that.focus && (i === 0)
                        });

                        view.render();
                    }, this));
                });
        }
    });
}(window.app));
