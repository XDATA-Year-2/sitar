/* jshint browser: true, jquery: true */
/* global Backbone, _ */

(function (app) {
    "use strict";

    app.util = app.util || {};

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
        var base = $.Deferred(),
            pipe = base,
            sentinel = _.times(128, function () {
                return _.sample("0123456789abcdef");
            }).join(""),
            identity = function (x) {
                return x;
            },
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
                    next = next(response, responses);
                    if (_.isArray(next)) {
                        processFunc = whenProcessor(process);
                        next = $.when.apply(null, next);
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

    app.util.girderRequester = function (root, token) {
        return function (options) {
            options.headers = _.extend(options.headers || {}, {
                "Girder-Token": token
            });

            if (options.url) {
                options.url = root + options.url;
            }

            return Backbone.ajax(options);
        };
    };
}(window.app));
