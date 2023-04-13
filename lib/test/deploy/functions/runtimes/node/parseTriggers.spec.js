"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const error_1 = require("../../../../../error");
const backend = require("../../../../../deploy/functions/backend");
const build = require("../../../../../deploy/functions/build");
const parseTriggers = require("../../../../../deploy/functions/runtimes/node/parseTriggers");
const api = require("../../../../../api");
const v1_1 = require("../../../../../functions/events/v1");
async function resolveBackend(bd) {
    return (await build.resolveBackend(bd, {
        locationId: "",
        projectId: "foo",
        storageBucket: "foo.appspot.com",
        databaseURL: "https://foo.firebaseio.com",
    }, { functionsSource: "", projectId: "PROJECT" }, {})).backend;
}
describe("addResourcesToBuild", () => {
    const oldDefaultRegion = api.functionsDefaultRegion;
    before(() => {
        api.functionsDefaultRegion = "us-central1";
    });
    after(() => {
        api.functionsDefaultRegion = oldDefaultRegion;
    });
    const BASIC_TRIGGER = Object.freeze({
        name: "func",
        entryPoint: "func",
    });
    const BASIC_ENDPOINT = Object.freeze({
        platform: "gcfv1",
        region: [api.functionsDefaultRegion],
        project: "project",
        runtime: "nodejs16",
        entryPoint: "func",
    });
    const BASIC_FUNCTION_NAME = Object.freeze({
        id: "func",
        region: api.functionsDefaultRegion,
        project: "project",
    });
    const BASIC_BACKEND_ENDPOINT = Object.freeze(Object.assign(Object.assign({ platform: "gcfv1" }, BASIC_FUNCTION_NAME), { runtime: "nodejs16", entryPoint: "func" }));
    it("should handle a minimal https trigger, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {} });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({ func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {} }) });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {} }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should handle a callable trigger, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, labels: {
                "deployment-callable": "true",
            } });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { callableTrigger: {}, labels: {} }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { callableTrigger: {}, labels: {} }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should handle a minimal task queue trigger, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { taskQueueTrigger: {} });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { taskQueueTrigger: {} }),
        });
        expected.requiredAPIs = [
            {
                api: "cloudtasks.googleapis.com",
                reason: "Needed for task queue functions.",
            },
        ];
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = Object.assign(Object.assign({}, backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { taskQueueTrigger: {} }))), { requiredAPIs: [
                {
                    api: "cloudtasks.googleapis.com",
                    reason: "Needed for task queue functions.",
                },
            ] });
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should copy fields, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {
                invoker: ["public"],
            }, maxInstances: 42, minInstances: 1, serviceAccountEmail: "inlined@google.com", vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY", vpcConnector: "projects/project/locations/region/connectors/connector", ingressSettings: "ALLOW_ALL", labels: {
                test: "testing",
            } });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const config = {
            maxInstances: 42,
            minInstances: 1,
            serviceAccount: "inlined@google.com",
            vpc: {
                connector: "projects/project/locations/region/connectors/connector",
                egressSettings: "PRIVATE_RANGES_ONLY",
            },
            ingressSettings: "ALLOW_ALL",
            labels: {
                test: "testing",
            },
        };
        const expected = build.of({
            func: Object.assign(Object.assign(Object.assign({}, BASIC_ENDPOINT), config), { httpsTrigger: {
                    invoker: ["public"],
                } }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const backendConfig = {
            maxInstances: 42,
            minInstances: 1,
            serviceAccount: "inlined@google.com",
            vpc: {
                connector: "projects/project/locations/region/connectors/connector",
                egressSettings: "PRIVATE_RANGES_ONLY",
            },
            ingressSettings: "ALLOW_ALL",
            labels: {
                test: "testing",
            },
        };
        const expectedBackend = backend.of(Object.assign(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {
                invoker: ["public"],
            } }), backendConfig));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should rename/transform fields, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { eventTrigger: {
                eventType: "google.pubsub.topic.publish",
                resource: "projects/p/topics/t",
                service: "pubsub.googleapis.com",
            }, timeout: "60s" });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const eventTrigger = {
            eventType: "google.pubsub.topic.publish",
            eventFilters: { resource: "projects/p/topics/t" },
            retry: false,
        };
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { eventTrigger, timeoutSeconds: 60 }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { eventTrigger, timeoutSeconds: 60 }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should support multiple regions, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, regions: ["us-central1", "europe-west1"] });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, region: ["us-central1", "europe-west1"] }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {}, region: "us-central1" }), Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {}, region: "europe-west1" }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should support schedules, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const schedule = {
            schedule: "every 10 minutes",
            timeZone: "America/Los_Angeles",
            retryConfig: {
                retryCount: 20,
                maxRetrySeconds: 200,
                minBackoffSeconds: 1,
                maxBackoffSeconds: 10,
                maxDoublings: 10,
            },
        };
        const typesafetyCheck1 = schedule;
        const typesafetyCheck2 = schedule;
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { eventTrigger: {
                eventType: "google.pubsub.topic.publish",
                resource: "projects/project/topics",
                service: "pubsub.googleapis.com",
            }, regions: ["us-central1", "europe-west1"], schedule: {
                schedule: "every 10 minutes",
                timeZone: "America/Los_Angeles",
                retryConfig: {
                    retryCount: 20,
                    maxRetryDuration: "200s",
                    minBackoffDuration: "1s",
                    maxBackoffDuration: "10s",
                    maxDoublings: 10,
                },
            }, labels: {
                test: "testing",
            } });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { scheduleTrigger: schedule, labels: {
                    test: "testing",
                }, region: ["us-central1", "europe-west1"] }),
        });
        expected.requiredAPIs = [
            {
                api: "cloudscheduler.googleapis.com",
                reason: "Needed for scheduled functions.",
            },
        ];
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = Object.assign(Object.assign({}, backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { region: "us-central1", labels: {
                test: "testing",
            }, scheduleTrigger: schedule }), Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { region: "europe-west1", labels: {
                test: "testing",
            }, scheduleTrigger: schedule }))), { requiredAPIs: [
                {
                    api: "cloudscheduler.googleapis.com",
                    reason: "Needed for scheduled functions.",
                },
            ] });
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should expand vpc connector in w/ shorthand form", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, vpcConnector: "hello-vpc" });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, vpc: {
                    connector: "hello-vpc",
                } }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {}, vpc: {
                connector: `projects/project/locations/${api.functionsDefaultRegion}/connectors/hello-vpc`,
            } }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should preserve empty vpc connector setting, yielding a build reversibly equivalent to the corresponding backend", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, vpcConnector: "" });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, vpc: {
                    connector: "",
                } }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {}, vpc: {
                connector: "",
            } }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
    it("should parse secret", async () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, secrets: ["MY_SECRET"] });
        const result = build.empty();
        parseTriggers.addResourcesToBuild("project", "nodejs16", trigger, result);
        const expected = build.of({
            func: Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, secretEnvironmentVariables: [
                    {
                        projectId: "project",
                        secret: "MY_SECRET",
                        key: "MY_SECRET",
                    },
                ] }),
        });
        (0, chai_1.expect)(result).to.deep.equal(expected);
        const expectedBackend = backend.of(Object.assign(Object.assign({}, BASIC_BACKEND_ENDPOINT), { httpsTrigger: {}, secretEnvironmentVariables: [
                {
                    projectId: "project",
                    secret: "MY_SECRET",
                    key: "MY_SECRET",
                },
            ] }));
        const convertedBackend = resolveBackend(expected);
        await (0, chai_1.expect)(convertedBackend).to.eventually.deep.equal(expectedBackend);
    });
});
describe("addResourcesToBackend", () => {
    const oldDefaultRegion = api.functionsDefaultRegion;
    before(() => {
        api.functionsDefaultRegion = "us-central1";
    });
    after(() => {
        api.functionsDefaultRegion = oldDefaultRegion;
    });
    const BASIC_TRIGGER = Object.freeze({
        name: "func",
        entryPoint: "func",
    });
    const BASIC_FUNCTION_NAME = Object.freeze({
        id: "func",
        region: api.functionsDefaultRegion,
        project: "project",
    });
    const BASIC_ENDPOINT = Object.freeze(Object.assign(Object.assign({ platform: "gcfv1" }, BASIC_FUNCTION_NAME), { runtime: "nodejs16", entryPoint: "func" }));
    it("should assert against impossible configurations", () => {
        (0, chai_1.expect)(() => {
            parseTriggers.addResourcesToBackend("project", "nodejs16", Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: "projects/project/topics/topic",
                    service: "pubsub.googleapis.com",
                } }), backend.empty());
        }).to.throw(error_1.FirebaseError);
    });
    it("should handle a minimal https trigger", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {} });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {} }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should handle a callable trigger", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, labels: {
                "deployment-callable": "true",
            } });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { callableTrigger: {}, labels: {} }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should handle a minimal task queue trigger", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { taskQueueTrigger: {} });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = Object.assign(Object.assign({}, backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { taskQueueTrigger: {} }))), { requiredAPIs: [
                {
                    api: "cloudtasks.googleapis.com",
                    reason: "Needed for task queue functions.",
                },
            ] });
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    describe("should handle a minimal event trigger", () => {
        for (const failurePolicy of [undefined, false, true, { retry: {} }]) {
            const name = typeof failurePolicy === "undefined" ? "undefined" : JSON.stringify(failurePolicy);
            it(`should handle failurePolicy=${name}`, () => {
                const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { eventTrigger: {
                        service: "pubsub.googleapis.com",
                        eventType: "google.pubsub.topic.publish",
                        resource: "projects/project/topics/topic",
                    } });
                if (typeof failurePolicy !== "undefined") {
                    trigger.failurePolicy = failurePolicy;
                }
                const result = backend.empty();
                parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
                const eventTrigger = {
                    eventType: "google.pubsub.topic.publish",
                    eventFilters: { resource: "projects/project/topics/topic" },
                    retry: !!failurePolicy,
                };
                const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { eventTrigger }));
                (0, chai_1.expect)(result).to.deep.equal(expected);
            });
        }
    });
    it("should copy fields", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {
                invoker: ["public", "other", "serviceAccount@"],
            }, maxInstances: 42, minInstances: 1, serviceAccountEmail: "inlined@google.com", vpcConnectorEgressSettings: "PRIVATE_RANGES_ONLY", vpcConnector: "projects/project/locations/region/connectors/connector", ingressSettings: "ALLOW_ALL", labels: {
                test: "testing",
            } });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const config = {
            maxInstances: 42,
            minInstances: 1,
            serviceAccount: "inlined@google.com",
            vpc: {
                connector: "projects/project/locations/region/connectors/connector",
                egressSettings: "PRIVATE_RANGES_ONLY",
            },
            ingressSettings: "ALLOW_ALL",
            labels: {
                test: "testing",
            },
        };
        const expected = backend.of(Object.assign(Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {
                invoker: ["public", "other", "serviceAccount@"],
            } }), config));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should rename/transform fields", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { eventTrigger: {
                eventType: "google.pubsub.topic.publish",
                resource: "projects/p/topics/t",
                service: "pubsub.googleapis.com",
            }, timeout: "60s" });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const eventTrigger = {
            eventType: "google.pubsub.topic.publish",
            eventFilters: { resource: "projects/p/topics/t" },
            retry: false,
        };
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { eventTrigger, timeoutSeconds: 60 }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should support explicit regions", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, regions: ["europe-west1"] });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { region: "europe-west1", httpsTrigger: {} }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should support multiple regions", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, regions: ["us-central1", "europe-west1"] });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, region: "us-central1" }), Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, region: "europe-west1" }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should support schedules", () => {
        const schedule = {
            schedule: "every 10 minutes",
            timeZone: "America/Los_Angeles",
            retryConfig: {
                retryCount: 20,
                maxRetryDuration: "200s",
                minBackoffDuration: "1s",
                maxBackoffDuration: "10s",
                maxDoublings: 10,
            },
        };
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { eventTrigger: {
                eventType: "google.pubsub.topic.publish",
                resource: "projects/project/topics",
                service: "pubsub.googleapis.com",
            }, regions: ["us-central1", "europe-west1"], schedule, labels: {
                test: "testing",
            } });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = Object.assign(Object.assign({}, backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { region: "us-central1", labels: {
                test: "testing",
            }, scheduleTrigger: schedule }), Object.assign(Object.assign({}, BASIC_ENDPOINT), { region: "europe-west1", labels: {
                test: "testing",
            }, scheduleTrigger: schedule }))), { requiredAPIs: [
                {
                    api: "cloudscheduler.googleapis.com",
                    reason: "Needed for scheduled functions.",
                },
            ] });
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should expand vpc connector setting to full resource name", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, vpcConnector: "hello-vpc" });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, vpc: {
                connector: "projects/project/locations/us-central1/connectors/hello-vpc",
            } }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should preserve empty vpc connector setting", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, vpcConnector: "" });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, vpc: {
                connector: "",
            } }));
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should parse secret", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { httpsTrigger: {}, secrets: ["MY_SECRET"] });
        const expected = backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { httpsTrigger: {}, secretEnvironmentVariables: [
                {
                    projectId: "project",
                    secret: "MY_SECRET",
                    key: "MY_SECRET",
                },
            ] }));
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should parse a basic blocking trigger", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { blockingTrigger: {
                eventType: v1_1.BEFORE_CREATE_EVENT,
            } });
        const expected = Object.assign(Object.assign({}, backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { blockingTrigger: {
                eventType: v1_1.BEFORE_CREATE_EVENT,
                options: undefined,
            } }))), { requiredAPIs: [
                {
                    api: "identitytoolkit.googleapis.com",
                    reason: "Needed for auth blocking functions.",
                },
            ] });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
    it("should parse a blocking trigger with options", () => {
        const trigger = Object.assign(Object.assign({}, BASIC_TRIGGER), { blockingTrigger: {
                eventType: v1_1.BEFORE_CREATE_EVENT,
                options: {
                    accessToken: true,
                    idToken: false,
                    refreshToken: true,
                },
            } });
        const expected = Object.assign(Object.assign({}, backend.of(Object.assign(Object.assign({}, BASIC_ENDPOINT), { blockingTrigger: {
                eventType: v1_1.BEFORE_CREATE_EVENT,
                options: {
                    accessToken: true,
                    idToken: false,
                    refreshToken: true,
                },
            } }))), { requiredAPIs: [
                {
                    api: "identitytoolkit.googleapis.com",
                    reason: "Needed for auth blocking functions.",
                },
            ] });
        const result = backend.empty();
        parseTriggers.addResourcesToBackend("project", "nodejs16", trigger, result);
        (0, chai_1.expect)(result).to.deep.equal(expected);
    });
});
//# sourceMappingURL=parseTriggers.spec.js.map