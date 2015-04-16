/* jshint browser: true */
/* global Backbone, d3, girder */

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

            this.listenTo(this.model, "change", this.render);
        },

        render: function () {
            var name;
            if (this.model.get("firstName")) {
                name = this.model.get("firstName") + " " + this.model.get("lastName")[0] + ".";
            }

            d3.select(this.el)
                .html(app.templates.navbar({
                    name: name
                }));
        },

        hide: function () {
            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        logout: function () {
            girder.logout();
            app.user.clear();

            app.router.setjmp(null);
        }
    });
}(window.app));
