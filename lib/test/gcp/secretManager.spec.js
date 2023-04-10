"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const secretManager = require("../../gcp/secretManager");
const error_1 = require("../../error");
const secretManager_1 = require("../../gcp/secretManager");
describe("secretManager", () => {
    describe("parseSecretResourceName", () => {
        it("parses valid secret resource name", () => {
            (0, chai_1.expect)(secretManager.parseSecretResourceName("projects/my-project/secrets/my-secret")).to.deep.equal({ projectId: "my-project", name: "my-secret" });
        });
        it("throws given invalid resource name", () => {
            (0, chai_1.expect)(() => secretManager.parseSecretResourceName("foo/bar")).to.throw(error_1.FirebaseError);
        });
        it("throws given incomplete resource name", () => {
            (0, chai_1.expect)(() => secretManager.parseSecretResourceName("projects/my-project")).to.throw(error_1.FirebaseError);
        });
        it("parse secret version resource name", () => {
            (0, chai_1.expect)(secretManager.parseSecretResourceName("projects/my-project/secrets/my-secret/versions/8")).to.deep.equal({ projectId: "my-project", name: "my-secret" });
        });
    });
    describe("parseSecretVersionResourceName", () => {
        it("parses valid secret resource name", () => {
            (0, chai_1.expect)(secretManager.parseSecretVersionResourceName("projects/my-project/secrets/my-secret/versions/7")).to.deep.equal({ secret: { projectId: "my-project", name: "my-secret" }, versionId: "7" });
        });
        it("throws given invalid resource name", () => {
            (0, chai_1.expect)(() => secretManager.parseSecretVersionResourceName("foo/bar")).to.throw(error_1.FirebaseError);
        });
        it("throws given incomplete resource name", () => {
            (0, chai_1.expect)(() => secretManager.parseSecretVersionResourceName("projects/my-project")).to.throw(error_1.FirebaseError);
        });
        it("throws given secret resource name", () => {
            (0, chai_1.expect)(() => secretManager.parseSecretVersionResourceName("projects/my-project/secrets/my-secret")).to.throw(error_1.FirebaseError);
        });
    });
    describe("ensureServiceAgentRole", () => {
        const projectId = "my-project";
        const secret = { projectId, name: "my-secret" };
        const role = "test-role";
        let getIamPolicyStub;
        let setIamPolicyStub;
        beforeEach(() => {
            getIamPolicyStub = sinon.stub(secretManager, "getIamPolicy").rejects("Unexpected call");
            setIamPolicyStub = sinon.stub(secretManager, "setIamPolicy").rejects("Unexpected call");
        });
        afterEach(() => {
            getIamPolicyStub.restore();
            setIamPolicyStub.restore();
        });
        function setupStubs(existing, expected) {
            getIamPolicyStub.withArgs(secret).resolves({ bindings: existing });
            if (expected) {
                setIamPolicyStub.withArgs(secret, expected).resolves({ body: { bindings: expected } });
            }
        }
        it("adds new binding for each member", async () => {
            const existing = [];
            const expected = [
                { role, members: ["serviceAccount:1@foobar.com", "serviceAccount:2@foobar.com"] },
            ];
            setupStubs(existing, expected);
            await (0, secretManager_1.ensureServiceAgentRole)(secret, ["1@foobar.com", "2@foobar.com"], role);
        });
        it("adds bindings only for missing members", async () => {
            const existing = [{ role, members: ["serviceAccount:1@foobar.com"] }];
            const expected = [
                { role, members: ["serviceAccount:1@foobar.com", "serviceAccount:2@foobar.com"] },
            ];
            setupStubs(existing, expected);
            await (0, secretManager_1.ensureServiceAgentRole)(secret, ["1@foobar.com", "2@foobar.com"], role);
        });
        it("keeps bindings that already exists", async () => {
            const existing = [
                { role: "another-role", members: ["serviceAccount:3@foobar.com"] },
            ];
            const expected = [
                {
                    role: "another-role",
                    members: ["serviceAccount:3@foobar.com"],
                },
                {
                    role,
                    members: ["serviceAccount:1@foobar.com", "serviceAccount:2@foobar.com"],
                },
            ];
            setupStubs(existing, expected);
            await (0, secretManager_1.ensureServiceAgentRole)(secret, ["1@foobar.com", "2@foobar.com"], role);
        });
        it("does nothing if the binding already exists", async () => {
            const existing = [{ role, members: ["serviceAccount:1@foobar.com"] }];
            setupStubs(existing);
            await (0, secretManager_1.ensureServiceAgentRole)(secret, ["1@foobar.com"], role);
        });
    });
});
//# sourceMappingURL=secretManager.spec.js.map