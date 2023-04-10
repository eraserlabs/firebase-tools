"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ensureTargeted_1 = require("../../functions/ensureTargeted");
describe("ensureTargeted", () => {
    it("does nothing if 'functions' is included", () => {
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting,functions", "codebase")).to.equal("hosting,functions");
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting,functions", "codebase", "id")).to.equal("hosting,functions");
    });
    it("does nothing if the codebase is targeted", () => {
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting,functions:codebase", "codebase")).to.equal("hosting,functions:codebase");
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting,functions:codebase", "codebase", "id")).to.equal("hosting,functions:codebase");
    });
    it("does nothing if the function is targeted", () => {
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting,functions:codebase:id", "codebase", "id")).to.equal("hosting,functions:codebase:id");
    });
    it("adds the codebase if missing and no id is provided", () => {
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting", "codebase")).to.equal("hosting,functions:codebase");
    });
    it("adds the function if missing", () => {
        (0, chai_1.expect)((0, ensureTargeted_1.ensureTargeted)("hosting", "codebase", "id")).to.equal("hosting,functions:codebase:id");
    });
});
//# sourceMappingURL=ensureTargeted.spec.js.map