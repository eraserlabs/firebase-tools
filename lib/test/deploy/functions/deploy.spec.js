"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const backend = require("../../../deploy/functions/backend");
const deploy = require("../../../deploy/functions/deploy");
describe("deploy", () => {
    const ENDPOINT_BASE = {
        platform: "gcfv2",
        id: "id",
        region: "region",
        project: "project",
        entryPoint: "entry",
        runtime: "nodejs16",
    };
    const ENDPOINT = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
    const CONTEXT = {
        projectId: "project",
    };
    describe("shouldUploadBeSkipped", () => {
        let endpoint1InWantBackend;
        let endpoint2InWantBackend;
        let endpoint1InHaveBackend;
        let endpoint2InHaveBackend;
        let wantBackend;
        let haveBackend;
        beforeEach(() => {
            endpoint1InWantBackend = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint1", platform: "gcfv1", codebase: "backend1" });
            endpoint2InWantBackend = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint2", platform: "gcfv1", codebase: "backend1" });
            endpoint1InHaveBackend = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint1", platform: "gcfv2", codebase: "backend2" });
            endpoint2InHaveBackend = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint2", platform: "gcfv2", codebase: "backend2" });
            wantBackend = backend.of(endpoint1InWantBackend, endpoint2InWantBackend);
            haveBackend = backend.of(endpoint1InHaveBackend, endpoint2InHaveBackend);
        });
        it("should skip if all endpoints are identical", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should not skip if hashes don't match", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = "No_match";
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if haveBackend is missing", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            wantBackend = backend.of(endpoint1InWantBackend, endpoint2InWantBackend);
            haveBackend = backend.of(endpoint1InHaveBackend);
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if wantBackend is missing", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            wantBackend = backend.of(endpoint1InWantBackend);
            haveBackend = backend.of(endpoint1InHaveBackend, endpoint2InHaveBackend);
            const result = deploy.shouldUploadBeSkipped(CONTEXT, wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
        it("should not skip if endpoint filter is specified", () => {
            endpoint1InWantBackend.hash = "1";
            endpoint2InWantBackend.hash = "2";
            endpoint1InHaveBackend.hash = endpoint1InWantBackend.hash;
            endpoint2InHaveBackend.hash = endpoint2InWantBackend.hash;
            const result = deploy.shouldUploadBeSkipped(Object.assign(Object.assign({}, CONTEXT), { filters: [{ idChunks: ["foobar"] }] }), wantBackend, haveBackend);
            (0, chai_1.expect)(result).to.be.false;
        });
    });
});
//# sourceMappingURL=deploy.spec.js.map