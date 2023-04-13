"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../../../../error");
const validate = require("../../../../../deploy/functions/runtimes/node/validate");
const fsutils = require("../../../../../fsutils");
const cjson = require("cjson");
describe("validate", () => {
    describe("packageJsonIsValid", () => {
        const sandbox = sinon.createSandbox();
        let cjsonLoadStub;
        let fileExistsStub;
        beforeEach(() => {
            fileExistsStub = sandbox.stub(fsutils, "fileExistsSync");
            cjsonLoadStub = sandbox.stub(cjson, "load");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should throw error if package.json file is missing", () => {
            fileExistsStub.withArgs("sourceDir/package.json").returns(false);
            (0, chai_1.expect)(() => {
                validate.packageJsonIsValid("sourceDirName", "sourceDir", "projectDir");
            }).to.throw(error_1.FirebaseError, "No npm package found");
        });
        it("should throw error if functions source file is missing", () => {
            cjsonLoadStub.returns({ name: "my-project", engines: { node: "8" } });
            fileExistsStub.withArgs("sourceDir/package.json").returns(true);
            fileExistsStub.withArgs("sourceDir/index.js").returns(false);
            (0, chai_1.expect)(() => {
                validate.packageJsonIsValid("sourceDirName", "sourceDir", "projectDir");
            }).to.throw(error_1.FirebaseError, "does not exist, can't deploy");
        });
        it("should throw error if main is defined and that file is missing", () => {
            cjsonLoadStub.returns({ name: "my-project", main: "src/main.js", engines: { node: "8" } });
            fileExistsStub.withArgs("sourceDir/package.json").returns(true);
            fileExistsStub.withArgs("sourceDir/src/main.js").returns(false);
            (0, chai_1.expect)(() => {
                validate.packageJsonIsValid("sourceDirName", "sourceDir", "projectDir");
            }).to.throw(error_1.FirebaseError, "does not exist, can't deploy");
        });
        it("should not throw error if runtime is set in the config and the engines field is not set", () => {
            cjsonLoadStub.returns({ name: "my-project" });
            fileExistsStub.withArgs("sourceDir/package.json").returns(true);
            fileExistsStub.withArgs("sourceDir/index.js").returns(true);
            (0, chai_1.expect)(() => {
                validate.packageJsonIsValid("sourceDirName", "sourceDir", "projectDir");
            }).to.not.throw();
        });
    });
});
//# sourceMappingURL=validate.spec.js.map