"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const backend = require("../../../deploy/functions/backend");
const storage = require("../../../gcp/storage");
const triggerRegionHelper = require("../../../deploy/functions/triggerRegionHelper");
const SPEC = {
    region: "us-west1",
    project: "my-project",
    runtime: "nodejs14",
};
describe("TriggerRegionHelper", () => {
    describe("ensureTriggerRegions", () => {
        let storageStub;
        beforeEach(() => {
            storageStub = sinon.stub(storage, "getBucket").throws("unexpected call to storage.getBucket");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("should throw an error if we can't find the bucket region", async () => {
            const ep = Object.assign({ id: "fn", entryPoint: "fnn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC);
            await (0, chai_1.expect)(triggerRegionHelper.ensureTriggerRegions(backend.of(ep))).to.be.rejectedWith("Can't find the storage bucket region");
        });
        it("should skip v1 and callable functions", async () => {
            const v1EventFn = Object.assign({ id: "v1eventfn", entryPoint: "v1Fn", platform: "gcfv1", eventTrigger: {
                    eventType: "google.storage.object.create",
                    eventFilters: { resource: "projects/_/buckets/my-bucket" },
                    retry: false,
                } }, SPEC);
            const v2CallableFn = Object.assign({ id: "v2callablefn", entryPoint: "v2callablefn", platform: "gcfv2", httpsTrigger: {} }, SPEC);
            await triggerRegionHelper.ensureTriggerRegions(backend.of(v1EventFn, v2CallableFn));
            const want = {
                eventType: "google.storage.object.create",
                eventFilters: { resource: "projects/_/buckets/my-bucket" },
                retry: false,
            };
            (0, chai_1.expect)(v1EventFn.eventTrigger).to.deep.eq(want);
            (0, chai_1.expect)(v2CallableFn.httpsTrigger).to.deep.eq({});
        });
        it("should set trigger region from API", async () => {
            storageStub.resolves({ location: "US" });
            const wantFn = Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC);
            await triggerRegionHelper.ensureTriggerRegions(backend.of(wantFn));
            const want = {
                eventType: "google.cloud.storage.object.v1.finalized",
                eventFilters: { bucket: "my-bucket" },
                retry: false,
                region: "us",
            };
            (0, chai_1.expect)(wantFn.eventTrigger).to.deep.eq(want);
        });
        it("should set trigger region from API then reject on invalid function region", async () => {
            storageStub.resolves({ location: "US" });
            const wantFn = Object.assign(Object.assign({ id: "wantFn", entryPoint: "wantFn", platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.storage.object.v1.finalized",
                    eventFilters: { bucket: "my-bucket" },
                    retry: false,
                } }, SPEC), { region: "europe-west4" });
            await (0, chai_1.expect)(triggerRegionHelper.ensureTriggerRegions(backend.of(wantFn))).to.be.rejectedWith("A function in region europe-west4 cannot listen to a bucket in region us");
        });
    });
});
//# sourceMappingURL=triggerRegionHelper.spec.js.map