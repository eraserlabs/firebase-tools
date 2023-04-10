"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const inquirer = require("inquirer");
const error_1 = require("../error");
const prompt = require("../prompt");
describe("prompt", () => {
    let inquirerStub;
    const PROMPT_RESPONSES = {
        lint: true,
        "lint/dint/mint": true,
        project: "the-best-project-ever",
    };
    beforeEach(() => {
        inquirerStub = sinon.stub(inquirer, "prompt").resolves(PROMPT_RESPONSES);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe("prompt", () => {
        it("should error if questions are asked in nonInteractive environment", async () => {
            const o = { nonInteractive: true };
            const qs = [{ name: "foo" }];
            await (0, chai_1.expect)(prompt.prompt(o, qs)).to.be.rejectedWith(error_1.FirebaseError, /required.+non-interactive/);
        });
        it("should utilize inquirer to prompt for the questions", async () => {
            const qs = [
                {
                    name: "foo",
                    message: "this is a test",
                },
            ];
            await prompt.prompt({}, qs);
            (0, chai_1.expect)(inquirerStub).calledOnceWithExactly(qs);
        });
        it("should add the new values to the options object", async () => {
            const options = { hello: "world" };
            const qs = [
                {
                    name: "foo",
                    message: "this is a test",
                },
            ];
            await prompt.prompt(options, qs);
            (0, chai_1.expect)(options).to.deep.equal(Object.assign({ hello: "world" }, PROMPT_RESPONSES));
        });
    });
    describe("promptOnce", () => {
        it("should provide a name if one is not provided", async () => {
            await prompt.promptOnce({ message: "foo" });
            (0, chai_1.expect)(inquirerStub).calledOnceWith([{ name: "question", message: "foo" }]);
        });
        it("should return the value for the given name", async () => {
            const r = await prompt.promptOnce({ name: "lint" });
            (0, chai_1.expect)(r).to.equal(true);
            (0, chai_1.expect)(inquirerStub).calledOnce;
        });
        it("should handle names with .'s", async () => {
            const r = await prompt.promptOnce({ name: "lint.dint.mint" });
            (0, chai_1.expect)(r).to.equal(true);
            (0, chai_1.expect)(inquirerStub).calledOnce;
        });
    });
});
//# sourceMappingURL=prompt.spec.js.map