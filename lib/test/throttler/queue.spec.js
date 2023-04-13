"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const queue_1 = require("../../throttler/queue");
const throttler_spec_1 = require("./throttler.spec");
describe("Queue", () => {
    it("should have default name of queue", () => {
        const queue = new queue_1.default({});
        (0, chai_1.expect)(queue.name).to.equal("queue");
    });
    it("should be first-in-first-out", async () => {
        const order = [];
        const queue = new queue_1.default({
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
        (0, chai_1.expect)(order).to.deep.equal(["blocker", "1", "2"]);
    });
});
//# sourceMappingURL=queue.spec.js.map