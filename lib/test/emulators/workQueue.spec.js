"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const workQueue_1 = require("../../emulator/workQueue");
const types_1 = require("../../emulator/types");
function resolveIn(ms) {
    if (ms === 0) {
        return Promise.resolve();
    }
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}
describe("WorkQueue", () => {
    describe("mode=AUTO", () => {
        const MAX_PARALLEL = 10;
        let queue;
        beforeEach(() => {
            queue = new workQueue_1.WorkQueue(types_1.FunctionsExecutionMode.AUTO, MAX_PARALLEL);
            queue.start();
        });
        afterEach(() => {
            if (queue) {
                queue.stop();
            }
        });
        it("never runs a job immediately", async () => {
            let hasRun = false;
            const work = () => {
                hasRun = true;
                return Promise.resolve();
            };
            queue.submit(work);
            (0, chai_1.expect)(!hasRun, "hasRun=false");
            await resolveIn(10);
            (0, chai_1.expect)(hasRun, "hasRun=true");
        });
        it("runs two jobs", async () => {
            let hasRun1 = false;
            const work1 = () => {
                hasRun1 = true;
                return Promise.resolve();
            };
            let hasRun2 = false;
            const work2 = () => {
                hasRun2 = true;
                return Promise.resolve();
            };
            queue.submit(work1);
            queue.submit(work2);
            (0, chai_1.expect)(!hasRun1, "hasRun1=false");
            (0, chai_1.expect)(!hasRun2, "hasRun2=false");
            await resolveIn(10);
            (0, chai_1.expect)(hasRun1 && hasRun2, "hasRun1 && hasRun2");
        });
        it("never runs more than the maximum allowed parallel work", async () => {
            let numRun = 0;
            const timePerJob = 5;
            const numJobs = MAX_PARALLEL * 2;
            for (let i = 0; i < numJobs; i++) {
                const work = () => {
                    numRun++;
                    return resolveIn(timePerJob);
                };
                queue.submit(work);
            }
            await resolveIn(timePerJob - 1);
            (0, chai_1.expect)(queue.getState().workRunningCount).to.eq(MAX_PARALLEL);
            await resolveIn(numJobs * timePerJob + 10);
            (0, chai_1.expect)(numRun).to.eq(numJobs);
        });
    });
    describe("mode=SEQUENTIAL", () => {
        let queue;
        beforeEach(() => {
            queue = new workQueue_1.WorkQueue(types_1.FunctionsExecutionMode.SEQUENTIAL);
            queue.start();
        });
        afterEach(() => {
            if (queue) {
                queue.stop();
            }
        });
        it("finishes one job before running another", async () => {
            const timeout = 50;
            let hasRun1 = false;
            const work1 = async () => {
                await resolveIn(timeout);
                hasRun1 = true;
            };
            let hasRun2 = false;
            const work2 = async () => {
                await resolveIn(timeout);
                hasRun2 = true;
            };
            queue.submit(work1);
            queue.submit(work2);
            await resolveIn(timeout + 10);
            (0, chai_1.expect)(hasRun1, "job 1 finished");
            (0, chai_1.expect)(!hasRun2, "job 2 not finished");
            await resolveIn(timeout + 10);
            (0, chai_1.expect)(hasRun2, "both jobs finished");
        });
        it("proceeds even if a job errors out", () => {
            let hasRun1 = false;
            const work1 = () => {
                hasRun1 = true;
                return Promise.reject();
            };
            let hasRun2 = false;
            const work2 = () => {
                hasRun2 = true;
                return Promise.resolve();
            };
            queue.submit(work1);
            queue.submit(work2);
            (0, chai_1.expect)(hasRun1, "hasRun1");
            (0, chai_1.expect)(hasRun2, "hasRun2");
        });
    });
});
//# sourceMappingURL=workQueue.spec.js.map