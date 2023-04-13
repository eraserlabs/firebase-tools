"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const config_1 = require("../config");
const error_1 = require("../error");
const rc_1 = require("../rc");
const requireConfig_1 = require("../requireConfig");
const utils_1 = require("../utils");
const options = {
    cwd: "",
    configPath: "",
    only: "",
    except: "",
    config: new config_1.Config({}),
    filteredTargets: [],
    force: false,
    json: false,
    nonInteractive: false,
    interactive: false,
    debug: false,
    rc: new rc_1.RC(),
};
describe("requireConfig", () => {
    it("should resolve if config exists", async () => {
        await (0, requireConfig_1.requireConfig)(options);
    });
    it("should fail if config does not exist", async () => {
        const o = (0, utils_1.cloneDeep)(options);
        delete o.config;
        await (0, chai_1.expect)((0, requireConfig_1.requireConfig)(o)).to.eventually.be.rejectedWith(error_1.FirebaseError, /Not in a Firebase project directory/);
    });
    it("should return the existing configError if one is set", async () => {
        const o = (0, utils_1.cloneDeep)(options);
        delete o.config;
        o.configError = new Error("This is a config error.");
        await (0, chai_1.expect)((0, requireConfig_1.requireConfig)(o)).to.eventually.be.rejectedWith(Error, /This is a config error./);
    });
});
//# sourceMappingURL=requireConfig.spec.js.map