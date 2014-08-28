window.app = window.app || {};

(function (app) {
    "use strict";

    // A "global" reference to the Girder API path.
    //
    // TODO: make this dependent on either configuration, or a utility in
    // Tangelo that tells what this path is.
    app.girder = "/girder/api/v1";

    // Containers for backbone objects.
    app.model = {};
    app.view = {};
}(window.app));
