"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const iam = require("../../gcp/iam");
const displayExtensionInfo = require("../../extensions/displayExtensionInfo");
const types_1 = require("../../extensions/types");
const SPEC = {
    name: "test",
    displayName: "Old",
    description: "descriptive",
    version: "0.1.0",
    license: "MIT",
    apis: [
        { apiName: "api1", reason: "" },
        { apiName: "api2", reason: "" },
    ],
    roles: [
        { role: "role1", reason: "" },
        { role: "role2", reason: "" },
    ],
    resources: [
        { name: "resource1", type: "firebaseextensions.v1beta.function", description: "desc" },
        { name: "resource2", type: "other", description: "" },
    ],
    author: { authorName: "Tester", url: "firebase.google.com" },
    contributors: [{ authorName: "Tester 2" }],
    billingRequired: true,
    sourceUrl: "test.com",
    params: [],
    systemParams: [],
};
const TASK_FUNCTION_RESOURCE = {
    name: "taskResource",
    type: "firebaseextensions.v1beta.function",
    properties: {
        taskQueueTrigger: {},
    },
};
const SECRET_PARAM = {
    param: "secret",
    label: "Secret",
    type: types_1.ParamType.SECRET,
};
describe("displayExtensionInfo", () => {
    describe("displayExtInfo", () => {
        let getRoleStub;
        beforeEach(() => {
            getRoleStub = sinon.stub(iam, "getRole");
            getRoleStub.withArgs("role1").resolves({
                title: "Role 1",
                description: "a role",
            });
            getRoleStub.withArgs("role2").resolves({
                title: "Role 2",
                description: "a role",
            });
            getRoleStub.withArgs("cloudtasks.enqueuer").resolves({
                title: "Cloud Task Enqueuer",
                description: "Enqueue tasks",
            });
            getRoleStub.withArgs("secretmanager.secretAccessor").resolves({
                title: "Secret Accessor",
                description: "Access Secrets",
            });
        });
        afterEach(() => {
            getRoleStub.restore();
        });
        it("should display info during install", async () => {
            const loggedLines = await displayExtensionInfo.displayExtInfo(SPEC.name, "", SPEC);
            const expected = [
                "**Name**: Old",
                "**Description**: descriptive",
                "**APIs used by this Extension**:\n  api1 ()\n  api2 ()",
                "\u001b[1m**Roles granted to this Extension**:\n\u001b[22m  Role 1 (a role)\n  Role 2 (a role)",
            ];
            (0, chai_1.expect)(loggedLines.length).to.eql(expected.length);
            (0, chai_1.expect)(loggedLines[0]).to.include("Old");
            (0, chai_1.expect)(loggedLines[1]).to.include("descriptive");
            (0, chai_1.expect)(loggedLines[2]).to.include("api1");
            (0, chai_1.expect)(loggedLines[2]).to.include("api2");
            (0, chai_1.expect)(loggedLines[3]).to.include("Role 1");
            (0, chai_1.expect)(loggedLines[3]).to.include("Role 2");
        });
        it("should display additional information for a published extension", async () => {
            const loggedLines = await displayExtensionInfo.displayExtInfo(SPEC.name, "testpublisher", SPEC, true);
            const expected = [
                "**Name**: Old",
                "**Publisher**: testpublisher",
                "**Description**: descriptive",
                "**License**: MIT",
                "**Source code**: test.com",
                "**APIs used by this Extension**:\n  api1 ()\n  api2 ()",
                "\u001b[1m**Roles granted to this Extension**:\n\u001b[22m  Role 1 (a role)\n  Role 2 (a role)",
            ];
            (0, chai_1.expect)(loggedLines.length).to.eql(expected.length);
            (0, chai_1.expect)(loggedLines[0]).to.include("Old");
            (0, chai_1.expect)(loggedLines[1]).to.include("testpublisher");
            (0, chai_1.expect)(loggedLines[2]).to.include("descriptive");
            (0, chai_1.expect)(loggedLines[3]).to.include("MIT");
            (0, chai_1.expect)(loggedLines[4]).to.include("test.com");
            (0, chai_1.expect)(loggedLines[5]).to.include("api1");
            (0, chai_1.expect)(loggedLines[5]).to.include("api2");
            (0, chai_1.expect)(loggedLines[6]).to.include("Role 1");
            (0, chai_1.expect)(loggedLines[6]).to.include("Role 2");
        });
        it("should display role and api for Cloud Tasks during install", async () => {
            const specWithTasks = JSON.parse(JSON.stringify(SPEC));
            specWithTasks.resources.push(TASK_FUNCTION_RESOURCE);
            const loggedLines = await displayExtensionInfo.displayExtInfo(SPEC.name, "", specWithTasks);
            const expected = [
                "**Name**: Old",
                "**Description**: descriptive",
                "**APIs used by this Extension**:\n  api1 ()\n  api2 ()",
                "\u001b[1m**Roles granted to this Extension**:\n\u001b[22m  Role 1 (a role)\n  Role 2 (a role)\n  Cloud Task Enqueuer (Enqueue tasks)",
            ];
            (0, chai_1.expect)(loggedLines.length).to.eql(expected.length);
            (0, chai_1.expect)(loggedLines[0]).to.include("Old");
            (0, chai_1.expect)(loggedLines[1]).to.include("descriptive");
            (0, chai_1.expect)(loggedLines[2]).to.include("api1");
            (0, chai_1.expect)(loggedLines[2]).to.include("api2");
            (0, chai_1.expect)(loggedLines[2]).to.include("Cloud Tasks");
            (0, chai_1.expect)(loggedLines[3]).to.include("Role 1");
            (0, chai_1.expect)(loggedLines[3]).to.include("Role 2");
            (0, chai_1.expect)(loggedLines[3]).to.include("Cloud Task Enqueuer");
        });
        it("should display role for Cloud Secret Manager during install", async () => {
            const specWithSecret = JSON.parse(JSON.stringify(SPEC));
            specWithSecret.params.push(SECRET_PARAM);
            const loggedLines = await displayExtensionInfo.displayExtInfo(SPEC.name, "", specWithSecret);
            const expected = [
                "**Name**: Old",
                "**Description**: descriptive",
                "**APIs used by this Extension**:\n  api1 ()\n  api2 ()",
                "\u001b[1m**Roles granted to this Extension**:\n\u001b[22m  Role 1 (a role)\n  Role 2 (a role)\n  Secret Accessor (Access secrets)",
            ];
            (0, chai_1.expect)(loggedLines.length).to.eql(expected.length);
            (0, chai_1.expect)(loggedLines[0]).to.include("Old");
            (0, chai_1.expect)(loggedLines[1]).to.include("descriptive");
            (0, chai_1.expect)(loggedLines[2]).to.include("api1");
            (0, chai_1.expect)(loggedLines[2]).to.include("api2");
            (0, chai_1.expect)(loggedLines[3]).to.include("Role 1");
            (0, chai_1.expect)(loggedLines[3]).to.include("Role 2");
            (0, chai_1.expect)(loggedLines[3]).to.include("Secret Accessor");
        });
    });
});
//# sourceMappingURL=displayExtensionInfo.spec.js.map