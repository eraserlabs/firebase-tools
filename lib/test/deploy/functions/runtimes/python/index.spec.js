"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const python = require("../../../../../deploy/functions/runtimes/python");
const PROJECT_ID = "test-project";
const SOURCE_DIR = "/some/path/fns";
describe("PythonDelegate", () => {
    describe("getPythonBinary", () => {
        let platformMock;
        beforeEach(() => {
            platformMock = sinon.stub(process, "platform");
        });
        afterEach(() => {
            platformMock.restore();
        });
        it("returns specific version of the python binary corresponding to the runtime", () => {
            platformMock.value("darwin");
            const requestedRuntime = "python310";
            const delegate = new python.Delegate(PROJECT_ID, SOURCE_DIR, requestedRuntime);
            (0, chai_1.expect)(delegate.getPythonBinary()).to.equal("python3.10");
        });
        it("returns generic python binary given non-recognized python runtime", () => {
            platformMock.value("darwin");
            const requestedRuntime = "python312";
            const delegate = new python.Delegate(PROJECT_ID, SOURCE_DIR, requestedRuntime);
            (0, chai_1.expect)(delegate.getPythonBinary()).to.equal("python");
        });
        it("always returns version-neutral, python.exe on windows", () => {
            platformMock.value("win32");
            const requestedRuntime = "python310";
            const delegate = new python.Delegate(PROJECT_ID, SOURCE_DIR, requestedRuntime);
            (0, chai_1.expect)(delegate.getPythonBinary()).to.equal("python.exe");
        });
    });
});
//# sourceMappingURL=index.spec.js.map