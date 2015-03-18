/* jshint browser: true, jquery: true */
/* global _ */

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

    app.util.DeferredChain = function (first) {
        var start,
            link,
            methods;

        if (!first) {
            throw new Error("argument 'first' is required");
        }

        start = link = first;

        methods = {
            then: function () {
                link = link.then.apply(link, arguments);
            }
        };

        _.each(["reject", "rejectWith", "resolve", "resolveWith"], function (f) {
            methods[f] = function () {
                return start[f].apply(start, arguments);
            };
        });

        _.each(["always", "done", "fail", "notify", "notifyWith", "progress", "promise", "state"], function (f) {
            methods[f] = function () {
                return link[f].apply(link, arguments);
            };
        });

        return methods;
    };
}(window.app));
