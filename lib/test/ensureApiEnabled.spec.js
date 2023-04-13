"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const ensureApiEnabled_1 = require("../ensureApiEnabled");
const FAKE_PROJECT_ID = "my_project";
const FAKE_API = "myapi.googleapis.com";
describe("ensureApiEnabled", () => {
    describe("check", () => {
        before(() => {
            nock.disableNetConnect();
        });
        after(() => {
            nock.enableNetConnect();
        });
        it("should call the API to check if it's enabled", async () => {
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .reply(200, { state: "ENABLED" });
            await (0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, FAKE_API, "", true);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return the value from the API", async () => {
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "ENABLED" });
            await (0, chai_1.expect)((0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, FAKE_API, "", true)).to.eventually.be.true;
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "DISABLED" });
            await (0, chai_1.expect)((0, ensureApiEnabled_1.check)(FAKE_PROJECT_ID, FAKE_API, "", true)).to.eventually.be.false;
        });
    });
    describe("ensure", () => {
        const originalPollInterval = ensureApiEnabled_1.POLL_SETTINGS.pollInterval;
        const originalPollsBeforeRetry = ensureApiEnabled_1.POLL_SETTINGS.pollsBeforeRetry;
        beforeEach(() => {
            nock.disableNetConnect();
            ensureApiEnabled_1.POLL_SETTINGS.pollInterval = 0;
            ensureApiEnabled_1.POLL_SETTINGS.pollsBeforeRetry = 0;
        });
        afterEach(() => {
            nock.enableNetConnect();
            ensureApiEnabled_1.POLL_SETTINGS.pollInterval = originalPollInterval;
            ensureApiEnabled_1.POLL_SETTINGS.pollsBeforeRetry = originalPollsBeforeRetry;
        });
        it("should verify that the API is enabled, and stop if it is", async () => {
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "ENABLED" });
            await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, FAKE_API, "", true)).to.not.be.rejected;
        });
        it("should attempt to enable the API if it is not enabled", async () => {
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "DISABLED" });
            nock("https://serviceusage.googleapis.com")
                .post(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}:enable`, (body) => !body)
                .once()
                .reply(200);
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "ENABLED" });
            await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, FAKE_API, "", true)).to.not.be.rejected;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should retry enabling the API if it does not enable in time", async () => {
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "DISABLED" });
            nock("https://serviceusage.googleapis.com")
                .post(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}:enable`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .twice()
                .reply(200);
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "DISABLED" });
            nock("https://serviceusage.googleapis.com")
                .get(`/v1/projects/${FAKE_PROJECT_ID}/services/${FAKE_API}`)
                .matchHeader("x-goog-quota-user", `projects/${FAKE_PROJECT_ID}`)
                .once()
                .reply(200, { state: "ENABLED" });
            await (0, chai_1.expect)((0, ensureApiEnabled_1.ensure)(FAKE_PROJECT_ID, FAKE_API, "", true)).to.not.be.rejected;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=ensureApiEnabled.spec.js.map