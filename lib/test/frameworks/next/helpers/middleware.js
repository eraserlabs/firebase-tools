"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewareManifestWhenNotUsed = exports.middlewareManifestWhenUsed = void 0;
exports.middlewareManifestWhenUsed = {
    sortedMiddleware: ["/"],
    middleware: {
        "/": {
            env: [],
            files: ["server/edge-runtime-webpack.js", "server/middleware.js"],
            name: "middleware",
            page: "/",
            matchers: [
                {
                    regexp: "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/([^/.]{1,}))\\/about(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?(.json)?[\\/#\\?]?$",
                },
            ],
            wasm: [],
            assets: [],
        },
    },
    functions: {},
    version: 2,
};
exports.middlewareManifestWhenNotUsed = {
    sortedMiddleware: [],
    middleware: {},
    functions: {},
    version: 2,
};
//# sourceMappingURL=middleware.js.map