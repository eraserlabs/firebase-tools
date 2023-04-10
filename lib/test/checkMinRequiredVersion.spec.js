"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const configstore_1 = require("../configstore");
const sinon = require("sinon");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
describe("checkMinRequiredVersion", () => {
    let configstoreStub;
    beforeEach(() => {
        configstoreStub = sinon.stub(configstore_1.configstore, "get");
    });
    afterEach(() => {
        configstoreStub.restore();
    });
    it("should error if installed version is below the min required version", () => {
        configstoreStub.withArgs("motd.key").returns("1000.1000.1000");
        (0, chai_1.expect)(() => {
            (0, checkMinRequiredVersion_1.checkMinRequiredVersion)({}, "key");
        }).to.throw();
    });
    it("should not error if installed version is above the min required version", () => {
        configstoreStub.withArgs("motd.key").returns("0.0.0");
        (0, chai_1.expect)(() => {
            (0, checkMinRequiredVersion_1.checkMinRequiredVersion)({}, "key");
        }).not.to.throw();
    });
});
//# sourceMappingURL=checkMinRequiredVersion.spec.js.map