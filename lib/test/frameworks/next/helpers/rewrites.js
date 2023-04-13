"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsupportedRewritesObject = exports.supportedRewritesObject = exports.unsupportedRewritesArray = exports.supportedRewritesArray = void 0;
const paths_1 = require("./paths");
exports.supportedRewritesArray = paths_1.supportedPaths.map((path) => ({
    source: path,
    destination: `${path}/rewrite`,
    regex: "",
}));
exports.unsupportedRewritesArray = [
    ...paths_1.unsupportedPaths.map((path) => ({
        source: path,
        destination: `/${path}/rewrite`,
        regex: "",
    })),
    {
        source: "/:path*",
        destination: "http://firebase.google.com",
        regex: "",
    },
    {
        source: "/:path*",
        destination: "https://firebase.google.com",
        regex: "",
    },
    {
        source: "/specific/:path*",
        destination: "/some/specific/:path",
        regex: "",
        has: [
            { type: "query", key: "overrideMe" },
            {
                type: "header",
                key: "x-rewrite-me",
            },
        ],
    },
    {
        source: "/specific/:path*",
        destination: "/some/specific/:path",
        regex: "",
        has: [
            {
                type: "query",
                key: "page",
                value: "home",
            },
        ],
    },
    {
        source: "/specific/:path*",
        destination: "/some/specific/:path",
        regex: "",
        has: [
            {
                type: "cookie",
                key: "authorized",
                value: "true",
            },
        ],
    },
];
exports.supportedRewritesObject = {
    afterFiles: exports.unsupportedRewritesArray,
    beforeFiles: exports.supportedRewritesArray,
    fallback: exports.unsupportedRewritesArray,
};
exports.unsupportedRewritesObject = {
    afterFiles: exports.unsupportedRewritesArray,
    beforeFiles: exports.unsupportedRewritesArray,
    fallback: exports.unsupportedRewritesArray,
};
//# sourceMappingURL=rewrites.js.map