"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const specHelper = require("../../../extensions/emulator/specHelper");
const error_1 = require("../../../error");
const testResource = {
    name: "test-resource",
    entryPoint: "functionName",
    type: "firebaseextensions.v1beta.function",
    properties: {
        timeout: "3s",
        location: "us-east1",
        availableMemoryMb: 1024,
    },
};
describe("getRuntime", () => {
    it("gets runtime of resources", () => {
        const r1 = Object.assign(Object.assign({}, testResource), { properties: {
                runtime: "nodejs14",
            } });
        const r2 = Object.assign(Object.assign({}, testResource), { properties: {
                runtime: "nodejs14",
            } });
        (0, chai_1.expect)(specHelper.getRuntime([r1, r2])).to.equal("nodejs14");
    });
    it("chooses the latest runtime if many runtime exists", () => {
        const r1 = Object.assign(Object.assign({}, testResource), { properties: {
                runtime: "nodejs12",
            } });
        const r2 = Object.assign(Object.assign({}, testResource), { properties: {
                runtime: "nodejs14",
            } });
        (0, chai_1.expect)(specHelper.getRuntime([r1, r2])).to.equal("nodejs14");
    });
    it("returns default runtime if none specified", () => {
        const r1 = Object.assign(Object.assign({}, testResource), { properties: {} });
        const r2 = Object.assign(Object.assign({}, testResource), { properties: {} });
        (0, chai_1.expect)(specHelper.getRuntime([r1, r2])).to.equal(specHelper.DEFAULT_RUNTIME);
    });
    it("returns default runtime given no resources", () => {
        (0, chai_1.expect)(specHelper.getRuntime([])).to.equal(specHelper.DEFAULT_RUNTIME);
    });
    it("throws error given invalid runtime", () => {
        const r1 = Object.assign(Object.assign({}, testResource), { properties: {
                runtime: "dotnet6",
            } });
        const r2 = Object.assign(Object.assign({}, testResource), { properties: {
                runtime: "nodejs14",
            } });
        (0, chai_1.expect)(() => specHelper.getRuntime([r1, r2])).to.throw(error_1.FirebaseError);
    });
});
//# sourceMappingURL=specHelper.spec.js.map