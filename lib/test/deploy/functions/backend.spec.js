"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../../error");
const backend = require("../../../deploy/functions/backend");
const gcf = require("../../../gcp/cloudfunctions");
const gcfV2 = require("../../../gcp/cloudfunctionsv2");
const run = require("../../../gcp/run");
const utils = require("../../../utils");
const projectConfig = require("../../../functions/projectConfig");
describe("Backend", () => {
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
    };
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
            service: "projects/project/locations/region/services/service",
        },
    };
    const CLOUD_RUN_SERVICE = {
        apiVersion: "serving.knative.dev/v1",
        kind: "Service",
        metadata: {
            name: "service",
            namespace: "projectnumber",
        },
        spec: {
            template: {
                spec: {
                    containerConcurrency: 80,
                    containers: [
                        {
                            image: "image",
                            ports: [
                                {
                                    name: "main",
                                    containerPort: 8080,
                                },
                            ],
                            env: {},
                            resources: {
                                limits: {
                                    memory: "256MiB",
                                    cpu: "1",
                                },
                            },
                        },
                    ],
                },
                metadata: {
                    name: "service",
                    namespace: "project",
                },
            },
            traffic: [],
        },
    };
    const RUN_URI = "https://id-nonce-region-project.run.app";
    const HAVE_CLOUD_FUNCTION_V2 = Object.assign(Object.assign({}, CLOUD_FUNCTION_V2), { serviceConfig: {
            uri: RUN_URI,
        }, state: "ACTIVE", updateTime: new Date() });
    const HAVE_CLOUD_FUNCTION = Object.assign(Object.assign({}, CLOUD_FUNCTION), { buildId: "buildId", versionId: 1, updateTime: new Date(), status: "ACTIVE" });
    describe("Helper functions", () => {
        it("isEmptyBackend", () => {
            (0, chai_1.expect)(backend.isEmptyBackend(backend.empty())).to.be.true;
            (0, chai_1.expect)(backend.isEmptyBackend(Object.assign(Object.assign({}, backend.empty()), { requiredAPIs: [{ api: "foo.googleapis.com", reason: "foo" }] }))).to.be.false;
            (0, chai_1.expect)(backend.isEmptyBackend(backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} }))));
        });
        it("names", () => {
            (0, chai_1.expect)(backend.functionName(ENDPOINT)).to.equal("projects/project/locations/region/functions/id");
        });
        it("merge", () => {
            const BASE_ENDPOINT = Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} });
            const e1 = Object.assign(Object.assign({}, BASE_ENDPOINT), { id: "1" });
            const e21 = Object.assign(Object.assign({}, BASE_ENDPOINT), { id: "2.1" });
            const e22 = Object.assign(Object.assign({}, BASE_ENDPOINT), { id: "2.2" });
            const e3 = Object.assign(Object.assign({}, BASE_ENDPOINT), { id: "3" });
            const b1 = backend.of(e1);
            b1.environmentVariables = { foo: "bar" };
            b1.requiredAPIs = [
                { reason: "a", api: "a.com" },
                { reason: "b", api: "b.com" },
            ];
            const b2 = backend.of(e21, e22);
            b2.environmentVariables = { bar: "foo" };
            const b3 = backend.of(e3);
            b3.requiredAPIs = [{ reason: "a", api: "a.com" }];
            const got = backend.merge(b3, b2, b1);
            (0, chai_1.expect)(backend.allEndpoints(got)).to.have.deep.members([e1, e21, e22, e3]);
            (0, chai_1.expect)(got.environmentVariables).to.deep.equal({ foo: "bar", bar: "foo" });
            (0, chai_1.expect)(got.requiredAPIs).to.have.deep.members([
                { reason: "a", api: "a.com" },
                { reason: "b", api: "b.com" },
            ]);
        });
    });
    describe("existing backend", () => {
        let listAllFunctions;
        let listAllFunctionsV2;
        let logLabeledWarning;
        let getService;
        beforeEach(() => {
            listAllFunctions = sinon.stub(gcf, "listAllFunctions").rejects("Unexpected call");
            listAllFunctionsV2 = sinon.stub(gcfV2, "listAllFunctions").rejects("Unexpected v2 call");
            logLabeledWarning = sinon.spy(utils, "logLabeledWarning");
            getService = sinon.stub(run, "getService").rejects("Unexpected call to getService");
        });
        afterEach(() => {
            listAllFunctions.restore();
            listAllFunctionsV2.restore();
            logLabeledWarning.restore();
            getService.restore();
        });
        function newContext() {
            return {};
        }
        describe("existingBackend", () => {
            it("should throw error when functions list fails", async () => {
                const context = newContext();
                listAllFunctions.rejects(new error_1.FirebaseError("Failed to list functions"));
                await (0, chai_1.expect)(backend.existingBackend(context)).to.be.rejected;
            });
            it("should cache", async () => {
                const context = newContext();
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {} }),
                    ],
                    unreachable: ["region"],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const firstBackend = await backend.existingBackend(context);
                const secondBackend = await backend.existingBackend(context);
                await backend.checkAvailability(context, backend.empty());
                (0, chai_1.expect)(firstBackend).to.deep.equal(secondBackend);
                (0, chai_1.expect)(listAllFunctions).to.be.calledOnce;
                (0, chai_1.expect)(listAllFunctionsV2).to.be.calledOnce;
            });
            it("should translate functions", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {} }),
                    ],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const have = await backend.existingBackend(newContext());
                (0, chai_1.expect)(have).to.deep.equal(backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} })));
            });
            it("should throw an error if v2 list api throws an error", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.throws(new error_1.FirebaseError("HTTP Error: 500, Internal Error", { status: 500 }));
                await (0, chai_1.expect)(backend.existingBackend(newContext())).to.be.rejectedWith("HTTP Error: 500, Internal Error");
            });
            it("should read v1 functions only when user is not allowlisted for v2", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {} }),
                    ],
                    unreachable: [],
                });
                listAllFunctionsV2.throws(new error_1.FirebaseError("HTTP Error: 404, Method not found", { status: 404 }));
                const have = await backend.existingBackend(newContext());
                (0, chai_1.expect)(have).to.deep.equal(backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} })));
            });
            it("should throw an error if v2 list api throws an error", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.throws(new error_1.FirebaseError("HTTP Error: 500, Internal Error", { status: 500 }));
                await (0, chai_1.expect)(backend.existingBackend(newContext())).to.be.rejectedWith("HTTP Error: 500, Internal Error");
            });
            it("should read v1 functions only when user is not allowlisted for v2", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { httpsTrigger: {} }),
                    ],
                    unreachable: [],
                });
                listAllFunctionsV2.throws(new error_1.FirebaseError("HTTP Error: 404, Method not found", { status: 404 }));
                const have = await backend.existingBackend(newContext());
                (0, chai_1.expect)(have).to.deep.equal(backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} })));
            });
            it("should read v2 functions when enabled", async () => {
                getService
                    .withArgs(HAVE_CLOUD_FUNCTION_V2.serviceConfig.service)
                    .resolves(CLOUD_RUN_SERVICE);
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [HAVE_CLOUD_FUNCTION_V2],
                    unreachable: [],
                });
                const have = await backend.existingBackend(newContext());
                (0, chai_1.expect)(have).to.deep.equal(backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", concurrency: 80, cpu: 1, httpsTrigger: {}, uri: HAVE_CLOUD_FUNCTION_V2.serviceConfig.uri })));
                (0, chai_1.expect)(getService).to.have.been.called;
            });
            it("should deduce features of scheduled functions", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [
                        Object.assign(Object.assign({}, HAVE_CLOUD_FUNCTION), { eventTrigger: {
                                eventType: "google.pubsub.topic.publish",
                                resource: "projects/project/topics/topic",
                            }, labels: {
                                "deployment-scheduled": "true",
                            } }),
                    ],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const have = await backend.existingBackend(newContext());
                const want = backend.of(Object.assign(Object.assign({}, ENDPOINT), { scheduleTrigger: {}, labels: {
                        "deployment-scheduled": "true",
                    } }));
                (0, chai_1.expect)(have).to.deep.equal(want);
            });
        });
        describe("checkAvailability", () => {
            it("should throw error when functions list fails", async () => {
                const context = newContext();
                listAllFunctions.rejects(new error_1.FirebaseError("Failed to list functions"));
                await (0, chai_1.expect)(backend.checkAvailability(context, backend.empty())).to.be.rejected;
            });
            it("should do nothing when regions are all avalable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                await backend.checkAvailability(newContext(), backend.empty());
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.not.have.been.called;
            });
            it("should warn if an unused GCFv1 backend is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                listAllFunctionsV2.resolves({
                    functions: [],
                    unreachable: [],
                });
                await backend.checkAvailability(newContext(), backend.empty());
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
            it("should warn if an unused GCFv2 backend is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                await backend.checkAvailability(newContext(), backend.empty());
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
            it("should throw if a needed GCFv1 region is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                listAllFunctionsV2.resolves({
                    functions: [],
                    unreachable: [],
                });
                const want = backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} }));
                await (0, chai_1.expect)(backend.checkAvailability(newContext(), want)).to.eventually.be.rejectedWith(error_1.FirebaseError, /The following Cloud Functions regions are currently unreachable:/);
            });
            it("should throw if a GCFv2 needed region is unavailable", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["region"],
                });
                const want = backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2", httpsTrigger: {} }));
                await (0, chai_1.expect)(backend.checkAvailability(newContext(), want)).to.eventually.be.rejectedWith(error_1.FirebaseError, /The following Cloud Functions V2 regions are currently unreachable:/);
            });
            it("Should only warn when deploying GCFv1 and GCFv2 is unavailable.", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["us-central1"],
                });
                const want = backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} }));
                await backend.checkAvailability(newContext(), want);
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
            it("Should only warn when deploying GCFv2 and GCFv1 is unavailable.", async () => {
                listAllFunctions.onFirstCall().resolves({
                    functions: [],
                    unreachable: ["us-central1"],
                });
                listAllFunctionsV2.onFirstCall().resolves({
                    functions: [],
                    unreachable: [],
                });
                const want = backend.of(Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {} }));
                await backend.checkAvailability(newContext(), want);
                (0, chai_1.expect)(listAllFunctions).to.have.been.called;
                (0, chai_1.expect)(listAllFunctionsV2).to.have.been.called;
                (0, chai_1.expect)(logLabeledWarning).to.have.been.called;
            });
        });
    });
    describe("compareFunctions", () => {
        const fnMembers = {
            project: "project",
            runtime: "nodejs14",
            httpsTrigger: {},
        };
        it("should compare different platforms", () => {
            const left = Object.assign({ id: "v1", region: "us-central1", platform: "gcfv1", entryPoint: "v1" }, fnMembers);
            const right = Object.assign({ id: "v2", region: "us-west1", platform: "gcfv2", entryPoint: "v2" }, fnMembers);
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(1);
            (0, chai_1.expect)(backend.compareFunctions(right, left)).to.eq(-1);
        });
        it("should compare different regions, same platform", () => {
            const left = Object.assign({ id: "v1", region: "us-west1", platform: "gcfv1", entryPoint: "v1" }, fnMembers);
            const right = Object.assign({ id: "newV1", region: "us-central1", platform: "gcfv1", entryPoint: "newV1" }, fnMembers);
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(1);
            (0, chai_1.expect)(backend.compareFunctions(right, left)).to.eq(-1);
        });
        it("should compare different ids, same platform & region", () => {
            const left = Object.assign({ id: "v1", region: "us-central1", platform: "gcfv1", entryPoint: "v1" }, fnMembers);
            const right = Object.assign({ id: "newV1", region: "us-central1", platform: "gcfv1", entryPoint: "newV1" }, fnMembers);
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(1);
            (0, chai_1.expect)(backend.compareFunctions(right, left)).to.eq(-1);
        });
        it("should compare same ids", () => {
            const left = Object.assign({ id: "v1", region: "us-central1", platform: "gcfv1", entryPoint: "v1" }, fnMembers);
            const right = Object.assign({ id: "v1", region: "us-central1", platform: "gcfv1", entryPoint: "v1" }, fnMembers);
            (0, chai_1.expect)(backend.compareFunctions(left, right)).to.eq(0);
        });
    });
    describe("comprehension helpers", () => {
        const endpointUS = {
            id: "endpointUS",
            project: "project",
            region: "us-west1",
            platform: "gcfv2",
            runtime: "nodejs16",
            entryPoint: "ep",
            httpsTrigger: {},
        };
        const endpointEU = Object.assign(Object.assign({}, endpointUS), { id: "endpointEU", region: "europe-west1" });
        const bkend = Object.assign({}, backend.empty());
        bkend.endpoints[endpointUS.region] = { [endpointUS.id]: endpointUS };
        bkend.endpoints[endpointEU.region] = { [endpointEU.id]: endpointEU };
        bkend.requiredAPIs = [{ api: "api.google.com", reason: "required" }];
        it("allEndpoints", () => {
            const have = backend.allEndpoints(bkend).sort(backend.compareFunctions);
            const want = [endpointUS, endpointEU].sort(backend.compareFunctions);
            (0, chai_1.expect)(have).to.deep.equal(want);
        });
        it("matchingBackend", () => {
            const have = backend.matchingBackend(bkend, (fn) => fn.id === "endpointUS");
            const want = Object.assign(Object.assign({}, backend.empty()), { endpoints: {
                    [endpointUS.region]: {
                        [endpointUS.id]: endpointUS,
                    },
                }, requiredAPIs: [{ api: "api.google.com", reason: "required" }] });
            (0, chai_1.expect)(have).to.deep.equal(want);
        });
        it("someEndpoint", () => {
            (0, chai_1.expect)(backend.someEndpoint(bkend, (fn) => fn.id === "endpointUS")).to.be.true;
            (0, chai_1.expect)(backend.someEndpoint(bkend, (fn) => fn.id === "missing")).to.be.false;
        });
        it("findEndpoint", () => {
            (0, chai_1.expect)(backend.findEndpoint(bkend, (fn) => fn.id === "endpointUS")).to.be.deep.equal(endpointUS);
            (0, chai_1.expect)(backend.findEndpoint(bkend, (fn) => fn.id === "missing")).to.be.undefined;
        });
        it("regionalEndpoints", () => {
            const have = backend.regionalEndpoints(bkend, endpointUS.region);
            const want = [endpointUS];
            (0, chai_1.expect)(have).to.deep.equal(want);
        });
        it("hasEndpoint", () => {
            const smallBackend = backend.matchingBackend(bkend, (fn) => fn.id === "endpointUS");
            (0, chai_1.expect)(backend.hasEndpoint(smallBackend)(endpointUS)).to.be.true;
            (0, chai_1.expect)(backend.hasEndpoint(smallBackend)(endpointEU)).to.be.false;
        });
        it("missingEndpoint", () => {
            const smallBackend = backend.matchingBackend(bkend, (fn) => fn.id === "endpointUS");
            (0, chai_1.expect)(backend.missingEndpoint(smallBackend)(endpointUS)).to.be.false;
            (0, chai_1.expect)(backend.missingEndpoint(smallBackend)(endpointEU)).to.be.true;
        });
    });
});
//# sourceMappingURL=backend.spec.js.map