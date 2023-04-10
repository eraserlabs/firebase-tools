"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api = require("../../api");
const error_1 = require("../../error");
const cloudmonitoring_1 = require("../../gcp/cloudmonitoring");
const CLOUD_MONITORING_VERSION = "v3";
const PROJECT_NUMBER = 1;
describe("queryTimeSeries", () => {
    afterEach(() => {
        nock.cleanAll();
    });
    const query = {
        filter: 'metric.type="firebaseextensions.googleapis.com/extension/version/active_instances" resource.type="firebaseextensions.googleapis.com/ExtensionVersion"',
        "interval.endTime": new Date().toJSON(),
        "interval.startTime": new Date().toJSON(),
        view: cloudmonitoring_1.TimeSeriesView.FULL,
        "aggregation.alignmentPeriod": (60 * 60 * 24).toString() + "s",
        "aggregation.perSeriesAligner": cloudmonitoring_1.Aligner.ALIGN_MAX,
    };
    const RESPONSE = {
        timeSeries: [],
    };
    it("should make a POST call to the correct endpoint", async () => {
        nock(api.cloudMonitoringOrigin)
            .get(`/${CLOUD_MONITORING_VERSION}/projects/${PROJECT_NUMBER}/timeSeries/`)
            .query(true)
            .reply(200, RESPONSE);
        const res = await (0, cloudmonitoring_1.queryTimeSeries)(query, PROJECT_NUMBER);
        (0, chai_1.expect)(res).to.deep.equal(RESPONSE.timeSeries);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should throw a FirebaseError if the endpoint returns an error response", async () => {
        nock(api.cloudMonitoringOrigin)
            .get(`/${CLOUD_MONITORING_VERSION}/projects/${PROJECT_NUMBER}/timeSeries/`)
            .query(true)
            .reply(404);
        await (0, chai_1.expect)((0, cloudmonitoring_1.queryTimeSeries)(query, PROJECT_NUMBER)).to.be.rejectedWith(error_1.FirebaseError);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
});
//# sourceMappingURL=cloudmonitoring.spec.js.map