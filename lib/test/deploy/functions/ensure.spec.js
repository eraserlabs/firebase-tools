"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const error_1 = require("../../../error");
const logger_1 = require("../../../logger");
const configstore_1 = require("../../../configstore");
const ensureApiEnabled_1 = require("../../../ensureApiEnabled");
const api = require("../../../api");
const backend = require("../../../deploy/functions/backend");
const ensure = require("../../../deploy/functions/ensure");
const secretManager = require("../../../gcp/secretManager");
describe("ensureCloudBuildEnabled()", () => {
    let restoreInterval;
    before(() => {
        restoreInterval = ensureApiEnabled_1.POLL_SETTINGS.pollInterval;
        ensureApiEnabled_1.POLL_SETTINGS.pollInterval = 0;
    });
    after(() => {
        ensureApiEnabled_1.POLL_SETTINGS.pollInterval = restoreInterval;
    });
    let sandbox;
    let logStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        logStub = sandbox.stub(logger_1.logger, "warn");
    });
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.be.true;
        sandbox.restore();
        timeStub = null;
        logStub = null;
    });
    function mockServiceCheck(isEnabled = false) {
        nock(api.serviceUsageOrigin)
            .get("/v1/projects/test-project/services/cloudbuild.googleapis.com")
            .reply(200, { state: isEnabled ? "ENABLED" : "DISABLED" });
    }
    function mockServiceEnableSuccess() {
        nock(api.serviceUsageOrigin)
            .post("/v1/projects/test-project/services/cloudbuild.googleapis.com:enable")
            .reply(200, {});
    }
    function mockServiceEnableBillingError() {
        nock(api.serviceUsageOrigin)
            .post("/v1/projects/test-project/services/cloudbuild.googleapis.com:enable")
            .reply(403, {
            error: {
                details: [{ violations: [{ type: "serviceusage/billing-enabled" }] }],
            },
        });
    }
    function mockServiceEnablePermissionError() {
        nock(api.serviceUsageOrigin)
            .post("/v1/projects/test-project/services/cloudbuild.googleapis.com:enable")
            .reply(403, {
            error: {
                status: "PERMISSION_DENIED",
            },
        });
    }
    let timeStub;
    function stubTimes(warnAfter, errorAfter) {
        timeStub = sandbox.stub(configstore_1.configstore, "get");
        timeStub.withArgs("motd.cloudBuildWarnAfter").returns(warnAfter);
        timeStub.withArgs("motd.cloudBuildErrorAfter").returns(errorAfter);
    }
    describe("with cloudbuild service enabled", () => {
        beforeEach(() => {
            mockServiceCheck(true);
        });
        it("should succeed", async () => {
            stubTimes(Date.now() - 10000, Date.now() - 5000);
            await (0, chai_1.expect)(ensure.cloudBuildEnabled("test-project")).to.eventually.be.fulfilled;
            (0, chai_1.expect)(logStub === null || logStub === void 0 ? void 0 : logStub.callCount).to.eq(0);
        });
    });
    describe("with cloudbuild service disabled, but enabling succeeds", () => {
        beforeEach(() => {
            mockServiceCheck(false);
            mockServiceEnableSuccess();
            mockServiceCheck(true);
        });
        it("should succeed", async () => {
            stubTimes(Date.now() - 10000, Date.now() - 5000);
            await (0, chai_1.expect)(ensure.cloudBuildEnabled("test-project")).to.eventually.be.fulfilled;
            (0, chai_1.expect)(logStub === null || logStub === void 0 ? void 0 : logStub.callCount).to.eq(1);
        });
    });
    describe("with cloudbuild service disabled, but enabling fails with billing error", () => {
        beforeEach(() => {
            mockServiceCheck(false);
            mockServiceEnableBillingError();
        });
        it("should error", async () => {
            stubTimes(Date.now() - 10000, Date.now() - 5000);
            await (0, chai_1.expect)(ensure.cloudBuildEnabled("test-project")).to.eventually.be.rejectedWith(error_1.FirebaseError, /must be on the Blaze \(pay-as-you-go\) plan to complete this command/);
        });
    });
    describe("with cloudbuild service disabled, but enabling fails with permission error", () => {
        beforeEach(() => {
            mockServiceCheck(false);
            mockServiceEnablePermissionError();
        });
        it("should error", async () => {
            stubTimes(Date.now() - 10000, Date.now() - 5000);
            await (0, chai_1.expect)(ensure.cloudBuildEnabled("test-project")).to.eventually.be.rejectedWith(error_1.FirebaseError, /Please ask a project owner to visit the following URL to enable Cloud Build/);
        });
    });
});
describe("ensureSecretAccess", () => {
    const DEFAULT_SA = "default-sa@google.com";
    const ENDPOINT_BASE = {
        project: "project",
        platform: "gcfv2",
        id: "id",
        region: "region",
        entryPoint: "entry",
        runtime: "nodejs16",
    };
    const ENDPOINT = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
    const projectId = "project-0";
    const secret0 = {
        projectId: "project",
        key: "MY_SECRET_0",
        secret: "MY_SECRET_0",
        version: "2",
    };
    const secret1 = {
        projectId: "project",
        key: "ANOTHER_SECRET",
        secret: "ANOTHER_SECRET",
        version: "1",
    };
    const e = Object.assign(Object.assign({}, ENDPOINT), { project: projectId, platform: "gcfv1", secretEnvironmentVariables: [] });
    let defaultServiceAccountStub;
    let secretManagerMock;
    beforeEach(() => {
        defaultServiceAccountStub = sinon.stub(ensure, "defaultServiceAccount").resolves(DEFAULT_SA);
        secretManagerMock = sinon.mock(secretManager);
    });
    afterEach(() => {
        defaultServiceAccountStub.restore();
        secretManagerMock.verify();
        secretManagerMock.restore();
    });
    it("ensures access to default service account", async () => {
        const b = backend.of(Object.assign(Object.assign({}, e), { secretEnvironmentVariables: [secret0] }));
        secretManagerMock
            .expects("ensureServiceAgentRole")
            .once()
            .withExactArgs({ name: secret0.secret, projectId: projectId }, [DEFAULT_SA], "roles/secretmanager.secretAccessor");
        await ensure.secretAccess(projectId, b, backend.empty());
    });
    it("ensures access to all secrets", async () => {
        const b = backend.of(Object.assign(Object.assign({}, e), { secretEnvironmentVariables: [secret0, secret1] }));
        secretManagerMock.expects("ensureServiceAgentRole").twice();
        await ensure.secretAccess(projectId, b, backend.empty());
    });
    it("combines service account to make one call per secret", async () => {
        const b = backend.of(Object.assign(Object.assign({}, e), { secretEnvironmentVariables: [secret0] }), Object.assign(Object.assign({}, e), { id: "another-id", serviceAccount: "foo@bar.com", secretEnvironmentVariables: [secret0] }));
        secretManagerMock
            .expects("ensureServiceAgentRole")
            .once()
            .withExactArgs({ name: secret0.secret, projectId: projectId }, [DEFAULT_SA, "foo@bar.com"], "roles/secretmanager.secretAccessor");
        await ensure.secretAccess(projectId, b, backend.empty());
    });
    it("skips calling IAM if secret is already bound to a service account", async () => {
        const b = backend.of(Object.assign(Object.assign({}, e), { secretEnvironmentVariables: [secret0] }));
        secretManagerMock.expects("ensureServiceAgentRole").never();
        await ensure.secretAccess(projectId, b, b);
    });
    it("does not include service account already bounud to a secret", async () => {
        const haveEndpoint = Object.assign(Object.assign({}, e), { secretEnvironmentVariables: [secret0] });
        const haveBackend = backend.of(haveEndpoint);
        const wantBackend = backend.of(haveEndpoint, Object.assign(Object.assign({}, e), { id: "another-id", serviceAccount: "foo@bar.com", secretEnvironmentVariables: [secret0] }));
        secretManagerMock
            .expects("ensureServiceAgentRole")
            .once()
            .withExactArgs({ name: secret0.secret, projectId: projectId }, ["foo@bar.com"], "roles/secretmanager.secretAccessor");
        await ensure.secretAccess(projectId, wantBackend, haveBackend);
    });
});
//# sourceMappingURL=ensure.spec.js.map