"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const httpMocks = require("node-mocks-http");
const nock = require("nock");
const chai_1 = require("chai");
const functionsEmulator_1 = require("../../emulator/functionsEmulator");
const events_1 = require("events");
const functionsRuntimeWorker_1 = require("../../emulator/functionsRuntimeWorker");
const types_1 = require("../../emulator/types");
class MockRuntimeInstance {
    constructor() {
        this.metadata = {};
        this.events = new events_1.EventEmitter();
        this.cwd = "/home/users/dir";
        this.conn = new functionsEmulator_1.IPCConn("/path/to/socket/foo.sock");
        this.exit = new Promise((resolve) => {
            this.events.on("exit", resolve);
        });
        this.process = new events_1.EventEmitter();
        this.process.kill = () => {
            this.events.emit("log", new types_1.EmulatorLog("SYSTEM", "runtime-status", "killed"));
            this.process.emit("exit");
            return true;
        };
    }
}
class WorkerStateCounter {
    constructor(worker) {
        this.counts = {
            CREATED: 0,
            IDLE: 0,
            BUSY: 0,
            FINISHING: 0,
            FINISHED: 0,
        };
        this.increment(worker.state);
        worker.stateEvents.on(functionsRuntimeWorker_1.RuntimeWorkerState.CREATED, () => {
            this.increment(functionsRuntimeWorker_1.RuntimeWorkerState.CREATED);
        });
        worker.stateEvents.on(functionsRuntimeWorker_1.RuntimeWorkerState.IDLE, () => {
            this.increment(functionsRuntimeWorker_1.RuntimeWorkerState.IDLE);
        });
        worker.stateEvents.on(functionsRuntimeWorker_1.RuntimeWorkerState.BUSY, () => {
            this.increment(functionsRuntimeWorker_1.RuntimeWorkerState.BUSY);
        });
        worker.stateEvents.on(functionsRuntimeWorker_1.RuntimeWorkerState.FINISHING, () => {
            this.increment(functionsRuntimeWorker_1.RuntimeWorkerState.FINISHING);
        });
        worker.stateEvents.on(functionsRuntimeWorker_1.RuntimeWorkerState.FINISHED, () => {
            this.increment(functionsRuntimeWorker_1.RuntimeWorkerState.FINISHED);
        });
    }
    increment(state) {
        this.counts[state]++;
    }
    get total() {
        return (this.counts.CREATED +
            this.counts.IDLE +
            this.counts.BUSY +
            this.counts.FINISHING +
            this.counts.FINISHED);
    }
}
function mockTrigger(id) {
    return {
        id,
        name: id,
        entryPoint: id,
        region: "us-central1",
        platform: "gcfv2",
    };
}
describe("FunctionsRuntimeWorker", () => {
    describe("RuntimeWorker", () => {
        it("goes from created --> idle --> busy --> idle in normal operation", async () => {
            const scope = nock("http://localhost").get("/").reply(200);
            const worker = new functionsRuntimeWorker_1.RuntimeWorker("trigger", new MockRuntimeInstance(), {});
            const counter = new WorkerStateCounter(worker);
            worker.readyForWork();
            await worker.request({ method: "GET", path: "/" }, httpMocks.createResponse({ eventEmitter: events_1.EventEmitter }));
            scope.done();
            (0, chai_1.expect)(counter.counts.CREATED).to.eql(1);
            (0, chai_1.expect)(counter.counts.BUSY).to.eql(1);
            (0, chai_1.expect)(counter.counts.IDLE).to.eql(2);
            (0, chai_1.expect)(counter.total).to.eql(4);
        });
        it("goes from created --> idle --> busy --> finished when there's an error", async () => {
            const scope = nock("http://localhost").get("/").replyWithError("boom");
            const worker = new functionsRuntimeWorker_1.RuntimeWorker("trigger", new MockRuntimeInstance(), {});
            const counter = new WorkerStateCounter(worker);
            worker.readyForWork();
            await worker.request({ method: "GET", path: "/" }, httpMocks.createResponse({ eventEmitter: events_1.EventEmitter }));
            scope.done();
            (0, chai_1.expect)(counter.counts.CREATED).to.eql(1);
            (0, chai_1.expect)(counter.counts.IDLE).to.eql(1);
            (0, chai_1.expect)(counter.counts.BUSY).to.eql(1);
            (0, chai_1.expect)(counter.counts.FINISHED).to.eql(1);
            (0, chai_1.expect)(counter.total).to.eql(4);
        });
        it("goes from created --> busy --> finishing --> finished when marked", async () => {
            const scope = nock("http://localhost").get("/").replyWithError("boom");
            const worker = new functionsRuntimeWorker_1.RuntimeWorker("trigger", new MockRuntimeInstance(), {});
            const counter = new WorkerStateCounter(worker);
            worker.readyForWork();
            const resp = httpMocks.createResponse({ eventEmitter: events_1.EventEmitter });
            resp.on("end", () => {
                worker.state = functionsRuntimeWorker_1.RuntimeWorkerState.FINISHING;
            });
            await worker.request({ method: "GET", path: "/" }, resp);
            scope.done();
            (0, chai_1.expect)(counter.counts.CREATED).to.eql(1);
            (0, chai_1.expect)(counter.counts.IDLE).to.eql(1);
            (0, chai_1.expect)(counter.counts.BUSY).to.eql(1);
            (0, chai_1.expect)(counter.counts.FINISHING).to.eql(1);
            (0, chai_1.expect)(counter.counts.FINISHED).to.eql(1);
            (0, chai_1.expect)(counter.total).to.eql(5);
        });
    });
    describe("RuntimeWorkerPool", () => {
        it("properly manages a single worker", async () => {
            const scope = nock("http://localhost").get("/").reply(200);
            const pool = new functionsRuntimeWorker_1.RuntimeWorkerPool();
            const triggerId = "region-trigger1";
            (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.be.undefined;
            const worker = pool.addWorker(mockTrigger(triggerId), new MockRuntimeInstance(), {});
            worker.readyForWork();
            const triggerWorkers = pool.getTriggerWorkers(triggerId);
            (0, chai_1.expect)(triggerWorkers.length).length.to.eq(1);
            (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.eql(worker);
            const resp = httpMocks.createResponse({ eventEmitter: events_1.EventEmitter });
            resp.on("end", () => {
                (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.be.undefined;
            });
            await worker.request({ method: "GET", path: "/" }, resp);
            scope.done();
            (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.eql(worker);
        });
        it("does not consider failed workers idle", async () => {
            const pool = new functionsRuntimeWorker_1.RuntimeWorkerPool();
            const triggerId = "trigger1";
            (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.be.undefined;
            const scope = nock("http://localhost").get("/").replyWithError("boom");
            const worker = pool.addWorker(mockTrigger(triggerId), new MockRuntimeInstance(), {});
            worker.readyForWork();
            (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.eql(worker);
            await worker.request({ method: "GET", path: "/" }, httpMocks.createResponse({ eventEmitter: events_1.EventEmitter }));
            scope.done();
            (0, chai_1.expect)(pool.getIdleWorker(triggerId)).to.be.undefined;
        });
        it("exit() kills idle and busy workers", async () => {
            const pool = new functionsRuntimeWorker_1.RuntimeWorkerPool();
            const triggerId = "trigger1";
            const busyWorker = pool.addWorker(mockTrigger(triggerId), new MockRuntimeInstance(), {});
            busyWorker.readyForWork();
            const busyWorkerCounter = new WorkerStateCounter(busyWorker);
            const idleWorker = pool.addWorker(mockTrigger(triggerId), new MockRuntimeInstance(), {});
            idleWorker.readyForWork();
            const idleWorkerCounter = new WorkerStateCounter(idleWorker);
            const scope = nock("http://localhost").get("/").reply(200);
            const resp = httpMocks.createResponse({ eventEmitter: events_1.EventEmitter });
            resp.on("end", () => {
                pool.exit();
            });
            await busyWorker.request({ method: "GET", path: "/" }, resp);
            scope.done();
            (0, chai_1.expect)(busyWorkerCounter.counts.IDLE).to.eql(1);
            (0, chai_1.expect)(busyWorkerCounter.counts.BUSY).to.eql(1);
            (0, chai_1.expect)(busyWorkerCounter.counts.FINISHED).to.eql(1);
            (0, chai_1.expect)(busyWorkerCounter.total).to.eql(3);
            (0, chai_1.expect)(idleWorkerCounter.counts.IDLE).to.eql(1);
            (0, chai_1.expect)(idleWorkerCounter.counts.FINISHED).to.eql(1);
            (0, chai_1.expect)(idleWorkerCounter.total).to.eql(2);
        });
        it("refresh() kills idle workers and marks busy ones as finishing", async () => {
            const pool = new functionsRuntimeWorker_1.RuntimeWorkerPool();
            const triggerId = "trigger1";
            const busyWorker = pool.addWorker(mockTrigger(triggerId), new MockRuntimeInstance(), {});
            busyWorker.readyForWork();
            const busyWorkerCounter = new WorkerStateCounter(busyWorker);
            const idleWorker = pool.addWorker(mockTrigger(triggerId), new MockRuntimeInstance(), {});
            idleWorker.readyForWork();
            const idleWorkerCounter = new WorkerStateCounter(idleWorker);
            const scope = nock("http://localhost").get("/").reply(200);
            const resp = httpMocks.createResponse({ eventEmitter: events_1.EventEmitter });
            resp.on("end", () => {
                pool.refresh();
            });
            await busyWorker.request({ method: "GET", path: "/" }, resp);
            scope.done();
            (0, chai_1.expect)(busyWorkerCounter.counts.BUSY).to.eql(1);
            (0, chai_1.expect)(busyWorkerCounter.counts.FINISHING).to.eql(1);
            (0, chai_1.expect)(busyWorkerCounter.counts.FINISHED).to.eql(1);
            (0, chai_1.expect)(idleWorkerCounter.counts.IDLE).to.eql(1);
            (0, chai_1.expect)(idleWorkerCounter.counts.FINISHING).to.eql(1);
            (0, chai_1.expect)(idleWorkerCounter.counts.FINISHED).to.eql(1);
        });
        it("gives assigns all triggers to the same worker in sequential mode", async () => {
            const scope = nock("http://localhost").get("/").reply(200);
            const triggerId1 = "region-abc";
            const triggerId2 = "region-def";
            const pool = new functionsRuntimeWorker_1.RuntimeWorkerPool(types_1.FunctionsExecutionMode.SEQUENTIAL);
            const worker = pool.addWorker(mockTrigger(triggerId1), new MockRuntimeInstance(), {});
            worker.readyForWork();
            const resp = httpMocks.createResponse({ eventEmitter: events_1.EventEmitter });
            resp.on("end", () => {
                (0, chai_1.expect)(pool.readyForWork(triggerId1)).to.be.false;
                (0, chai_1.expect)(pool.readyForWork(triggerId2)).to.be.false;
            });
            await worker.request({ method: "GET", path: "/" }, resp);
            scope.done();
            (0, chai_1.expect)(pool.readyForWork(triggerId1)).to.be.true;
            (0, chai_1.expect)(pool.readyForWork(triggerId2)).to.be.true;
        });
    });
});
//# sourceMappingURL=functionsRuntimeWorker.spec.js.map