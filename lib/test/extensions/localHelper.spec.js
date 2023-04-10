"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const path_1 = require("path");
const sinon = require("sinon");
const localHelper = require("../../extensions/localHelper");
const error_1 = require("../../error");
const EXT_FIXTURE_DIRECTORY = (0, path_1.resolve)(__dirname, "../fixtures/sample-ext");
const EXT_PREINSTALL_FIXTURE_DIRECTORY = (0, path_1.resolve)(__dirname, "../fixtures/sample-ext-preinstall");
describe("localHelper", () => {
    const sandbox = sinon.createSandbox();
    describe("getLocalExtensionSpec", () => {
        it("should return a spec when extension.yaml is present", async () => {
            const result = await localHelper.getLocalExtensionSpec(EXT_FIXTURE_DIRECTORY);
            (0, chai_1.expect)(result.name).to.equal("fixture-ext");
            (0, chai_1.expect)(result.version).to.equal("1.0.0");
            (0, chai_1.expect)(result.preinstallContent).to.be.undefined;
        });
        it("should populate preinstallContent when PREINSTALL.md is present", async () => {
            const result = await localHelper.getLocalExtensionSpec(EXT_PREINSTALL_FIXTURE_DIRECTORY);
            (0, chai_1.expect)(result.name).to.equal("fixture-ext-with-preinstall");
            (0, chai_1.expect)(result.version).to.equal("1.0.0");
            (0, chai_1.expect)(result.preinstallContent).to.equal("This is a PREINSTALL file for testing with.\n");
        });
        it("should return a nice error if there is no extension.yaml", async () => {
            await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(__dirname)).to.be.rejectedWith(error_1.FirebaseError);
        });
        describe("with an invalid YAML file", () => {
            beforeEach(() => {
                sandbox.stub(fs, "readFileSync").returns(`name: foo\nunknownkey\nother: value`);
            });
            afterEach(() => {
                sandbox.restore();
            });
            it("should return a rejected promise with a useful error if extension.yaml is invalid", async () => {
                await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(EXT_FIXTURE_DIRECTORY)).to.be.rejectedWith(error_1.FirebaseError, /YAML Error.+multiline key.+line.+/);
            });
        });
        describe("other YAML errors", () => {
            beforeEach(() => {
                sandbox.stub(yaml, "safeLoad").throws(new Error("not the files you are looking for"));
            });
            afterEach(() => {
                sandbox.restore();
            });
            it("should rethrow normal errors", async () => {
                await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(EXT_FIXTURE_DIRECTORY)).to.be.rejectedWith(error_1.FirebaseError, "not the files you are looking for");
            });
        });
    });
    describe("isLocalExtension", () => {
        let fsStub;
        beforeEach(() => {
            fsStub = sandbox.stub(fs, "readdirSync");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return true if a file exists there", () => {
            fsStub.returns("");
            const result = localHelper.isLocalExtension("some/local/path");
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should return false if a file doesn't exist there", () => {
            fsStub.throws(new Error("directory not found"));
            const result = localHelper.isLocalExtension("some/local/path");
            (0, chai_1.expect)(result).to.be.false;
        });
    });
});
//# sourceMappingURL=localHelper.spec.js.map