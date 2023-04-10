"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const functionsConfig = require("../functionsConfig");
describe("config.parseSetArgs", () => {
    it("should throw if a reserved namespace is used", () => {
        (0, chai_1.expect)(() => {
            functionsConfig.parseSetArgs(["firebase.something=else"]);
        }).to.throw("reserved namespace");
    });
    it("should throw if a malformed arg is used", () => {
        (0, chai_1.expect)(() => {
            functionsConfig.parseSetArgs(["foo.bar=baz", "qux"]);
        }).to.throw("must be in key=val format");
    });
    it("should parse args into correct config and variable IDs", () => {
        (0, chai_1.expect)(functionsConfig.parseSetArgs(["foo.bar.faz=val"])).to.deep.eq([
            {
                configId: "foo",
                varId: "bar/faz",
                val: "val",
            },
        ]);
    });
});
describe("config.parseUnsetArgs", () => {
    it("should throw if a reserved namespace is used", () => {
        (0, chai_1.expect)(() => {
            functionsConfig.parseUnsetArgs(["firebase.something"]);
        }).to.throw("reserved namespace");
    });
    it("should parse args into correct config and variable IDs", () => {
        (0, chai_1.expect)(functionsConfig.parseUnsetArgs(["foo.bar.faz"])).to.deep.eq([
            {
                configId: "foo",
                varId: "bar/faz",
            },
        ]);
    });
});
//# sourceMappingURL=functionsConfig.spec.js.map