"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const expireUtils_1 = require("../../hosting/expireUtils");
const error_1 = require("../../error");
describe("calculateChannelExpireTTL", () => {
    const goodTests = [
        { input: "30d", want: 30 * 24 * 60 * 60 * 1000 },
        { input: "1d", want: 24 * 60 * 60 * 1000 },
        { input: "2d", want: 2 * 24 * 60 * 60 * 1000 },
        { input: "2h", want: 2 * 60 * 60 * 1000 },
        { input: "56m", want: 56 * 60 * 1000 },
    ];
    for (const test of goodTests) {
        it(`should be able to parse time ${test.input}`, () => {
            const got = (0, expireUtils_1.calculateChannelExpireTTL)(test.input);
            (0, chai_1.expect)(got).to.equal(test.want, `unexpected output for ${test.input}`);
        });
    }
    const badTests = [
        { input: "1.5d" },
        { input: "2x" },
        { input: "2dd" },
        { input: "0.5m" },
        { input: undefined },
    ];
    for (const test of badTests) {
        it(`should be able to parse time ${test.input || "undefined"}`, () => {
            (0, chai_1.expect)(() => (0, expireUtils_1.calculateChannelExpireTTL)(test.input)).to.throw(error_1.FirebaseError, /flag must be a duration string/);
        });
    }
    it("should throw if greater than 30d", () => {
        (0, chai_1.expect)(() => (0, expireUtils_1.calculateChannelExpireTTL)("31d")).to.throw(error_1.FirebaseError, /not be longer than 30d/);
        (0, chai_1.expect)(() => (0, expireUtils_1.calculateChannelExpireTTL)(`${31 * 24}h`)).to.throw(error_1.FirebaseError, /not be longer than 30d/);
    });
});
//# sourceMappingURL=expireUtils.spec.js.map