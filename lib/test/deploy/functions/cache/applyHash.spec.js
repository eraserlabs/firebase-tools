"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash = require("../../../../deploy/functions/cache/hash");
const applyHash_1 = require("../../../../deploy/functions/cache/applyHash");
const backend = require("../../../../deploy/functions/backend");
const chai_1 = require("chai");
const sinon = require("sinon");
const EMPTY_ENDPOINT = {
    id: "id",
    region: "region",
    project: "project",
    platform: "gcfv2",
    runtime: "nodejs16",
    entryPoint: "ep",
    httpsTrigger: {},
    secretEnvironmentVariables: [],
};
describe("applyHash", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("applyBackendHashToBackends", () => {
        it("should applyHash to each endpoint of a given backend", () => {
            const context = {
                projectId: "projectId",
                sources: {
                    backend1: {
                        functionsSourceV1Hash: "backend1_sourceV1",
                        functionsSourceV2Hash: "backend1_sourceV2",
                    },
                    backend2: {
                        functionsSourceV1Hash: "backend2_sourceV1",
                        functionsSourceV2Hash: "backend2_sourceV2",
                    },
                },
            };
            const endpoint1 = Object.assign(Object.assign({}, EMPTY_ENDPOINT), { id: "endpoint1", platform: "gcfv1", codebase: "backend1", secretEnvironmentVariables: [
                    {
                        key: "key",
                        secret: "secret1",
                        projectId: "projectId",
                        version: "1",
                    },
                ] });
            const endpoint2 = Object.assign(Object.assign({}, EMPTY_ENDPOINT), { id: "endpoint2", platform: "gcfv2", codebase: "backend2", secretEnvironmentVariables: [
                    {
                        key: "key",
                        secret: "secret2",
                        projectId: "projectId",
                        version: "2",
                    },
                ] });
            const backend1 = backend.of(endpoint1);
            const backend2 = backend.of(endpoint2);
            backend1.environmentVariables.test = "backend1_env_hash";
            backend2.environmentVariables.test = "backend2_env_hash";
            const backends = { backend1, backend2 };
            const getEnvironmentVariablesHash = sinon.stub(hash, "getEnvironmentVariablesHash");
            getEnvironmentVariablesHash.callsFake((backend) => "env=" + backend.environmentVariables.test);
            const getSecretsHash = sinon.stub(hash, "getSecretsHash");
            getSecretsHash.callsFake((endpoint) => { var _a; return "secret=" + ((_a = endpoint.secretEnvironmentVariables) === null || _a === void 0 ? void 0 : _a[0].secret); });
            const getEndpointHash = sinon.stub(hash, "getEndpointHash");
            getEndpointHash.callsFake((source, env, secrets) => [source, env, secrets].join("&"));
            (0, applyHash_1.applyBackendHashToBackends)(backends, context);
            (0, chai_1.expect)(getEndpointHash).to.have.been.calledWith("backend1_sourceV1", "env=backend1_env_hash", "secret=secret1");
            (0, chai_1.expect)(endpoint1.hash).to.equal("backend1_sourceV1&env=backend1_env_hash&secret=secret1");
            (0, chai_1.expect)(getEndpointHash).to.have.been.calledWith("backend2_sourceV2", "env=backend2_env_hash", "secret=secret2");
            (0, chai_1.expect)(endpoint2.hash).to.equal("backend2_sourceV2&env=backend2_env_hash&secret=secret2");
            (0, chai_1.expect)(getEnvironmentVariablesHash).to.have.been.calledWith(backend1);
            (0, chai_1.expect)(getEnvironmentVariablesHash).to.have.been.calledWith(backend2);
        });
    });
});
//# sourceMappingURL=applyHash.spec.js.map