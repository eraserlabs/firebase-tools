"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const logger_1 = require("../../../../logger");
const reporter = require("../../../../deploy/functions/release/reporter");
const track = require("../../../../track");
const events = require("../../../../functions/events");
const ENDPOINT_BASE = {
    platform: "gcfv1",
    id: "id",
    region: "region",
    project: "project",
    entryPoint: "id",
    runtime: "nodejs16",
};
const ENDPOINT = Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} });
describe("reporter", () => {
    describe("triggerTag", () => {
        it("detects v1.https", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {} }))).to.equal("v1.https");
        });
        it("detects v2.https", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", httpsTrigger: {} }))).to.equal("v2.https");
        });
        it("detects v1.callable", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { httpsTrigger: {}, labels: {
                    "deployment-callable": "true",
                } }))).to.equal("v1.callable");
        });
        it("detects v2.callable", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", httpsTrigger: {}, labels: {
                    "deployment-callable": "true",
                } }))).to.equal("v2.callable");
        });
        it("detects v1.scheduled", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { scheduleTrigger: {} }))).to.equal("v1.scheduled");
        });
        it("detects v2.scheduled", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", scheduleTrigger: {} }))).to.equal("v2.scheduled");
        });
        it("detects v1.blocking", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { blockingTrigger: { eventType: events.v1.BEFORE_CREATE_EVENT } }))).to.equal("v1.blocking");
        });
        it("detects v2.blocking", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", blockingTrigger: { eventType: events.v1.BEFORE_CREATE_EVENT } }))).to.equal("v2.blocking");
        });
        it("detects others", () => {
            (0, chai_1.expect)(reporter.triggerTag(Object.assign(Object.assign({}, ENDPOINT_BASE), { platform: "gcfv2", eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    eventFilters: {},
                    retry: false,
                } }))).to.equal("google.pubsub.topic.publish");
        });
    });
    describe("logAndTrackDeployStats", () => {
        let trackStub;
        let debugStub;
        beforeEach(() => {
            trackStub = sinon.stub(track, "track");
            debugStub = sinon.stub(logger_1.logger, "debug");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("tracks global summaries", async () => {
            const summary = {
                totalTime: 2000,
                results: [
                    {
                        endpoint: ENDPOINT,
                        durationMs: 2000,
                    },
                    {
                        endpoint: ENDPOINT,
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "update", undefined),
                    },
                    {
                        endpoint: ENDPOINT,
                        durationMs: 0,
                        error: new reporter.AbortedDeploymentError(ENDPOINT),
                    },
                ],
            };
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_region_count", "1", 1);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("function_deploy_success", "v1.https", 2000);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("function_deploy_failure", "v1.https", 1000);
            (0, chai_1.expect)(trackStub).to.not.have.been.calledWith("function_deploy_failure", "v1.https", 0);
            (0, chai_1.expect)(debugStub).to.have.been.calledWith("Total Function Deployment time: 2000");
            (0, chai_1.expect)(debugStub).to.have.been.calledWith("3 Functions Deployed");
            (0, chai_1.expect)(debugStub).to.have.been.calledWith("1 Functions Errored");
            (0, chai_1.expect)(debugStub).to.have.been.calledWith("1 Function Deployments Aborted");
            (0, chai_1.expect)(debugStub).to.have.been.calledWith("Average Function Deployment time: 1500");
        });
        it("tracks v1 vs v2 codebases", async () => {
            const v1 = Object.assign({}, ENDPOINT);
            const v2 = Object.assign(Object.assign({}, ENDPOINT), { platform: "gcfv2" });
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: v1,
                        durationMs: 1000,
                    },
                    {
                        endpoint: v2,
                        durationMs: 1000,
                    },
                ],
            };
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_codebase_deploy", "v1+v2", 2);
            trackStub.resetHistory();
            summary.results = [{ endpoint: v1, durationMs: 1000 }];
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_codebase_deploy", "v1", 1);
            trackStub.resetHistory();
            summary.results = [{ endpoint: v2, durationMs: 1000 }];
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_codebase_deploy", "v2", 1);
        });
        it("tracks overall success/failure", async () => {
            const success = {
                endpoint: ENDPOINT,
                durationMs: 1000,
            };
            const failure = {
                endpoint: ENDPOINT,
                durationMs: 1000,
                error: new reporter.DeploymentError(ENDPOINT, "create", undefined),
            };
            const summary = {
                totalTime: 1000,
                results: [success, failure],
            };
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_deploy_result", "partial_success", 1);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_deploy_result", "partial_failure", 1);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_deploy_result", "partial_error_ratio", 0.5);
            trackStub.resetHistory();
            summary.results = [success];
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_deploy_result", "success", 1);
            trackStub.resetHistory();
            summary.results = [failure];
            await reporter.logAndTrackDeployStats(summary);
            (0, chai_1.expect)(trackStub).to.have.been.calledWith("functions_deploy_result", "failure", 1);
        });
    });
    describe("printErrors", () => {
        let infoStub;
        beforeEach(() => {
            infoStub = sinon.stub(logger_1.logger, "info");
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("does nothing if there are no errors", () => {
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: ENDPOINT,
                        durationMs: 1000,
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.not.have.been.called;
        });
        it("only prints summaries for non-aborted errors", () => {
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: Object.assign(Object.assign({}, ENDPOINT), { id: "failedCreate" }),
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "create", undefined),
                    },
                    {
                        endpoint: Object.assign(Object.assign({}, ENDPOINT), { id: "abortedDelete" }),
                        durationMs: 0,
                        error: new reporter.AbortedDeploymentError(ENDPOINT),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch(/Functions deploy had errors.*failedCreate/s);
            (0, chai_1.expect)(infoStub).to.not.have.been.calledWithMatch(/Functions deploy had errors.*abortedDelete/s);
        });
        it("prints IAM errors", () => {
            const explicit = Object.assign(Object.assign({}, ENDPOINT), { httpsTrigger: {
                    invoker: ["public"],
                } });
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: explicit,
                        durationMs: 1000,
                        error: new reporter.DeploymentError(explicit, "set invoker", undefined),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("Unable to set the invoker for the IAM policy");
            (0, chai_1.expect)(infoStub).to.not.have.been.calledWithMatch("One or more functions were being implicitly made publicly available");
            infoStub.resetHistory();
            summary.results[0].endpoint = ENDPOINT;
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("Unable to set the invoker for the IAM policy");
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("One or more functions were being implicitly made publicly available");
        });
        it("prints quota errors", () => {
            const rawError = new Error("Quota exceeded");
            rawError.status = 429;
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: ENDPOINT,
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "create", rawError),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch("Exceeded maximum retries while deploying functions.");
        });
        it("prints aborted errors", () => {
            const summary = {
                totalTime: 1000,
                results: [
                    {
                        endpoint: Object.assign(Object.assign({}, ENDPOINT), { id: "failedCreate" }),
                        durationMs: 1000,
                        error: new reporter.DeploymentError(ENDPOINT, "create", undefined),
                    },
                    {
                        endpoint: Object.assign(Object.assign({}, ENDPOINT), { id: "abortedDelete" }),
                        durationMs: 1000,
                        error: new reporter.AbortedDeploymentError(ENDPOINT),
                    },
                ],
            };
            reporter.printErrors(summary);
            (0, chai_1.expect)(infoStub).to.have.been.calledWithMatch(/the following functions were not deleted.*abortedDelete/s);
            (0, chai_1.expect)(infoStub).to.not.have.been.calledWith(/the following functions were not deleted.*failedCreate/s);
        });
    });
});
//# sourceMappingURL=reporter.spec.js.map