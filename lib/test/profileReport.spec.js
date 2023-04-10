"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const stream = require("stream");
const profileReport_1 = require("../profileReport");
function combinerFunc(obj1, obj2) {
    return { count: obj1.count + obj2.count };
}
const fixturesDir = path.resolve(__dirname, "./fixtures");
function newReport() {
    const input = path.resolve(fixturesDir, "profiler-data/sample.json");
    const throwAwayStream = new stream.PassThrough();
    return new profileReport_1.ProfileReport(input, throwAwayStream, {
        format: "JSON",
        isFile: false,
        collapse: true,
        isInput: true,
    });
}
describe("profilerReport", () => {
    it("should correctly generate a report", () => {
        const report = newReport();
        const output = require(path.resolve(fixturesDir, "profiler-data/sample-output.json"));
        return (0, chai_1.expect)(report.generate()).to.eventually.deep.equal(output);
    });
    it("should format numbers correctly", () => {
        let result = (0, profileReport_1.formatNumber)(5);
        (0, chai_1.expect)(result).to.eq("5");
        result = (0, profileReport_1.formatNumber)(5.0);
        (0, chai_1.expect)(result).to.eq("5");
        result = (0, profileReport_1.formatNumber)(3.33);
        (0, chai_1.expect)(result).to.eq("3.33");
        result = (0, profileReport_1.formatNumber)(3.123423);
        (0, chai_1.expect)(result).to.eq("3.12");
        result = (0, profileReport_1.formatNumber)(3.129);
        (0, chai_1.expect)(result).to.eq("3.13");
        result = (0, profileReport_1.formatNumber)(3123423232);
        (0, chai_1.expect)(result).to.eq("3,123,423,232");
        result = (0, profileReport_1.formatNumber)(3123423232.4242);
        (0, chai_1.expect)(result).to.eq("3,123,423,232.42");
    });
    it("should not collapse paths if not needed", () => {
        const report = newReport();
        const data = {};
        for (let i = 0; i < 20; i++) {
            data[`/path/num${i}`] = { count: 1 };
        }
        const result = report.collapsePaths(data, combinerFunc);
        (0, chai_1.expect)(result).to.deep.eq(data);
    });
    it("should collapse paths to $wildcard", () => {
        const report = newReport();
        const data = {};
        for (let i = 0; i < 30; i++) {
            data[`/path/num${i}`] = { count: 1 };
        }
        const result = report.collapsePaths(data, combinerFunc);
        (0, chai_1.expect)(result).to.deep.eq({ "/path/$wildcard": { count: 30 } });
    });
    it("should not collapse paths with --no-collapse", () => {
        const report = newReport();
        report.options.collapse = false;
        const data = {};
        for (let i = 0; i < 30; i++) {
            data[`/path/num${i}`] = { count: 1 };
        }
        const result = report.collapsePaths(data, combinerFunc);
        (0, chai_1.expect)(result).to.deep.eq(data);
    });
    it("should collapse paths recursively", () => {
        const report = newReport();
        const data = {};
        for (let i = 0; i < 30; i++) {
            data[`/path/num${i}/next${i}`] = { count: 1 };
        }
        data["/path/num1/bar/test"] = { count: 1 };
        data["/foo"] = { count: 1 };
        const result = report.collapsePaths(data, combinerFunc);
        (0, chai_1.expect)(result).to.deep.eq({
            "/path/$wildcard/$wildcard": { count: 30 },
            "/path/$wildcard/$wildcard/test": { count: 1 },
            "/foo": { count: 1 },
        });
    });
    it("should extract the correct path index", () => {
        const query = { index: { path: ["foo", "bar"] } };
        const result = (0, profileReport_1.extractReadableIndex)(query);
        (0, chai_1.expect)(result).to.eq("/foo/bar");
    });
    it("should extract the correct value index", () => {
        const query = { index: {} };
        const result = (0, profileReport_1.extractReadableIndex)(query);
        (0, chai_1.expect)(result).to.eq(".value");
    });
});
//# sourceMappingURL=profileReport.spec.js.map