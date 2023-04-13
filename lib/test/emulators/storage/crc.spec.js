"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const crc_1 = require("../../../emulator/storage/crc");
const stringTestCases = require("./crc-string-cases.json");
const bufferTestCases = require("./crc-buffer-cases.json");
const toStringTestCases = require("./crc-to-string-cases.json");
describe("crc", () => {
    it("correctly computes crc32c from a string", () => {
        const cases = stringTestCases.cases;
        for (const c of cases) {
            (0, chai_1.expect)((0, crc_1.crc32c)(Buffer.from(c.input))).to.equal(c.want);
        }
    });
    it("correctly computes crc32c from bytes", () => {
        const cases = bufferTestCases.cases;
        for (const c of cases) {
            (0, chai_1.expect)((0, crc_1.crc32c)(Buffer.from(c.input))).to.equal(c.want);
        }
    });
    it("correctly stringifies crc32c", () => {
        const cases = toStringTestCases.cases;
        for (const c of cases) {
            const value = (0, crc_1.crc32c)(Buffer.from(c.input));
            const result = (0, crc_1.crc32cToString)(value);
            (0, chai_1.expect)(result).to.equal(c.want);
        }
    });
});
//# sourceMappingURL=crc.spec.js.map