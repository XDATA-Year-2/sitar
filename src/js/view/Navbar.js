/* jshint browser: true, devel: true */
/* global Backbone, d3 */

(function (app) {
    "use strict";

    app.view.Navbar = Backbone.View.extend({
        events: {
            "click .logout": "logout"
        },

        initialize: function () {
            if (!this.model) {
                throw new Error("'model' option is required");
            }

            this.listenTo(this.model, "change:name", this.render);
        },

        render: function () {
            d3.select(this.el)
                .html(app.templates.navbar({
                    name: this.model.get("name")
                }));
        },

        hide: function () {
            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        logout: function () {
            this.model.destroy({
                success: function () {
                    app.router.setjmp(null);
                },

                error: function () {
                    throw new Error("the impossible has happened");
                }
            });
        }
    });
}(window.app));
