"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const experiments_1 = require("../experiments");
describe("experiments", () => {
    let originalCLIState = process.env.FIREBASE_CLI_EXPERIMENTS;
    before(() => {
        originalCLIState = process.env.FIREBASE_CLI_EXPERIMENTS;
    });
    beforeEach(() => {
        process.env.FIREBASE_CLI_EXPERIMENTS = originalCLIState;
    });
    afterEach(() => {
        process.env.FIREBASE_CLI_EXPERIMENTS = originalCLIState;
    });
    describe("enableExperimentsFromCliEnvVariable", () => {
        it("should enable some experiments", () => {
            (0, chai_1.expect)((0, experiments_1.isEnabled)("experiments")).to.be.false;
            process.env.FIREBASE_CLI_EXPERIMENTS = "experiments,not_an_experiment";
            (0, experiments_1.enableExperimentsFromCliEnvVariable)();
            (0, chai_1.expect)((0, experiments_1.isEnabled)("experiments")).to.be.true;
            (0, experiments_1.setEnabled)("experiments", false);
        });
    });
});
//# sourceMappingURL=experiments.spec.js.map