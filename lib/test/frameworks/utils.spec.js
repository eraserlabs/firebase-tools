"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const utils_1 = require("../../frameworks/utils");
const utils_2 = require("../../frameworks/utils");
describe("Frameworks utils", () => {
    describe("isUrl", () => {
        it("should identify http URL", () => {
            (0, chai_1.expect)((0, utils_2.isUrl)("http://firebase.google.com")).to.be.true;
        });
        it("should identify https URL", () => {
            (0, chai_1.expect)((0, utils_2.isUrl)("https://firebase.google.com")).to.be.true;
        });
        it("should ignore URL within path", () => {
            (0, chai_1.expect)((0, utils_2.isUrl)("path/?url=https://firebase.google.com")).to.be.false;
        });
        it("should ignore path starting with http but without protocol", () => {
            (0, chai_1.expect)((0, utils_2.isUrl)("httpendpoint/foo/bar")).to.be.false;
        });
        it("should ignore path starting with https but without protocol", () => {
            (0, chai_1.expect)((0, utils_2.isUrl)("httpsendpoint/foo/bar")).to.be.false;
        });
    });
    describe("warnIfCustomBuildScript", () => {
        const framework = "Next.js";
        let sandbox;
        let consoleLogSpy;
        const packageJson = {
            scripts: {
                build: "",
            },
        };
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            consoleLogSpy = sandbox.spy(console, "warn");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should not print warning when a default build script is found.", async () => {
            const buildScript = "next build";
            const defaultBuildScripts = ["next build"];
            packageJson.scripts.build = buildScript;
            sandbox.stub(fs.promises, "readFile").resolves(JSON.stringify(packageJson));
            await (0, utils_1.warnIfCustomBuildScript)("fakedir/", framework, defaultBuildScripts);
            (0, chai_1.expect)(consoleLogSpy.callCount).to.equal(0);
        });
        it("should print warning when a custom build script is found.", async () => {
            const buildScript = "echo 'Custom build script' && next build";
            const defaultBuildScripts = ["next build"];
            packageJson.scripts.build = buildScript;
            sandbox.stub(fs.promises, "readFile").resolves(JSON.stringify(packageJson));
            await (0, utils_1.warnIfCustomBuildScript)("fakedir/", framework, defaultBuildScripts);
            (0, chai_1.expect)(consoleLogSpy).to.be.calledOnceWith(`\nWARNING: Your package.json contains a custom build that is being ignored. Only the ${framework} default build script (e.g, "${defaultBuildScripts[0]}") is respected. If you have a more advanced build process you should build a custom integration https://firebase.google.com/docs/hosting/express\n`);
        });
    });
});
//# sourceMappingURL=utils.spec.js.map