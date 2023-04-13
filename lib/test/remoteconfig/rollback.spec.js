"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("../../api");
const nock = require("nock");
const remoteconfig = require("../../remoteconfig/rollback");
const error_1 = require("../../error");
const PROJECT_ID = "the-remoteconfig-test-project";
function createTemplate(versionNumber, date) {
    return {
        parameterGroups: {},
        version: {
            updateUser: {
                email: "jackiechu@google.com",
            },
            updateTime: date,
            updateOrigin: "REST_API",
            versionNumber: versionNumber,
        },
        conditions: [],
        parameters: {},
        etag: "123",
    };
}
const latestTemplate = createTemplate("115", "2020-08-06T23:11:41.629Z");
const rollbackTemplate = createTemplate("114", "2020-08-07T23:11:41.629Z");
describe("RemoteConfig Rollback", () => {
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
        nock.cleanAll();
    });
    describe("rollbackCurrentVersion", () => {
        it("should return a rollback to the version number specified", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .post(`/v1/projects/${PROJECT_ID}/remoteConfig:rollback?versionNumber=${115}`)
                .reply(200, latestTemplate);
            const RCtemplate = await remoteconfig.rollbackTemplate(PROJECT_ID, 115);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(latestTemplate);
        });
        it.skip("should reject invalid rollback version number", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .post(`/v1/projects/${PROJECT_ID}/remoteConfig:rollback?versionNumber=${1000}`)
                .reply(200, latestTemplate);
            const RCtemplate = await remoteconfig.rollbackTemplate(PROJECT_ID, 1000);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(latestTemplate);
            try {
                await remoteconfig.rollbackTemplate(PROJECT_ID);
            }
            catch (e) {
                e;
            }
        });
        it.skip("should return a rollback to the previous version", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .post(`/v1/projects/${PROJECT_ID}/remoteConfig:rollback?versionNumber=${undefined}`)
                .reply(200, rollbackTemplate);
            const RCtemplate = await remoteconfig.rollbackTemplate(PROJECT_ID);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(rollbackTemplate);
        });
        it("should reject if the api call fails", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .post(`/v1/projects/${PROJECT_ID}/remoteConfig:rollback?versionNumber=${4}`)
                .reply(404, {});
            await (0, chai_1.expect)(remoteconfig.rollbackTemplate(PROJECT_ID, 4)).to.eventually.be.rejectedWith(error_1.FirebaseError, /Not Found/);
        });
    });
});
//# sourceMappingURL=rollback.spec.js.map