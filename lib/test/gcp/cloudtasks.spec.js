"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const cloudtasks = require("../../gcp/cloudtasks");
const proto = require("../../gcp/proto");
describe("CloudTasks", () => {
    let ct;
    const ENDPOINT = {
        platform: "gcfv2",
        id: "id",
        region: "region",
        project: "project",
        entryPoint: "id",
        runtime: "nodejs16",
        taskQueueTrigger: {},
    };
    beforeEach(() => {
        ct = sinon.stub(cloudtasks);
        ct.queueNameForEndpoint.restore();
        ct.queueFromEndpoint.restore();
        ct.triggerFromQueue.restore();
        ct.setEnqueuer.restore();
        ct.upsertQueue.restore();
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("queueFromEndpoint", () => {
        it("handles minimal endpoints", () => {
            (0, chai_1.expect)(cloudtasks.queueFromEndpoint(ENDPOINT)).to.deep.equal(Object.assign(Object.assign({}, cloudtasks.DEFAULT_SETTINGS), { name: "projects/project/locations/region/queues/id" }));
        });
        it("handles complex endpoints", () => {
            const rateLimits = {
                maxConcurrentDispatches: 5,
                maxDispatchesPerSecond: 5,
            };
            const retryConfig = {
                maxAttempts: 10,
                maxDoublings: 9,
                maxBackoffSeconds: 60,
                maxRetrySeconds: 300,
                minBackoffSeconds: 1,
            };
            const ep = Object.assign(Object.assign({}, ENDPOINT), { taskQueueTrigger: {
                    rateLimits,
                    retryConfig,
                    invoker: ["robot@"],
                } });
            (0, chai_1.expect)(cloudtasks.queueFromEndpoint(ep)).to.deep.equal({
                name: "projects/project/locations/region/queues/id",
                rateLimits,
                retryConfig: {
                    maxAttempts: 10,
                    maxDoublings: 9,
                    maxRetryDuration: "300s",
                    maxBackoff: "60s",
                    minBackoff: "1s",
                },
                state: "RUNNING",
            });
        });
    });
    describe("triggerFromQueue", () => {
        it("handles queue with default settings", () => {
            var _a, _b, _c, _d;
            (0, chai_1.expect)(cloudtasks.triggerFromQueue(Object.assign({ name: "projects/project/locations/region/queues/id" }, cloudtasks.DEFAULT_SETTINGS))).to.deep.equal({
                rateLimits: Object.assign({}, cloudtasks.DEFAULT_SETTINGS.rateLimits),
                retryConfig: {
                    maxAttempts: (_a = cloudtasks.DEFAULT_SETTINGS.retryConfig) === null || _a === void 0 ? void 0 : _a.maxAttempts,
                    maxDoublings: (_b = cloudtasks.DEFAULT_SETTINGS.retryConfig) === null || _b === void 0 ? void 0 : _b.maxDoublings,
                    maxBackoffSeconds: proto.secondsFromDuration(((_c = cloudtasks.DEFAULT_SETTINGS.retryConfig) === null || _c === void 0 ? void 0 : _c.maxBackoff) || ""),
                    minBackoffSeconds: proto.secondsFromDuration(((_d = cloudtasks.DEFAULT_SETTINGS.retryConfig) === null || _d === void 0 ? void 0 : _d.minBackoff) || ""),
                },
            });
        });
        it("handles queue with custom configs", () => {
            (0, chai_1.expect)(cloudtasks.triggerFromQueue({
                name: "projects/project/locations/region/queues/id",
                rateLimits: {
                    maxConcurrentDispatches: 5,
                    maxDispatchesPerSecond: 5,
                },
                retryConfig: {
                    maxAttempts: 10,
                    maxDoublings: 9,
                },
            })).to.deep.equal({
                rateLimits: {
                    maxConcurrentDispatches: 5,
                    maxDispatchesPerSecond: 5,
                },
                retryConfig: {
                    maxAttempts: 10,
                    maxDoublings: 9,
                },
            });
        });
    });
    describe("upsertEndpoint", () => {
        it("accepts a matching queue", async () => {
            const queue = Object.assign({ name: "projects/p/locations/r/queues/f" }, cloudtasks.DEFAULT_SETTINGS);
            ct.getQueue.resolves(queue);
            await cloudtasks.upsertQueue(queue);
            (0, chai_1.expect)(ct.getQueue).to.have.been.called;
            (0, chai_1.expect)(ct.updateQueue).to.not.have.been.called;
            (0, chai_1.expect)(ct.purgeQueue).to.not.have.been.called;
        });
        it("updates a non-matching queue", async () => {
            const wantQueue = Object.assign(Object.assign({ name: "projects/p/locations/r/queues/f" }, cloudtasks.DEFAULT_SETTINGS), { rateLimits: {
                    maxConcurrentDispatches: 20,
                } });
            const haveQueue = Object.assign({ name: "projects/p/locations/r/queues/f" }, cloudtasks.DEFAULT_SETTINGS);
            ct.getQueue.resolves(haveQueue);
            await cloudtasks.upsertQueue(wantQueue);
            (0, chai_1.expect)(ct.getQueue).to.have.been.called;
            (0, chai_1.expect)(ct.updateQueue).to.have.been.called;
            (0, chai_1.expect)(ct.purgeQueue).to.not.have.been.called;
        });
        it("purges a disabled queue", async () => {
            const wantQueue = Object.assign({ name: "projects/p/locations/r/queues/f" }, cloudtasks.DEFAULT_SETTINGS);
            const haveQueue = Object.assign(Object.assign({ name: "projects/p/locations/r/queues/f" }, cloudtasks.DEFAULT_SETTINGS), { state: "DISABLED" });
            ct.getQueue.resolves(haveQueue);
            await cloudtasks.upsertQueue(wantQueue);
            (0, chai_1.expect)(ct.getQueue).to.have.been.called;
            (0, chai_1.expect)(ct.updateQueue).to.have.been.called;
            (0, chai_1.expect)(ct.purgeQueue).to.have.been.called;
        });
    });
    describe("setEnqueuer", () => {
        const NAME = "projects/p/locations/r/queues/f";
        const ADMIN_BINDING = {
            role: "roles/cloudtasks.admin",
            members: ["user:sundar@google.com"],
        };
        const PUBLIC_ENQUEUER_BINDING = {
            role: "roles/cloudtasks.enqueuer",
            members: ["allUsers"],
        };
        it("can blind-write", async () => {
            await cloudtasks.setEnqueuer(NAME, ["private"], true);
            (0, chai_1.expect)(ct.getIamPolicy).to.not.have.been.called;
            (0, chai_1.expect)(ct.setIamPolicy).to.not.have.been.called;
            await cloudtasks.setEnqueuer(NAME, ["public"], true);
            (0, chai_1.expect)(ct.getIamPolicy).to.not.have.been.called;
            (0, chai_1.expect)(ct.setIamPolicy).to.have.been.calledWith(NAME, {
                bindings: [PUBLIC_ENQUEUER_BINDING],
                etag: "",
                version: 3,
            });
        });
        it("preserves other roles", async () => {
            ct.getIamPolicy.resolves({
                bindings: [ADMIN_BINDING, PUBLIC_ENQUEUER_BINDING],
                etag: "",
                version: 3,
            });
            await cloudtasks.setEnqueuer(NAME, ["private"]);
            (0, chai_1.expect)(ct.getIamPolicy).to.have.been.called;
            (0, chai_1.expect)(ct.setIamPolicy).to.have.been.calledWith(NAME, {
                bindings: [ADMIN_BINDING],
                etag: "",
                version: 3,
            });
        });
        it("noops existing matches", async () => {
            ct.getIamPolicy.resolves({
                bindings: [ADMIN_BINDING, PUBLIC_ENQUEUER_BINDING],
                etag: "",
                version: 3,
            });
            await cloudtasks.setEnqueuer(NAME, ["public"]);
            (0, chai_1.expect)(ct.getIamPolicy).to.have.been.called;
            (0, chai_1.expect)(ct.setIamPolicy).to.not.have.been.called;
        });
        it("can insert an enqueuer binding", async () => {
            ct.getIamPolicy.resolves({
                bindings: [ADMIN_BINDING],
                etag: "",
                version: 3,
            });
            await cloudtasks.setEnqueuer(NAME, ["public"]);
            (0, chai_1.expect)(ct.getIamPolicy).to.have.been.called;
            (0, chai_1.expect)(ct.setIamPolicy).to.have.been.calledWith(NAME, {
                bindings: [ADMIN_BINDING, PUBLIC_ENQUEUER_BINDING],
                etag: "",
                version: 3,
            });
        });
        it("can resolve conflicts", async () => {
            ct.getIamPolicy.onCall(0).resolves({
                bindings: [ADMIN_BINDING],
                etag: "",
                version: 3,
            });
            ct.getIamPolicy.onCall(1).resolves({
                bindings: [ADMIN_BINDING],
                etag: "2",
                version: 3,
            });
            ct.setIamPolicy.onCall(0).rejects({ context: { response: { statusCode: 429 } } });
            await cloudtasks.setEnqueuer(NAME, ["public"]);
            (0, chai_1.expect)(ct.getIamPolicy).to.have.been.calledTwice;
            (0, chai_1.expect)(ct.setIamPolicy).to.have.been.calledTwice;
            (0, chai_1.expect)(ct.setIamPolicy).to.have.been.calledWithMatch(NAME, {
                etag: "2",
            });
        });
    });
});
//# sourceMappingURL=cloudtasks.spec.js.map