"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const cloudfunctionsv2 = require("../../gcp/cloudfunctionsv2");
const backend = require("../../deploy/functions/backend");
const events = require("../../functions/events");
const projectConfig = require("../../functions/projectConfig");
const constants_1 = require("../../functions/constants");
const api_1 = require("../../api");
const error_1 = require("../../error");
describe("cloudfunctionsv2", () => {
    const FUNCTION_NAME = {
        id: "id",
        region: "region",
        project: "project",
    };
    const ENDPOINT = Object.assign(Object.assign({ platform: "gcfv2" }, FUNCTION_NAME), { entryPoint: "function", runtime: "nodejs16", codebase: projectConfig.DEFAULT_CODEBASE });
    const CLOUD_FUNCTION_V2_SOURCE = {
        bucket: "sample",
        object: "source.zip",
        generation: 42,
    };
    const CLOUD_FUNCTION_V2 = {
        name: "projects/project/locations/region/functions/id",
        buildConfig: {
            entryPoint: "function",
            runtime: "nodejs16",
            source: {
                storageSource: CLOUD_FUNCTION_V2_SOURCE,
            },
            environmentVariables: {},
        },
        serviceConfig: {
            availableMemory: `${backend.DEFAULT_MEMORY}Mi`,
        },
    };
    const RUN_URI = "https://id-nonce-region-project.run.app";
    const HAVE_CLOUD_FUNCTION_V2 = Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { serviceConfig: {
            uri: RUN_URI,
        }, state: "ACTIVE", updateTime: new Date() });
    describe("megabytes", () => {
        let Bytes;
        (function (Bytes) {
            Bytes[Bytes["KB"] = 1000] = "KB";
            Bytes[Bytes["MB"] = 1000000] = "MB";
            Bytes[Bytes["GB"] = 1000000000] = "GB";
            Bytes[Bytes["KiB"] = 1024] = "KiB";
            Bytes[Bytes["MiB"] = 1048576] = "MiB";
            Bytes[Bytes["GiB"] = 1073741824] = "GiB";
        })(Bytes || (Bytes = {}));
        it("Should handle decimal SI units", () => {
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1000k")).to.equal((1000 * Bytes.KB) / Bytes.MiB);
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1.5M")).to.equal((1.5 * Bytes.MB) / Bytes.MiB);
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1G")).to.equal(Bytes.GB / Bytes.MiB);
        });
        it("Should handle binary SI units", () => {
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1Mi")).to.equal(Bytes.MiB / Bytes.MiB);
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1Gi")).to.equal(Bytes.GiB / Bytes.MiB);
        });
        it("Should handle no unit", () => {
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("100000")).to.equal(100000 / Bytes.MiB);
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1e9")).to.equal(1e9 / Bytes.MiB);
            (0, chai_1.expect)(cloudfunctionsv2.mebibytes("1.5E6")).to.equal((1.5 * 1e6) / Bytes.MiB);
        });
    });
    describe("functionFromEndpoint", () => {
        it("should guard against version mixing", () => {
            (0, chai_1.expect)(() => {
                cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, platform: "gcfv1" }), CLOUD_FUNCTION_V2_SOURCE);
            }).to.throw();
        });
        it("should copy a minimal function", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", httpsTrigger: {} }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(CLOUD_FUNCTION_V2);
            const eventEndpoint = Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: {
                        resource: "projects/p/regions/r/instances/i",
                        serviceName: "compute.googleapis.com",
                    },
                    retry: false,
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                } });
            const eventGcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: [
                        {
                            attribute: "resource",
                            value: "projects/p/regions/r/instances/i",
                        },
                        {
                            attribute: "serviceName",
                            value: "compute.googleapis.com",
                        },
                    ],
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                }, serviceConfig: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.serviceConfig), { environmentVariables: { FUNCTION_SIGNATURE_TYPE: "cloudevent" } }) });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(eventEndpoint, CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(eventGcfFunction);
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: {
                        instance: "my-db-1",
                    },
                    eventFilterPathPatterns: {
                        path: "foo/{bar}",
                    },
                    retry: false,
                } }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: [
                        {
                            attribute: "instance",
                            value: "my-db-1",
                        },
                        {
                            attribute: "path",
                            value: "foo/{bar}",
                            operator: "match-path-pattern",
                        },
                    ],
                }, serviceConfig: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.serviceConfig), { environmentVariables: { FUNCTION_SIGNATURE_TYPE: "cloudevent" } }) }));
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", taskQueueTrigger: {} }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { "deployment-taskqueue": "true" }) }));
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", blockingTrigger: {
                    eventType: events.v1.BEFORE_CREATE_EVENT,
                } }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { [constants_1.BLOCKING_LABEL]: "before-create" }) }));
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", blockingTrigger: {
                    eventType: events.v1.BEFORE_SIGN_IN_EVENT,
                } }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { [constants_1.BLOCKING_LABEL]: "before-sign-in" }) }));
        });
        it("should copy trival fields", () => {
            const fullEndpoint = Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, platform: "gcfv2", vpc: {
                    connector: "connector",
                    egressSettings: "ALL_TRAFFIC",
                }, ingressSettings: "ALLOW_ALL", serviceAccount: "inlined@google.com", labels: {
                    foo: "bar",
                }, environmentVariables: {
                    FOO: "bar",
                }, secretEnvironmentVariables: [
                    {
                        secret: "MY_SECRET",
                        key: "MY_SECRET",
                        projectId: "project",
                    },
                ] });
            const fullGcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { foo: "bar" }), serviceConfig: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.serviceConfig), { environmentVariables: {
                        FOO: "bar",
                    }, secretEnvironmentVariables: [
                        {
                            secret: "MY_SECRET",
                            key: "MY_SECRET",
                            projectId: "project",
                        },
                    ], vpcConnector: "connector", vpcConnectorEgressSettings: "ALL_TRAFFIC", ingressSettings: "ALLOW_ALL", serviceAccountEmail: "inlined@google.com" }) });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(fullEndpoint, CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(fullGcfFunction);
        });
        it("should calculate non-trivial fields", () => {
            const complexEndpoint = Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    eventFilters: {
                        topic: "projects/p/topics/t",
                        serviceName: "pubsub.googleapis.com",
                    },
                    retry: false,
                }, maxInstances: 42, minInstances: 1, timeoutSeconds: 15, availableMemoryMb: 128 });
            const complexGcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    pubsubTopic: "projects/p/topics/t",
                    eventFilters: [
                        {
                            attribute: "serviceName",
                            value: "pubsub.googleapis.com",
                        },
                    ],
                }, serviceConfig: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.serviceConfig), { maxInstanceCount: 42, minInstanceCount: 1, timeoutSeconds: 15, availableMemory: "128Mi", environmentVariables: { FUNCTION_SIGNATURE_TYPE: "cloudevent" } }) });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(complexEndpoint, CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(complexGcfFunction);
        });
        it("should correctly convert CPU and concurrency values", () => {
            const endpoint = Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", httpsTrigger: {}, concurrency: 40, cpu: 2 });
            const gcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { serviceConfig: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.serviceConfig), { maxInstanceRequestConcurrency: 40, availableCpu: "2" }) });
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(endpoint, CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(gcfFunction);
        });
        it("should export codebase as label", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { codebase: "my-codebase", httpsTrigger: {} }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase" }) }));
        });
        it("should export hash as label", () => {
            (0, chai_1.expect)(cloudfunctionsv2.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { hash: "my-hash", httpsTrigger: {} }), CLOUD_FUNCTION_V2_SOURCE)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { [constants_1.HASH_LABEL]: "my-hash" }) }));
        });
    });
    describe("endpointFromFunction", () => {
        it("should copy a minimal version", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(HAVE_CLOUD_FUNCTION_V2)).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, platform: "gcfv2", uri: RUN_URI }));
        });
        it("should copy run service IDs", () => {
            const fn = Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { serviceConfig: Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2.serviceConfig), { service: "projects/p/locations/l/services/service-id" }) });
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(fn)).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, platform: "gcfv2", uri: RUN_URI, runServiceId: "service-id" }));
        });
        it("should translate event triggers", () => {
            let want = Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", uri: RUN_URI, eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    eventFilters: { topic: "projects/p/topics/t" },
                    retry: false,
                } });
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: events.v2.PUBSUB_PUBLISH_EVENT,
                    pubsubTopic: "projects/p/topics/t",
                } }))).to.deep.equal(want);
            want = Object.assign(Object.assign({}, want), { eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: {
                        resource: "projects/p/regions/r/instances/i",
                        serviceName: "compute.googleapis.com",
                    },
                    retry: false,
                } });
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: "google.cloud.audit.log.v1.written",
                    eventFilters: [
                        {
                            attribute: "resource",
                            value: "projects/p/regions/r/instances/i",
                        },
                        {
                            attribute: "serviceName",
                            value: "compute.googleapis.com",
                        },
                    ],
                } }))).to.deep.equal(want);
            want = Object.assign(Object.assign({}, want), { eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: {
                        instance: "my-db-1",
                    },
                    eventFilterPathPatterns: {
                        path: "foo/{bar}",
                    },
                    retry: false,
                } });
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: "google.firebase.database.ref.v1.written",
                    eventFilters: [
                        {
                            attribute: "instance",
                            value: "my-db-1",
                        },
                        {
                            attribute: "path",
                            value: "foo/{bar}",
                            operator: "match-path-pattern",
                        },
                    ],
                } }))).to.deep.equal(want);
        });
        it("should translate custom event triggers", () => {
            const want = Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", uri: RUN_URI, eventTrigger: {
                    eventType: "com.custom.event",
                    eventFilters: { customattr: "customvalue" },
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                    retry: false,
                } });
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { eventTrigger: {
                    eventType: "com.custom.event",
                    eventFilters: [
                        {
                            attribute: "customattr",
                            value: "customvalue",
                        },
                    ],
                    channel: "projects/myproject/locations/us-wildwest11/channels/mychannel",
                } }))).to.deep.equal(want);
        });
        it("should translate task queue functions", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { labels: { "deployment-taskqueue": "true" } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { taskQueueTrigger: {}, platform: "gcfv2", uri: RUN_URI, labels: { "deployment-taskqueue": "true" } }));
        });
        it("should translate beforeCreate blocking functions", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { labels: { "deployment-blocking": "before-create" } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { blockingTrigger: {
                    eventType: events.v1.BEFORE_CREATE_EVENT,
                }, platform: "gcfv2", uri: RUN_URI, labels: { "deployment-blocking": "before-create" } }));
        });
        it("should translate beforeSignIn blocking functions", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { labels: { "deployment-blocking": "before-sign-in" } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { blockingTrigger: {
                    eventType: events.v1.BEFORE_SIGN_IN_EVENT,
                }, platform: "gcfv2", uri: RUN_URI, labels: { "deployment-blocking": "before-sign-in" } }));
        });
        it("should copy optional fields", () => {
            const extraFields = {
                ingressSettings: "ALLOW_ALL",
                timeoutSeconds: 15,
                environmentVariables: {
                    FOO: "bar",
                },
            };
            const vpc = {
                connector: "connector",
                egressSettings: "ALL_TRAFFIC",
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { serviceConfig: Object.assign(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2.serviceConfig), extraFields), { serviceAccountEmail: "inlined@google.com", vpcConnector: vpc.connector, vpcConnectorEgressSettings: vpc.egressSettings, availableMemory: "128Mi" }), labels: {
                    foo: "bar",
                } }))).to.deep.equal(Object.assign(Object.assign(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", httpsTrigger: {}, uri: RUN_URI }), extraFields), { serviceAccount: "inlined@google.com", vpc, availableMemoryMb: 128, labels: {
                    foo: "bar",
                } }));
        });
        it("should transform fields", () => {
            const extraFields = {
                minInstances: 1,
                maxInstances: 42,
            };
            const extraGcfFields = {
                minInstanceCount: 1,
                maxInstanceCount: 42,
            };
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { serviceConfig: Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2.serviceConfig), extraGcfFields) }))).to.deep.equal(Object.assign(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", uri: RUN_URI, httpsTrigger: {} }), extraFields));
        });
        it("should derive codebase from labels", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase" }) }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", uri: RUN_URI, httpsTrigger: {}, labels: Object.assign(Object.assign({}, ENDPOINT.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase" }), codebase: "my-codebase" }));
        });
        it("should derive hash from labels", () => {
            (0, chai_1.expect)(cloudfunctionsv2.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION_V2), { labels: Object.assign(Object.assign({}, CLOUD_FUNCTION_V2.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase", [constants_1.HASH_LABEL]: "my-hash" }) }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", uri: RUN_URI, httpsTrigger: {}, labels: Object.assign(Object.assign({}, ENDPOINT.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase", [constants_1.HASH_LABEL]: "my-hash" }), codebase: "my-codebase", hash: "my-hash" }));
        });
    });
    describe("listFunctions", () => {
        it("should pass back an error with the correct status", async () => {
            nock(api_1.functionsV2Origin)
                .get("/v2/projects/foo/locations/-/functions")
                .query({ filter: `environment="GEN_2"` })
                .reply(403, { error: "You don't have permissions." });
            let errCaught = false;
            try {
                await cloudfunctionsv2.listFunctions("foo", "-");
            }
            catch (err) {
                errCaught = true;
                (0, chai_1.expect)(err).instanceOf(error_1.FirebaseError);
                (0, chai_1.expect)(err).has.property("status", 403);
            }
            (0, chai_1.expect)(errCaught, "should have caught an error").to.be.true;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=cloudfunctionsv2.spec.js.map