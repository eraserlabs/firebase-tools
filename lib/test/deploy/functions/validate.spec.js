"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../../error");
const fsutils = require("../../../fsutils");
const validate = require("../../../deploy/functions/validate");
const projectPath = require("../../../projectPath");
const secretManager = require("../../../gcp/secretManager");
const backend = require("../../../deploy/functions/backend");
const v1_1 = require("../../../functions/events/v1");
const prepare_1 = require("../../../deploy/functions/prepare");
describe("validate", () => {
    describe("functionsDirectoryExists", () => {
        const sandbox = sinon.createSandbox();
        let resolvePpathStub;
        let dirExistsStub;
        beforeEach(() => {
            resolvePpathStub = sandbox.stub(projectPath, "resolveProjectPath");
            dirExistsStub = sandbox.stub(fsutils, "dirExistsSync");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should not throw error if functions directory is present", () => {
            resolvePpathStub.returns("some/path/to/project");
            dirExistsStub.returns(true);
            (0, chai_1.expect)(() => {
                validate.functionsDirectoryExists("/cwd/sourceDirName", "/cwd");
            }).to.not.throw();
        });
        it("should throw error if the functions directory does not exist", () => {
            resolvePpathStub.returns("some/path/to/project");
            dirExistsStub.returns(false);
            (0, chai_1.expect)(() => {
                validate.functionsDirectoryExists("/cwd/sourceDirName", "/cwd");
            }).to.throw(error_1.FirebaseError);
        });
    });
    describe("functionNamesAreValid", () => {
        it("should allow properly formatted function names", () => {
            const functions = [
                {
                    id: "my-function-1",
                },
                {
                    id: "my-function-2",
                },
            ];
            (0, chai_1.expect)(() => {
                validate.functionIdsAreValid(functions);
            }).to.not.throw();
        });
        it("should throw error on improperly formatted function names", () => {
            const functions = [
                {
                    id: "my-function-!@#$%",
                    platform: "gcfv1",
                },
                {
                    id: "my-function-!@#$!@#",
                    platform: "gcfv1",
                },
            ];
            (0, chai_1.expect)(() => {
                validate.functionIdsAreValid(functions);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw error if some function names are improperly formatted", () => {
            const functions = [
                {
                    id: "my-function$%#",
                    platform: "gcfv1",
                },
                {
                    id: "my-function-2",
                    platform: "gcfv2",
                },
            ];
            (0, chai_1.expect)(() => {
                validate.functionIdsAreValid(functions);
            }).to.throw(error_1.FirebaseError);
        });
        it.skip("should throw error on empty function names", () => {
            const functions = [{ id: "", platform: "gcfv1" }];
            (0, chai_1.expect)(() => {
                validate.functionIdsAreValid(functions);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw error on capital letters in v2 function names", () => {
            const functions = [{ id: "Hi", platform: "gcfv2" }];
            (0, chai_1.expect)(() => {
                validate.functionIdsAreValid(functions);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw error on underscores in v2 function names", () => {
            const functions = [{ id: "o_O", platform: "gcfv2" }];
            (0, chai_1.expect)(() => {
                validate.functionIdsAreValid(functions);
            }).to.throw(error_1.FirebaseError);
        });
    });
    describe("endpointsAreValid", () => {
        const ENDPOINT_BASE = {
            platform: "gcfv2",
            id: "id",
            region: "us-east1",
            project: "project",
            entryPoint: "func",
            runtime: "nodejs16",
            httpsTrigger: {},
        };
        it("disallows concurrency for GCF gen 1", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv1", availableMemoryMb: 256, concurrency: 2 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/GCF gen 1/);
        });
        it("Disallows concurrency for low-CPU gen 2", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", cpu: 1 / 6, concurrency: 2 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/concurrent execution and less than one full CPU/);
        });
        for (const [mem, cpu] of [
            [undefined, undefined],
            [undefined, "gcf_gen1"],
            [128, 0.1],
            [512, 0.5],
            [512, 1],
            [512, 2],
            [2048, 4],
            [4096, 6],
            [4096, 8],
        ]) {
            it(`does not throw for valid CPU ${cpu !== null && cpu !== void 0 ? cpu : "undefined"}`, () => {
                const want = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", cpu, availableMemoryMb: mem }));
                (0, chai_1.expect)(() => validate.endpointsAreValid(want)).to.not.throw();
            });
        }
        it("throws for gcfv1 with CPU", () => {
            const want = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv1", cpu: 1 }));
            (0, chai_1.expect)(() => validate.endpointsAreValid(want)).to.throw();
        });
        for (const region of ["australia-southeast2", "asia-northeast3", "asia-south2"]) {
            it("disallows large CPU in low-CPU region" + region, () => {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", region, cpu: 6, availableMemoryMb: 2048 });
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/have > 4 CPU in a region that supports a maximum 4 CPU/);
            });
        }
        for (const [mem, cpu] of [
            [128, 0.08],
            [512, 0.5],
            [1024, 1],
            [2048, 2],
            [2048, 4],
            [4096, 6],
            [4096, 8],
            [1024, "gcf_gen1"],
        ]) {
            it(`allows valid CPU size ${cpu}`, () => {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", region: "us-west1", cpu: cpu, availableMemoryMb: mem });
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.not.throw();
            });
        }
        for (const [mem, cpu] of [
            [128, 0.07],
            [512, 1.1],
            [1024, 3],
            [2048, 5],
            [2048, 7],
            [4096, 9],
        ]) {
            it(`disallows CPU size ${cpu}`, () => {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", cpu, availableMemoryMb: mem });
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/Valid CPU options are \(0.08, 1], 2, 4, 6, 8, or "gcf_gen1"/);
            });
        }
        it("disallows tiny CPU with large memory", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", cpu: 0.49, availableMemoryMb: 1024 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/A minimum of 0.5 CPU is needed to set a memory limit greater than 512MiB/);
        });
        it("disallows small CPU with huge memory", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", cpu: 0.99, availableMemoryMb: 2048 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/A minimum of 1 CPU is needed to set a memory limit greater than 1GiB/);
        });
        for (const [mem, cpu] of [
            [1024, 4],
            [2048, 6],
            [2048, 8],
        ]) {
            it(`enforces minimum memory for ${cpu} CPU`, () => {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", cpu, availableMemoryMb: mem });
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/too little memory for their CPU/);
            });
        }
        for (const mem of [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]) {
            it(`allows gcfv2 endpoints with mem ${mem} and no cpu`, () => {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", availableMemoryMb: mem });
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.not.throw();
            });
        }
        it("allows endpoints with no mem and no concurrency", () => {
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ENDPOINT_BASE))).to.not.throw();
        });
        it("allows endpoints with mem and no concurrency", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { availableMemoryMb: 256 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.not.throw();
        });
        it("allows explicitly one concurrent", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { concurrency: 1 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.not.throw();
        });
        it("allows endpoints with enough mem and no concurrency", () => {
            for (const mem of [2 << 10, 4 << 10, 8 << 10]) {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { availableMemoryMb: mem, cpu: "gcf_gen1" });
                (0, prepare_1.resolveCpuAndConcurrency)(backend.of(ep));
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.not.throw;
            }
        });
        it("allows endpoints with enough mem and explicit concurrency", () => {
            for (const mem of [2 << 10, 4 << 10, 8 << 10]) {
                const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { availableMemoryMb: mem, cpu: "gcf_gen1", concurrency: 42 });
                (0, prepare_1.resolveCpuAndConcurrency)(backend.of(ep));
                (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.not.throw;
            }
        });
        it("disallows concurrency with too little memory (implicit)", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { availableMemoryMb: 256, concurrency: 2, cpu: "gcf_gen1" });
            (0, prepare_1.resolveCpuAndConcurrency)(backend.of(ep));
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/concurrent execution and less than one full CPU/);
        });
        it("Disallows concurrency with too little cpu (explicit)", () => {
            const ep = Object.assign(Object.assign({}, ENDPOINT_BASE), { concurrency: 2, cpu: 0.5 });
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep))).to.throw(/concurrent execution and less than one full CPU/);
        });
        it("disallows multiple beforeCreate blocking", () => {
            const ep1 = {
                platform: "gcfv1",
                id: "id1",
                region: "us-east1",
                project: "project",
                entryPoint: "func1",
                runtime: "nodejs16",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                },
            };
            const ep2 = {
                platform: "gcfv1",
                id: "id2",
                region: "us-east1",
                project: "project",
                entryPoint: "func2",
                runtime: "nodejs16",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                },
            };
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep1, ep2))).to.throw(`Can only create at most one Auth Blocking Trigger for ${v1_1.BEFORE_CREATE_EVENT} events`);
        });
        it("disallows multiple beforeSignIn blocking", () => {
            const ep1 = {
                platform: "gcfv1",
                id: "id1",
                region: "us-east1",
                project: "project",
                entryPoint: "func1",
                runtime: "nodejs16",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                },
            };
            const ep2 = {
                platform: "gcfv1",
                id: "id2",
                region: "us-east1",
                project: "project",
                entryPoint: "func2",
                runtime: "nodejs16",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                },
            };
            (0, chai_1.expect)(() => validate.endpointsAreValid(backend.of(ep1, ep2))).to.throw(`Can only create at most one Auth Blocking Trigger for ${v1_1.BEFORE_SIGN_IN_EVENT} events`);
        });
        it("Allows valid blocking functions", () => {
            const ep1 = {
                platform: "gcfv1",
                id: "id1",
                region: "us-east1",
                project: "project",
                entryPoint: "func1",
                runtime: "nodejs16",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                    },
                },
            };
            const ep2 = {
                platform: "gcfv1",
                id: "id2",
                region: "us-east1",
                project: "project",
                entryPoint: "func2",
                runtime: "nodejs16",
                blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: true,
                    },
                },
            };
            const want = Object.assign({}, backend.of(ep1, ep2));
            (0, chai_1.expect)(() => validate.endpointsAreValid(want)).to.not.throw();
        });
    });
    describe("endpointsAreUnqiue", () => {
        const ENDPOINT_BASE = {
            platform: "gcfv2",
            id: "id",
            region: "us-east1",
            project: "project",
            entryPoint: "func",
            runtime: "nodejs16",
            httpsTrigger: {},
        };
        it("passes given unqiue ids", () => {
            const b1 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }), Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i2", region: "r1" }));
            const b2 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i3", region: "r2" }), Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i4", region: "r2" }));
            (0, chai_1.expect)(() => validate.endpointsAreUnique({ b1, b2 })).to.not.throw();
        });
        it("passes given unique id, region pairs", () => {
            const b1 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }), Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i2", region: "r1" }));
            const b2 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r2" }), Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i2", region: "r2" }));
            (0, chai_1.expect)(() => validate.endpointsAreUnique({ b1, b2 })).to.not.throw();
        });
        it("throws given non-unique id region pairs", () => {
            const b1 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }));
            const b2 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }));
            (0, chai_1.expect)(() => validate.endpointsAreUnique({ b1, b2 })).to.throw(/projects\/project\/locations\/r1\/functions\/i1: b1,b2/);
        });
        it("throws given non-unique id region pairs across all codebases", () => {
            const b1 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }));
            const b2 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }));
            const b3 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }));
            (0, chai_1.expect)(() => validate.endpointsAreUnique({ b1, b2, b3 })).to.throw(/projects\/project\/locations\/r1\/functions\/i1: b1,b2,b3/);
        });
        it("throws given multiple conflicts", () => {
            const b1 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }), Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i2", region: "r2" }));
            const b2 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i1", region: "r1" }));
            const b3 = backend.of(Object.assign(Object.assign({}, ENDPOINT_BASE), { id: "i2", region: "r2" }));
            (0, chai_1.expect)(() => validate.endpointsAreUnique({ b1, b2, b3 })).to.throw(/b1,b2.*b1,b3/s);
        });
    });
    describe("secretsAreValid", () => {
        const project = "project";
        const ENDPOINT_BASE = {
            project,
            platform: "gcfv2",
            id: "id",
            region: "region",
            entryPoint: "entry",
            runtime: "nodejs16",
        };
        const ENDPOINT = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
        const secret = { projectId: project, name: "MY_SECRET" };
        let secretVersionStub;
        beforeEach(() => {
            secretVersionStub = sinon.stub(secretManager, "getSecretVersion").rejects("Unexpected call");
        });
        afterEach(() => {
            secretVersionStub.restore();
        });
        it("passes validation with empty backend", () => {
            (0, chai_1.expect)(validate.secretsAreValid(project, backend.empty())).to.not.be.rejected;
        });
        it("passes validation with no secret env vars", () => {
            const b = backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2" }));
            (0, chai_1.expect)(validate.secretsAreValid(project, b)).to.not.be.rejected;
        });
        it("fails validation given non-existent secret version", () => {
            secretVersionStub.rejects({ reason: "Secret version does not exist" });
            const b = backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv1", secretEnvironmentVariables: [
                    {
                        projectId: project,
                        secret: "MY_SECRET",
                        key: "MY_SECRET",
                    },
                ] }));
            (0, chai_1.expect)(validate.secretsAreValid(project, b)).to.be.rejectedWith(error_1.FirebaseError, /Failed to validate secret version/);
        });
        it("fails validation given non-existent secret version", () => {
            secretVersionStub.rejects({ reason: "Secret version does not exist" });
            const b = backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv1", secretEnvironmentVariables: [
                    {
                        projectId: project,
                        secret: "MY_SECRET",
                        key: "MY_SECRET",
                    },
                ] }));
            (0, chai_1.expect)(validate.secretsAreValid(project, b)).to.be.rejectedWith(error_1.FirebaseError, /Failed to validate secret versions/);
        });
        it("fails validation given disabled secret version", () => {
            secretVersionStub.resolves({
                secret,
                versionId: "1",
                state: "DISABLED",
            });
            const b = backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv1", secretEnvironmentVariables: [
                    {
                        projectId: project,
                        secret: "MY_SECRET",
                        key: "MY_SECRET",
                    },
                ] }));
            (0, chai_1.expect)(validate.secretsAreValid(project, b)).to.be.rejectedWith(error_1.FirebaseError, /Failed to validate secret versions/);
        });
        it("passes validation and resolves latest version given valid secret config", async () => {
            secretVersionStub.withArgs(project, secret.name, "latest").resolves({
                secret,
                versionId: "2",
                state: "ENABLED",
            });
            for (const platform of ["gcfv1", "gcfv2"]) {
                const b = backend.of(Object.assign(Object.assign({}, ENDPOINT), { platform, secretEnvironmentVariables: [
                        {
                            projectId: project,
                            secret: "MY_SECRET",
                            key: "MY_SECRET",
                        },
                    ] }));
                await validate.secretsAreValid(project, b);
                (0, chai_1.expect)(backend.allEndpoints(b)[0].secretEnvironmentVariables[0].version).to.equal("2");
            }
        });
    });
});
//# sourceMappingURL=validate.spec.js.map