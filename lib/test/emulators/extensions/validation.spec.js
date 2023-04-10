"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const validation = require("../../../emulator/extensions/validation");
const ensureApiEnabled = require("../../../ensureApiEnabled");
const controller = require("../../../emulator/controller");
const types_1 = require("../../../emulator/types");
const rc_1 = require("../../../rc");
const config_1 = require("../../../config");
const TEST_OPTIONS = {
    cwd: ".",
    configPath: ".",
    only: "",
    except: "",
    force: false,
    filteredTargets: [""],
    nonInteractive: true,
    interactive: false,
    json: false,
    debug: false,
    rc: new rc_1.RC(),
    config: new config_1.Config("."),
};
function fakeInstanceSpecWithAPI(instanceId, apiName) {
    return {
        instanceId,
        params: {},
        systemParams: {},
        ref: {
            publisherId: "test",
            extensionId: "test",
            version: "0.1.0",
        },
        extensionVersion: {
            name: "publishers/test/extensions/test/versions/0.1.0",
            ref: "test/test@0.1.0",
            state: "PUBLISHED",
            sourceDownloadUri: "test.com",
            hash: "abc123",
            spec: {
                name: "test",
                version: "0.1.0",
                sourceUrl: "test.com",
                resources: [],
                params: [],
                systemParams: [],
                apis: [{ apiName, reason: "because" }],
            },
        },
    };
}
function getTestEmulatableBackend(predefinedTriggers) {
    return {
        functionsDir: ".",
        env: {},
        secretEnv: [],
        codebase: "",
        predefinedTriggers,
    };
}
function getTestParsedTriggerDefinition(args) {
    return {
        entryPoint: "test",
        platform: "gcfv1",
        name: "test",
        eventTrigger: args.eventTrigger,
        httpsTrigger: args.httpsTrigger,
    };
}
describe("ExtensionsEmulator validation", () => {
    describe(`${validation.getUnemulatedAPIs.name}`, () => {
        const testProjectId = "test-project";
        const testAPI = "test.googleapis.com";
        const sandbox = sinon.createSandbox();
        let checkStub;
        beforeEach(() => {
            checkStub = sandbox.stub(ensureApiEnabled, "check");
            checkStub.withArgs(testProjectId, testAPI, "extensions", true).resolves(true);
            checkStub.throws("Unexpected API checked in test");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should check only unemulated APIs", async () => {
            const instanceIdWithUnemulatedAPI = "unemulated";
            const instanceId2WithUnemulatedAPI = "unemulated2";
            const instanceIdWithEmulatedAPI = "emulated";
            const result = await validation.getUnemulatedAPIs(testProjectId, [
                fakeInstanceSpecWithAPI(instanceIdWithEmulatedAPI, "firestore.googleapis.com"),
                fakeInstanceSpecWithAPI(instanceIdWithUnemulatedAPI, testAPI),
                fakeInstanceSpecWithAPI(instanceId2WithUnemulatedAPI, testAPI),
            ]);
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    apiName: testAPI,
                    instanceIds: [instanceIdWithUnemulatedAPI, instanceId2WithUnemulatedAPI],
                    enabled: true,
                },
            ]);
        });
        it("should not check on demo- projects", async () => {
            const instanceIdWithUnemulatedAPI = "unemulated";
            const instanceId2WithUnemulatedAPI = "unemulated2";
            const instanceIdWithEmulatedAPI = "emulated";
            const result = await validation.getUnemulatedAPIs(`demo-${testProjectId}`, [
                fakeInstanceSpecWithAPI(instanceIdWithEmulatedAPI, "firestore.googleapis.com"),
                fakeInstanceSpecWithAPI(instanceIdWithUnemulatedAPI, testAPI),
                fakeInstanceSpecWithAPI(instanceId2WithUnemulatedAPI, testAPI),
            ]);
            (0, chai_1.expect)(result).to.deep.equal([
                {
                    apiName: testAPI,
                    instanceIds: [instanceIdWithUnemulatedAPI, instanceId2WithUnemulatedAPI],
                    enabled: false,
                },
            ]);
            (0, chai_1.expect)(checkStub.callCount).to.equal(0);
        });
    });
    describe(`${validation.checkForUnemulatedTriggerTypes.name}`, () => {
        const sandbox = sinon.createSandbox();
        beforeEach(() => {
            const shouldStartStub = sandbox.stub(controller, "shouldStart");
            shouldStartStub.withArgs(sinon.match.any, types_1.Emulators.STORAGE).returns(true);
            shouldStartStub.withArgs(sinon.match.any, types_1.Emulators.DATABASE).returns(true);
            shouldStartStub.withArgs(sinon.match.any, types_1.Emulators.EVENTARC).returns(true);
            shouldStartStub.withArgs(sinon.match.any, types_1.Emulators.FIRESTORE).returns(false);
            shouldStartStub.withArgs(sinon.match.any, types_1.Emulators.AUTH).returns(false);
        });
        afterEach(() => {
            sandbox.restore();
        });
        const tests = [
            {
                desc: "should return trigger types for emulators that are not running",
                input: [
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test/{*}",
                            eventType: "providers/cloud.firestore/eventTypes/document.create",
                        },
                    }),
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test",
                            eventType: "providers/firebase.auth/eventTypes/user.create",
                        },
                    }),
                ],
                want: ["firestore", "auth"],
            },
            {
                desc: "should return trigger types that don't have an emulator",
                input: [
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test",
                            eventType: "providers/google.firebase.analytics/eventTypes/event.log",
                        },
                    }),
                ],
                want: ["analytics"],
            },
            {
                desc: "should not return duplicates",
                input: [
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test/{*}",
                            eventType: "providers/cloud.firestore/eventTypes/document.create",
                        },
                    }),
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test/{*}",
                            eventType: "providers/cloud.firestore/eventTypes/document.create",
                        },
                    }),
                ],
                want: ["firestore"],
            },
            {
                desc: "should not return trigger types for emulators that are running",
                input: [
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test/{*}",
                            eventType: "google.storage.object.finalize",
                        },
                    }),
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            resource: "test/{*}",
                            eventType: "providers/google.firebase.database/eventTypes/ref.write",
                        },
                    }),
                    getTestParsedTriggerDefinition({
                        eventTrigger: {
                            eventType: "test.custom.event",
                            channel: "projects/foo/locations/us-central1/channels/firebase",
                        },
                    }),
                ],
                want: [],
            },
            {
                desc: "should not return trigger types for https triggers",
                input: [
                    getTestParsedTriggerDefinition({
                        httpsTrigger: {},
                    }),
                ],
                want: [],
            },
        ];
        for (const test of tests) {
            it(test.desc, () => {
                const result = validation.checkForUnemulatedTriggerTypes(getTestEmulatableBackend(test.input), TEST_OPTIONS);
                (0, chai_1.expect)(result).to.have.members(test.want);
            });
        }
    });
});
//# sourceMappingURL=validation.spec.js.map