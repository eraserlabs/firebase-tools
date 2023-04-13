"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils = require("../../extensions/utils");
describe("extensions utils", () => {
    describe("formatTimestamp", () => {
        it("should format timestamp correctly", () => {
            (0, chai_1.expect)(utils.formatTimestamp("2020-05-11T03:45:13.583677Z")).to.equal("2020-05-11 03:45:13");
        });
    });
});
//# sourceMappingURL=utils.spec.js.map