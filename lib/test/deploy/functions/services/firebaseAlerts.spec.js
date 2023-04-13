"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const firebaseAlerts = require("../../../../deploy/functions/services/firebaseAlerts");
const projectNumber = "123456789";
const endpoint = {
    id: "endpoint",
    region: "us-central1",
    project: projectNumber,
    eventTrigger: {
        retry: false,
        eventType: "firebase.firebasealerts.alerts.v1.published",
        eventFilters: {},
    },
    entryPoint: "endpoint",
    platform: "gcfv2",
    runtime: "nodejs16",
};
describe("ensureFirebaseAlertsTriggerRegion", () => {
    it("should set the trigger location to global", async () => {
        const ep = Object.assign({}, endpoint);
        await firebaseAlerts.ensureFirebaseAlertsTriggerRegion(ep);
        (0, chai_1.expect)(ep.eventTrigger.region).to.eq("global");
    });
    it("should not error if the trigger location is global", async () => {
        const ep = Object.assign({}, endpoint);
        ep.eventTrigger.region = "global";
        await firebaseAlerts.ensureFirebaseAlertsTriggerRegion(ep);
        (0, chai_1.expect)(ep.eventTrigger.region).to.eq("global");
    });
    it("should error if the trigger location is not global", () => {
        const ep = Object.assign({}, endpoint);
        ep.eventTrigger.region = "us-west1";
        (0, chai_1.expect)(() => firebaseAlerts.ensureFirebaseAlertsTriggerRegion(ep)).to.throw("A firebase alerts trigger must specify 'global' trigger location");
    });
});
//# sourceMappingURL=firebaseAlerts.spec.js.map