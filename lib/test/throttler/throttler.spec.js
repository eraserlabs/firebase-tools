"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandler = exports.createTask = void 0;
const sinon = require("sinon");
const chai_1 = require("chai");
const queue_1 = require("../../throttler/queue");
const stack_1 = require("../../throttler/stack");
const throttler_1 = require("../../throttler/throttler");
const timeout_error_1 = require("../../throttler/errors/timeout-error");
const retries_exhausted_error_1 = require("../../throttler/errors/retries-exhausted-error");
const TEST_ERROR = new Error("foobar");
const throttlerTest = (ThrottlerConstructor) => {
    it("should have no waiting task after creation", () => {
        const queue = new ThrottlerConstructor({});
        (0, chai_1.expect)(queue.hasWaitingTask()).to.equal(false);
    });
    it("should return the task as the task name", () => {
        const handler = sinon.stub().resolves();
        const q = new ThrottlerConstructor({
            handler,
        });
        const stringTask = "test task";
        q.add(stringTask);
        (0, chai_1.expect)(q.taskName(0)).to.equal(stringTask);
    });
    it("should return the index as the task name", () => {
        const handler = sinon.stub().resolves();
        const q = new ThrottlerConstructor({
            handler,
        });
        q.add(2);
        (0, chai_1.expect)(q.taskName(0)).to.equal("index 0");
    });
    it("should return 'finished task' as the task name", () => {
        const handler = sinon.stub().resolves();
        const q = new ThrottlerConstructor({
            handler,
        });
        q.add(2);
        q.close();
        return q.wait().then(() => {
            (0, chai_1.expect)(q.taskName(0)).to.equal("finished task");
        });
    });
    it("should handle function tasks", () => {
        const task = sinon.stub().resolves();
        const q = new ThrottlerConstructor({});
        q.add(task);
        q.close();
        return q.wait().then(() => {
            (0, chai_1.expect)(task.callCount).to.equal(1);
            (0, chai_1.expect)(q.complete).to.equal(1);
            (0, chai_1.expect)(q.success).to.equal(1);
            (0, chai_1.expect)(q.errored).to.equal(0);
            (0, chai_1.expect)(q.retried).to.equal(0);
            (0, chai_1.expect)(q.total).to.equal(1);
        });
    });
    it("should handle tasks", () => {
        const handler = sinon.stub().resolves();
        const q = new ThrottlerConstructor({
            handler,
        });
        q.add(4);
        q.close();
        return q.wait().then(() => {
            (0, chai_1.expect)(handler.callCount).to.equal(1);
            (0, chai_1.expect)(q.complete).to.equal(1);
            (0, chai_1.expect)(q.success).to.equal(1);
            (0, chai_1.expect)(q.errored).to.equal(0);
            (0, chai_1.expect)(q.retried).to.equal(0);
            (0, chai_1.expect)(q.total).to.equal(1);
        });
    });
    it("should not retry", () => {
        const handler = sinon.stub().rejects(TEST_ERROR);
        const q = new ThrottlerConstructor({
            handler,
            retries: 0,
        });
        q.add(4);
        q.close();
        return q
            .wait()
            .then(() => {
            throw new Error("handler should have rejected");
        })
            .catch((err) => {
            (0, chai_1.expect)(err).to.be.an.instanceof(retries_exhausted_error_1.default);
            (0, chai_1.expect)(err.original).to.equal(TEST_ERROR);
            (0, chai_1.expect)(err.message).to.equal("Task index 0 failed: retries exhausted after 1 attempts, with error: foobar");
        })
            .then(() => {
            (0, chai_1.expect)(handler.callCount).to.equal(1);
            (0, chai_1.expect)(q.complete).to.equal(1);
            (0, chai_1.expect)(q.success).to.equal(0);
            (0, chai_1.expect)(q.errored).to.equal(1);
            (0, chai_1.expect)(q.retried).to.equal(0);
            (0, chai_1.expect)(q.total).to.equal(1);
        });
    });
    it("should retry the number of retries, plus one", () => {
        const handler = sinon.stub().rejects(TEST_ERROR);
        const q = new ThrottlerConstructor({
            backoff: 0,
            handler,
            retries: 3,
        });
        q.add(4);
        q.close();
        return q
            .wait()
            .then(() => {
            throw new Error("handler should have rejected");
        })
            .catch((err) => {
            (0, chai_1.expect)(err).to.be.an.instanceof(retries_exhausted_error_1.default);
            (0, chai_1.expect)(err.original).to.equal(TEST_ERROR);
            (0, chai_1.expect)(err.message).to.equal("Task index 0 failed: retries exhausted after 4 attempts, with error: foobar");
        })
            .then(() => {
            (0, chai_1.expect)(handler.callCount).to.equal(4);
            (0, chai_1.expect)(q.complete).to.equal(1);
            (0, chai_1.expect)(q.success).to.equal(0);
            (0, chai_1.expect)(q.errored).to.equal(1);
            (0, chai_1.expect)(q.retried).to.equal(3);
            (0, chai_1.expect)(q.total).to.equal(1);
        });
    });
    it("should handle tasks in concurrency", () => {
        const callCountMap = new Map();
        const handler = (task) => {
            let count = callCountMap.get(task);
            if (!count) {
                count = 0;
            }
            count += 1;
            callCountMap.set(task, count);
            if (count > 2) {
                return Promise.resolve();
            }
            return Promise.reject();
        };
        const q = new ThrottlerConstructor({
            backoff: 0,
            concurrency: 2,
            handler,
            retries: 2,
        });
        q.add("1");
        q.add("2");
        q.add("3");
        q.close();
        return q
            .wait()
            .catch((err) => {
            throw new Error(`handler should have passed ${err.message}`);
        })
            .then(() => {
            (0, chai_1.expect)(q.complete).to.equal(3);
            (0, chai_1.expect)(q.success).to.equal(3);
            (0, chai_1.expect)(q.errored).to.equal(0);
            (0, chai_1.expect)(q.retried).to.equal(6);
            (0, chai_1.expect)(q.total).to.equal(3);
        });
    });
    it("should retry the number of retries for mutiple identical tasks", () => {
        const handler = sinon
            .stub()
            .rejects(TEST_ERROR)
            .onCall(2)
            .resolves(0)
            .onCall(5)
            .resolves(0)
            .onCall(8)
            .resolves(0);
        const q = new ThrottlerConstructor({
            backoff: 0,
            concurrency: 1,
            handler,
            retries: 2,
        });
        q.add(5);
        q.add(5);
        q.add(5);
        q.close();
        return q
            .wait()
            .catch((err) => {
            throw new Error(`handler should have passed ${err.message}`);
        })
            .then(() => {
            (0, chai_1.expect)(handler.callCount).to.equal(9);
            (0, chai_1.expect)(q.complete).to.equal(3);
            (0, chai_1.expect)(q.success).to.equal(3);
            (0, chai_1.expect)(q.errored).to.equal(0);
            (0, chai_1.expect)(q.retried).to.equal(6);
            (0, chai_1.expect)(q.total).to.equal(3);
        });
    });
    it("should return the result of task", () => {
        const handler = (task) => {
            return Promise.resolve(`result: ${task}`);
        };
        const q = new ThrottlerConstructor({
            handler,
        });
        (0, chai_1.expect)(q.run(2)).to.eventually.to.equal("result: 2");
        (0, chai_1.expect)(q.run(3)).to.eventually.to.equal("result: 3");
    });
    it("should resolve if task finishes before timeout", async () => {
        const handler = (task) => {
            return Promise.resolve(`result: ${task}`);
        };
        const q = new queue_1.default({
            handler,
        });
        (0, chai_1.expect)(await q.run(2, 20000000)).to.equal("result: 2");
        (0, chai_1.expect)(q.complete).to.equal(1);
        (0, chai_1.expect)(q.success).to.equal(1);
        (0, chai_1.expect)(q.errored).to.equal(0);
        (0, chai_1.expect)(q.retried).to.equal(0);
        (0, chai_1.expect)(q.total).to.equal(1);
    });
    it("should reject if timeout", async () => {
        const handler = (task) => new Promise((resolve) => {
            setTimeout(() => {
                resolve(`result: ${task}`);
            }, 150);
        });
        const q = new queue_1.default({
            handler,
        });
        let err;
        try {
            await q.run(2, 100);
        }
        catch (e) {
            err = e;
        }
        (0, chai_1.expect)(err).to.be.instanceOf(timeout_error_1.default);
        (0, chai_1.expect)(err.message).to.equal("Task index 0 failed: timed out after 100ms.");
    });
    it("should reject with RetriesExhaustedError if last trial is rejected before timeout", async () => {
        const handler = sinon.stub().rejects(TEST_ERROR);
        const q = new queue_1.default({
            handler,
            retries: 2,
            backoff: 10,
        });
        let err;
        try {
            await q.run(2, 200);
        }
        catch (e) {
            err = e;
        }
        (0, chai_1.expect)(err).to.be.instanceOf(retries_exhausted_error_1.default);
        (0, chai_1.expect)(err.original).to.equal(TEST_ERROR);
        (0, chai_1.expect)(err.message).to.equal("Task index 0 failed: retries exhausted after 3 attempts, with error: foobar");
        (0, chai_1.expect)(handler.callCount).to.equal(3);
        (0, chai_1.expect)(q.complete).to.equal(1);
        (0, chai_1.expect)(q.success).to.equal(0);
        (0, chai_1.expect)(q.errored).to.equal(1);
        (0, chai_1.expect)(q.retried).to.equal(2);
        (0, chai_1.expect)(q.total).to.equal(1);
    });
    it("should reject with TimeoutError if timeout while retrying", async () => {
        const handler = sinon.stub().rejects(TEST_ERROR);
        const q = new queue_1.default({
            handler,
            retries: 1000,
            backoff: 5,
        });
        let err;
        try {
            await q.run(2, 100);
        }
        catch (e) {
            err = e;
        }
        (0, chai_1.expect)(err).to.be.instanceOf(timeout_error_1.default);
        (0, chai_1.expect)(handler.callCount).to.be.at.least(2);
        (0, chai_1.expect)(err.message).to.equal("Task index 0 failed: timed out after 100ms.");
        (0, chai_1.expect)(q.complete).to.equal(1);
        (0, chai_1.expect)(q.success).to.equal(0);
        (0, chai_1.expect)(q.errored).to.equal(1);
        (0, chai_1.expect)(q.retried).to.be.at.least(3);
        (0, chai_1.expect)(q.total).to.equal(1);
    });
    it("should reject with TimeoutError when waiting", async () => {
        const handler = sinon.stub().rejects(TEST_ERROR).onFirstCall().resolves(0);
        const q = new queue_1.default({
            handler,
            retries: 4,
            backoff: 20,
        });
        q.add(2);
        q.add(3, 10);
        q.add(4, 500);
        q.close();
        let err;
        try {
            await q.wait();
        }
        catch (e) {
            err = e;
        }
        (0, chai_1.expect)(err).to.be.instanceOf(timeout_error_1.default);
        (0, chai_1.expect)(err.message).to.equal("Task index 1 failed: timed out after 10ms.");
        (0, chai_1.expect)(handler.callCount).to.equal(3);
        (0, chai_1.expect)(q.complete).to.equal(2);
        (0, chai_1.expect)(q.success).to.equal(1);
        (0, chai_1.expect)(q.errored).to.equal(1);
        (0, chai_1.expect)(q.total).to.equal(3);
    });
    it("should reject with RetriesExhaustedError when waiting", async () => {
        const handler = sinon.stub().rejects(TEST_ERROR).onFirstCall().resolves(0);
        const q = new queue_1.default({
            handler,
            retries: 1,
            backoff: 10,
        });
        q.add(2);
        q.add(3, 100);
        q.close();
        let err;
        try {
            await q.wait();
        }
        catch (e) {
            err = e;
        }
        (0, chai_1.expect)(err).to.be.instanceOf(retries_exhausted_error_1.default);
        (0, chai_1.expect)(err.message).to.equal("Task index 1 failed: retries exhausted after 2 attempts, with error: foobar");
        (0, chai_1.expect)(handler.callCount).to.equal(3);
        (0, chai_1.expect)(q.complete).to.equal(2);
        (0, chai_1.expect)(q.success).to.equal(1);
        (0, chai_1.expect)(q.errored).to.equal(1);
        (0, chai_1.expect)(q.retried).to.equal(1);
        (0, chai_1.expect)(q.total).to.equal(2);
    });
};
describe("Throttler", () => {
    describe("Queue", () => {
        throttlerTest(queue_1.default);
    });
    describe("Stack", () => {
        throttlerTest(stack_1.default);
    });
});
describe("timeToWait", () => {
    it("should wait the base delay on the first attempt", () => {
        const retryCount = 0;
        const delay = 100;
        const maxDelay = 1000;
        (0, chai_1.expect)((0, throttler_1.timeToWait)(retryCount, delay, maxDelay)).to.equal(delay);
    });
    it("should back off exponentially", () => {
        const delay = 100;
        const maxDelay = 1000;
        (0, chai_1.expect)((0, throttler_1.timeToWait)(1, delay, maxDelay)).to.equal(delay * 2);
        (0, chai_1.expect)((0, throttler_1.timeToWait)(2, delay, maxDelay)).to.equal(delay * 4);
        (0, chai_1.expect)((0, throttler_1.timeToWait)(3, delay, maxDelay)).to.equal(delay * 8);
    });
    it("should not wait longer than maxDelay", () => {
        const retryCount = 2;
        const delay = 300;
        const maxDelay = 400;
        (0, chai_1.expect)((0, throttler_1.timeToWait)(retryCount, delay, maxDelay)).to.equal(maxDelay);
    });
});
const createTask = (name, resolved) => {
    return new Promise((res) => {
        let resolve = () => {
            throw new Error("resolve is not set");
        };
        let reject = () => {
            throw new Error("reject is not set");
        };
        let startExecute = () => {
            throw new Error("startExecute is not set");
        };
        const promise = new Promise((s, j) => {
            resolve = s;
            reject = j;
        });
        const startExecutePromise = new Promise((s) => {
            startExecute = s;
        });
        res({
            name,
            promise,
            resolve,
            reject,
            startExecute,
            startExecutePromise,
        });
        if (resolved) {
            resolve();
        }
    });
};
exports.createTask = createTask;
const createHandler = (orderList) => {
    return (task) => {
        task.startExecute();
        return task.promise.then(() => {
            orderList.push(task.name);
        });
    };
};
exports.createHandler = createHandler;
//# sourceMappingURL=throttler.spec.js.map