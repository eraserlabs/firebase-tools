"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const projectUtils_1 = require("../projectUtils");
const projects = require("../management/projects");
const rc_1 = require("../rc");
describe("getProjectId", () => {
    it("should prefer projectId, falling back to project", () => {
        (0, chai_1.expect)((0, projectUtils_1.getProjectId)({ projectId: "this", project: "not_that" })).to.eq("this");
        (0, chai_1.expect)((0, projectUtils_1.getProjectId)({ project: "this" })).to.eq("this");
    });
});
describe("needProjectId", () => {
    let options;
    beforeEach(() => {
        options = { rc: new rc_1.RC(undefined, {}) };
    });
    it("should throw when no project provided and no aliases available", () => {
        (0, chai_1.expect)(() => (0, projectUtils_1.needProjectId)(options)).to.throw("No currently active project");
    });
    it("should throw and mention aliases when they are available", () => {
        options.rc = new rc_1.RC(undefined, { projects: { "example-alias": "example-project" } });
        (0, chai_1.expect)(() => (0, projectUtils_1.needProjectId)(options)).to.throw("aliases are available");
    });
    it("should return projectId, falling back to project", () => {
        (0, chai_1.expect)((0, projectUtils_1.needProjectId)(Object.assign(Object.assign({}, options), { projectId: "this", project: "not_that" }))).to.eq("this");
        (0, chai_1.expect)((0, projectUtils_1.needProjectId)(Object.assign(Object.assign({}, options), { project: "this" }))).to.eq("this");
    });
});
describe("needProjectNumber", () => {
    let getProjectStub;
    beforeEach(() => {
        getProjectStub = sinon.stub(projects, "getFirebaseProject").throws(new Error("stubbed"));
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should return the project number from options, if present", async () => {
        const n = await (0, projectUtils_1.needProjectNumber)({ projectNumber: 1 });
        (0, chai_1.expect)(n).to.equal(1);
        (0, chai_1.expect)(getProjectStub).to.not.have.been.called;
    });
    it("should fetch the project number if necessary", async () => {
        getProjectStub.returns({ projectNumber: 2 });
        const n = await (0, projectUtils_1.needProjectNumber)({ project: "foo" });
        (0, chai_1.expect)(n).to.equal(2);
        (0, chai_1.expect)(getProjectStub).to.have.been.calledOnceWithExactly("foo");
    });
    it("should reject with an error on an error", async () => {
        getProjectStub.rejects(new Error("oh no"));
        await (0, chai_1.expect)((0, projectUtils_1.needProjectNumber)({ project: "foo" })).to.eventually.be.rejectedWith(Error, "oh no");
    });
});
describe("getAliases", () => {
    it("should return the aliases for a projectId", () => {
        const testProjectId = "my-project";
        const testOptions = {
            rc: {
                hasProjects: true,
                projects: {
                    prod: testProjectId,
                    prod2: testProjectId,
                    staging: "other-project",
                },
            },
        };
        (0, chai_1.expect)((0, projectUtils_1.getAliases)(testOptions, testProjectId).sort()).to.deep.equal(["prod", "prod2"]);
    });
    it("should return an empty array if there are no aliases in rc", () => {
        const testProjectId = "my-project";
        const testOptions = {
            rc: {
                hasProjects: false,
            },
        };
        (0, chai_1.expect)((0, projectUtils_1.getAliases)(testOptions, testProjectId)).to.deep.equal([]);
    });
});
//# sourceMappingURL=projectUtils.spec.js.map