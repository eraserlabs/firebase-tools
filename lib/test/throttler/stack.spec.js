"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const stack_1 = require("../../throttler/stack");
const throttler_spec_1 = require("./throttler.spec");
describe("Stack", () => {
    it("should have default name of stack", () => {
        const stack = new stack_1.default({});
        (0, chai_1.expect)(stack.name).to.equal("stack");
    });
    it("should be first-in-last-out", async () => {
        const order = [];
        const queue = new stack_1.default({
            handler: (0, throttler_spec_1.createHandler)(order),
            concurrency: 1,
        });
        const blocker = await (0, throttler_spec_1.createTask)("blocker", false);
        queue.add(blocker);
        queue.add(await (0, throttler_spec_1.createTask)("1", true));
        queue.add(await (0, throttler_spec_1.createTask)("2", true));
        blocker.resolve();
        queue.close();
        await queue.wait();
        (0, chai_1.expect)(order).to.deep.equal(["blocker", "2", "1"]);
    });
    it("should not repeat completed tasks", async () => {
        const order = [];
        const queue = new stack_1.default({
            handler: (0, throttler_spec_1.createHandler)(order),
            concurrency: 1,
        });
        const t1 = await (0, throttler_spec_1.createTask)("t1", false);
        queue.add(t1);
        const t2 = await (0, throttler_spec_1.createTask)("t2", false);
        queue.add(t2);
        queue.add(await (0, throttler_spec_1.createTask)("added before t1 finished a", true));
        queue.add(await (0, throttler_spec_1.createTask)("added before t1 finished b", true));
        t1.resolve();
        await t2.startExecutePromise;
        queue.add(await (0, throttler_spec_1.createTask)("added before t2 finished a", true));
        queue.add(await (0, throttler_spec_1.createTask)("added before t2 finished b", true));
        t2.resolve();
        queue.close();
        await queue.wait();
        (0, chai_1.expect)(order).to.deep.equal([
            "t1",
            "added before t1 finished b",
            "added before t1 finished a",
            "t2",
            "added before t2 finished b",
            "added before t2 finished a",
        ]);
    });
});
//# sourceMappingURL=stack.spec.js.map