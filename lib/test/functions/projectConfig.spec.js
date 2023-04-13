"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const projectConfig = require("../../functions/projectConfig");
const error_1 = require("../../error");
const TEST_CONFIG_0 = { source: "foo" };
describe("projectConfig", () => {
    describe("normalize", () => {
        it("normalizes singleton config", () => {
            (0, chai_1.expect)(projectConfig.normalize(TEST_CONFIG_0)).to.deep.equal([TEST_CONFIG_0]);
        });
        it("normalizes array config", () => {
            (0, chai_1.expect)(projectConfig.normalize([TEST_CONFIG_0, TEST_CONFIG_0])).to.deep.equal([
                TEST_CONFIG_0,
                TEST_CONFIG_0,
            ]);
        });
        it("throws error if given empty config", () => {
            (0, chai_1.expect)(() => projectConfig.normalize([])).to.throw(error_1.FirebaseError);
        });
    });
    describe("validate", () => {
        it("passes validation for simple config", () => {
            (0, chai_1.expect)(projectConfig.validate([TEST_CONFIG_0])).to.deep.equal([TEST_CONFIG_0]);
        });
        it("fails validation given config w/o source", () => {
            (0, chai_1.expect)(() => projectConfig.validate([{ runtime: "nodejs10" }])).to.throw(error_1.FirebaseError, /codebase source must be specified/);
        });
        it("fails validation given config w/ empty source", () => {
            (0, chai_1.expect)(() => projectConfig.validate([{ source: "" }])).to.throw(error_1.FirebaseError, /codebase source must be specified/);
        });
        it("fails validation given config w/ duplicate source", () => {
            (0, chai_1.expect)(() => projectConfig.validate([TEST_CONFIG_0, Object.assign(Object.assign({}, TEST_CONFIG_0), { codebase: "unique-codebase" })])).to.throw(error_1.FirebaseError, /source must be unique/);
        });
        it("fails validation given codebase name with capital letters", () => {
            (0, chai_1.expect)(() => projectConfig.validate([Object.assign(Object.assign({}, TEST_CONFIG_0), { codebase: "ABCDE" })])).to.throw(error_1.FirebaseError, /Invalid codebase name/);
        });
        it("fails validation given codebase name with invalid characters", () => {
            (0, chai_1.expect)(() => projectConfig.validate([Object.assign(Object.assign({}, TEST_CONFIG_0), { codebase: "abc.efg" })])).to.throw(error_1.FirebaseError, /Invalid codebase name/);
        });
        it("fails validation given long codebase name", () => {
            (0, chai_1.expect)(() => projectConfig.validate([
                Object.assign(Object.assign({}, TEST_CONFIG_0), { codebase: "thisismorethan63characterslongxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }),
            ])).to.throw(error_1.FirebaseError, /Invalid codebase name/);
        });
    });
    describe("normalizeAndValidate", () => {
        it("returns normalized config for singleton config", () => {
            (0, chai_1.expect)(projectConfig.normalizeAndValidate(TEST_CONFIG_0)).to.deep.equal([TEST_CONFIG_0]);
        });
        it("returns normalized config for multi-resource config", () => {
            (0, chai_1.expect)(projectConfig.normalizeAndValidate([TEST_CONFIG_0])).to.deep.equal([TEST_CONFIG_0]);
        });
        it("fails validation given singleton config w/o source", () => {
            (0, chai_1.expect)(() => projectConfig.normalizeAndValidate({ runtime: "nodejs10" })).to.throw(error_1.FirebaseError, /codebase source must be specified/);
        });
        it("fails validation given singleton config w empty source", () => {
            (0, chai_1.expect)(() => projectConfig.normalizeAndValidate({ source: "" })).to.throw(error_1.FirebaseError, /codebase source must be specified/);
        });
        it("fails validation given multi-resource config w/o source", () => {
            (0, chai_1.expect)(() => projectConfig.normalizeAndValidate([{ runtime: "nodejs10" }])).to.throw(error_1.FirebaseError, /codebase source must be specified/);
        });
        it("fails validation given config w/ duplicate source", () => {
            (0, chai_1.expect)(() => projectConfig.normalizeAndValidate([TEST_CONFIG_0, TEST_CONFIG_0])).to.throw(error_1.FirebaseError, /functions.source must be unique/);
        });
        it("fails validation given config w/ duplicate codebase", () => {
            (0, chai_1.expect)(() => projectConfig.normalizeAndValidate([
                Object.assign(Object.assign({}, TEST_CONFIG_0), { codebase: "foo" }),
                Object.assign(Object.assign({}, TEST_CONFIG_0), { codebase: "foo", source: "bar" }),
            ])).to.throw(error_1.FirebaseError, /functions.codebase must be unique/);
        });
    });
});
//# sourceMappingURL=projectConfig.spec.js.map