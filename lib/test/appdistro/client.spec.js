"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path_1 = require("path");
const fs = require("fs-extra");
const nock = require("nock");
const rimraf = require("rimraf");
const sinon = require("sinon");
const tmp = require("tmp");
const client_1 = require("../../appdistribution/client");
const api_1 = require("../../api");
const distribution_1 = require("../../appdistribution/distribution");
const error_1 = require("../../error");
tmp.setGracefulCleanup();
describe("distribution", () => {
    const tempdir = tmp.dirSync();
    const projectName = "projects/123456789";
    const appName = `${projectName}/apps/1:123456789:ios:abc123def456`;
    const binaryFile = (0, path_1.join)(tempdir.name, "app.ipa");
    fs.ensureFileSync(binaryFile);
    const mockDistribution = new distribution_1.Distribution(binaryFile);
    const appDistributionClient = new client_1.AppDistributionClient();
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.useFakeTimers();
    });
    afterEach(() => {
        sandbox.restore();
    });
    after(() => {
        rimraf.sync(tempdir.name);
    });
    describe("addTesters", () => {
        const emails = ["a@foo.com", "b@foo.com"];
        it("should throw error if request fails", async () => {
            nock(api_1.appDistributionOrigin)
                .post(`/v1/${projectName}/testers:batchAdd`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.addTesters(projectName, emails)).to.be.rejectedWith(error_1.FirebaseError, "Failed to add testers");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock(api_1.appDistributionOrigin).post(`/v1/${projectName}/testers:batchAdd`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.addTesters(projectName, emails)).to.be.eventually
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteTesters", () => {
        const emails = ["a@foo.com", "b@foo.com"];
        it("should throw error if delete fails", async () => {
            nock(api_1.appDistributionOrigin)
                .post(`/v1/${projectName}/testers:batchRemove`)
                .reply(400, { error: { status: "FAILED_PRECONDITION" } });
            await (0, chai_1.expect)(appDistributionClient.removeTesters(projectName, emails)).to.be.rejectedWith(error_1.FirebaseError, "Failed to remove testers");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        const mockResponse = { emails: emails };
        it("should resolve when request succeeds", async () => {
            nock(api_1.appDistributionOrigin)
                .post(`/v1/${projectName}/testers:batchRemove`)
                .reply(200, mockResponse);
            await (0, chai_1.expect)(appDistributionClient.removeTesters(projectName, emails)).to.eventually.deep.eq(mockResponse);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("uploadRelease", () => {
        it("should throw error if upload fails", async () => {
            nock(api_1.appDistributionOrigin).post(`/upload/v1/${appName}/releases:upload`).reply(400, {});
            await (0, chai_1.expect)(appDistributionClient.uploadRelease(appName, mockDistribution)).to.be.rejected;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return token if upload succeeds", async () => {
            const fakeOperation = "fake-operation-name";
            nock(api_1.appDistributionOrigin)
                .post(`/upload/v1/${appName}/releases:upload`)
                .reply(200, { name: fakeOperation });
            await (0, chai_1.expect)(appDistributionClient.uploadRelease(appName, mockDistribution)).to.be.eventually.eq(fakeOperation);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateReleaseNotes", () => {
        const releaseName = `${appName}/releases/fake-release-id`;
        it("should return immediately when no release notes are specified", async () => {
            await (0, chai_1.expect)(appDistributionClient.updateReleaseNotes(releaseName, "")).to.eventually.be
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw error when request fails", async () => {
            nock(api_1.appDistributionOrigin)
                .patch(`/v1/${releaseName}?updateMask=release_notes.text`)
                .reply(400, {});
            await (0, chai_1.expect)(appDistributionClient.updateReleaseNotes(releaseName, "release notes")).to.be.rejectedWith(error_1.FirebaseError, "failed to update release notes");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock(api_1.appDistributionOrigin)
                .patch(`/v1/${releaseName}?updateMask=release_notes.text`)
                .reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.updateReleaseNotes(releaseName, "release notes")).to
                .eventually.be.fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("distribute", () => {
        const releaseName = `${appName}/releases/fake-release-id`;
        it("should return immediately when testers and groups are empty", async () => {
            await (0, chai_1.expect)(appDistributionClient.distribute(releaseName)).to.eventually.be.fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve when request succeeds", async () => {
            nock(api_1.appDistributionOrigin).post(`/v1/${releaseName}:distribute`).reply(200, {});
            await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, ["tester1"], ["group1"])).to.be
                .fulfilled;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        describe("when request fails", () => {
            let testers;
            let groups;
            beforeEach(() => {
                testers = ["tester1"];
                groups = ["group1"];
            });
            it("should throw invalid testers error when status code is FAILED_PRECONDITION ", async () => {
                nock(api_1.appDistributionOrigin)
                    .post(`/v1/${releaseName}:distribute`, {
                    testerEmails: testers,
                    groupAliases: groups,
                })
                    .reply(412, { error: { status: "FAILED_PRECONDITION" } });
                await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, testers, groups)).to.be.rejectedWith(error_1.FirebaseError, "failed to distribute to testers/groups: invalid testers");
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
            it("should throw invalid groups error when status code is INVALID_ARGUMENT", async () => {
                nock(api_1.appDistributionOrigin)
                    .post(`/v1/${releaseName}:distribute`, {
                    testerEmails: testers,
                    groupAliases: groups,
                })
                    .reply(412, { error: { status: "INVALID_ARGUMENT" } });
                await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, testers, groups)).to.be.rejectedWith(error_1.FirebaseError, "failed to distribute to testers/groups: invalid groups");
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
            it("should throw default error", async () => {
                nock(api_1.appDistributionOrigin)
                    .post(`/v1/${releaseName}:distribute`, {
                    testerEmails: testers,
                    groupAliases: groups,
                })
                    .reply(400, {});
                await (0, chai_1.expect)(appDistributionClient.distribute(releaseName, ["tester1"], ["group1"])).to.be.rejectedWith(error_1.FirebaseError, "failed to distribute to testers/groups");
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
        });
    });
});
//# sourceMappingURL=client.spec.js.map