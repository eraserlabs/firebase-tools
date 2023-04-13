"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const runtimes = require("../../../../deploy/functions/runtimes");
describe("getHumanFriendlyRuntimeName", () => {
    it("should properly convert raw runtime to human friendly runtime", () => {
        (0, chai_1.expect)(runtimes.getHumanFriendlyRuntimeName("nodejs6")).to.contain("Node.js");
    });
});
//# sourceMappingURL=index.spec.js.map