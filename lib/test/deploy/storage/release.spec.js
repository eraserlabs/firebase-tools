"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const rulesDeploy_1 = require("../../../rulesDeploy");
const release_1 = require("../../../deploy/storage/release");
const rc_1 = require("../../../rc");
describe("storage.release", () => {
    it("should not release anything if there are no deployable configs", async () => {
        const rulesDeploy = sinon.createStubInstance(rulesDeploy_1.RulesDeploy);
        rulesDeploy.release.resolves();
        await (0, chai_1.expect)((0, release_1.default)({ storage: { rulesDeploy } }, {})).to.eventually.deep.equal([]);
        (0, chai_1.expect)(rulesDeploy.release).to.not.be.called;
    });
    it("should release rules for a single deploy config", async () => {
        const rulesDeploy = sinon.createStubInstance(rulesDeploy_1.RulesDeploy);
        rulesDeploy.release.resolves();
        const context = {
            storage: {
                rulesDeploy,
                rulesConfigsToDeploy: [{ bucket: "foo", rules: "true" }],
            },
        };
        await (0, chai_1.expect)((0, release_1.default)(context, {})).to.eventually.deep.equal(["foo"]);
        (0, chai_1.expect)(rulesDeploy.release).to.be.calledOnce;
    });
    it("should release rules based on targets", async () => {
        const project = "my-project";
        const rulesDeploy = sinon.createStubInstance(rulesDeploy_1.RulesDeploy);
        rulesDeploy.release.resolves();
        const rc = sinon.createStubInstance(rc_1.RC);
        rc.target.withArgs(project, "storage", "my-target").returns(["bar"]);
        const context = {
            storage: {
                rulesDeploy,
                rulesConfigsToDeploy: [{ target: "my-target", rules: "true" }],
            },
        };
        await (0, chai_1.expect)((0, release_1.default)(context, { project, rc })).to.eventually.deep.equal(["bar"]);
        (0, chai_1.expect)(rulesDeploy.release).to.be.calledOnce;
    });
});
//# sourceMappingURL=release.spec.js.map