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
            onSelect = $.noop,
            onDeselect = $.noop,
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

        if (cfg.onSelect) {
            if (!_.isFunction(cfg.onSelect)) {
                throw new Error("fatal: 'onSelect' must be a function");
            }

            onSelect = cfg.onSelect;
        }

        if (cfg.onDeselect) {
            if (!_.isFunction(cfg.onDeselect)) {
                throw new Error("fatal: 'onSelect' must be a function");
            }

            onDeselect = cfg.onDeselect;
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

                    // Deselect actions.
                    selected.onDeselect.call(selected.elt.node());
                    onDeselect.call(selected.elt.node());
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

                // Run the onSelect actions.
                onSelect.call(selected.elt.node(), name);
                selected.onSelect.call(selected.elt.node(), name);
            }
        };
    };

    app.util.getGirderTokenCookie = function () {
        var cookies = document.cookie.split("; ")
            .map(function (s) {
                return s.split("=");
            })
            .filter(function (c) {
                return c[0] === "girderToken";
            });

        if (cookies.length === 0) {
            return null;
        } else {
            return cookies[0][1];
        }
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

    app.util.formName = function (obj) {
        return obj.firstName + " " + obj.lastName[0] + ".";
    };

    app.util.MonadicDeferredChain = function () {
        var myself = this,
            base = $.Deferred(),
            pipe = base,
            sentinel = _.times(128, function () {
                return _.sample("0123456789abcdef");
            }).join(""),
            identity = function (x) { return x; },
            processFunc = identity,
            errorFunc = $.noop,
            errorInvoker,
            whenProcessor = function (p) {
                return function () {
                    var pluckedResponses = _.pluck(arguments, 0);
                    return [p(pluckedResponses)];
                };
            },
            normalProcessor = function (p) {
                return function () {
                    return p(arguments[0]);
                };
            },
            responses = [],
            previousError = false,
            accumResults;

        accumResults = function (next, process) {
            return function () {
                var response;

                response = processFunc.apply(null, arguments);
                if (response !== sentinel) {
                    responses = responses.concat([response]);
                } else {
                    response = _.last(responses);
                }

                if (_.isFunction(next)) {
                    next = _.bind(next, myself)(response, responses);
                    if (_.isArray(next)) {
                        processFunc = whenProcessor(process);
                    } else if (next === false) {
                        previousError = true;
                        next = undefined;
                    } else {
                        processFunc = normalProcessor(process);
                    }

                    if (_.isUndefined(next)) {
                        next = $.Deferred();
                        next.resolve(sentinel);
                    }
                } else {
                    processFunc = process;
                }

                return next;
            };
        };

        errorInvoker = function (errorFunc) {
            return function () {
                errorFunc(responses, previousError);
                previousError = true;
            };
        };

        return {
            add: function (action) {
                var deferred,
                    userProcess,
                    process,
                    error;

                action = action || {};
                deferred = action.deferred;
                error = action.error || $.noop;
                userProcess = action.process || identity;

                if (!deferred) {
                    deferred = $.Deferred();
                    deferred.resolve(sentinel);
                }

                if (_.isArray(deferred)) {
                    // Treat this as an array of deferreds to be managed with $.when.
                    //
                    // This is in an if-clause rather than else-if because in case
                    // deferred was passed in as a function that returns an array, we
                    // still want this phase triggered on that return value.
                    deferred = $.when.apply(null, deferred);

                    // Create a special-purpose processor to gather up the
                    // specially-prepared response to a 'when'.
                    process = whenProcessor(userProcess);
                } else if (_.isFunction(deferred)) {
                    process = userProcess;
                } else {
                    process = normalProcessor(userProcess);
                }

                pipe = pipe.then(accumResults(deferred, process), errorInvoker(errorFunc));
                errorFunc = error;
                return pipe;
            },

            run: function (success, error) {
                this.add();
                base.resolve(sentinel);

                success = success || $.noop;
                error = error || $.noop;

                return pipe.always(function () {
                    if (previousError) {
                        error(responses);
                    } else {
                        success(responses);
                    }
                });
            }
        };
    };
}(window.app));
