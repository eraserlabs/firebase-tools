"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const _ = require("lodash");
const sinon = require("sinon");
const error_1 = require("../../../error");
const config_1 = require("../../../config");
const storage_1 = require("../../../init/features/storage");
const prompt = require("../../../prompt");
describe("storage", () => {
    const sandbox = sinon.createSandbox();
    let askWriteProjectFileStub;
    let promptStub;
    beforeEach(() => {
        askWriteProjectFileStub = sandbox.stub(config_1.Config.prototype, "askWriteProjectFile");
        promptStub = sandbox.stub(prompt, "promptOnce");
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("doSetup", () => {
        it("should set up the correct properties in the project", async () => {
            const setup = {
                config: {},
                rcfile: {},
                projectId: "my-project-123",
                projectLocation: "us-central",
            };
            promptStub.returns("storage.rules");
            askWriteProjectFileStub.resolves();
            await (0, storage_1.doSetup)(setup, new config_1.Config("/path/to/src", {}));
            (0, chai_1.expect)(_.get(setup, "config.storage.rules")).to.deep.equal("storage.rules");
        });
        it("should error when cloud resource location is not set", async () => {
            const setup = {
                config: {},
                rcfile: {},
                projectId: "my-project-123",
            };
            await (0, chai_1.expect)((0, storage_1.doSetup)(setup, new config_1.Config("/path/to/src", {}))).to.eventually.be.rejectedWith(error_1.FirebaseError, "Cloud resource location is not set");
        });
    });
});
//# sourceMappingURL=storage.spec.js.map