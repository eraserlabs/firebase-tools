"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const error_1 = require("../error");
const operation_poller_1 = require("../operation-poller");
const timeout_error_1 = require("../throttler/errors/timeout-error");
const TEST_ORIGIN = "https://firebasedummy.googleapis.com.com";
const VERSION = "v1";
const LRO_RESOURCE_NAME = "operations/cp.3322442424242444";
const FULL_RESOURCE_NAME = `/${VERSION}/${LRO_RESOURCE_NAME}`;
describe("OperationPoller", () => {
    describe("poll", () => {
        let sandbox;
        let pollerOptions;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            pollerOptions = {
                apiOrigin: TEST_ORIGIN,
                apiVersion: VERSION,
                operationResourceName: LRO_RESOURCE_NAME,
                backoff: 10,
            };
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return result with response field if polling succeeds", async () => {
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(200, { done: true, response: "completed" });
            (0, chai_1.expect)(await (0, operation_poller_1.pollOperation)(pollerOptions)).to.deep.equal("completed");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return result with error field if polling operation returns failure response", async () => {
            nock(TEST_ORIGIN)
                .get(FULL_RESOURCE_NAME)
                .reply(200, {
                done: true,
                error: {
                    message: "failed",
                    code: 7,
                },
            });
            let err;
            try {
                await (0, operation_poller_1.pollOperation)(pollerOptions);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("failed");
            (0, chai_1.expect)(err.status).to.equal(7);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return result with error field if api call rejects with unrecoverable error", async () => {
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(404, { message: "poll failed" });
            await (0, chai_1.expect)((0, operation_poller_1.pollOperation)(pollerOptions)).to.eventually.be.rejectedWith(error_1.FirebaseError, "404");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should retry polling if http request responds with 500 or 503 status code", async () => {
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(500, {});
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(503, {});
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(200, { done: true, response: "completed" });
            (0, chai_1.expect)(await (0, operation_poller_1.pollOperation)(pollerOptions)).to.deep.equal("completed");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should retry polling until the LRO is done", async () => {
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).twice().reply(200, { done: false });
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(200, { done: true, response: "completed" });
            (0, chai_1.expect)(await (0, operation_poller_1.pollOperation)(pollerOptions)).to.deep.equal("completed");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject with TimeoutError when timed out after failed retries", async () => {
            pollerOptions.masterTimeout = 200;
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(200, { done: false }).persist();
            let error;
            try {
                await (0, operation_poller_1.pollOperation)(pollerOptions);
            }
            catch (err) {
                error = err;
            }
            (0, chai_1.expect)(error).to.be.instanceOf(timeout_error_1.default);
            nock.cleanAll();
        });
        it("should call onPoll each time the operation is polled", async () => {
            const opResult = { done: true, response: "completed" };
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(200, { done: false });
            nock(TEST_ORIGIN).get(FULL_RESOURCE_NAME).reply(200, opResult);
            const onPollSpy = sinon.spy(() => {
                return;
            });
            pollerOptions.onPoll = onPollSpy;
            console.log(nock.pendingMocks());
            const res = await (0, operation_poller_1.pollOperation)(pollerOptions);
            (0, chai_1.expect)(res).to.deep.equal("completed");
            (0, chai_1.expect)(onPollSpy).to.have.been.calledTwice;
            (0, chai_1.expect)(onPollSpy).to.have.been.calledWith({ done: false });
            (0, chai_1.expect)(onPollSpy).to.have.been.calledWith(opResult);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=operation-poller.spec.js.map