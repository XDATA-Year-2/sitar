/* jshint browser: true, jquery: true */
/* global _, d3 */

(function (app) {
    "use strict";

    app.util = app.util || {};

    // RadioDisplay - a class to manage a set of display elements, only one of
    // which should be shown at a time.  Generalizes the notion of radio
    // buttons.
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

    app.util.newVegaSpec = function (data) {
        return {
            "width": 800,
            "height": 700,
            "padding": "auto",
            "data": [
                {
                    "name": data.name,
                    "values": data.values,
                    "format": {
                        "type": "json"
                    },
                    "lyra.role": "data_source"
                },
                {
                    "name": "pipeline_0",
                    "lyra.displayName": "Pipeline 1",
                    "source": data.name,
                    "transform": []
                }
            ],
            "scales": [],
            "marks": [{
                "properties": {
                    "enter": {
                        "x": {
                            "value": 0,
                            "default": 1
                        },
                        "width": {
                            "value": 800,
                            "default": 1
                        },
                        "y": {
                            "value": 0,
                            "default": 1
                        },
                        "height": {
                            "value": 700,
                            "default": 1
                        },
                        "clip": {
                            "value": 0
                        },
                        "fill": {
                            "value": "#ffffff"
                        },
                        "fillOpacity": {
                            "value": 0
                        },
                        "stroke": {
                            "value": "#000000"
                        },
                        "strokeWidth": {
                            "value": 0
                        }
                    }
                },
                "scales": [],
                "axes": [],
                "marks": [],
                "name": "layer_0",
                "type": "group",
                "from": {},
                "lyra.displayName": "Layer 1",
                "lyra.groupType": "layer"
            }]
        };
    };

    // A Maybe-monad style "get" operation that returns undefined if any of the
    // sequence of properties yields undefined, or the final value if none of
    // them do.
    //
    // e.g., for an object x = {"name": {"first": "Roni"} }, maybeGet(x, "name",
    // "first") is "Roni", but maybeGet(x, "formal_name", "first") is undefined.
    app.util.maybeGet = function () {
        var val = arguments[0];
        _.each(Array.prototype.slice.call(arguments, 1), function (field) {
            if (_.isUndefined(val)) {
                return undefined;
            }

            val = val[field];
        });

        return val;
    };
}(window.app));
