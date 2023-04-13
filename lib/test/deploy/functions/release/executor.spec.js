"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const executor = require("../../../../deploy/functions/release/executor");
describe("Executor", () => {
    describe("QueueExecutor", () => {
        const exec = new executor.QueueExecutor({
            retries: 20,
            maxBackoff: 1,
            backoff: 1,
        });
        it("supports arbitrary return types", async () => {
            await (0, chai_1.expect)(exec.run(() => Promise.resolve(42))).to.eventually.equal(42);
            await (0, chai_1.expect)(exec.run(() => Promise.resolve({ hello: "world" }))).to.eventually.deep.equal({
                hello: "world",
            });
        });
        it("throws errors", async () => {
            const handler = () => Promise.reject(new Error("Fatal"));
            await (0, chai_1.expect)(exec.run(handler)).to.eventually.be.rejectedWith("Fatal");
        });
        it("retries temporary errors", async () => {
            let throwCount = 0;
            const handler = () => {
                if (throwCount < 2) {
                    throwCount++;
                    const err = new Error("Retryable");
                    err.code = 429;
                    return Promise.reject(err);
                }
                return Promise.resolve(42);
            };
            await (0, chai_1.expect)(exec.run(handler)).to.eventually.equal(42);
        });
        it("eventually gives up on retryable errors", async () => {
            const handler = () => {
                const err = new Error("Retryable");
                err.code = 429;
                throw err;
            };
            await (0, chai_1.expect)(exec.run(handler)).to.eventually.be.rejectedWith("Retryable");
        });
    });
});
//# sourceMappingURL=executor.spec.js.map