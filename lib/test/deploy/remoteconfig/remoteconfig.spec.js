"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const api_1 = require("../../../api");
const rcDeploy = require("../../../deploy/remoteconfig/functions");
const error_1 = require("../../../error");
const remoteconfig = require("../../../remoteconfig/get");
const PROJECT_NUMBER = "001";
const header = {
    etag: "etag-344230015214-190",
};
function createTemplate(versionNumber) {
    return {
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
            versionNumber: versionNumber,
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
}
const expectedTemplateInfo = createTemplate("7");
const currentTemplate = createTemplate("6");
describe("Remote Config Deploy", () => {
    let sandbox;
    let templateStub;
    let etagStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        templateStub = sandbox.stub(remoteconfig, "getTemplate");
        etagStub = sandbox.stub(rcDeploy, "getEtag");
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("Publish the updated template", () => {
        it("should publish the latest template", async () => {
            const ETAG = header.etag;
            templateStub.withArgs(PROJECT_NUMBER).returns(currentTemplate);
            etagStub.withArgs(PROJECT_NUMBER, "6").returns(ETAG);
            nock(api_1.remoteConfigApiOrigin)
                .put(`/v1/projects/${PROJECT_NUMBER}/remoteConfig`)
                .matchHeader("If-Match", ETAG)
                .reply(200, expectedTemplateInfo);
            const RCtemplate = await rcDeploy.publishTemplate(PROJECT_NUMBER, currentTemplate, ETAG);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(expectedTemplateInfo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should publish the latest template with * etag", async () => {
            templateStub.withArgs(PROJECT_NUMBER).returns(currentTemplate);
            nock(api_1.remoteConfigApiOrigin)
                .put(`/v1/projects/${PROJECT_NUMBER}/remoteConfig`)
                .matchHeader("If-Match", "*")
                .reply(200, expectedTemplateInfo);
            const options = { force: true };
            const etag = "*";
            const RCtemplate = await rcDeploy.publishTemplate(PROJECT_NUMBER, currentTemplate, etag, options);
            (0, chai_1.expect)(RCtemplate).to.deep.equal(expectedTemplateInfo);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the api call fails", async () => {
            const ETAG = header.etag;
            etagStub.withArgs(PROJECT_NUMBER, "6").returns(ETAG);
            nock(api_1.remoteConfigApiOrigin)
                .put(`/v1/projects/${PROJECT_NUMBER}/remoteConfig`)
                .matchHeader("If-Match", ETAG)
                .reply(400);
            await (0, chai_1.expect)(rcDeploy.publishTemplate(PROJECT_NUMBER, currentTemplate, ETAG)).to.eventually.be.rejectedWith(error_1.FirebaseError, "Unknown Error");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=remoteconfig.spec.js.map