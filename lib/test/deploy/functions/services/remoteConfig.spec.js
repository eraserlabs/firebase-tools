"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const remoteConfig = require("../../../../deploy/functions/services/remoteConfig");
const projectNumber = "123456789";
const endpoint = {
    id: "endpoint",
    region: "us-central1",
    project: projectNumber,
    eventTrigger: {
        retry: false,
        eventType: "google.firebase.remoteconfig.remoteConfig.v1.updated",
        eventFilters: {},
    },
    entryPoint: "endpoint",
    platform: "gcfv2",
    runtime: "nodejs16",
};
describe("ensureRemoteConfigTriggerRegion", () => {
    it("should set the trigger location to global", async () => {
        const ep = Object.assign({}, endpoint);
        await remoteConfig.ensureRemoteConfigTriggerRegion(ep);
        (0, chai_1.expect)(ep.eventTrigger.region).to.eq("global");
    });
    it("should not error if the trigger location is global", async () => {
        const ep = Object.assign({}, endpoint);
        ep.eventTrigger.region = "global";
        await remoteConfig.ensureRemoteConfigTriggerRegion(ep);
        (0, chai_1.expect)(ep.eventTrigger.region).to.eq("global");
    });
    it("should error if the trigger location is not global", () => {
        const ep = Object.assign({}, endpoint);
        ep.eventTrigger.region = "us-west1";
        (0, chai_1.expect)(() => remoteConfig.ensureRemoteConfigTriggerRegion(ep)).to.throw("A remote config trigger must specify 'global' trigger location");
    });
});
//# sourceMappingURL=remoteConfig.spec.js.map