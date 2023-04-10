"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs");
const fsExtra = require("fs-extra");
const sinon = require("sinon");
const constants_1 = require("../../../frameworks/next/constants");
const utils_1 = require("../../../frameworks/next/utils");
const frameworksUtils = require("../../../frameworks/utils");
const fsUtils = require("../../../fsutils");
const helpers_1 = require("./helpers");
describe("Next.js utils", () => {
    describe("pathHasRegex", () => {
        it("should identify regex", () => {
            for (const path of helpers_1.pathsWithRegex) {
                (0, chai_1.expect)((0, utils_1.pathHasRegex)(path)).to.be.true;
            }
        });
        it("should not identify escaped parentheses as regex", () => {
            for (const path of helpers_1.pathsWithEscapedChars) {
                (0, chai_1.expect)((0, utils_1.pathHasRegex)(path)).to.be.false;
            }
        });
        it("should identify regex along with escaped chars", () => {
            for (const path of helpers_1.pathsWithRegexAndEscapedChars) {
                (0, chai_1.expect)((0, utils_1.pathHasRegex)(path)).to.be.true;
            }
        });
        it("should not identify globs as regex", () => {
            for (const path of helpers_1.pathsAsGlobs) {
                (0, chai_1.expect)((0, utils_1.pathHasRegex)(path)).to.be.false;
            }
        });
    });
    describe("cleanEscapedChars", () => {
        it("should clean escaped chars", () => {
            const testPath = "/\\(\\)\\{\\}\\:\\+\\?\\*/:slug";
            (0, chai_1.expect)(testPath.includes("\\(")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\(")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\)")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\)")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\{")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\{")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\}")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\}")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\:")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\:")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\+")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\+")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\?")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\?")).to.be.false;
            (0, chai_1.expect)(testPath.includes("\\*")).to.be.true;
            (0, chai_1.expect)((0, utils_1.cleanEscapedChars)(testPath).includes("\\*")).to.be.false;
        });
    });
    describe("isRewriteSupportedByFirebase", () => {
        it("should allow supported rewrites", () => {
            for (const rewrite of helpers_1.supportedRewritesArray) {
                (0, chai_1.expect)((0, utils_1.isRewriteSupportedByHosting)(rewrite)).to.be.true;
            }
        });
        it("should disallow unsupported rewrites", () => {
            for (const rewrite of helpers_1.unsupportedRewritesArray) {
                (0, chai_1.expect)((0, utils_1.isRewriteSupportedByHosting)(rewrite)).to.be.false;
            }
        });
    });
    describe("isRedirectSupportedByFirebase", () => {
        it("should allow supported redirects", () => {
            for (const redirect of helpers_1.supportedRedirects) {
                (0, chai_1.expect)((0, utils_1.isRedirectSupportedByHosting)(redirect)).to.be.true;
            }
        });
        it("should disallow unsupported redirects", () => {
            for (const redirect of helpers_1.unsupportedRedirects) {
                (0, chai_1.expect)((0, utils_1.isRedirectSupportedByHosting)(redirect)).to.be.false;
            }
        });
    });
    describe("isHeaderSupportedByFirebase", () => {
        it("should allow supported headers", () => {
            for (const header of helpers_1.supportedHeaders) {
                (0, chai_1.expect)((0, utils_1.isHeaderSupportedByHosting)(header)).to.be.true;
            }
        });
        it("should disallow unsupported headers", () => {
            for (const header of helpers_1.unsupportedHeaders) {
                (0, chai_1.expect)((0, utils_1.isHeaderSupportedByHosting)(header)).to.be.false;
            }
        });
    });
    describe("getNextjsRewritesToUse", () => {
        it("should use only beforeFiles", () => {
            var _a;
            if (!((_a = helpers_1.supportedRewritesObject === null || helpers_1.supportedRewritesObject === void 0 ? void 0 : helpers_1.supportedRewritesObject.beforeFiles) === null || _a === void 0 ? void 0 : _a.length)) {
                throw new Error("beforeFiles must have rewrites");
            }
            const rewritesToUse = (0, utils_1.getNextjsRewritesToUse)(helpers_1.supportedRewritesObject);
            for (const [i, rewrite] of helpers_1.supportedRewritesObject.beforeFiles.entries()) {
                (0, chai_1.expect)(rewrite.source).to.equal(rewritesToUse[i].source);
                (0, chai_1.expect)(rewrite.destination).to.equal(rewritesToUse[i].destination);
            }
        });
        it("should return all rewrites if in array format", () => {
            const rewritesToUse = (0, utils_1.getNextjsRewritesToUse)(helpers_1.supportedRewritesArray);
            (0, chai_1.expect)(rewritesToUse).to.have.length(helpers_1.supportedRewritesArray.length);
        });
    });
    describe("usesAppDirRouter", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return false when app dir doesn't exist", () => {
            sandbox.stub(fs, "existsSync").returns(false);
            (0, chai_1.expect)((0, utils_1.usesAppDirRouter)("")).to.be.false;
        });
        it("should return true when app dir does exist", () => {
            sandbox.stub(fs, "existsSync").returns(true);
            (0, chai_1.expect)((0, utils_1.usesAppDirRouter)("")).to.be.true;
        });
    });
    describe("usesNextImage", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return true when export marker has isNextImageImported", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                isNextImageImported: true,
            });
            (0, chai_1.expect)(await (0, utils_1.usesNextImage)("", "")).to.be.true;
        });
        it("should return false when export marker has !isNextImageImported", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                isNextImageImported: false,
            });
            (0, chai_1.expect)(await (0, utils_1.usesNextImage)("", "")).to.be.false;
        });
    });
    describe("hasUnoptimizedImage", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return true when images manfiest indicates unoptimized", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                images: { unoptimized: true },
            });
            (0, chai_1.expect)(await (0, utils_1.hasUnoptimizedImage)("", "")).to.be.true;
        });
        it("should return true when images manfiest indicates !unoptimized", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves({
                images: { unoptimized: false },
            });
            (0, chai_1.expect)(await (0, utils_1.hasUnoptimizedImage)("", "")).to.be.false;
        });
    });
    describe("isUsingMiddleware", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should return true if using middleware in development", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", true)).to.be.true;
        });
        it("should return false if not using middleware in development", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(false);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", true)).to.be.false;
        });
        it("should return true if using middleware in production", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves(helpers_1.middlewareManifestWhenUsed);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", false)).to.be.true;
        });
        it("should return false if not using middleware in production", async () => {
            sandbox.stub(fsExtra, "readJSON").resolves(helpers_1.middlewareManifestWhenNotUsed);
            (0, chai_1.expect)(await (0, utils_1.isUsingMiddleware)("", false)).to.be.false;
        });
    });
    describe("isUsingImageOptimization", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it("should return true if images optimization is used", async () => {
            const stub = sandbox.stub(frameworksUtils, "readJSON");
            stub.withArgs(constants_1.EXPORT_MARKER).resolves(helpers_1.exportMarkerWithImage);
            stub.withArgs(constants_1.IMAGES_MANIFEST).resolves(helpers_1.imagesManifest);
            (0, chai_1.expect)(await (0, utils_1.isUsingImageOptimization)("")).to.be.true;
        });
        it("should return false if isNextImageImported is false", async () => {
            const stub = sandbox.stub(frameworksUtils, "readJSON");
            stub.withArgs(constants_1.EXPORT_MARKER).resolves(helpers_1.exportMarkerWithoutImage);
            (0, chai_1.expect)(await (0, utils_1.isUsingImageOptimization)("")).to.be.false;
        });
        it("should return false if `unoptimized` option is used", async () => {
            const stub = sandbox.stub(frameworksUtils, "readJSON");
            stub.withArgs(constants_1.EXPORT_MARKER).resolves(helpers_1.exportMarkerWithImage);
            stub.withArgs(constants_1.IMAGES_MANIFEST).resolves(helpers_1.imagesManifestUnoptimized);
            (0, chai_1.expect)(await (0, utils_1.isUsingImageOptimization)("")).to.be.false;
        });
    });
    describe("isUsingAppDirectory", () => {
        let sandbox;
        beforeEach(() => (sandbox = sinon.createSandbox()));
        afterEach(() => sandbox.restore());
        it(`should return true if ${constants_1.APP_PATH_ROUTES_MANIFEST} exists`, () => {
            sandbox.stub(fsUtils, "fileExistsSync").returns(true);
            (0, chai_1.expect)((0, utils_1.isUsingAppDirectory)("")).to.be.true;
        });
        it(`should return false if ${constants_1.APP_PATH_ROUTES_MANIFEST} did not exist`, () => {
            sandbox.stub(fsUtils, "fileExistsSync").returns(false);
            (0, chai_1.expect)((0, utils_1.isUsingAppDirectory)("")).to.be.false;
        });
    });
    describe("allDependencyNames", () => {
        it("should return empty on stopping conditions", () => {
            (0, chai_1.expect)((0, utils_1.allDependencyNames)({})).to.eql([]);
            (0, chai_1.expect)((0, utils_1.allDependencyNames)({ version: "foo" })).to.eql([]);
        });
        it("should return expected dependency names", () => {
            (0, chai_1.expect)((0, utils_1.allDependencyNames)(helpers_1.npmLsReturn)).to.eql([
                "@next/font",
                "next",
                "@next/env",
                "@next/swc-android-arm-eabi",
                "@next/swc-android-arm64",
                "@next/swc-darwin-arm64",
                "@next/swc-darwin-x64",
                "@next/swc-freebsd-x64",
                "@next/swc-linux-arm-gnueabihf",
                "@next/swc-linux-arm64-gnu",
                "@next/swc-linux-arm64-musl",
                "@next/swc-linux-x64-gnu",
                "@next/swc-linux-x64-musl",
                "@next/swc-win32-arm64-msvc",
                "@next/swc-win32-ia32-msvc",
                "@next/swc-win32-x64-msvc",
                "@swc/helpers",
                "tslib",
                "caniuse-lite",
                "fibers",
                "node-sass",
                "postcss",
                "nanoid",
                "picocolors",
                "source-map-js",
                "react-dom",
                "react",
                "sass",
                "styled-jsx",
                "client-only",
                "react",
                "react-dom",
                "loose-envify",
                "js-tokens",
                "react",
                "scheduler",
                "loose-envify",
                "react",
                "loose-envify",
            ]);
        });
    });
});
//# sourceMappingURL=utils.spec.js.map