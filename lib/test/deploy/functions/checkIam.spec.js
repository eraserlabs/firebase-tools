"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const checkIam = require("../../../deploy/functions/checkIam");
const storage = require("../../../gcp/storage");
const rm = require("../../../gcp/resourceManager");
const backend = require("../../../deploy/functions/backend");
const projectId = "my-project";
const projectNumber = "123456789";
const STORAGE_RES = {
    email_address: "service-123@gs-project-accounts.iam.gserviceaccount.com",
    kind: "storage#serviceAccount",
};
const BINDING = {
    role: "some/role",
    members: ["someuser"],
};
const SPEC = {
    region: "us-west1",
    project: projectNumber,
    runtime: "nodejs14",
};
describe("checkIam", () => {
    let storageStub;
    let getIamStub;
    let setIamStub;
    beforeEach(() => {
        storageStub = sinon
            .stub(storage, "getServiceAccount")
            .throws("unexpected call to storage.getServiceAccount");
        getIamStub = sinon
            .stub(rm, "getIamPolicy")
            .throws("unexpected call to resourceManager.getIamStub");
        setIamStub = sinon
            .stub(rm, "setIamPolicy")
            .throws("unexpected call to resourceManager.setIamPolicy");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("obtainPubSubServiceAgentBindings", () => {
        it("should obtain the bindings", () => {
            const bindings = checkIam.obtainPubSubServiceAgentBindings(projectNumber);
            (0, chai_1.expect)(bindings.length).to.equal(1);
            (0, chai_1.expect)(bindings[0]).to.deep.equal({
                role: checkIam.SERVICE_ACCOUNT_TOKEN_CREATOR_ROLE,
                members: [`serviceAccount:service-${projectNumber}@gcp-sa-pubsub.iam.gserviceaccount.com`],
            });
        });
    });
    describe("obtainDefaultComputeServiceAgentBindings", () => {
        it("should obtain the bindings", () => {
            const bindings = checkIam.obtainDefaultComputeServiceAgentBindings(projectNumber);
            (0, chai_1.expect)(bindings.length).to.equal(2);
            (0, chai_1.expect)(bindings).to.include.deep.members([
                {
                    role: checkIam.RUN_INVOKER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
                {
                    role: checkIam.EVENTARC_EVENT_RECEIVER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
            ]);
        });
    });
    describe("mergeBindings", () => {
        it("should not update the policy when the bindings are present", () => {
            const policy = {
                etag: "etag",
                version: 3,
                bindings: [BINDING],
            };
            const updated = checkIam.mergeBindings(policy, [BINDING]);
            (0, chai_1.expect)(updated).to.be.false;
            (0, chai_1.expect)(policy.bindings).to.deep.equal([BINDING]);
        });
        it("should update the members of a binding in the policy", () => {
            const policy = {
                etag: "etag",
                version: 3,
                bindings: [BINDING],
            };
            const updated = checkIam.mergeBindings(policy, [{ role: "some/role", members: ["newuser"] }]);
            (0, chai_1.expect)(updated).to.be.true;
            (0, chai_1.expect)(policy.bindings).to.deep.equal([
                {
                    role: "some/role",
                    members: ["someuser", "newuser"],
                },
            ]);
        });
        it("should add a new binding to the policy", () => {
            const policy = {
                etag: "etag",
                version: 3,
                bindings: [],
            };
            const updated = checkIam.mergeBindings(policy, [BINDING]);
            (0, chai_1.expect)(updated).to.be.true;
            (0, chai_1.expect)(policy.bindings).to.deep.equal([BINDING]);
        });
    });
    describe("ensureServiceAgentRoles", () => {
        it("should return early if we do not have new services", async () => {
            const v1EventFn = Object.assign({ id: "v1eventfn", entryPoint: "v1Fn", platform: "gcfv1", eventTrigger: {
                    eventType: "google.storage.object.create",
                    eventFilters: { resource: "projects/_/buckets/my-bucket" },
                    retry: false,
                } }, SPEC);
            const v2CallableFn = Object.assign({ id: "v2callablefn", entryPoint: "v2callablefn", platform: "gcfv2", httpsTrigger: {} }, SPEC);
            const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC);
            await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.of(v1EventFn, v2CallableFn, wantFn));
            (0, chai_1.expect)(storageStub).to.not.have.been.called;
            (0, chai_1.expect)(getIamStub).to.not.have.been.called;
            (0, chai_1.expect)(setIamStub).to.not.have.been.called;
        });
        it("should return early if we fail to get the IAM policy", async () => {
            storageStub.resolves(STORAGE_RES);
            getIamStub.rejects("Failed to get the IAM policy");
            const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC);
            await (0, chai_1.expect)(checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.empty())).to.not.be.rejected;
            (0, chai_1.expect)(storageStub).to.have.been.calledOnce;
            (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
            (0, chai_1.expect)(getIamStub).to.have.been.calledWith(projectNumber);
            (0, chai_1.expect)(setIamStub).to.not.have.been.called;
        });
        it("should error if we fail to set the IAM policy", async () => {
            storageStub.resolves(STORAGE_RES);
            getIamStub.resolves({
                etag: "etag",
                version: 3,
                bindings: [BINDING],
            });
            const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC);
            await (0, chai_1.expect)(checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.empty())).to.be.rejectedWith("We failed to modify the IAM policy for the project. The functions " +
                "deployment requires specific roles to be granted to service agents," +
                " otherwise the deployment will fail.");
            (0, chai_1.expect)(storageStub).to.have.been.calledOnce;
            (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
            (0, chai_1.expect)(getIamStub).to.have.been.calledWith(projectNumber);
            (0, chai_1.expect)(setIamStub).to.have.been.calledOnce;
        });
        it("should add the pubsub publisher role and all default bindings for a new v2 storage function without v2 deployed functions", async () => {
            const newIamPolicy = {
                etag: "etag",
                version: 3,
                bindings: [
                    BINDING,
                    {
                        role: "roles/pubsub.publisher",
                        members: [`serviceAccount:${STORAGE_RES.email_address}`],
                    },
                    {
                        role: checkIam.SERVICE_ACCOUNT_TOKEN_CREATOR_ROLE,
                        members: [
                            `serviceAccount:service-${projectNumber}@gcp-sa-pubsub.iam.gserviceaccount.com`,
                        ],
                    },
                    {
                        role: checkIam.RUN_INVOKER_ROLE,
                        members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                    },
                    {
                        role: checkIam.EVENTARC_EVENT_RECEIVER_ROLE,
                        members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                    },
                ],
            };
            storageStub.resolves(STORAGE_RES);
            getIamStub.resolves({
                etag: "etag",
                version: 3,
                bindings: [BINDING],
            });
            setIamStub.resolves(newIamPolicy);
            const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC);
            await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.empty());
            (0, chai_1.expect)(storageStub).to.have.been.calledOnce;
            (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
            (0, chai_1.expect)(setIamStub).to.have.been.calledOnce;
            (0, chai_1.expect)(setIamStub).to.have.been.calledWith(projectNumber, newIamPolicy, "bindings");
        });
    });
    it("should add the pubsub publisher role for a new v2 storage function with v2 deployed functions", async () => {
        const newIamPolicy = {
            etag: "etag",
            version: 3,
            bindings: [
                BINDING,
                {
                    role: "roles/pubsub.publisher",
                    members: [`serviceAccount:${STORAGE_RES.email_address}`],
                },
            ],
        };
        storageStub.resolves(STORAGE_RES);
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [BINDING],
        });
        setIamStub.resolves(newIamPolicy);
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.cloud.storage.object.v1.finalized",
                eventFilters: { bucket: "my-bucket" },
                retry: false,
            } }, SPEC);
        const haveFn = Object.assign({ id: "haveFn", entryPoint: "haveFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.firebasealerts.alerts.v1.published",
                eventFilters: { alertype: "crashlytics.newFatalIssue" },
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.of(haveFn));
        (0, chai_1.expect)(storageStub).to.have.been.calledOnce;
        (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledWith(projectNumber, newIamPolicy, "bindings");
    });
    it("should add the default bindings for a new v2 alerts function without v2 deployed functions", async () => {
        const newIamPolicy = {
            etag: "etag",
            version: 3,
            bindings: [
                BINDING,
                {
                    role: checkIam.SERVICE_ACCOUNT_TOKEN_CREATOR_ROLE,
                    members: [
                        `serviceAccount:service-${projectNumber}@gcp-sa-pubsub.iam.gserviceaccount.com`,
                    ],
                },
                {
                    role: checkIam.RUN_INVOKER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
                {
                    role: checkIam.EVENTARC_EVENT_RECEIVER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
            ],
        };
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [BINDING],
        });
        setIamStub.resolves(newIamPolicy);
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.firebasealerts.alerts.v1.published",
                eventFilters: { alertype: "crashlytics.newFatalIssue" },
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.empty());
        (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledWith(projectNumber, newIamPolicy, "bindings");
    });
    it("should not add bindings for a new v2 alerts function with v2 deployed functions", async () => {
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.firebasealerts.alerts.v1.published",
                eventFilters: { alertype: "crashlytics.newFatalIssue" },
                retry: false,
            } }, SPEC);
        const haveFn = Object.assign({ id: "haveFn", entryPoint: "haveFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.cloud.storage.object.v1.finalized",
                eventFilters: { bucket: "my-bucket" },
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.of(haveFn));
        (0, chai_1.expect)(getIamStub).to.not.have.been.called;
        (0, chai_1.expect)(setIamStub).to.not.have.been.called;
    });
    it("should add the default bindings for a new v2 remote config function without v2 deployed functions", async () => {
        const newIamPolicy = {
            etag: "etag",
            version: 3,
            bindings: [
                BINDING,
                {
                    role: checkIam.SERVICE_ACCOUNT_TOKEN_CREATOR_ROLE,
                    members: [
                        `serviceAccount:service-${projectNumber}@gcp-sa-pubsub.iam.gserviceaccount.com`,
                    ],
                },
                {
                    role: checkIam.RUN_INVOKER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
                {
                    role: checkIam.EVENTARC_EVENT_RECEIVER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
            ],
        };
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [BINDING],
        });
        setIamStub.resolves(newIamPolicy);
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.remoteconfig.remoteConfig.v1.updated",
                eventFilters: {},
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.empty());
        (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledWith(projectNumber, newIamPolicy, "bindings");
    });
    it("should not add bindings for a new v2 remote config function with v2 deployed functions", async () => {
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.remoteconfig.remoteConfig.v1.updated",
                eventFilters: {},
                retry: false,
            } }, SPEC);
        const haveFn = Object.assign({ id: "haveFn", entryPoint: "haveFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.cloud.storage.object.v1.finalized",
                eventFilters: { bucket: "my-bucket" },
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.of(haveFn));
        (0, chai_1.expect)(getIamStub).to.not.have.been.called;
        (0, chai_1.expect)(setIamStub).to.not.have.been.called;
    });
    it("should add the default bindings for a new v2 test lab function without v2 deployed functions", async () => {
        const newIamPolicy = {
            etag: "etag",
            version: 3,
            bindings: [
                BINDING,
                {
                    role: checkIam.SERVICE_ACCOUNT_TOKEN_CREATOR_ROLE,
                    members: [
                        `serviceAccount:service-${projectNumber}@gcp-sa-pubsub.iam.gserviceaccount.com`,
                    ],
                },
                {
                    role: checkIam.RUN_INVOKER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
                {
                    role: checkIam.EVENTARC_EVENT_RECEIVER_ROLE,
                    members: [`serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com`],
                },
            ],
        };
        getIamStub.resolves({
            etag: "etag",
            version: 3,
            bindings: [BINDING],
        });
        setIamStub.resolves(newIamPolicy);
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.testlab.testMatrix.v1.completed",
                eventFilters: {},
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.empty());
        (0, chai_1.expect)(getIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledOnce;
        (0, chai_1.expect)(setIamStub).to.have.been.calledWith(projectNumber, newIamPolicy, "bindings");
    });
    it("should not add bindings for a new v2 test lab function with v2 deployed functions", async () => {
        const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.firebase.testlab.testMatrix.v1.completed",
                eventFilters: {},
                retry: false,
            } }, SPEC);
        const haveFn = Object.assign({ id: "haveFn", entryPoint: "haveFn", platform: "gcfv2", eventTrigger: {
                eventType: "google.cloud.storage.object.v1.finalized",
                eventFilters: { bucket: "my-bucket" },
                retry: false,
            } }, SPEC);
        await checkIam.ensureServiceAgentRoles(projectId, projectNumber, backend.of(wantFn), backend.of(haveFn));
        (0, chai_1.expect)(getIamStub).to.not.have.been.called;
        (0, chai_1.expect)(setIamStub).to.not.have.been.called;
    });
});
//# sourceMappingURL=checkIam.spec.js.map