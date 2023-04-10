"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const functionsLog = require("../../functions/functionslog");
const logger_1 = require("../../logger");
describe("functionsLog", () => {
    describe("getApiFilter", () => {
        it("should return base api filter for v1&v2 functions", () => {
            (0, chai_1.expect)(functionsLog.getApiFilter(undefined)).to.eq('resource.type="cloud_function" OR ' +
                '(resource.type="cloud_run_revision" AND ' +
                'labels."goog-managed-by"="cloudfunctions")');
        });
        it("should return list api filter for v1&v2 functions", () => {
            (0, chai_1.expect)(functionsLog.getApiFilter("fn1,fn2")).to.eq('resource.type="cloud_function" OR ' +
                '(resource.type="cloud_run_revision" AND ' +
                'labels."goog-managed-by"="cloudfunctions")\n' +
                '(resource.labels.function_name="fn1" OR ' +
                'resource.labels.service_name="fn1" OR ' +
                'resource.labels.function_name="fn2" OR ' +
                'resource.labels.service_name="fn2")');
        });
    });
    describe("logEntries", () => {
        let sandbox;
        let loggerStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            loggerStub = sandbox.stub(logger_1.logger, "info");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should log no entries", () => {
            functionsLog.logEntries([]);
            (0, chai_1.expect)(loggerStub).to.have.been.calledOnce;
            (0, chai_1.expect)(loggerStub).to.be.calledWith("No log entries found.");
        });
        it("should log entries", () => {
            const entries = [
                {
                    logName: "log1",
                    resource: {
                        labels: {
                            function_name: "fn1",
                        },
                    },
                    receiveTimestamp: "0000000",
                },
                {
                    logName: "log2",
                    resource: {
                        labels: {
                            service_name: "fn2",
                        },
                    },
                    receiveTimestamp: "0000000",
                    timestamp: "1111",
                    severity: "DEBUG",
                    textPayload: "payload",
                },
            ];
            functionsLog.logEntries(entries);
            (0, chai_1.expect)(loggerStub).to.have.been.calledTwice;
            (0, chai_1.expect)(loggerStub.firstCall).to.be.calledWith("1111 D fn2: payload");
            (0, chai_1.expect)(loggerStub.secondCall).to.be.calledWith("--- ? fn1: ");
        });
    });
});
//# sourceMappingURL=functionsLog.spec.js.map