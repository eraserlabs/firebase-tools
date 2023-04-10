"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagesManifestUnoptimized = exports.imagesManifest = exports.exportMarkerWithImage = exports.exportMarkerWithoutImage = void 0;
exports.exportMarkerWithoutImage = {
    version: 1,
    hasExportPathMap: false,
    exportTrailingSlash: false,
    isNextImageImported: false,
};
exports.exportMarkerWithImage = {
    version: 1,
    hasExportPathMap: false,
    exportTrailingSlash: false,
    isNextImageImported: true,
};
exports.imagesManifest = {
    version: 1,
    images: {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        path: "/_next/image",
        loader: "default",
        loaderFile: "",
        domains: [],
        disableStaticImages: false,
        minimumCacheTTL: 60,
        formats: ["image/avif", "image/webp"],
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "^(?:^(?:assets\\.vercel\\.com)$)$",
                port: "",
                pathname: "^(?:\\/image\\/upload(?:\\/(?!\\.)(?:(?:(?!(?:^|\\/)\\.).)*?)|$))$",
            },
        ],
        unoptimized: false,
        sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840, 16, 32, 48, 64, 96, 128, 256, 384],
    },
};
exports.imagesManifestUnoptimized = Object.assign(Object.assign({}, exports.imagesManifest), { images: Object.assign(Object.assign({}, exports.imagesManifest.images), { unoptimized: true }) });
//# sourceMappingURL=images.js.map