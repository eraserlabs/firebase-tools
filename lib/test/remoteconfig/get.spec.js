"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const api_1 = require("../../api");
const nock = require("nock");
const remoteconfig = require("../../remoteconfig/get");
const error_1 = require("../../error");
const PROJECT_ID = "the-remoteconfig-test-project";
const expectedProjectInfo = {
    conditions: [
        {
            name: "RCTestCondition",
            expression: "dateTime < dateTime('2020-07-24T00:00:00', 'America/Los_Angeles')",
        },
    ],
    parameters: {
        RCTestkey: {
            defaultValue: {
                value: "RCTestValue",
            },
        },
    },
    version: {
        versionNumber: "6",
        updateTime: "2020-07-23T17:13:11.190Z",
        updateUser: {
            email: "abc@gmail.com",
        },
        updateOrigin: "CONSOLE",
        updateType: "INCREMENTAL_UPDATE",
    },
    parameterGroups: {
        RCTestCaseGroup: {
            parameters: {
                RCTestKey2: {
                    defaultValue: {
                        value: "RCTestValue2",
                    },
                    description: "This is a test",
                },
            },
        },
    },
    etag: "123",
};
const projectInfoWithTwoParameters = {
    conditions: [
        {
            name: "RCTestCondition",
            expression: "dateTime < dateTime('2020-07-24T00:00:00', 'America/Los_Angeles')",
        },
    ],
    parameters: {
        RCTestkey: {
            defaultValue: {
                value: "RCTestValue",
            },
        },
        enterNumber: {
            defaultValue: {
                value: "6",
            },
        },
    },
    version: {
        versionNumber: "6",
        updateTime: "2020-07-23T17:13:11.190Z",
        updateUser: {
            email: "abc@gmail.com",
        },
        updateOrigin: "CONSOLE",
        updateType: "INCREMENTAL_UPDATE",
    },
    parameterGroups: {
        RCTestCaseGroup: {
            parameters: {
                RCTestKey2: {
                    defaultValue: {
                        value: "RCTestValue2",
                    },
                    description: "This is a test",
                },
            },
        },
    },
    etag: "123",
};
describe("Remote Config GET", () => {
    describe("getTemplate", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.equal(true, "all nock stubs should have been called");
            nock.cleanAll();
        });
        it("should return the latest template", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .get(`/v1/projects/${PROJECT_ID}/remoteConfig`)
                .reply(200, expectedProjectInfo);
            const RCtemplate = await remoteconfig.getTemplate(PROJECT_ID);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(expectedProjectInfo);
        });
        it("should return the correct version of the template if version is specified", async () => {
            nock(api_1.remoteConfigApiOrigin)
                .get(`/v1/projects/${PROJECT_ID}/remoteConfig?versionNumber=${6}`)
                .reply(200, expectedProjectInfo);
            const RCtemplateVersion = await remoteconfig.getTemplate(PROJECT_ID, "6");
            (0, chai_1.expect)(RCtemplateVersion).to.deep.equal(expectedProjectInfo);
        });
        it("should return a correctly parsed entry value with one parameter", () => {
            const expectRCParameters = "RCTestkey\n";
            const RCParameters = remoteconfig.parseTemplateForTable(expectedProjectInfo.parameters);
            (0, chai_1.expect)(RCParameters).to.deep.equal(expectRCParameters);
        });
        it("should return a correctly parsed entry value with two parameters", () => {
            const expectRCParameters = "RCTestkey\nenterNumber\n";
            const RCParameters = remoteconfig.parseTemplateForTable(projectInfoWithTwoParameters.parameters);
            (0, chai_1.expect)(RCParameters).to.deep.equal(expectRCParameters);
        });
        it("should reject if the api call fails", async () => {
            nock(api_1.remoteConfigApiOrigin).get(`/v1/projects/${PROJECT_ID}/remoteConfig`).reply(404, {});
            await (0, chai_1.expect)(remoteconfig.getTemplate(PROJECT_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /Failed to get Firebase Remote Config template/);
        });
    });
});
//# sourceMappingURL=get.spec.js.map