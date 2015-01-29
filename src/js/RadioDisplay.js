/* jshint browser: true, jquery: true */
/* global _, d3 */

// RadioDisplay - a class to manage a set of display elements, only one of which
// should be shown at a time.  Generalizes the notion of radio buttons.

(function (app) {
    "use strict";

    app.util = app.util || {};

    app.util.RadioDisplay = function (cfg) {
        var elts = {},
            selected = null,
            classes = {
                add: [],
                remove: []
            };

        // Handle configuration object.
        cfg = cfg || {};

        // Extract a list of classes to activate/deactivate for the focused
        // element.
        if (cfg.classes) {
            if (cfg.classes.add) {
                classes.add = cfg.classes.add.slice();
            }

            if (cfg.classes.remove) {
                classes.remove = cfg.classes.remove.slice();
            }
        }

        return {
            addElement: function (name, elt, cfg) {
                var entry = {
                    classes: {
                        add: [],
                        remove: []
                    },
                    onSelect: $.noop,
                    onDeselect: $.noop,
                    elt: d3.select(elt)
                };

                // Handle the configuration options.
                //
                // First, collect which classes to add/remove upon
                // selection/deselection.
                cfg = cfg || {};
                if (cfg.classes) {
                    if (cfg.classes.add) {
                        entry.classes.add = cfg.classes.add.slice();
                    }

                    if (cfg.classes.remove) {
                        entry.classes.remove = cfg.classes.remove.slice();
                    }
                }

                // Collect an action to run upon selection.
                if (cfg.onSelect) {
                    if (!_.isFunction(cfg.onSelect)) {
                        throw new Error("fatal: 'onSelect' optino must be a function");
                    }

                    entry.onSelect = cfg.onSelect;
                }

                // Collect an action to run upon deselection.
                if (cfg.onDeselect) {
                    if (!_.isFunction(cfg.onDeselect)) {
                        throw new Error("fatal: 'onSelect' optino must be a function");
                    }

                    entry.onDeselect = cfg.onDeselect;
                }

                // Log the informational entry in the table.
                elts[name] = entry;
            },

            deselect: function () {
                if (selected) {
                    // Global class list.
                    _.each(classes.add, function (c) {
                        selected.elt.classed(c, false);
                    });

                    _.each(classes.remove, function (c) {
                        selected.elt.classed(c, true);
                    });

                    // Local class list.
                    _.each(selected.classes.add, function (c) {
                        selected.elt.classed(c, false);
                    });

                    _.each(selected.classes.remove, function (c) {
                        selected.elt.classed(c, true);
                    });

                    // Deselect action.
                    selected.onDeselect.call(selected.elt.node());
                }
            },

            select: function (name) {
                // Deselect any currently selected item.
                this.deselect();

                // Grab the element from the table.
                selected = elts[name];
                if (!selected) {
                    throw new Error("RadioDisplay element named '" + name + "' not found.");
                }

                // Add/remove the appropriate classes.
                //
                // Global.
                _.each(classes.add, function (c) {
                    selected.elt.classed(c, true);
                });

                _.each(classes.remove, function (c) {
                    selected.elt.classed(c, false);
                });

                // Local.
                _.each(selected.classes.add, function (c) {
                    selected.elt.classed(c, true);
                });

                _.each(selected.classes.remove, function (c) {
                    selected.elt.classed(c, false);
                });

                // Run the onSelect action.
                selected.onSelect.call(selected.elt.node());
            }
        };
    };
}(window.app));
