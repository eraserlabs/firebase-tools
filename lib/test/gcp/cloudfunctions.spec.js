"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../../api");
const backend = require("../../deploy/functions/backend");
const v1_1 = require("../../functions/events/v1");
const cloudfunctions = require("../../gcp/cloudfunctions");
const projectConfig = require("../../functions/projectConfig");
const constants_1 = require("../../functions/constants");
const error_1 = require("../../error");
describe("cloudfunctions", () => {
    const FUNCTION_NAME = {
        id: "id",
        region: "region",
        project: "project",
    };
    const ENDPOINT = Object.assign(Object.assign({ platform: "gcfv1" }, FUNCTION_NAME), { entryPoint: "function", runtime: "nodejs16", codebase: projectConfig.DEFAULT_CODEBASE });
    const CLOUD_FUNCTION = {
        name: "projects/project/locations/region/functions/id",
        entryPoint: "function",
        runtime: "nodejs16",
        dockerRegistry: "ARTIFACT_REGISTRY",
    };
    const HAVE_CLOUD_FUNCTION = Object.assign(Object.assign({}, CLOUD_FUNCTION), { buildId: "buildId", versionId: 1, updateTime: new Date(), status: "ACTIVE" });
    before(() => {
        nock.disableNetConnect();
    });
    after(() => {
        (0, chai_1.expect)(nock.isDone()).to.be.true;
        nock.enableNetConnect();
    });
    describe("functionFromEndpoint", () => {
        const UPLOAD_URL = "https://storage.googleapis.com/projects/-/buckets/sample/source.zip";
        it("should guard against version mixing", () => {
            (0, chai_1.expect)(() => {
                cloudfunctions.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", httpsTrigger: {} }), UPLOAD_URL);
            }).to.throw();
        });
        it("should copy a minimal function", () => {
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} }), UPLOAD_URL)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {} }));
            const eventEndpoint = Object.assign(Object.assign({}, ENDPOINT), { eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    eventFilters: { resource: "projects/p/topics/t" },
                    retry: false,
                } });
            const eventGcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: "projects/p/topics/t",
                    failurePolicy: undefined,
                } });
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(eventEndpoint, UPLOAD_URL)).to.deep.equal(eventGcfFunction);
        });
        it("should copy trival fields", () => {
            const fullEndpoint = Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, availableMemoryMb: 128, minInstances: 1, maxInstances: 42, vpc: {
                    connector: "connector",
                    egressSettings: "ALL_TRAFFIC",
                }, ingressSettings: "ALLOW_ALL", serviceAccount: "inlined@google.com", labels: {
                    foo: "bar",
                }, environmentVariables: {
                    FOO: "bar",
                } });
            const fullGcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { foo: "bar" }), environmentVariables: {
                    FOO: "bar",
                }, maxInstances: 42, minInstances: 1, vpcConnector: "connector", vpcConnectorEgressSettings: "ALL_TRAFFIC", ingressSettings: "ALLOW_ALL", availableMemoryMb: 128, serviceAccountEmail: "inlined@google.com" });
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(fullEndpoint, UPLOAD_URL)).to.deep.equal(fullGcfFunction);
        });
        it("should calculate non-trivial fields", () => {
            const complexEndpoint = Object.assign(Object.assign({}, ENDPOINT), { scheduleTrigger: {}, timeoutSeconds: 20 });
            const complexGcfFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: `projects/project/topics/${backend.scheduleIdForFunction(FUNCTION_NAME)}`,
                }, timeout: "20s", labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { "deployment-scheduled": "true" }) });
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(complexEndpoint, UPLOAD_URL)).to.deep.equal(complexGcfFunction);
        });
        it("detects task queue functions", () => {
            const taskEndpoint = Object.assign(Object.assign({}, ENDPOINT), { taskQueueTrigger: {} });
            const taskQueueFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { "deployment-taskqueue": "true" }) });
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(taskEndpoint, UPLOAD_URL)).to.deep.equal(taskQueueFunction);
        });
        it("detects beforeCreate blocking functions", () => {
            const blockingEndpoint = Object.assign(Object.assign({}, ENDPOINT), { blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                } });
            const blockingFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { [constants_1.BLOCKING_LABEL]: "before-create" }) });
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(blockingEndpoint, UPLOAD_URL)).to.deep.equal(blockingFunction);
        });
        it("detects beforeSignIn blocking functions", () => {
            const blockingEndpoint = Object.assign(Object.assign({}, ENDPOINT), { blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                } });
            const blockingFunction = Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { [constants_1.BLOCKING_LABEL]: "before-sign-in" }) });
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(blockingEndpoint, UPLOAD_URL)).to.deep.equal(blockingFunction);
        });
        it("should export codebase as label", () => {
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { codebase: "my-codebase", httpsTrigger: {} }), UPLOAD_URL)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase" }) }));
        });
        it("should export hash as label", () => {
            (0, chai_1.expect)(cloudfunctions.functionFromEndpoint(Object.assign(Object.assign({}, ENDPOINT), { hash: "my-hash", httpsTrigger: {} }), UPLOAD_URL)).to.deep.equal(Object.assign(Object.assign({}, CLOUD_FUNCTION), { sourceUploadUrl: UPLOAD_URL, httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { [constants_1.HASH_LABEL]: "my-hash" }) }));
        });
    });
    describe("endpointFromFunction", () => {
        it("should copy a minimal version", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {} }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} }));
        });
        it("should translate event triggers", () => {
            let want = Object.assign(Object.assign({}, ENDPOINT), { eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    eventFilters: { resource: "projects/p/topics/t" },
                    retry: true,
                } });
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: "projects/p/topics/t",
                    failurePolicy: {
                        retry: {},
                    },
                } }))).to.deep.equal(want);
            want = Object.assign(Object.assign({}, want), { eventTrigger: Object.assign(Object.assign({}, want.eventTrigger), { retry: false }) });
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: "projects/p/topics/t",
                } }))).to.deep.equal(want);
        });
        it("should translate scheduled triggers", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: "projects/p/topics/t",
                    failurePolicy: {
                        retry: {},
                    },
                }, labels: {
                    "deployment-scheduled": "true",
                } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { scheduleTrigger: {}, labels: {
                    "deployment-scheduled": "true",
                } }));
        });
        it("should translate task queue triggers", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {}, labels: {
                    "deployment-taskqueue": "true",
                } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { taskQueueTrigger: {}, labels: {
                    "deployment-taskqueue": "true",
                } }));
        });
        it("should translate beforeCreate blocking triggers", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {}, labels: {
                    "deployment-blocking": "before-create",
                } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                }, labels: {
                    "deployment-blocking": "before-create",
                } }));
        });
        it("should translate beforeSignIn blocking triggers", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {}, labels: {
                    "deployment-blocking": "before-sign-in",
                } }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                }, labels: {
                    "deployment-blocking": "before-sign-in",
                } }));
        });
        it("should copy optional fields", () => {
            const wantExtraFields = {
                availableMemoryMb: 128,
                minInstances: 1,
                maxInstances: 42,
                ingressSettings: "ALLOW_ALL",
                serviceAccount: "inlined@google.com",
                timeoutSeconds: 15,
                labels: {
                    foo: "bar",
                },
                environmentVariables: {
                    FOO: "bar",
                },
            };
            const haveExtraFields = {
                availableMemoryMb: 128,
                minInstances: 1,
                maxInstances: 42,
                ingressSettings: "ALLOW_ALL",
                serviceAccountEmail: "inlined@google.com",
                timeout: "15s",
                labels: {
                    foo: "bar",
                },
                environmentVariables: {
                    FOO: "bar",
                },
            };
            const vpcConnector = "connector";
            const vpcConnectorEgressSettings = "ALL_TRAFFIC";
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), haveExtraFields), { vpcConnector,
                vpcConnectorEgressSettings, httpsTrigger: {} }))).to.deep.equal(Object.assign(Object.assign(Object.assign({}, ENDPOINT), wantExtraFields), { vpc: {
                    connector: vpcConnector,
                    egressSettings: vpcConnectorEgressSettings,
                }, httpsTrigger: {} }));
        });
        it("should derive codebase from labels", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase" }) }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, labels: Object.assign(Object.assign({}, ENDPOINT.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase" }), codebase: "my-codebase" }));
        });
        it("should derive hash from labels", () => {
            (0, chai_1.expect)(cloudfunctions.endpointFromFunction(Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {}, labels: Object.assign(Object.assign({}, CLOUD_FUNCTION.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase", [constants_1.HASH_LABEL]: "my-hash" }) }))).to.deep.equal(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {}, labels: Object.assign(Object.assign({}, ENDPOINT.labels), { [constants_1.CODEBASE_LABEL]: "my-codebase", [constants_1.HASH_LABEL]: "my-hash" }), codebase: "my-codebase", hash: "my-hash" }));
        });
    });
    describe("setInvokerCreate", () => {
        it("should reject on emtpy invoker array", async () => {
            await (0, chai_1.expect)(cloudfunctions.setInvokerCreate("project", "function", [])).to.be.rejected;
        });
        it("should reject if the setting the IAM policy fails", async () => {
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [{ role: "roles/cloudfunctions.invoker", members: ["allUsers"] }],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(418, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerCreate("project", "function", ["public"])).to.be.rejectedWith("Failed to set the IAM Policy on the function function");
        });
        it("should set a private policy on a function", async () => {
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [{ role: "roles/cloudfunctions.invoker", members: [] }],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(200, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerCreate("project", "function", ["private"])).to.not.be
                .rejected;
        });
        it("should set a public policy on a function", async () => {
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [{ role: "roles/cloudfunctions.invoker", members: ["allUsers"] }],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(200, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerCreate("project", "function", ["public"])).to.not.be
                .rejected;
        });
        it("should set the policy with a set of invokers with active policies", async () => {
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [
                        {
                            role: "roles/cloudfunctions.invoker",
                            members: [
                                "serviceAccount:service-account1@project.iam.gserviceaccount.com",
                                "serviceAccount:service-account2@project.iam.gserviceaccount.com",
                                "serviceAccount:service-account3@project.iam.gserviceaccount.com",
                            ],
                        },
                    ],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(200, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerCreate("project", "function", [
                "service-account1@",
                "service-account2@project.iam.gserviceaccount.com",
                "service-account3@",
            ])).to.not.be.rejected;
        });
    });
    describe("setInvokerUpdate", () => {
        it("should reject on emtpy invoker array", async () => {
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", [])).to.be.rejected;
        });
        it("should reject if the getting the IAM policy fails", async () => {
            nock(api_1.functionsOrigin).get("/v1/function:getIamPolicy").reply(404, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", ["public"])).to.be.rejectedWith("Failed to get the IAM Policy on the function function");
        });
        it("should reject if the setting the IAM policy fails", async () => {
            nock(api_1.functionsOrigin).get("/v1/function:getIamPolicy").reply(200, {});
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [{ role: "roles/cloudfunctions.invoker", members: ["allUsers"] }],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(418, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", ["public"])).to.be.rejectedWith("Failed to set the IAM Policy on the function function");
        });
        it("should set a basic policy on a function without any polices", async () => {
            nock(api_1.functionsOrigin).get("/v1/function:getIamPolicy").reply(200, {});
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [{ role: "roles/cloudfunctions.invoker", members: ["allUsers"] }],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(200, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", ["public"])).to.not.be
                .rejected;
        });
        it("should set the policy with private invoker with active policies", async () => {
            nock(api_1.functionsOrigin)
                .get("/v1/function:getIamPolicy")
                .reply(200, {
                bindings: [
                    { role: "random-role", members: ["user:pineapple"] },
                    { role: "roles/cloudfunctions.invoker", members: ["some-service-account"] },
                ],
                etag: "1234",
                version: 3,
            });
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [
                        { role: "random-role", members: ["user:pineapple"] },
                        { role: "roles/cloudfunctions.invoker", members: [] },
                    ],
                    etag: "1234",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(200, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", ["private"])).to.not.be
                .rejected;
        });
        it("should set the policy with a set of invokers with active policies", async () => {
            nock(api_1.functionsOrigin).get("/v1/function:getIamPolicy").reply(200, {});
            nock(api_1.functionsOrigin)
                .post("/v1/function:setIamPolicy", {
                policy: {
                    bindings: [
                        {
                            role: "roles/cloudfunctions.invoker",
                            members: [
                                "serviceAccount:service-account1@project.iam.gserviceaccount.com",
                                "serviceAccount:service-account2@project.iam.gserviceaccount.com",
                                "serviceAccount:service-account3@project.iam.gserviceaccount.com",
                            ],
                        },
                    ],
                    etag: "",
                    version: 3,
                },
                updateMask: "bindings,etag,version",
            })
                .reply(200, {});
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", [
                "service-account1@",
                "service-account2@project.iam.gserviceaccount.com",
                "service-account3@",
            ])).to.not.be.rejected;
        });
        it("should not set the policy if the set of invokers is the same as the current invokers", async () => {
            nock(api_1.functionsOrigin)
                .get("/v1/function:getIamPolicy")
                .reply(200, {
                bindings: [
                    {
                        role: "roles/cloudfunctions.invoker",
                        members: [
                            "serviceAccount:service-account1@project.iam.gserviceaccount.com",
                            "serviceAccount:service-account3@project.iam.gserviceaccount.com",
                            "serviceAccount:service-account2@project.iam.gserviceaccount.com",
                        ],
                    },
                ],
                etag: "1234",
                version: 3,
            });
            await (0, chai_1.expect)(cloudfunctions.setInvokerUpdate("project", "function", [
                "service-account2@project.iam.gserviceaccount.com",
                "service-account3@",
                "service-account1@",
            ])).to.not.be.rejected;
        });
    });
    describe("listFunctions", () => {
        it("should pass back an error with the correct status", async () => {
            nock(api_1.functionsOrigin)
                .get("/v1/projects/foo/locations/-/functions")
                .reply(403, { error: "You don't have permissions." });
            let errCaught = false;
            try {
                await cloudfunctions.listFunctions("foo", "-");
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
//# sourceMappingURL=cloudfunctions.spec.js.map