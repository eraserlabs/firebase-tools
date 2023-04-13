"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const functionsEmulatorUtils_1 = require("../../emulator/functionsEmulatorUtils");
describe("FunctionsEmulatorUtils", () => {
    describe("extractParamsFromPath", () => {
        it("should match a path which fits a wildcard template", () => {
            const params = (0, functionsEmulatorUtils_1.extractParamsFromPath)("companies/{company}/users/{user}", "/companies/firebase/users/abe");
            (0, chai_1.expect)(params).to.deep.equal({ company: "firebase", user: "abe" });
        });
        it("should not match unfilled wildcards", () => {
            const params = (0, functionsEmulatorUtils_1.extractParamsFromPath)("companies/{company}/users/{user}", "companies/{still_wild}/users/abe");
            (0, chai_1.expect)(params).to.deep.equal({ user: "abe" });
        });
        it("should not match a path which is too long", () => {
            const params = (0, functionsEmulatorUtils_1.extractParamsFromPath)("companies/{company}/users/{user}", "companies/firebase/users/abe/boots");
            (0, chai_1.expect)(params).to.deep.equal({});
        });
        it("should not match a path which is too short", () => {
            const params = (0, functionsEmulatorUtils_1.extractParamsFromPath)("companies/{company}/users/{user}", "companies/firebase/users/");
            (0, chai_1.expect)(params).to.deep.equal({});
        });
        it("should not match a path which has different chunks", () => {
            const params = (0, functionsEmulatorUtils_1.extractParamsFromPath)("locations/{company}/users/{user}", "companies/firebase/users/{user}");
            (0, chai_1.expect)(params).to.deep.equal({});
        });
    });
    describe("isValidWildcardMatch", () => {
        it("should match a path which fits a wildcard template", () => {
            const valid = (0, functionsEmulatorUtils_1.isValidWildcardMatch)("companies/{company}/users/{user}", "/companies/firebase/users/abe");
            (0, chai_1.expect)(valid).to.equal(true);
        });
        it("should not match a path which is too long", () => {
            const tooLong = (0, functionsEmulatorUtils_1.isValidWildcardMatch)("companies/{company}/users/{user}", "companies/firebase/users/abe/boots");
            (0, chai_1.expect)(tooLong).to.equal(false);
        });
        it("should not match a path which is too short", () => {
            const tooShort = (0, functionsEmulatorUtils_1.isValidWildcardMatch)("companies/{company}/users/{user}", "companies/firebase/users/");
            (0, chai_1.expect)(tooShort).to.equal(false);
        });
        it("should not match a path which has different chunks", () => {
            const differentChunk = (0, functionsEmulatorUtils_1.isValidWildcardMatch)("locations/{company}/users/{user}", "companies/firebase/users/{user}");
            (0, chai_1.expect)(differentChunk).to.equal(false);
        });
    });
    describe("trimSlashes", () => {
        it("should remove leading and trailing slashes", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.trimSlashes)("///a/b/c////")).to.equal("a/b/c");
        });
        it("should replace multiple adjacent slashes with a single slash", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.trimSlashes)("a////b//c")).to.equal("a/b/c");
        });
        it("should do both", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.trimSlashes)("///a////b//c/")).to.equal("a/b/c");
        });
    });
    describe("compareVersonStrings", () => {
        it("should detect a higher major version", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.0.0", "3.2.1")).to.be.gt(0);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("3.2.1", "4.0.0")).to.be.lt(0);
        });
        it("should detect a higher minor version", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.1.0", "4.0.1")).to.be.gt(0);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.0.1", "4.1.0")).to.be.lt(0);
        });
        it("should detect a higher patch version", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.0.1", "4.0.0")).to.be.gt(0);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.0.0", "4.0.1")).to.be.lt(0);
        });
        it("should detect the same version", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.0.0", "4.0.0")).to.eql(0);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4.0", "4.0.0")).to.eql(0);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.compareVersionStrings)("4", "4.0.0")).to.eql(0);
        });
    });
    describe("parseRuntimeVerson", () => {
        it("should parse fully specified runtime strings", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("nodejs6")).to.eql(6);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("nodejs8")).to.eql(8);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("nodejs10")).to.eql(10);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("nodejs12")).to.eql(12);
        });
        it("should parse plain number strings", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("6")).to.eql(6);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("8")).to.eql(8);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("10")).to.eql(10);
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("12")).to.eql(12);
        });
        it("should ignore unknown", () => {
            (0, chai_1.expect)((0, functionsEmulatorUtils_1.parseRuntimeVersion)("banana")).to.eql(undefined);
        });
    });
    describe("isLocalHost", () => {
        const testCases = [
            {
                desc: "should return true for localhost",
                href: "http://localhost:4000",
                expected: true,
            },
            {
                desc: "should return true for 127.0.0.1",
                href: "127.0.0.1:5001/firestore",
                expected: true,
            },
            {
                desc: "should return true for ipv6 loopback",
                href: "[::1]:5001/firestore",
                expected: true,
            },
            {
                desc: "should work with https",
                href: "https://127.0.0.1:5001/firestore",
                expected: true,
            },
            {
                desc: "should return false for external uri",
                href: "http://google.com/what-is-localhost",
                expected: false,
            },
            {
                desc: "should return false for external ip",
                href: "123:100:99:12",
                expected: false,
            },
        ];
        for (const t of testCases) {
            it(t.desc, () => {
                (0, chai_1.expect)((0, functionsEmulatorUtils_1.isLocalHost)(t.href)).to.eq(t.expected);
            });
        }
    });
});
//# sourceMappingURL=functionsEmulatorUtils.spec.js.map