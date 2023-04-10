"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("../../api");
const nock = require("nock");
const remoteconfig = require("../../remoteconfig/versionslist");
const PROJECT_ID = "the-remoteconfig-test-project";
function createVersion(version, date) {
    return {
        versionNumber: version,
        updateTime: date,
        updateUser: { email: "jackiechu@google.com" },
    };
}
const expectedProjectInfoLimit = {
    versions: [
        createVersion("114", "2020-07-16T23:22:23.608Z"),
        createVersion("113", "2020-06-18T21:10:08.992Z"),
    ],
};
const expectedProjectInfoDefault = {
    versions: [
        ...expectedProjectInfoLimit.versions,
        createVersion("112", "2020-06-16T22:20:34.549Z"),
        createVersion("111", "2020-06-16T22:14:24.419Z"),
        createVersion("110", "2020-06-16T22:05:03.116Z"),
        createVersion("109", "2020-06-16T21:55:19.415Z"),
        createVersion("108", "2020-06-16T21:54:55.799Z"),
        createVersion("107", "2020-06-16T21:48:37.565Z"),
        createVersion("106", "2020-06-16T21:44:41.043Z"),
        createVersion("105", "2020-06-16T21:44:13.860Z"),
    ],
};
const expectedProjectInfoNoLimit = {
    versions: [
        ...expectedProjectInfoDefault.versions,
        createVersion("104", "2020-06-16T21:39:19.422Z"),
        createVersion("103", "2020-06-16T21:37:40.858Z"),
    ],
};
describe("RemoteConfig ListVersions", () => {
    describe("getVersionTemplate", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
            nock.cleanAll();
        });
        it("should return the list of versions up to the limit", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .get(`/v1/projects/${PROJECT_ID}/remoteConfig:listVersions?pageSize=${2}`)
                .reply(200, expectedProjectInfoLimit);
            const RCtemplate = await remoteconfig.getVersions(PROJECT_ID, 2);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(expectedProjectInfoLimit);
        });
        it("should return all the versions when the limit is 0", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .get(`/v1/projects/${PROJECT_ID}/remoteConfig:listVersions?pageSize=${300}`)
                .reply(200, expectedProjectInfoNoLimit);
            const RCtemplate = await remoteconfig.getVersions(PROJECT_ID, 0);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(expectedProjectInfoNoLimit);
        });
        it("should return with default 10 versions when no limit is set", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .get(`/v1/projects/${PROJECT_ID}/remoteConfig:listVersions?pageSize=${10}`)
                .reply(200, expectedProjectInfoDefault);
            const RCtemplateVersion = await remoteconfig.getVersions(PROJECT_ID);
            (0, chai_1.expect)(RCtemplateVersion.versions.length).to.deep.equal(10);
            (0, chai_1.expect)(RCtemplateVersion).to.deep.equal(expectedProjectInfoDefault);
        });
        it("should reject if the api call fails", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .get(`/v1/projects/${PROJECT_ID}/remoteConfig:listVersions?pageSize=${10}`)
                .reply(404, "Not Found");
            let err;
            try {
                await remoteconfig.getVersions(PROJECT_ID);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err).to.not.be.undefined;
            (0, chai_1.expect)(err.message).to.equal(`Failed to get Remote Config template versions for Firebase project ${PROJECT_ID}. `);
        });
    });
});
//# sourceMappingURL=versionslist.spec.js.map