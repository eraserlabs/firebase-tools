"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const resourceManager = require("../../../gcp/resourceManager");
const pn = require("../../../getProjectNumber");
const v2FunctionHelper = require("../../../deploy/extensions/v2FunctionHelper");
const ensureApiEnabled = require("../../../ensureApiEnabled");
const projectUtils = require("../../../projectUtils");
const GOOD_BINDING = {
    role: "roles/eventarc.eventReceiver",
    members: ["serviceAccount:123456-compute@developer.gserviceaccount.com"],
};
describe("ensureNecessaryV2ApisAndRoles", () => {
    let getIamStub;
    let setIamStub;
    let needProjectIdStub;
    let getProjectNumberStub;
    let ensureApiEnabledStub;
    beforeEach(() => {
        getIamStub = sinon
            .stub(resourceManager, "getIamPolicy")
            .throws("unexpected call to resourceManager.getIamStub");
        setIamStub = sinon
            .stub(resourceManager, "setIamPolicy")
            .throws("unexpected call to resourceManager.setIamPolicy");
        needProjectIdStub = sinon
            .stub(projectUtils, "needProjectId")
            .throws("unexpected call to pn.getProjectNumber");
        getProjectNumberStub = sinon
            .stub(pn, "getProjectNumber")
            .throws("unexpected call to pn.getProjectNumber");
        ensureApiEnabledStub = sinon
            .stub(ensureApiEnabled, "ensure")
            .throws("unexpected call to ensureApiEnabled.ensure");
        getProjectNumberStub.resolves(123456);
        needProjectIdStub.returns("project_id");
        ensureApiEnabledStub.resolves(undefined);
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("should succeed when IAM policy is correct", async () => {
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [GOOD_BINDING],
        });
        (0, chai_1.expect)(await v2FunctionHelper.ensureNecessaryV2ApisAndRoles({ projectId: "project_id" })).to.not
            .throw;
        (0, chai_1.expect)(getIamStub).to.have.been.calledWith("project_id");
        (0, chai_1.expect)(setIamStub).to.not.have.been.called;
    });
    it("should fix the IAM policy by adding missing bindings", async () => {
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [],
        });
        setIamStub.resolves();
        (0, chai_1.expect)(await v2FunctionHelper.ensureNecessaryV2ApisAndRoles({ projectId: "project_id" })).to.not
            .throw;
        (0, chai_1.expect)(getIamStub).to.have.been.calledWith("project_id");
        (0, chai_1.expect)(setIamStub).to.have.been.calledWith("project_id", {
            etag: "etag",
            version: 3,
            bindings: [GOOD_BINDING],
        }, "bindings");
    });
});
//# sourceMappingURL=v2FunctionHelper.spec.js.map