"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const backend = require("../../../deploy/functions/backend");
const prepare = require("../../../deploy/functions/prepare");
const v1_1 = require("../../../functions/events/v1");
describe("prepare", () => {
    const ENDPOINT_BASE = {
        platform: "gcfv2",
        id: "id",
        region: "region",
        project: "project",
        entryPoint: "entry",
        runtime: "nodejs16",
    };
    const ENDPOINT = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
    describe("inferDetailsFromExisting", () => {
        it("merges env vars if .env is not used", () => {
            const oldE = Object.assign(Object.assign({}, ENDPOINT), { environmentVariables: {
                    foo: "old value",
                    old: "value",
                } });
            const newE = Object.assign(Object.assign({}, ENDPOINT), { environmentVariables: {
                    foo: "new value",
                    new: "value",
                } });
            prepare.inferDetailsFromExisting(backend.of(newE), backend.of(oldE), false);
            (0, chai_1.expect)(newE.environmentVariables).to.deep.equals({
                old: "value",
                new: "value",
                foo: "new value",
            });
        });
        it("overwrites env vars if .env is used", () => {
            const oldE = Object.assign(Object.assign({}, ENDPOINT), { environmentVariables: {
                    foo: "old value",
                    old: "value",
                } });
            const newE = Object.assign(Object.assign({}, ENDPOINT), { environmentVariables: {
                    foo: "new value",
                    new: "value",
                } });
            prepare.inferDetailsFromExisting(backend.of(newE), backend.of(oldE), true);
            (0, chai_1.expect)(newE.environmentVariables).to.deep.equals({
                new: "value",
                foo: "new value",
            });
        });
        it("can noop when there is no prior endpoint", () => {
            const e = Object.assign({}, ENDPOINT);
            prepare.inferDetailsFromExisting(backend.of(e), backend.of(), false);
            (0, chai_1.expect)(e).to.deep.equal(ENDPOINT);
        });
        it("can fill in regions from last deploy", () => {
            const want = Object.assign(Object.assign({}, ENDPOINT_BASE), { eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "bucket" },
                    retry: false,
                } });
            const have = JSON.parse(JSON.stringify(want));
            have.eventTrigger.region = "us";
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            (0, chai_1.expect)(want.eventTrigger.region).to.equal("us");
        });
        it("doesn't fill in regions if triggers changed", () => {
            const want = Object.assign(Object.assign({}, ENDPOINT_BASE), { eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalzied",
                    eventFilters: { bucket: "us-bucket" },
                    retry: false,
                } });
            const have = JSON.parse(JSON.stringify(want));
            have.eventTrigger.eventFilters = { bucket: "us-central1-bucket" };
            have.eventTrigger.region = "us-central1";
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            (0, chai_1.expect)(want.eventTrigger.region).to.be.undefined;
        });
        it("fills in instance size", () => {
            const want = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
            const have = JSON.parse(JSON.stringify(want));
            have.availableMemoryMb = 512;
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            (0, chai_1.expect)(want.availableMemoryMb).to.equal(512);
        });
        it("downgrades concurrency if necessary (explicit)", () => {
            const have = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {}, concurrency: 80, cpu: 1 });
            const want = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {}, cpu: 0.5 });
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            prepare.resolveCpuAndConcurrency(backend.of(want));
            (0, chai_1.expect)(want.concurrency).to.equal(1);
        });
        it("downgrades concurrency if necessary (implicit)", () => {
            const have = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {}, concurrency: 80, cpu: 1 });
            const want = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {}, cpu: "gcf_gen1" });
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            prepare.resolveCpuAndConcurrency(backend.of(want));
            (0, chai_1.expect)(want.concurrency).to.equal(1);
        });
        it("upgrades default concurrency with CPU upgrades", () => {
            const have = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {}, availableMemoryMb: 256, cpu: "gcf_gen1" });
            const want = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
            prepare.inferDetailsFromExisting(backend.of(want), backend.of(have), false);
            prepare.resolveCpuAndConcurrency(backend.of(want));
            (0, chai_1.expect)(want.concurrency).to.equal(1);
        });
    });
    describe("inferBlockingDetails", () => {
        it("should merge the blocking options and set default value", () => {
            var _a, _b, _c, _d, _e, _f;
            const beforeCreate = Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "beforeCreate", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: true,
                        refreshToken: false,
                    },
                } });
            const beforeSignIn = Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "beforeSignIn", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                    },
                } });
            prepare.inferBlockingDetails(backend.of(beforeCreate, beforeSignIn));
            (0, chai_1.expect)((_a = beforeCreate.blockingTrigger.options) === null || _a === void 0 ? void 0 : _a.accessToken).to.be.true;
            (0, chai_1.expect)((_b = beforeCreate.blockingTrigger.options) === null || _b === void 0 ? void 0 : _b.idToken).to.be.true;
            (0, chai_1.expect)((_c = beforeCreate.blockingTrigger.options) === null || _c === void 0 ? void 0 : _c.refreshToken).to.be.false;
            (0, chai_1.expect)((_d = beforeSignIn.blockingTrigger.options) === null || _d === void 0 ? void 0 : _d.accessToken).to.be.true;
            (0, chai_1.expect)((_e = beforeSignIn.blockingTrigger.options) === null || _e === void 0 ? void 0 : _e.idToken).to.be.true;
            (0, chai_1.expect)((_f = beforeSignIn.blockingTrigger.options) === null || _f === void 0 ? void 0 : _f.refreshToken).to.be.false;
        });
    });
    describe("updateEndpointTargetedStatus", () => {
        let endpoint1InBackend1;
        let endpoint2InBackend1;
        let endpoint1InBackend2;
        let endpoint2InBackend2;
        let backends;
        beforeEach(() => {
            endpoint1InBackend1 = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint1", platform: "gcfv1", codebase: "backend1" });
            endpoint2InBackend1 = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint2", platform: "gcfv1", codebase: "backend1" });
            endpoint1InBackend2 = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint1", platform: "gcfv2", codebase: "backend2" });
            endpoint2InBackend2 = Object.assign(Object.assign({}, ENDPOINT), { id: "endpoint2", platform: "gcfv2", codebase: "backend2" });
            const backend1 = backend.of(endpoint1InBackend1, endpoint2InBackend1);
            const backend2 = backend.of(endpoint1InBackend2, endpoint2InBackend2);
            backends = { backend1, backend2 };
        });
        it("should mark targeted codebases", () => {
            const filters = [{ codebase: "backend1" }];
            prepare.updateEndpointTargetedStatus(backends, filters);
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint1InBackend2.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint2InBackend2.targetedByOnly).to.be.false;
        });
        it("should mark targeted codebases + ids", () => {
            const filters = [{ codebase: "backend1", idChunks: ["endpoint1"] }];
            prepare.updateEndpointTargetedStatus(backends, filters);
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend1.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint1InBackend2.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint2InBackend2.targetedByOnly).to.be.false;
        });
        it("should mark targeted ids", () => {
            const filters = [{ idChunks: ["endpoint1"] }];
            prepare.updateEndpointTargetedStatus(backends, filters);
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend1.targetedByOnly).to.be.false;
            (0, chai_1.expect)(endpoint1InBackend1.targetedByOnly).to.be.true;
            (0, chai_1.expect)(endpoint2InBackend2.targetedByOnly).to.be.false;
        });
    });
});
//# sourceMappingURL=prepare.spec.js.map