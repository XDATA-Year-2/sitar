/* jshint browser: true */
/* global Backbone, d3, girder, _ */

(function (app) {
    "use strict";

    app.view.Login = Backbone.View.extend({
        events: {
            "submit form": "submit",
            "click button.register": "register"
        },

        render: function (options) {
            options = options || {};

            d3.select(this.el)
                .html(app.templates.login({
                    jumpback: options.jumpback
                }));

            this.$("#register-dialog").on("show.bs.modal", _.bind(function () {
                var email = this.$("#username").val(),
                    password = this.$("#password").val();

                this.$("#r-username").val(email.split("@")[0]);

                if (email.indexOf("@") > -1) {
                    this.$("#r-email").val(email);
                }

                this.$("#r-password").val(password);
            }, this));

            this.$("button.cancel").on("click", _.bind(function () {
                this.$(".transient").val("");
            }, this));

            this.$("button.accept").on("click", _.bind(function () {
                var username,
                    email,
                    firstName,
                    lastName,
                    password,
                    confirmPassword,
                    empty,
                    newUser,
                    getText;

                // Clear any error flags.
                this.$(".transient").removeClass("has-error");
                this.$("#validation").addClass("hidden");

                // Collect all fields.
                username = this.$("#r-username");
                email = this.$("#r-email");
                firstName = this.$("#r-firstname");
                lastName = this.$("#r-lastname");
                password = this.$("#r-password");
                confirmPassword = this.$("#r-password2");

                // Validate that all fields contain text.
                empty = _.filter([username, email, firstName, lastName, password], function (s) {
                    return _.isEmpty(Backbone.$("input", s).val());
                });

                if (empty.length > 0) {
                    this.$("#validation")
                        .text("Some fields were missing - please fill them in and try again.");
                    this.$("#validation")
                        .removeClass("hidden");

                    _.each(empty, function (s) {
                        s.addClass("has-error");
                    });
                    return;
                }

                getText = function (s) {
                    return Backbone.$("input", s).val();
                };

                // Validate that passwords match.
                if (getText(password) !== getText(confirmPassword)) {
                    this.$("#validation")
                        .text("The passwords do not match - please try again.");
                    this.$("#validation")
                        .removeClass("hidden");
                    return;
                }

                // Perform the user creation and login.
                newUser = new girder.models.UserModel({
                    login: getText(username),
                    email: getText(email),
                    firstName: getText(firstName),
                    lastName: getText(lastName),
                    password: getText(password)
                });

                newUser.save();
                newUser.once("g:saved", _.bind(function () {
                    var sitarFolder;

                    // Create a sitar folder, with visualizations and data
                    // folders inside.
                    sitarFolder = new girder.models.FolderModel({
                        parentType: "user",
                        parentId: newUser.id,
                        name: "sitar",
                        public: true
                    });
                    sitarFolder.save();

                    sitarFolder.once("g:saved", function () {
                        var visFolder,
                            dataFolder;

                        visFolder = new girder.models.FolderModel({
                            parentType: "folder",
                            parentId: sitarFolder.id,
                            name: "visualizations"
                        });
                        visFolder.save();

                        dataFolder = new girder.models.FolderModel({
                            parentType: "folder",
                            parentId: sitarFolder.id,
                            name: "data"
                        });
                        dataFolder.save();
                    });

                    this.$(".transient input").val("");
                    this.$("#register-dialog").modal("hide");

                    this.$("#register-dialog").on("hidden.bs.modal", function () {
                        app.home.user.current();
                        app.home.user.once("change", function () {
                            app.router.longjmp("gallery");
                        });
                    });
                }, this));

                newUser.once("g:error", _.bind(function (error) {
                    error = error.responseJSON;

                    this.$("#validation")
                        .text(error.message);
                    this.$("#validation")
                        .removeClass("hidden");

                    if (error.field) {
                        this.$("#r-" + error.field.toLowerCase()).addClass("has-error");
                    }
                }, this));
            }, this));
        },

        submit: function (evt) {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");

            // Attempt to log the user in if not already logged in.
            girder.login(username, password)
                .then(function () {
                    d3.select("#jumpback")
                        .classed("hidden", true);

                    d3.select("#failed")
                        .classed("hidden", true);

                    d3.select("#username")
                        .property("value", "");

                    d3.select("#password")
                        .property("value", "");

                    app.router.longjmp("gallery");
                }, function () {
                    d3.select("#failed")
                        .classed("hidden", false);
                });

            evt.preventDefault();
        },

        register: function () {
            var username,
                password;

            username = d3.select("#username")
                .property("value");

            password = d3.select("#password")
                .property("value");
        }
    });
}(window.app));
