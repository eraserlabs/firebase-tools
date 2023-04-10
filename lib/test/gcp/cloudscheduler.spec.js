"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const error_1 = require("../../error");
const api = require("../../api");
const cloudscheduler = require("../../gcp/cloudscheduler");
const utils_1 = require("../../utils");
const VERSION = "v1";
const TEST_JOB = {
    name: "projects/test-project/locations/us-east1/jobs/test",
    schedule: "every 5 minutes",
    timeZone: "America/Los_Angeles",
    pubsubTarget: {
        topicName: "projects/test-project/topics/test",
        attributes: {
            scheduled: "true",
        },
    },
    retryConfig: {},
};
describe("cloudscheduler", () => {
    describe("createOrUpdateJob", () => {
        afterEach(() => {
            nock.cleanAll();
        });
        it("should create a job if none exists", async () => {
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .reply(404, { context: { response: { statusCode: 404 } } });
            nock(api.cloudschedulerOrigin)
                .post(`/${VERSION}/projects/test-project/locations/us-east1/jobs`)
                .reply(200, TEST_JOB);
            const response = await cloudscheduler.createOrReplaceJob(TEST_JOB);
            (0, chai_1.expect)(response.body).to.deep.equal(TEST_JOB);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should do nothing if a functionally identical job exists", async () => {
            const otherJob = (0, utils_1.cloneDeep)(TEST_JOB);
            otherJob.name = "something-different";
            nock(api.cloudschedulerOrigin).get(`/${VERSION}/${TEST_JOB.name}`).reply(200, otherJob);
            const response = await cloudscheduler.createOrReplaceJob(TEST_JOB);
            (0, chai_1.expect)(response).to.be.undefined;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should do nothing if a job exists with superset retry config.", async () => {
            const existingJob = (0, utils_1.cloneDeep)(TEST_JOB);
            existingJob.retryConfig = { maxDoublings: 10, retryCount: 2 };
            const newJob = (0, utils_1.cloneDeep)(existingJob);
            newJob.retryConfig = { maxDoublings: 10 };
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, existingJob);
            const response = await cloudscheduler.createOrReplaceJob(newJob);
            (0, chai_1.expect)(response).to.be.undefined;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should update if a job exists with the same name and a different schedule", async () => {
            const otherJob = (0, utils_1.cloneDeep)(TEST_JOB);
            otherJob.schedule = "every 6 minutes";
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, otherJob);
            nock(api.cloudschedulerOrigin)
                .patch(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, otherJob);
            const response = await cloudscheduler.createOrReplaceJob(TEST_JOB);
            (0, chai_1.expect)(response.body).to.deep.equal(otherJob);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should update if a job exists with the same name but a different timeZone", async () => {
            const otherJob = (0, utils_1.cloneDeep)(TEST_JOB);
            otherJob.timeZone = "America/New_York";
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, otherJob);
            nock(api.cloudschedulerOrigin)
                .patch(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, otherJob);
            const response = await cloudscheduler.createOrReplaceJob(TEST_JOB);
            (0, chai_1.expect)(response.body).to.deep.equal(otherJob);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should update if a job exists with the same name but a different retry config", async () => {
            const otherJob = (0, utils_1.cloneDeep)(TEST_JOB);
            otherJob.retryConfig = { maxDoublings: 10 };
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, TEST_JOB);
            nock(api.cloudschedulerOrigin)
                .patch(`/${VERSION}/${TEST_JOB.name}`)
                .query(true)
                .reply(200, otherJob);
            const response = await cloudscheduler.createOrReplaceJob(otherJob);
            (0, chai_1.expect)(response.body).to.deep.equal(otherJob);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should error and exit if cloud resource location is not set", async () => {
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .reply(404, { context: { response: { statusCode: 404 } } });
            nock(api.cloudschedulerOrigin)
                .post(`/${VERSION}/projects/test-project/locations/us-east1/jobs`)
                .reply(404, { context: { response: { statusCode: 404 } } });
            await (0, chai_1.expect)(cloudscheduler.createOrReplaceJob(TEST_JOB)).to.be.rejectedWith(error_1.FirebaseError, "Cloud resource location is not set");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should error and exit if cloud scheduler create request fail", async () => {
            nock(api.cloudschedulerOrigin)
                .get(`/${VERSION}/${TEST_JOB.name}`)
                .reply(404, { context: { response: { statusCode: 404 } } });
            nock(api.cloudschedulerOrigin)
                .post(`/${VERSION}/projects/test-project/locations/us-east1/jobs`)
                .reply(400, { context: { response: { statusCode: 400 } } });
            await (0, chai_1.expect)(cloudscheduler.createOrReplaceJob(TEST_JOB)).to.be.rejectedWith(error_1.FirebaseError, "Failed to create scheduler job projects/test-project/locations/us-east1/jobs/test: HTTP Error: 400, Unknown Error");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("jobFromEndpoint", () => {
        const V1_ENDPOINT = {
            platform: "gcfv1",
            id: "id",
            region: "region",
            project: "project",
            entryPoint: "id",
            runtime: "nodejs16",
            scheduleTrigger: {
                schedule: "every 1 minutes",
            },
        };
        const V2_ENDPOINT = Object.assign(Object.assign({}, V1_ENDPOINT), { platform: "gcfv2", uri: "https://my-uri.com" });
        it("should copy minimal fields for v1 endpoints", () => {
            (0, chai_1.expect)(cloudscheduler.jobFromEndpoint(V1_ENDPOINT, "appEngineLocation", "1234567")).to.deep.equal({
                name: "projects/project/locations/appEngineLocation/jobs/firebase-schedule-id-region",
                schedule: "every 1 minutes",
                timeZone: "America/Los_Angeles",
                pubsubTarget: {
                    topicName: "projects/project/topics/firebase-schedule-id-region",
                    attributes: {
                        scheduled: "true",
                    },
                },
            });
        });
        it("should copy minimal fields for v2 endpoints", () => {
            (0, chai_1.expect)(cloudscheduler.jobFromEndpoint(V2_ENDPOINT, V2_ENDPOINT.region, "1234567")).to.deep.equal({
                name: "projects/project/locations/region/jobs/firebase-schedule-id-region",
                schedule: "every 1 minutes",
                timeZone: "UTC",
                httpTarget: {
                    uri: "https://my-uri.com",
                    httpMethod: "POST",
                    oidcToken: {
                        serviceAccountEmail: "1234567-compute@developer.gserviceaccount.com",
                    },
                },
            });
        });
        it("should copy optional fields for v1 endpoints", () => {
            (0, chai_1.expect)(cloudscheduler.jobFromEndpoint(Object.assign(Object.assign({}, V1_ENDPOINT), { scheduleTrigger: {
                    schedule: "every 1 minutes",
                    timeZone: "America/Los_Angeles",
                    retryConfig: {
                        maxDoublings: 2,
                        maxBackoffSeconds: 20,
                        minBackoffSeconds: 1,
                        maxRetrySeconds: 60,
                    },
                } }), "appEngineLocation", "1234567")).to.deep.equal({
                name: "projects/project/locations/appEngineLocation/jobs/firebase-schedule-id-region",
                schedule: "every 1 minutes",
                timeZone: "America/Los_Angeles",
                retryConfig: {
                    maxDoublings: 2,
                    maxBackoffDuration: "20s",
                    minBackoffDuration: "1s",
                    maxRetryDuration: "60s",
                },
                pubsubTarget: {
                    topicName: "projects/project/topics/firebase-schedule-id-region",
                    attributes: {
                        scheduled: "true",
                    },
                },
            });
        });
        it("should copy optional fields for v2 endpoints", () => {
            (0, chai_1.expect)(cloudscheduler.jobFromEndpoint(Object.assign(Object.assign({}, V2_ENDPOINT), { scheduleTrigger: {
                    schedule: "every 1 minutes",
                    timeZone: "America/Los_Angeles",
                    retryConfig: {
                        maxDoublings: 2,
                        maxBackoffSeconds: 20,
                        minBackoffSeconds: 1,
                        maxRetrySeconds: 60,
                    },
                } }), V2_ENDPOINT.region, "1234567")).to.deep.equal({
                name: "projects/project/locations/region/jobs/firebase-schedule-id-region",
                schedule: "every 1 minutes",
                timeZone: "America/Los_Angeles",
                retryConfig: {
                    maxDoublings: 2,
                    maxBackoffDuration: "20s",
                    minBackoffDuration: "1s",
                    maxRetryDuration: "60s",
                },
                httpTarget: {
                    uri: "https://my-uri.com",
                    httpMethod: "POST",
                    oidcToken: {
                        serviceAccountEmail: "1234567-compute@developer.gserviceaccount.com",
                    },
                },
            });
        });
    });
});
//# sourceMappingURL=cloudscheduler.spec.js.map