"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const cloudFunctions_1 = require("../../../emulator/auth/cloudFunctions");
const registry_1 = require("../../../emulator/registry");
const types_1 = require("../../../emulator/types");
const fakeEmulator_1 = require("../fakeEmulator");
describe("cloudFunctions", () => {
    describe("dispatch", () => {
        before(async () => {
            const emu = await fakeEmulator_1.FakeEmulator.create(types_1.Emulators.FUNCTIONS);
            await registry_1.EmulatorRegistry.start(emu);
            nock(registry_1.EmulatorRegistry.url(types_1.Emulators.FUNCTIONS).toString())
                .post("/functions/projects/project-foo/trigger_multicast", {
                eventId: /.*/,
                eventType: "providers/firebase.auth/eventTypes/user.create",
                resource: {
                    name: "projects/project-foo",
                    service: "firebaseauth.googleapis.com",
                },
                params: {},
                timestamp: /.*/,
                data: { uid: "foobar", metadata: {}, customClaims: {} },
            })
                .reply(200, {});
        });
        after(async () => {
            await registry_1.EmulatorRegistry.stopAll();
            nock.cleanAll();
        });
        it("should make a request to the functions emulator", async () => {
            const cf = new cloudFunctions_1.AuthCloudFunction("project-foo");
            await cf.dispatch("create", { localId: "foobar" });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=cloudFunctions.spec.js.map