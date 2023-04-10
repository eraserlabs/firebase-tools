"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const _ = require("lodash");
const sinon = require("sinon");
const error_1 = require("../../../error");
const firestore = require("../../../init/features/firestore");
const indexes = require("../../../init/features/firestore/indexes");
const rules = require("../../../init/features/firestore/rules");
const requirePermissions = require("../../../requirePermissions");
const apiEnabled = require("../../../ensureApiEnabled");
const checkDatabaseType = require("../../../firestore/checkDatabaseType");
describe("firestore", () => {
    const sandbox = sinon.createSandbox();
    let checkApiStub;
    let checkDbTypeStub;
    beforeEach(() => {
        checkApiStub = sandbox.stub(apiEnabled, "check");
        checkDbTypeStub = sandbox.stub(checkDatabaseType, "checkDatabaseType");
        checkApiStub.returns(true);
        checkDbTypeStub.returns("FIRESTORE_NATIVE");
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("doSetup", () => {
        it("should require access, set up rules and indices, ensure cloud resource location set", async () => {
            const requirePermissionsStub = sandbox
                .stub(requirePermissions, "requirePermissions")
                .resolves();
            const initIndexesStub = sandbox.stub(indexes, "initIndexes").resolves();
            const initRulesStub = sandbox.stub(rules, "initRules").resolves();
            const setup = { config: {}, projectId: "my-project-123", projectLocation: "us-central1" };
            await firestore.doSetup(setup, {}, {});
            (0, chai_1.expect)(requirePermissionsStub).to.have.been.calledOnce;
            (0, chai_1.expect)(initRulesStub).to.have.been.calledOnce;
            (0, chai_1.expect)(initIndexesStub).to.have.been.calledOnce;
            (0, chai_1.expect)(_.get(setup, "config.firestore")).to.deep.equal({});
        });
        it("should error when the firestore API is not enabled", async () => {
            checkApiStub.returns(false);
            const setup = { config: {}, projectId: "my-project-123" };
            await (0, chai_1.expect)(firestore.doSetup(setup, {}, {})).to.eventually.be.rejectedWith(error_1.FirebaseError, "It looks like you haven't used Cloud Firestore");
        });
        it("should error when firestore is in the wrong mode", async () => {
            checkApiStub.returns(true);
            checkDbTypeStub.returns("CLOUD_DATASTORE_COMPATIBILITY");
            const setup = { config: {}, projectId: "my-project-123" };
            await (0, chai_1.expect)(firestore.doSetup(setup, {}, {})).to.eventually.be.rejectedWith(error_1.FirebaseError, "It looks like this project is using Cloud Datastore or Cloud Firestore in Datastore mode.");
        });
    });
});
//# sourceMappingURL=firestore.spec.js.map